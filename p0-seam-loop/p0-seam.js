/* P0 seam reference loop: receipt watcher -> Sentinel invocation -> result ingest -> custody -> promotion.
   SIMULATION. Reference implementation only. This is NOT the production loop on Jeramie's Mac.
   Receipt format: receipt v1.0, SHA-256 hash chain, first prev hash is the literal string GENESIS,
   canonical JSON with the hash field stripped before hashing.
   Source of the canonical format: ~/workspace/your_files/land-report-store/index.html (buildReceipt)
   and runtime.js. The N-Cell adapter demo uses FNV-1a 32-bit hashing; that is demo-only and is NOT
   used here. All hashing in this module is SHA-256.
   UMD style: the same file loads in Node (require) and in the browser (window.P0Seam). */
(function (root, factory) {
  if (typeof module === 'object' && module !== null && module.exports) {
    module.exports = factory();
  } else {
    root.P0Seam = factory();
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

  /* ---------- (1) receipt watcher: ingest JSONL, verify the chain ---------- */
  function parseJsonl(text) {
    var receipts = [];
    var errors = [];
    var lines = String(text || '').split(/\n/);
    lines.forEach(function (line, idx) {
      var t = line.trim();
      if (!t) return;
      try {
        receipts.push(JSON.parse(t));
      } catch (e) {
        errors.push('line ' + (idx + 1) + ': invalid JSON');
      }
    });
    return { receipts: receipts, errors: errors };
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

  function watchJsonl(text) {
    var parsed = parseJsonl(text);
    if (parsed.errors.length) return { ok: false, receipts: parsed.receipts, errors: parsed.errors };
    var chain = verifyChain(parsed.receipts);
    return { ok: chain.ok, receipts: parsed.receipts, errors: chain.errors };
  }

  /* ---------- (2) Sentinel invocation: CRUCIBLE gate ---------- */
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

  /* Strike counting. A KILL adds one strike. kill_move fires only at strike 3.
     The first KILL does NOT move the file. Non-KILL verdicts do not add strikes. */
  function applyStrike(state, verdict) {
    var s = { strikes: (state && state.strikes) || 0, moved: !!(state && state.moved) };
    if (verdict === 'KILL') s.strikes += 1;
    var killMove = (verdict === 'KILL' && s.strikes === 3);
    if (killMove) s.moved = true;
    return { strikes: s.strikes, moved: s.moved, kill_move: killMove };
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

  /* ---------- (3) result ingest: outcome records chained onto the same ledger ---------- */
  function ingestOutcome(ledger, outcome) {
    var prev = GENESIS;
    if (Array.isArray(ledger) && ledger.length) {
      prev = ledger[ledger.length - 1].provenance.report_hash_sha256;
    }
    var receipt = buildReceipt({
      type: 'outcome',
      seq: (Array.isArray(ledger) ? ledger.length : 0) + 1,
      payload: outcome || {},
      prevHash: prev,
      timestamp_utc: (outcome && outcome.timestamp_utc) || undefined
    });
    var next = (Array.isArray(ledger) ? ledger.slice() : []);
    next.push(receipt);
    return { receipt: receipt, ledger: next };
  }

  /* ---------- (4) promotion gate ---------- */
  function promotionGate(input) {
    var i = input || {};
    if (i.verdict !== 'SHIP-CANDIDATE') {
      return { promote: false, reason: 'verdict ' + i.verdict + ' is not SHIP-CANDIDATE' };
    }
    if (!i.external_signal) {
      return { promote: false, reason: 'SHIP-CANDIDATE without a real external signal does not promote' };
    }
    return { promote: true, reason: 'SHIP-CANDIDATE with a real external signal promotes' };
  }

  /* ---------- full loop: watcher -> Sentinel -> ingest -> promotion ---------- */
  function runLoop(jsonlText, worlds) {
    var watch = watchJsonl(jsonlText);
    var steps = [];
    var ledger = watch.receipts.slice();
    var strikeState = { strikes: 0, moved: false };
    var promotions = [];
    steps.push({ hop: 'watcher', ok: watch.ok, errors: watch.errors, receipts_seen: ledger.length });
    if (!watch.ok) {
      return { ok: false, steps: steps, ledger: ledger, promotions: promotions, error: 'watcher rejected the ledger: ' + watch.errors.join('; ') };
    }
    (worlds || []).forEach(function (w) {
      var gate = crucibleVerdict(w);
      var eta = etaGate(w);
      strikeState = applyStrike(strikeState, gate.verdict);
      var outcome = {
        world: w.id || null,
        emergence_raw: w.emergence_raw,
        objection_penalty: w.objection_penalty,
        signal: w.signal || 'none',
        external_signal: !!w.external_signal,
        crucible_score: gate.score,
        verdict: gate.verdict,
        verdict_reason: gate.reason,
        doctrine_eta: eta.eta,
        seed_allowed: eta.seed_allowed,
        strikes: strikeState.strikes,
        kill_move: strikeState.kill_move
      };
      var ingested = ingestOutcome(ledger, outcome);
      ledger = ingested.ledger;
      var promo = promotionGate({ verdict: gate.verdict, external_signal: !!w.external_signal });
      if (promo.promote) promotions.push({ world: w.id || null, receipt_hash: ingested.receipt.provenance.report_hash_sha256 });
      steps.push({
        hop: 'sentinel+ingest',
        world: w.id || null,
        score: gate.score,
        verdict: gate.verdict,
        eta: eta.eta,
        seed_allowed: eta.seed_allowed,
        strikes: strikeState.strikes,
        kill_move: strikeState.kill_move,
        outcome_receipt: ingested.receipt.provenance.report_hash_sha256,
        promote: promo.promote,
        promote_reason: promo.reason
      });
    });
    var finalChain = verifyChain(ledger);
    steps.push({ hop: 'custody', ok: finalChain.ok, errors: finalChain.errors, receipts_total: ledger.length });
    return { ok: finalChain.ok, steps: steps, ledger: ledger, promotions: promotions, error: finalChain.ok ? null : 'final chain failed: ' + finalChain.errors.join('; ') };
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
    parseJsonl: parseJsonl,
    verifyChain: verifyChain,
    watchJsonl: watchJsonl,
    signalMultiplier: signalMultiplier,
    crucibleScore: crucibleScore,
    crucibleVerdict: crucibleVerdict,
    applyStrike: applyStrike,
    doctrineEta: doctrineEta,
    etaGate: etaGate,
    ingestOutcome: ingestOutcome,
    promotionGate: promotionGate,
    runLoop: runLoop
  };
}));
