/* Integrated Governance Loop: one claim through header, intersection,
   memory write-gate, CRUCIBLE gate, receipt, promotion.
   SIMULATION. Reference implementation only. Not the production Mac loop.
   Receipt v1.0, SHA-256 hash chain, first prev hash GENESIS. FNV-1a nowhere.
   Verbatim sections are copied from the named sources without retyping;
   new sections are marked NEW. Bit meanings are the N-Cell demo placeholders
   / manifest mappings, never paper claims. Memory-gate thresholds are
   illustrative; the paper sets none.
   UMD: same file loads in Node (require) and in the browser (window.GovernanceLoop). */
(function (root, factory) {
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = factory();
  } else {
    root.GovernanceLoop = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

/* ---------- SHA-256 (pure JS, verbatim from the land-report store) ---------- */
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), i, j, result = '';
    var words = [], bitLen = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [];
    var pc = k.length, isC = {};
    for (var cand = 2; pc < 64; cand++) {
      if (!isC[cand]) {
        for (i = 0; i < 313; i += cand) isC[i] = cand;
        hash[pc] = (mp(cand, .5) * mw) | 0;
        k[pc++] = (mp(cand, 1 / 3) * mw) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return null;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (bitLen / mw) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
          + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
    return result;
  }

  function toUtf8(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) out += str.charAt(i);
      else if (c < 2048) out += String.fromCharCode((c >> 6) | 192, (c & 63) | 128);
      else if (c < 55296 || c > 57343) out += String.fromCharCode((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
      else {
        i++; var c2 = str.charCodeAt(i);
        var cp = 0x10000 + (((c & 0x3FF) << 10) | (c2 & 0x3FF));
        out += String.fromCharCode((cp >> 18) | 240, ((cp >> 12) & 63) | 128, ((cp >> 6) & 63) | 128, (cp & 63) | 128);
      }
    }
    return out;
  }

  function hashStr(s) { return sha256(toUtf8(s)); }

/* canonical JSON: sorted keys, arrays in order */
  function canonical(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(v[k]); }).join(',') + '}';
  }

  var GENESIS = 'GENESIS';
  var RECEIPT_VERSION = '1.0';

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  /* ---------- receipt v1.0 ---------- */
  function buildReceipt(opts) {
    var o = opts || {};
    var receipt = {
      receipt_version: RECEIPT_VERSION,
      type: o.type || 'event',
      seq: o.seq || 0,
      payload: o.payload || {},
      provenance: {
        report_hash_sha256: null,
        timestamp_utc: o.timestamp_utc || new Date().toISOString(),
        prev_receipt_hash: (o.prevHash === undefined || o.prevHash === null) ? GENESIS : o.prevHash
      }
    };
    var forHash = deepCopy(receipt);
    delete forHash.provenance.report_hash_sha256;
    receipt.provenance.report_hash_sha256 = hashStr(canonical(forHash));
    return receipt;
  }

  /* Recompute the hash of a sealed receipt. Returns null when the receipt is malformed. */
  function hashReceipt(receipt) {
    try {
      var forHash = deepCopy(receipt);
      if (!forHash.provenance) return null;
      delete forHash.provenance.report_hash_sha256;
      return hashStr(canonical(forHash));
    } catch (e) {
      return null;
    }
  }

  function verifyReceipt(receipt) {
    if (!receipt || typeof receipt !== 'object') return { ok: false, error: 'not an object' };
    if (receipt.receipt_version !== RECEIPT_VERSION) return { ok: false, error: 'bad receipt_version: ' + receipt.receipt_version };
    if (!receipt.provenance || typeof receipt.provenance.report_hash_sha256 !== 'string') return { ok: false, error: 'missing report_hash_sha256' };
    if (typeof receipt.provenance.prev_receipt_hash !== 'string') return { ok: false, error: 'missing prev_receipt_hash' };
    var recomputed = hashReceipt(receipt);
    if (recomputed === null) return { ok: false, error: 'unhashable receipt' };
    if (recomputed !== receipt.provenance.report_hash_sha256) return { ok: false, error: 'hash mismatch: stored ' + receipt.provenance.report_hash_sha256.slice(0, 12) + ' recomputed ' + recomputed.slice(0, 12) };
    return { ok: true, error: null };
  }

  function verifyChain(receipts) {
    var errors = [];
    if (!Array.isArray(receipts) || receipts.length === 0) {
      return { ok: false, errors: ['empty ledger'] };
    }
    receipts.forEach(function (r, i) {
      var v = verifyReceipt(r);
      if (!v.ok) errors.push('receipt ' + i + ': ' + v.error);
      if (i === 0) {
        if (r.provenance && r.provenance.prev_receipt_hash !== GENESIS) {
          errors.push('receipt 0: first prev hash must be GENESIS, got ' + r.provenance.prev_receipt_hash);
        }
      } else {
        var prevHash = receipts[i - 1].provenance && receipts[i - 1].provenance.report_hash_sha256;
        if (r.provenance && r.provenance.prev_receipt_hash !== prevHash) {
          errors.push('receipt ' + i + ': broken link, prev ' + String(r.provenance.prev_receipt_hash).slice(0, 12) + ' does not match receipt ' + (i - 1) + ' hash ' + String(prevHash).slice(0, 12));
        }
      }
    });
    return { ok: errors.length === 0, errors: errors };
  }

  var MULTIPLIERS = {
    contract: 1.00,   /* revenue / signed contract */
    pilot: 0.50,      /* paid pilot */
    lead: 0.30,       /* one real lead */
    none: 0.15        /* nothing */
  };

  function signalMultiplier(signal) {
    if (signal === 'contract' || signal === 'revenue/signed contract' || signal === 'revenue' || signal === 'signed contract') return MULTIPLIERS.contract;
    if (signal === 'pilot' || signal === 'paid pilot') return MULTIPLIERS.pilot;
    if (signal === 'lead' || signal === 'one real lead') return MULTIPLIERS.lead;
    return MULTIPLIERS.none;
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  /* score = max(0, emergence_raw - objection_penalty) x multiplier */
  function crucibleScore(emergenceRaw, objectionPenalty, signal) {
    var base = Math.max(0, emergenceRaw - objectionPenalty);
    return round2(base * signalMultiplier(signal));
  }

  function crucibleVerdict(input) {
    var i = input || {};
    var score = crucibleScore(i.emergence_raw, i.objection_penalty, i.signal);
    var externalSignal = !!i.external_signal;
    var verdict, reason;
    if (score < 20) {
      verdict = 'KILL';
      reason = 'score ' + score + ' below 20';
    } else if (score < 50) {
      verdict = 'ITERATE';
      reason = 'score ' + score + ' in 20-49 band';
    } else if (externalSignal) {
      verdict = 'SHIP-CANDIDATE';
      reason = 'score ' + score + ' at or above 50 with a real external signal';
    } else {
      verdict = 'ITERATE';
      reason = 'score ' + score + ' at or above 50 but no real external signal, downgraded to ITERATE';
    }
    return { score: score, multiplier: signalMultiplier(i.signal), verdict: verdict, reason: reason, external_signal: externalSignal };
  }

  /* ---------- eta gate (doctrine eta) ---------- */
  /* doctrine-eta = (I_q x I_r x I_v) / (1 + E_wasted + C_violations), bounded 0-100.
     Seed requires eta >= 70 AND feedback accuracy >= 0.6. */
  function doctrineEta(input) {
    var i = input || {};
    var num = (i.I_q || 0) * (i.I_r || 0) * (i.I_v || 0);
    var den = 1 + (i.E_wasted || 0) + (i.C_violations || 0);
    var eta = num / den;
    if (eta < 0) eta = 0;
    if (eta > 100) eta = 100;
    return round2(eta);
  }

  function etaGate(input) {
    var i = input || {};
    var eta = doctrineEta(i);
    var accuracy = (typeof i.feedback_accuracy === 'number') ? i.feedback_accuracy : 0;
    var seedAllowed = eta >= 70 && accuracy >= 0.6;
    return {
      eta: eta,
      feedback_accuracy: accuracy,
      seed_allowed: seedAllowed,
      reason: seedAllowed
        ? 'eta ' + eta + ' >= 70 and feedback accuracy ' + accuracy + ' >= 0.6'
        : 'blocked: eta ' + eta + ' (needs >= 70) and feedback accuracy ' + accuracy + ' (needs >= 0.6)'
    };
  }

  var MEMORY_CLASSES = [
    "Working", "Episodic", "Semantic", "Procedural",
    "Negative", "Strategic", "Capability", "Epistemic"
  ];
  var FRESHNESS_VALUES = ["Minutes", "Hours", "Days", "Weeks", "Months", "Years"];
  var CONFLICT_VALUES = ["none", "contradicts", "supersedes"];
  var KIND_VALUES = ["Fact", "Inference"];
  var MUTABILITY_VALUES = ["Immutable history", "Editable current state"];

  /* Illustrative thresholds. The paper gives no numeric thresholds. */
  var ILLUSTRATIVE_THRESHOLDS = { rejectBelow: 3, quarantineBelow: 6 };
  var THRESHOLD_NOTE =
    "Illustrative thresholds only: the JGI paper gives no numeric " +
    "thresholds. REJECT below 3, QUARANTINE below 6, else WRITE.";

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function validate(input) {
    var problems = [];
    if (!input || typeof input !== "object") {
      return ["input must be an object answering the eight gate questions"];
    }
    if (MEMORY_CLASSES.indexOf(input.memoryClass) === -1) {
      problems.push("memoryClass must be one of: " + MEMORY_CLASSES.join(", "));
    }
    if (!isNonEmptyString(input.source)) {
      problems.push("source must be a non-empty string");
    }
    if (!isNonEmptyString(input.freshness) || FRESHNESS_VALUES.indexOf(input.freshness) === -1) {
      problems.push("freshness must be one of: " + FRESHNESS_VALUES.join(", "));
    }
    if (typeof input.evidence !== "number" || !isFinite(input.evidence) ||
        input.evidence < 0 || input.evidence > 10) {
      problems.push("evidence (confidence) must be a number from 0 to 10");
    }
    if (CONFLICT_VALUES.indexOf(input.contradiction) === -1) {
      problems.push("contradiction must be one of: " + CONFLICT_VALUES.join(", "));
    }
    if (!isNonEmptyString(input.relevanceHorizon)) {
      problems.push("relevanceHorizon must be a non-empty string");
    }
    if (KIND_VALUES.indexOf(input.kind) === -1) {
      problems.push("kind must be one of: " + KIND_VALUES.join(", "));
    }
    if (MUTABILITY_VALUES.indexOf(input.mutability) === -1) {
      problems.push("mutability must be one of: " + MUTABILITY_VALUES.join(", "));
    }
    return problems;
  }

  /* Evaluate one write candidate against the eight gate questions.
   * Returns { verdict, reasons, input, illustrative, thresholdNote }.
   * Verdicts: REJECT, QUARANTINE, WRITE.
   */
  function evaluateWrite(input) {
    var problems = validate(input);
    if (problems.length > 0) {
      return {
        verdict: "REJECT",
        reasons: ["Gate input invalid: " + problems.join("; ")],
        input: input || null,
        illustrative: true,
        thresholdNote: THRESHOLD_NOTE
      };
    }
    var ev = input.evidence;
    var reasons = [];
    var verdict;
    if (ev < ILLUSTRATIVE_THRESHOLDS.rejectBelow) {
      verdict = "REJECT";
      reasons.push("Evidence strength " + ev + " is below " + ILLUSTRATIVE_THRESHOLDS.rejectBelow + ". Insufficient evidence to write.");
    } else if (input.contradiction === "contradicts") {
      verdict = "QUARANTINE";
      reasons.push("Contradicts an existing memory. Held for resolution under Section 38 before any write.");
    } else if (ev < ILLUSTRATIVE_THRESHOLDS.quarantineBelow) {
      /* Dead branch removed: the old demo also tested (kind === "Inference" && ev < 6)
       * here, but that condition is subsumed by ev < 6 and could never fire on its own. */
      verdict = "QUARANTINE";
      reasons.push("Evidence strength " + ev + " is below " + ILLUSTRATIVE_THRESHOLDS.quarantineBelow + ". Held for corroboration.");
    } else {
      verdict = "WRITE";
      reasons.push(
        "Evidence strength " + ev + ", no contradiction, " +
        input.kind.toLowerCase() + " accepted as " + input.mutability.toLowerCase() + "."
      );
      if (input.contradiction === "supersedes") {
        reasons.push("Supersedes an existing memory; the superseded record is retained as history, not deleted.");
      }
    }
    return {
      verdict: verdict,
      reasons: reasons,
      input: {
        memoryClass: input.memoryClass,
        source: input.source,
        freshness: input.freshness,
        evidence: ev,
        contradiction: input.contradiction,
        relevanceHorizon: input.relevanceHorizon,
        kind: input.kind,
        mutability: input.mutability
      },
      illustrative: true,
      thresholdNote: THRESHOLD_NOTE
    };
  }


  /* ---------- NEW: N-Cell/64 header stamper (paper Section 3.3) ---------- */
  /* The paper defines the 8-byte layout only. It sets no numeric defaults.
     Defaults below are the N-Cell Organ Manifest demo defaults: confidence
     128, every other byte 0, organMask 0x07 (SAL manifest bits 0, 1, 2:
     signal-node-creation, opportunity-node-update, neighborhood-proposal).
     Bit meanings are the manifest demo placeholders, never paper claims. */
  var BYTE_NAMES = [
    'routeMask', 'organMask', 'lifecycleMask', 'authorityMask',
    'memoryMask', 'confidence', 'risk', 'outputMask'
  ];
  var DEFAULT_HEADER = {
    routeMask: 0x00,
    organMask: 0x07,
    lifecycleMask: 0x00,
    authorityMask: 0x00,
    memoryMask: 0x00,
    confidence: 128,
    risk: 0,
    outputMask: 0x00
  };

  function hex2(n) {
    return ('0' + (n & 0xFF).toString(16)).slice(-2).toUpperCase();
  }

  function clamp255(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > 255) return 255;
    return n;
  }

  function stampHeader(overrides) {
    var o = overrides || {};
    var bytes = BYTE_NAMES.map(function (name) {
      var v = (o[name] === undefined || o[name] === null) ? DEFAULT_HEADER[name] : o[name];
      return clamp255(v);
    });
    var fields = {};
    BYTE_NAMES.forEach(function (name, i) { fields[name] = bytes[i]; });
    return {
      bytes: bytes,
      fields: fields,
      hex: bytes.map(hex2).join(' '),
      hexCompact: bytes.map(hex2).join(''),
      byteNames: BYTE_NAMES.slice(),
      defaultsNote: 'Paper Section 3.3 defines the layout only. Defaults are the N-Cell Organ Manifest demo defaults; organMask 0x07 is the SAL manifest bit mapping, a placeholder, never a paper claim.'
    };
  }

  /* ---------- NEW: governance intersection (paper Section 3.4) ---------- */
  /* E* = E_proposed AND E_allowed AND E_available, computed on edge id sets.
     Verdicts: NO PROPOSAL (proposed empty), BLOCKED (intersection empty),
     PARTIAL (intersection non-empty but smaller than proposed),
     PROCEED (intersection equals proposed). The N-Cell demo shows this
     formula but does not compute it; this computation is new here. */
  function uniqSorted(arr) {
    var seen = {};
    var out = [];
    (arr || []).forEach(function (v) {
      var n = parseInt(v, 10);
      if (!isNaN(n) && !seen[n]) { seen[n] = true; out.push(n); }
    });
    out.sort(function (a, b) { return a - b; });
    return out;
  }

  function governanceIntersection(proposed, allowed, available) {
    var p = uniqSorted(proposed);
    var a = uniqSorted(allowed);
    var v = uniqSorted(available);
    var aSet = {};
    a.forEach(function (x) { aSet[x] = true; });
    var vSet = {};
    v.forEach(function (x) { vSet[x] = true; });
    var inter = p.filter(function (x) { return aSet[x] && vSet[x]; });
    var verdict, reason;
    if (p.length === 0) {
      verdict = 'NO PROPOSAL';
      reason = 'nothing proposed: E_proposed is empty';
    } else if (inter.length === 0) {
      verdict = 'BLOCKED';
      reason = 'intersection is empty: no proposed edge is both allowed and available';
    } else if (inter.length === p.length) {
      verdict = 'PROCEED';
      reason = 'every proposed edge is allowed and available: E* equals E_proposed';
    } else {
      verdict = 'PARTIAL';
      reason = 'only ' + inter.length + ' of ' + p.length + ' proposed edges are allowed and available';
    }
    return {
      proposed: p, allowed: a, available: v, intersection: inter,
      counts: { proposed: p.length, allowed: a.length, available: v.length, intersection: inter.length },
      verdict: verdict, reason: reason
    };
  }

  /* ---------- NEW: promotion decision ---------- */
  /* Promotes only when all three gates pass AND a real external signal is
     present. Passing means: intersection PROCEED, memory gate WRITE,
     CRUCIBLE SHIP-CANDIDATE. Otherwise it stops and names the first
     blocking gate in order: intersection, memory gate, CRUCIBLE, signal. */
  function decidePromotion(input) {
    var i = input || {};
    var blockingGate = null;
    if (i.intersectionVerdict !== 'PROCEED') blockingGate = 'intersection';
    else if (i.memoryVerdict !== 'WRITE') blockingGate = 'memory-gate';
    else if (i.crucibleVerdict !== 'SHIP-CANDIDATE') blockingGate = 'crucible';
    else if (!i.externalSignal) blockingGate = 'external-signal';
    if (blockingGate) {
      return { promote: false, blockingGate: blockingGate, reason: 'stopped at ' + blockingGate };
    }
    return { promote: true, blockingGate: null, reason: 'all three gates pass with a real external signal' };
  }

  /* ---------- NEW: run one claim through the whole loop ---------- */
  function runClaim(input) {
    var i = input || {};
    var header = stampHeader(i.header);
    var intersection = governanceIntersection(i.proposed, i.allowed, i.available);
    var eta = etaGate(i.eta || {});
    var memoryGate = evaluateWrite(i.memory || {});
    var crucible = crucibleVerdict({
      emergence_raw: i.emergence_raw,
      objection_penalty: i.objection_penalty,
      signal: i.signal,
      external_signal: !!i.external_signal
    });
    var promotion = decidePromotion({
      intersectionVerdict: intersection.verdict,
      memoryVerdict: memoryGate.verdict,
      crucibleVerdict: crucible.verdict,
      externalSignal: !!i.external_signal
    });
    var payload = {
      claim: i.claim || '',
      header_hex: header.hex,
      header_bytes: header.bytes,
      intersection: {
        verdict: intersection.verdict,
        counts: intersection.counts,
        intersection: intersection.intersection
      },
      doctrine_eta: { eta: eta.eta, seed_allowed: eta.seed_allowed },
      memory_gate: { verdict: memoryGate.verdict, reasons: memoryGate.reasons, illustrative: true },
      crucible: { score: crucible.score, multiplier: crucible.multiplier, verdict: crucible.verdict, signal: i.signal || 'none' },
      promotion: promotion
    };
    var receipt = buildReceipt({
      type: 'governance-loop',
      seq: 1,
      payload: payload,
      prevHash: GENESIS,
      timestamp_utc: i.timestamp_utc || undefined
    });
    var receiptCheck = verifyReceipt(receipt);
    return {
      claim: i.claim || '',
      header: header,
      intersection: intersection,
      eta: eta,
      memoryGate: memoryGate,
      crucible: crucible,
      promotion: promotion,
      receipt: receipt,
      receiptValid: receiptCheck.ok
    };
  }


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
    signalMultiplier: signalMultiplier,
    crucibleScore: crucibleScore,
    crucibleVerdict: crucibleVerdict,
    doctrineEta: doctrineEta,
    etaGate: etaGate,
    ILLUSTRATIVE_THRESHOLDS: ILLUSTRATIVE_THRESHOLDS,
    THRESHOLD_NOTE: THRESHOLD_NOTE,
    validate: validate,
    evaluateWrite: evaluateWrite,
    BYTE_NAMES: BYTE_NAMES,
    DEFAULT_HEADER: DEFAULT_HEADER,
    hex2: hex2,
    clamp255: clamp255,
    stampHeader: stampHeader,
    governanceIntersection: governanceIntersection,
    decidePromotion: decidePromotion,
    runClaim: runClaim
  };
}));
