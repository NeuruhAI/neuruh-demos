#!/usr/bin/env python3
"""Assemble ~/workspace/unified-chain/unified-chain.js from proven pieces.

Verbatim extraction (no retyping) from:
  - ~/workspace/p0-seam-loop/p0-seam.js  (SHA-256, canonical JSON, receipt v1.0,
    verifyChain, CRUCIBLE gate, strike counting, eta gate, ingestOutcome,
    promotionGate, runLoop)
  - ~/workspace/memory-gate/lib/write-gate.js (evaluateWrite, thresholds)
  - ~/workspace/memory-gate/lib/decay.js (decay, DECAY_PRESETS)
  - ~/workspace/governance-loop/governance-loop.js (stampHeader,
    governanceIntersection)
plus new unified-chain code appended by this script (see NEW_CODE below).
Run: python3 assemble.py ; node test.js in the target dir afterwards.
"""
import re, os

WS = os.path.expanduser("~/workspace")
OUT = os.path.join(WS, "unified-chain", "unified-chain.js")

def factory_body(path):
    src = open(path).read()
    m = re.search(r"function \(\) \{\n  ['\"]use strict['\"];\n", src)
    assert m, "no factory strict header in " + path
    start = m.end()
    end = src.rfind("\n  return {")
    assert end > start, "no factory return in " + path
    return src[start:end]

def section(path, start_marker, end_marker):
    src = open(path).read()
    a = src.index(start_marker)
    b = src.index(end_marker, a)
    return src[a:b]

p0 = factory_body(os.path.join(WS, "p0-seam-loop", "p0-seam.js"))
wg = factory_body(os.path.join(WS, "memory-gate", "lib", "write-gate.js"))
dc = factory_body(os.path.join(WS, "memory-gate", "lib", "decay.js"))
hdr = section(os.path.join(WS, "governance-loop", "governance-loop.js"),
              "/* ---------- NEW: N-Cell/64 header stamper",
              "/* ---------- NEW: promotion decision ---------- */")

NEW_CODE = r'''
  /* ================= UNIFIED CHAIN: new code for this demo ================= */
  /* Decisions recorded in build-unified-chain.md. Nothing here is presented
     as a paper claim or a founder order unless the comment says so. */

  /* ---------- worked example: claim OPP-2026-RE-0042 ---------- */
  /* The paper (Section 3.3) defines the 8-byte layout only; it assigns no
     byte values to any claim. The byte values below are THIS DEMO'S worked
     example, chosen so the stamper reproduces the recorded hex
     1f0701070fa52d01. Rationale per byte, in the build report:
     routeMask 0x1f (routes 0-4 open), organMask 0x07 (SAL manifest bits 0-2),
     lifecycleMask 0x01 (proposed), authorityMask 0x07 (founder + operator +
     auditor bits), memoryMask 0x0f (working + episodic + semantic +
     procedural), confidence 165, risk 45, outputMask 0x01 (receipt). */
  var WORKED_CLAIM_ID = 'OPP-2026-RE-0042';
  var WORKED_HEADER_BYTES = [0x1f, 0x07, 0x01, 0x07, 0x0f, 0xa5, 0x2d, 0x01];
  var WORKED_HEADER_FIELDS = {
    routeMask: 0x1f, organMask: 0x07, lifecycleMask: 0x01, authorityMask: 0x07,
    memoryMask: 0x0f, confidence: 165, risk: 45, outputMask: 0x01
  };
  var WORKED_HEADER_HEX = '1F 07 01 07 0F A5 2D 01';
  var WORKED_HEADER_HEX_COMPACT = '1f0701070fa52d01';

  /* ---------- governance intersection: blocked-policy vs blocked-infra ---------- */
  /* E* = E_proposed intersect E_allowed intersect E_available (paper 3.4).
     blockedPolicy: proposed edges missing from E_allowed (policy refuses).
     blockedInfra: proposed edges allowed but missing from E_available
     (infrastructure cannot serve them right now). */
  function intersectionDetail(proposed, allowed, available) {
    var base = governanceIntersection(proposed, allowed, available);
    var aSet = {};
    base.allowed.forEach(function (x) { aSet[x] = true; });
    var vSet = {};
    base.available.forEach(function (x) { vSet[x] = true; });
    var blockedPolicy = base.proposed.filter(function (x) { return !aSet[x]; });
    var blockedInfra = base.proposed.filter(function (x) { return aSet[x] && !vSet[x]; });
    base.blockedPolicy = blockedPolicy;
    base.blockedInfra = blockedInfra;
    base.counts.blockedPolicy = blockedPolicy.length;
    base.counts.blockedInfra = blockedInfra.length;
    return base;
  }

  /* Default sets, decision D-001 from the overnight run (kept, not re-decided):
     propose 8 edges, allow 6, available 5, intersection 5, verdict PARTIAL,
     which blocks promotion. */
  var DEFAULT_SETS = {
    proposed: [0, 1, 2, 3, 4, 5, 6, 7],
    allowed: [0, 1, 2, 3, 4, 5],
    available: [0, 1, 2, 3, 4]
  };
  /* Passing preset: 4 proposed edges, all inside allowed and available. */
  var PROCEED_SETS = {
    proposed: [0, 1, 2, 3],
    allowed: [0, 1, 2, 3, 4, 5],
    available: [0, 1, 2, 3, 4]
  };

  /* ---------- unified promotion decision (task rule) ---------- */
  /* PROCEED only when: intersection PROCEED, CRUCIBLE verdict is not KILL,
     and the write-gate is WRITE, or QUARANTINE with an explicit override
     noted on the record. Every other combination stops and names each
     blocking reason. This is the demo's rule, not the governance-loop demo's
     rule (which also required SHIP-CANDIDATE and an external signal); the
     difference is deliberate and recorded in the build report. */
  function decidePromotionUnified(input) {
    var i = input || {};
    var reasons = [];
    var blocked = [];
    if (i.intersectionVerdict !== 'PROCEED') {
      blocked.push('intersection');
      reasons.push('intersection is ' + i.intersectionVerdict + ', not PROCEED');
    }
    if (i.crucibleVerdict === 'KILL') {
      blocked.push('crucible');
      reasons.push('CRUCIBLE verdict is KILL');
    }
    if (i.memoryVerdict === 'WRITE') {
      reasons.push('memory write-gate is WRITE');
    } else if (i.memoryVerdict === 'QUARANTINE' && i.overrideQuarantine) {
      reasons.push('memory write-gate is QUARANTINE, proceeding under explicit override noted on the record');
    } else if (i.memoryVerdict === 'QUARANTINE') {
      blocked.push('memory-gate');
      reasons.push('memory write-gate is QUARANTINE with no override');
    } else {
      blocked.push('memory-gate');
      reasons.push('memory write-gate is ' + i.memoryVerdict);
    }
    if (blocked.length) {
      return { promote: false, decision: 'STOP', blockingGates: blocked, reasons: reasons, overrideUsed: false };
    }
    return { promote: true, decision: 'PROCEED', blockingGates: [], reasons: reasons, overrideUsed: !!(i.memoryVerdict === 'QUARANTINE' && i.overrideQuarantine) };
  }

  /* ---------- claim ids ---------- */
  var claimSeq = 0;
  function nextClaimId(dateStr) {
    claimSeq += 1;
    var d = dateStr || new Date().toISOString().slice(0, 10);
    var n = ('000' + claimSeq).slice(-4);
    return 'UC-' + d + '-' + n;
  }
  function resetClaimSeq() { claimSeq = 0; }

  /* ---------- chain state: ledger, strikes, outcomes ---------- */
  function newChainState() {
    return { ledger: [], strikes: 0, moved: false, outcomes: [], seq: 0 };
  }

  /* Run stages 1-7 for one claim. Returns the full stage record plus the
     sealed chain receipt (seq 1 in a fresh state, or next seq in state). */
  function runChain(input, state) {
    var i = input || {};
    var st = state || newChainState();
    var claimId = i.claimId || nextClaimId(i.dateStr);
    var timestamp = i.timestamp_utc || new Date().toISOString();
    var header = stampHeader(i.header);
    var intersection = intersectionDetail(i.proposed, i.allowed, i.available);
    var memoryGate = evaluateWrite(i.memory || {});
    var crucible = crucibleVerdict({
      emergence_raw: i.emergence_raw,
      objection_penalty: i.objection_penalty,
      signal: i.signal,
      external_signal: !!i.external_signal
    });
    var strike = applyStrike({ strikes: st.strikes, moved: st.moved }, crucible.verdict);
    st.strikes = strike.strikes;
    st.moved = strike.moved;
    var promotion = decidePromotionUnified({
      intersectionVerdict: intersection.verdict,
      memoryVerdict: memoryGate.verdict,
      crucibleVerdict: crucible.verdict,
      overrideQuarantine: !!i.overrideQuarantine
    });
    var decayRows = null;
    if (typeof i.decayAgeDays === 'number') {
      var presetKey = i.decayPreset || 'lead';
      var h = DECAY_PRESETS[presetKey] ? DECAY_PRESETS[presetKey].halfLifeDays : 7;
      decayRows = {
        preset: presetKey, halfLifeDays: h, ageDays: i.decayAgeDays,
        retention: Math.round(decay(i.decayAgeDays, h) * 10000) / 10000
      };
    }
    var payload = {
      claim_id: claimId,
      claim: i.claim || '',
      timestamp_utc: timestamp,
      header_hex: header.hex,
      header_bytes: header.bytes,
      intersection: {
        verdict: intersection.verdict,
        counts: intersection.counts,
        intersection: intersection.intersection,
        blocked_policy: intersection.blockedPolicy,
        blocked_infra: intersection.blockedInfra
      },
      memory_gate: { verdict: memoryGate.verdict, reasons: memoryGate.reasons, illustrative: true },
      crucible: { score: crucible.score, multiplier: crucible.multiplier, verdict: crucible.verdict, signal: i.signal || 'none', external_signal: !!i.external_signal },
      strikes: strike.strikes,
      kill_move: strike.kill_move,
      promotion: promotion,
      decay: decayRows
    };
    var prev = st.ledger.length ? st.ledger[st.ledger.length - 1].provenance.report_hash_sha256 : GENESIS;
    st.seq += 1;
    var receipt = buildReceipt({
      type: 'unified-chain',
      seq: st.seq,
      payload: payload,
      prevHash: prev,
      timestamp_utc: timestamp
    });
    st.ledger.push(receipt);
    return {
      claimId: claimId, timestamp: timestamp, header: header,
      intersection: intersection, memoryGate: memoryGate, crucible: crucible,
      strike: strike, promotion: promotion, decay: decayRows,
      receipt: receipt, receiptValid: verifyReceipt(receipt).ok, state: st
    };
  }

  /* Stage 8: record an outcome. Appends an outcome receipt chained onto the
     same ledger, and appends to the in-page outcome ledger. */
  function recordOutcome(state, outcome) {
    var st = state || newChainState();
    var o = outcome || {};
    var rec = {
      claim_id: o.claimId || null,
      result: o.result || 'unknown',
      notes: o.notes || '',
      timestamp_utc: o.timestamp_utc || new Date().toISOString()
    };
    var prev = st.ledger.length ? st.ledger[st.ledger.length - 1].provenance.report_hash_sha256 : GENESIS;
    st.seq += 1;
    var receipt = buildReceipt({
      type: 'unified-chain-outcome',
      seq: st.seq,
      payload: rec,
      prevHash: prev,
      timestamp_utc: rec.timestamp_utc
    });
    st.ledger.push(receipt);
    st.outcomes.push({ outcome: rec, receipt: receipt });
    return { outcome: rec, receipt: receipt, receiptValid: verifyReceipt(receipt).ok, chainOk: verifyChain(st.ledger).ok, state: st };
  }

  /* Stage 9: the outcome generates a next-mission card. A success queues a
     follow-up claim pre-filled into stage 1; a failure queues a rework
     claim naming what failed. The card is a suggestion, not an execution. */
  function nextMission(outcomeRecord) {
    var o = outcomeRecord || {};
    var ok = (o.result === 'success');
    return {
      kind: ok ? 'follow-up' : 'rework',
      claim: ok
        ? 'Follow up on ' + (o.claimId || 'the claim') + ': verify the outcome held and find the next adjacent opportunity.'
        : 'Rework ' + (o.claimId || 'the claim') + ': the recorded outcome was ' + (o.result || 'unknown') + '. Re-open the claim with the failure notes attached.',
      notes: o.notes || '',
      prefillClaimId: null
    };
  }

  /* Worked-example input: the full claim that reproduces the recorded hex. */
  function workedExampleInput() {
    return {
      claimId: WORKED_CLAIM_ID,
      claim: 'Berrien County tax-lien parcel, absentee owner, estate-held. Opportunity scan candidate.',
      header: WORKED_HEADER_FIELDS,
      proposed: PROCEED_SETS.proposed,
      allowed: PROCEED_SETS.allowed,
      available: PROCEED_SETS.available,
      memory: {
        memoryClass: 'Semantic', source: 'county record', freshness: 'Days',
        evidence: 8, contradiction: 'none', relevanceHorizon: '90 days',
        kind: 'Fact', mutability: 'Editable current state'
      },
      emergence_raw: 90, objection_penalty: 10, signal: 'contract',
      external_signal: true,
      decayAgeDays: 7, decayPreset: 'lead'
    };
  }

  /* Passing preset: 4 proposed edges inside allowed/available, WRITE gate,
     SHIP-CANDIDATE crucible. Reaches PROCEED under the unified rule. */
  function passingPresetInput() {
    var w = workedExampleInput();
    w.claimId = undefined;
    w.claim = 'Passing preset: 4 proposed edges, all allowed and available, evidence 8, contract signal.';
    return w;
  }

  /* Kill preset: the recorded CRUCIBLE case (94-56)x0.15 = 5.7 KILL. */
  function killPresetInput() {
    var w = workedExampleInput();
    w.claimId = undefined;
    w.claim = 'Kill preset: the recorded case, emergence 94, objections 56, no external signal.';
    w.emergence_raw = 94;
    w.objection_penalty = 56;
    w.signal = 'none';
    w.external_signal = false;
    return w;
  }

  /* Default preset: D-001 sets, propose 8 / allow 6 / available 5, PARTIAL,
     which blocks promotion. */
  function defaultPresetInput() {
    var w = workedExampleInput();
    w.claimId = undefined;
    w.claim = 'Default preset (decision D-001): propose 8, allow 6, available 5. Intersection PARTIAL, promotion blocked.';
    w.proposed = DEFAULT_SETS.proposed.slice();
    w.allowed = DEFAULT_SETS.allowed.slice();
    w.available = DEFAULT_SETS.available.slice();
    return w;
  }

'''

EXPORTS = r'''
  return {
    GENESIS: GENESIS,
    RECEIPT_VERSION: RECEIPT_VERSION,
    MULTIPLIERS: MULTIPLIERS,
    sha256: sha256,
    toUtf8: toUtf8,
    hashStr: hashStr,
    canonical: canonical,
    buildReceipt: buildReceipt,
    hashReceipt: hashReceipt,
    verifyReceipt: verifyReceipt,
    verifyChain: verifyChain,
    parseJsonl: parseJsonl,
    watchJsonl: watchJsonl,
    signalMultiplier: signalMultiplier,
    crucibleScore: crucibleScore,
    crucibleVerdict: crucibleVerdict,
    applyStrike: applyStrike,
    doctrineEta: doctrineEta,
    etaGate: etaGate,
    ingestOutcome: ingestOutcome,
    promotionGate: promotionGate,
    runLoop: runLoop,
    ILLUSTRATIVE_THRESHOLDS: ILLUSTRATIVE_THRESHOLDS,
    THRESHOLD_NOTE: THRESHOLD_NOTE,
    validate: validate,
    evaluateWrite: evaluateWrite,
    DECAY_PRESETS: DECAY_PRESETS,
    decay: decay,
    decayWithPreset: decayWithPreset,
    BYTE_NAMES: BYTE_NAMES,
    DEFAULT_HEADER: DEFAULT_HEADER,
    hex2: hex2,
    clamp255: clamp255,
    stampHeader: stampHeader,
    governanceIntersection: governanceIntersection,
    intersectionDetail: intersectionDetail,
    DEFAULT_SETS: DEFAULT_SETS,
    PROCEED_SETS: PROCEED_SETS,
    WORKED_CLAIM_ID: WORKED_CLAIM_ID,
    WORKED_HEADER_BYTES: WORKED_HEADER_BYTES,
    WORKED_HEADER_FIELDS: WORKED_HEADER_FIELDS,
    WORKED_HEADER_HEX: WORKED_HEADER_HEX,
    WORKED_HEADER_HEX_COMPACT: WORKED_HEADER_HEX_COMPACT,
    decidePromotionUnified: decidePromotionUnified,
    nextClaimId: nextClaimId,
    resetClaimSeq: resetClaimSeq,
    newChainState: newChainState,
    runChain: runChain,
    recordOutcome: recordOutcome,
    nextMission: nextMission,
    workedExampleInput: workedExampleInput,
    passingPresetInput: passingPresetInput,
    killPresetInput: killPresetInput,
    defaultPresetInput: defaultPresetInput
  };
'''

header = """/* Unified Chain demo core logic (SIMULATION, browser-local, no backend).
   Assembled verbatim from proven pieces; see assemble.py for sources.
   UMD style: the same file loads in Node (require) and in the browser
   (window.UnifiedChain). Receipt v1.0, SHA-256 hash chain, first prev hash
   is the literal string GENESIS, canonical JSON with the hash field
   stripped before hashing. */
(function (root, factory) {
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = factory();
  } else {
    root.UnifiedChain = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
"""

footer = "\n}));\n"

os.makedirs(os.path.join(WS, "unified-chain"), exist_ok=True)
out = header + p0 + "\n" + wg + "\n" + dc + "\n" + hdr + NEW_CODE + EXPORTS + footer
open(OUT, "w").write(out)
print("wrote", OUT, len(out), "bytes")
