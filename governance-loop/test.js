/* Node tests for the Integrated Governance Loop (governance-loop.js).
   Run: node test.js
   Exits 0 only when every check passes. */
var G = require('./governance-loop.js');
var crypto = require('crypto');

var passed = 0;
var failed = 0;
var failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log('PASS ' + name);
  } else {
    failed += 1;
    failures.push(name + (detail ? ' :: ' + detail : ''));
    console.log('FAIL ' + name + (detail ? ' :: ' + detail : ''));
  }
}

function nodeSha256(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function goodMemory(evidence, contradiction) {
  return {
    memoryClass: 'Semantic', source: 'county record', freshness: 'Days',
    evidence: evidence, contradiction: contradiction || 'none',
    relevanceHorizon: '90 days', kind: 'Fact', mutability: 'Editable current state'
  };
}

function baseClaim(overrides) {
  var c = {
    claim: 'Test claim',
    proposed: [0, 1, 2, 3],
    allowed: [0, 1, 2, 3, 4, 5],
    available: [0, 1, 2, 3, 4],
    memory: goodMemory(8),
    emergence_raw: 90,
    objection_penalty: 10,
    signal: 'contract',
    external_signal: true,
    eta: { I_q: 10, I_r: 9, I_v: 8, E_wasted: 0, C_violations: 0, feedback_accuracy: 0.8 }
  };
  if (overrides) {
    Object.keys(overrides).forEach(function (k) { c[k] = overrides[k]; });
  }
  return c;
}

/* --- SHA-256 correctness: pure-JS implementation vs Node crypto --- */
check('sha256 abc vector', G.sha256(G.toUtf8('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
check('sha256 matches Node crypto', G.hashStr('governance loop 2026-11-14') === nodeSha256('governance loop 2026-11-14'));

/* --- Step 1: N-Cell/64 header --- */
check('header defaults are 00 07 00 00 00 80 00 00', (function () {
  var h = G.stampHeader({});
  return h.hex === '00 07 00 00 00 80 00 00' && h.fields.confidence === 128 && h.fields.organMask === 0x07;
})());
check('header byte order is paper Section 3.3', G.BYTE_NAMES.join(',') === 'routeMask,organMask,lifecycleMask,authorityMask,memoryMask,confidence,risk,outputMask');
check('header override replaces a default byte', G.stampHeader({ risk: 200 }).fields.risk === 200);

/* --- Step 2: governance intersection --- */
check('intersection defaults propose 8 allow 6 available 5 intersect 5 PARTIAL', (function () {
  var x = G.governanceIntersection([0, 1, 2, 3, 4, 5, 6, 7], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4]);
  return x.counts.proposed === 8 && x.counts.allowed === 6 && x.counts.available === 5 &&
    x.counts.intersection === 5 && x.verdict === 'PARTIAL';
})());
check('intersection PROCEED when proposed is a subset of allowed and available', (function () {
  var x = G.governanceIntersection([0, 1, 2, 3], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4]);
  return x.verdict === 'PROCEED' && x.intersection.join(',') === '0,1,2,3';
})());
check('intersection BLOCKED when no proposed edge is allowed and available', (function () {
  var x = G.governanceIntersection([6, 7], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4]);
  return x.verdict === 'BLOCKED' && x.intersection.length === 0;
})());
check('intersection NO PROPOSAL when proposed is empty', G.governanceIntersection([], [0, 1], [0, 1]).verdict === 'NO PROPOSAL');

/* --- Step 3: memory write-gate (illustrative thresholds) --- */
check('write-gate evidence below 3 REJECTs', G.evaluateWrite(goodMemory(1)).verdict === 'REJECT');
check('write-gate contradiction QUARANTINEs even at evidence 9', G.evaluateWrite(goodMemory(9, 'contradicts')).verdict === 'QUARANTINE');
check('write-gate evidence 4 QUARANTINEs', G.evaluateWrite(goodMemory(4)).verdict === 'QUARANTINE');
check('write-gate evidence 8 with no contradiction WRITEs', G.evaluateWrite(goodMemory(8)).verdict === 'WRITE');

/* --- RECORDED CASE: fabricated world eta 0.0 is blocked --- */
check('fabricated world eta 0.0 is blocked', (function () {
  var g = G.etaGate({ I_q: 0, I_r: 0, I_v: 0, E_wasted: 0, C_violations: 0, feedback_accuracy: 0 });
  return g.eta === 0 && g.seed_allowed === false;
})());

/* --- RECORDED CASE: (94-56)x0.15 = 5.7 KILL --- */
check('(94-56)x0.15 = 5.7 KILL', (function () {
  var v = G.crucibleVerdict({ emergence_raw: 94, objection_penalty: 56, signal: 'none' });
  return v.score === 5.7 && v.verdict === 'KILL';
})());

/* --- RECORDED CASE: perfect world with zero signal = 15 KILL --- */
check('perfect world with zero signal = 15 KILL', (function () {
  var v = G.crucibleVerdict({ emergence_raw: 100, objection_penalty: 0, signal: 'none' });
  return v.score === 15 && v.verdict === 'KILL';
})());

/* --- Step 4: CRUCIBLE ladder --- */
check('multiplier ladder contract 1.00 pilot 0.50 lead 0.30 none 0.15', (
  G.signalMultiplier('contract') === 1.00 &&
  G.signalMultiplier('pilot') === 0.50 &&
  G.signalMultiplier('lead') === 0.30 &&
  G.signalMultiplier('none') === 0.15
));
check('score 50+ with external signal is SHIP-CANDIDATE', (function () {
  var v = G.crucibleVerdict({ emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: true });
  return v.score === 80 && v.verdict === 'SHIP-CANDIDATE';
})());
check('score 50+ without external signal downgrades to ITERATE', (function () {
  var v = G.crucibleVerdict({ emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: false });
  return v.score === 80 && v.verdict === 'ITERATE';
})());

/* --- REQUIRED: a claim passing all gates with a real signal promotes --- */
check('claim passing all gates with a real signal promotes', (function () {
  var r = G.runClaim(baseClaim());
  return r.promotion.promote === true && r.promotion.blockingGate === null &&
    r.intersection.verdict === 'PROCEED' && r.memoryGate.verdict === 'WRITE' &&
    r.crucible.verdict === 'SHIP-CANDIDATE' && r.receiptValid === true;
})());

/* --- REQUIRED: a claim failing any gate does not promote, blocking gate named --- */
check('claim failing the intersection does not promote, names intersection', (function () {
  var r = G.runClaim(baseClaim({ proposed: [6, 7] }));
  return r.promotion.promote === false && r.promotion.blockingGate === 'intersection';
})());
check('claim failing the memory gate does not promote, names memory-gate', (function () {
  var r = G.runClaim(baseClaim({ memory: goodMemory(1) }));
  return r.promotion.promote === false && r.promotion.blockingGate === 'memory-gate';
})());
check('claim failing CRUCIBLE does not promote, names crucible', (function () {
  var r = G.runClaim(baseClaim({ emergence_raw: 94, objection_penalty: 56, signal: 'none', external_signal: false }));
  return r.promotion.promote === false && r.promotion.blockingGate === 'crucible' && r.crucible.score === 5.7;
})());
check('SHIP-CANDIDATE without an external signal does not promote', (function () {
  var r = G.runClaim(baseClaim({ external_signal: false }));
  return r.promotion.promote === false && r.crucible.verdict === 'ITERATE';
})());
check('default intersection PARTIAL blocks promotion at the intersection', (function () {
  var r = G.runClaim(baseClaim({ proposed: [0, 1, 2, 3, 4, 5, 6, 7] }));
  return r.promotion.promote === false && r.promotion.blockingGate === 'intersection' &&
    r.intersection.verdict === 'PARTIAL';
})());

/* --- Step 5: receipt v1.0 --- */
check('receipt is v1.0 with GENESIS prev hash and verifies', (function () {
  var r = G.runClaim(baseClaim());
  return r.receipt.receipt_version === '1.0' &&
    r.receipt.provenance.prev_receipt_hash === 'GENESIS' &&
    G.verifyReceipt(r.receipt).ok === true;
})());
check('receipt payload records header, intersection, gate, and CRUCIBLE verdicts', (function () {
  var r = G.runClaim(baseClaim());
  var p = r.receipt.payload;
  return p.header_hex === '00 07 00 00 00 80 00 00' &&
    p.intersection.verdict === 'PROCEED' &&
    p.memory_gate.verdict === 'WRITE' &&
    p.crucible.verdict === 'SHIP-CANDIDATE' &&
    p.promotion.promote === true;
})());

/* --- REQUIRED: a tampered receipt fails verification --- */
check('tampered receipt fails verification', (function () {
  var r = G.runClaim(baseClaim());
  var tampered = JSON.parse(JSON.stringify(r.receipt));
  tampered.payload.crucible.verdict = 'SHIP-CANDIDATE';
  tampered.payload.promotion = { promote: true, blockingGate: null, reason: 'forged' };
  return G.verifyReceipt(tampered).ok === false;
})());
check('chain verification rejects a broken prev link', (function () {
  var r = G.runClaim(baseClaim());
  var second = JSON.parse(JSON.stringify(r.receipt));
  second.provenance.prev_receipt_hash = 'deadbeef';
  var stripped = JSON.parse(JSON.stringify(second));
  delete stripped.provenance.report_hash_sha256;
  second.provenance.report_hash_sha256 = G.hashStr(G.canonical(stripped));
  return G.verifyChain([r.receipt, second]).ok === false;
})());

console.log('---');
console.log('passed ' + passed + '/' + (passed + failed));
if (failed) {
  console.log('failures:');
  failures.forEach(function (f) { console.log('  ' + f); });
  process.exit(1);
}
