/* Node tests for the P0 seam reference loop (p0-seam.js).
   Run: node test.js
   Exits 0 only when every check passes. */
var P0 = require('./p0-seam.js');
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

function seedLedger() {
  var r1 = P0.buildReceipt({ type: 'seed', seq: 1, payload: { world: 'alpha', note: 'genesis receipt' }, prevHash: 'GENESIS', timestamp_utc: '2026-11-14T00:00:00.000Z' });
  var r2 = P0.buildReceipt({ type: 'seed', seq: 2, payload: { world: 'alpha', note: 'second receipt' }, prevHash: r1.provenance.report_hash_sha256, timestamp_utc: '2026-11-14T00:01:00.000Z' });
  return [r1, r2];
}

function toJsonl(receipts) {
  return receipts.map(function (r) { return JSON.stringify(r); }).join('\n') + '\n';
}

/* --- SHA-256 correctness: pure-JS implementation vs Node crypto and known vectors --- */
check('sha256 abc vector', P0.sha256(P0.toUtf8('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
check('sha256 empty vector', P0.sha256(P0.toUtf8('')) === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
check('sha256 long vector', P0.sha256(P0.toUtf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')) === '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
check('sha256 matches Node crypto on receipt text', (function () {
  var s = 'P0 seam reference loop 2026-11-14';
  return P0.hashStr(s) === nodeSha256(s);
})());

/* --- canonical JSON --- */
check('canonical sorts keys', P0.canonical({ b: 1, a: { d: 4, c: 3 } }) === '{"a":{"c":3,"d":4},"b":1}');
check('canonical keeps array order', P0.canonical({ xs: [3, 1, 2] }) === '{"xs":[3,1,2]}');

/* --- receipt v1.0 --- */
check('first receipt prev hash is GENESIS', (function () {
  var r = P0.buildReceipt({ type: 'seed', seq: 1, payload: {} });
  return r.provenance.prev_receipt_hash === 'GENESIS' && r.receipt_version === '1.0';
})());
check('receipt hash recomputes and matches Node crypto', (function () {
  var r = P0.buildReceipt({ type: 'seed', seq: 1, payload: { x: 1 }, timestamp_utc: '2026-11-14T00:00:00.000Z' });
  var stripped = JSON.parse(JSON.stringify(r));
  delete stripped.provenance.report_hash_sha256;
  return r.provenance.report_hash_sha256 === nodeSha256(P0.canonical(stripped));
})());

/* --- RECORDED CASE: fabricated world eta 0.0 is blocked --- */
check('fabricated world eta 0.0 is blocked', (function () {
  var g = P0.etaGate({ I_q: 0, I_r: 0, I_v: 0, E_wasted: 0, C_violations: 0, feedback_accuracy: 0 });
  return g.eta === 0 && g.seed_allowed === false;
})());

/* --- RECORDED CASE: (94-56)x0.15 = 5.7 KILL --- */
check('(94-56)x0.15 = 5.7 KILL', (function () {
  var v = P0.crucibleVerdict({ emergence_raw: 94, objection_penalty: 56, signal: 'none' });
  return v.score === 5.7 && v.verdict === 'KILL';
})());

/* --- RECORDED CASE: perfect world with zero signal = 15 KILL --- */
check('perfect world with zero signal = 15 KILL', (function () {
  var v = P0.crucibleVerdict({ emergence_raw: 100, objection_penalty: 0, signal: 'none' });
  return v.score === 15 && v.verdict === 'KILL';
})());

/* --- multiplier ladder --- */
check('multiplier ladder contract 1.00 pilot 0.50 lead 0.30 none 0.15', (
  P0.signalMultiplier('contract') === 1.00 &&
  P0.signalMultiplier('pilot') === 0.50 &&
  P0.signalMultiplier('lead') === 0.30 &&
  P0.signalMultiplier('none') === 0.15
));
check('ITERATE band 20-49', (function () {
  var v = P0.crucibleVerdict({ emergence_raw: 60, objection_penalty: 10, signal: 'pilot' });
  return v.score === 25 && v.verdict === 'ITERATE';
})());
check('score 50+ with external signal is SHIP-CANDIDATE', (function () {
  var v = P0.crucibleVerdict({ emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: true });
  return v.score === 80 && v.verdict === 'SHIP-CANDIDATE';
})());
check('score 50+ without external signal downgrades to ITERATE', (function () {
  var v = P0.crucibleVerdict({ emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: false });
  return v.score === 80 && v.verdict === 'ITERATE';
})());

/* --- RECORDED CASES: chain verification --- */
check('chain verification accepts a good chain', (function () {
  var w = P0.watchJsonl(toJsonl(seedLedger()));
  return w.ok === true && w.errors.length === 0;
})());
check('chain verification rejects a tampered link', (function () {
  var ledger = seedLedger();
  ledger[1].payload.note = 'tampered after sealing';
  var w = P0.watchJsonl(toJsonl(ledger));
  return w.ok === false && w.errors.some(function (e) { return e.indexOf('hash mismatch') !== -1; });
})());
check('chain verification rejects a wrong GENESIS', (function () {
  var ledger = seedLedger();
  ledger[0].provenance.prev_receipt_hash = 'NOT-GENESIS';
  var fixed = JSON.parse(JSON.stringify(ledger[0]));
  var stripped = JSON.parse(JSON.stringify(fixed));
  delete stripped.provenance.report_hash_sha256;
  fixed.provenance.report_hash_sha256 = P0.hashStr(P0.canonical(stripped));
  ledger[0] = fixed;
  var w = P0.watchJsonl(toJsonl(ledger));
  return w.ok === false && w.errors.some(function (e) { return e.indexOf('GENESIS') !== -1; });
})());
check('chain verification rejects a broken prev link', (function () {
  var ledger = seedLedger();
  var fixed = JSON.parse(JSON.stringify(ledger[1]));
  fixed.provenance.prev_receipt_hash = 'deadbeef';
  var stripped = JSON.parse(JSON.stringify(fixed));
  delete stripped.provenance.report_hash_sha256;
  fixed.provenance.report_hash_sha256 = P0.hashStr(P0.canonical(stripped));
  ledger[1] = fixed;
  var w = P0.watchJsonl(toJsonl(ledger));
  return w.ok === false && w.errors.some(function (e) { return e.indexOf('broken link') !== -1; });
})());

/* --- RECORDED CASES: strike counting --- */
check('strike 1 KILL does not move', (function () {
  var s = P0.applyStrike({ strikes: 0, moved: false }, 'KILL');
  return s.strikes === 1 && s.kill_move === false && s.moved === false;
})());
check('strike 2 KILL does not move', (function () {
  var s = P0.applyStrike({ strikes: 1, moved: false }, 'KILL');
  return s.strikes === 2 && s.kill_move === false && s.moved === false;
})());
check('strike 3 KILL moves', (function () {
  var s = P0.applyStrike({ strikes: 2, moved: false }, 'KILL');
  return s.strikes === 3 && s.kill_move === true && s.moved === true;
})());
check('non-KILL verdict does not add a strike', (function () {
  var s = P0.applyStrike({ strikes: 1, moved: false }, 'ITERATE');
  return s.strikes === 1 && s.kill_move === false;
})());

/* --- RECORDED CASES: promotion gate --- */
check('promotion gate refuses SHIP-CANDIDATE without external signal', (function () {
  var p = P0.promotionGate({ verdict: 'SHIP-CANDIDATE', external_signal: false });
  return p.promote === false;
})());
check('promotion gate refuses ITERATE', (function () {
  var p = P0.promotionGate({ verdict: 'ITERATE', external_signal: true });
  return p.promote === false;
})());
check('promotion gate refuses KILL', (function () {
  var p = P0.promotionGate({ verdict: 'KILL', external_signal: true });
  return p.promote === false;
})());
check('promotion gate allows SHIP-CANDIDATE with external signal', (function () {
  var p = P0.promotionGate({ verdict: 'SHIP-CANDIDATE', external_signal: true });
  return p.promote === true;
})());

/* --- eta gate --- */
check('eta gate seeds at eta 70 and accuracy 0.6', (function () {
  var g = P0.etaGate({ I_q: 10, I_r: 7, I_v: 10, E_wasted: 9, C_violations: 0, feedback_accuracy: 0.6 });
  return g.eta === 70 && g.seed_allowed === true;
})());
check('eta gate blocks when accuracy is below 0.6', (function () {
  var g = P0.etaGate({ I_q: 10, I_r: 10, I_v: 10, E_wasted: 0, C_violations: 0, feedback_accuracy: 0.5 });
  return g.eta === 100 && g.seed_allowed === false;
})());
check('doctrine eta is bounded 0-100', (function () {
  var hi = P0.doctrineEta({ I_q: 10, I_r: 10, I_v: 10, E_wasted: 0, C_violations: 0 });
  var lo = P0.doctrineEta({ I_q: 0, I_r: 0, I_v: 0, E_wasted: 0, C_violations: 0 });
  return hi === 100 && lo === 0;
})());

/* --- result ingest chains onto the same ledger --- */
check('result ingest chains onto the same ledger', (function () {
  var ledger = seedLedger();
  var out = P0.ingestOutcome(ledger, { world: 'alpha', verdict: 'KILL', crucible_score: 5.7 });
  var last = ledger[ledger.length - 1];
  var okPrev = out.receipt.provenance.prev_receipt_hash === last.provenance.report_hash_sha256;
  var okChain = P0.verifyChain(out.ledger).ok === true;
  return okPrev && okChain && out.ledger.length === 3 && out.receipt.type === 'outcome';
})());

/* --- full loop end to end --- */
check('full loop runs watcher, Sentinel, ingest, promotion', (function () {
  var result = P0.runLoop(toJsonl(seedLedger()), [
    { id: 'w-kill', emergence_raw: 94, objection_penalty: 56, signal: 'none', external_signal: false, I_q: 0, I_r: 0, I_v: 0, E_wasted: 0, C_violations: 0, feedback_accuracy: 0 },
    { id: 'w-ship', emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: true, I_q: 10, I_r: 9, I_v: 8, E_wasted: 0, C_violations: 0, feedback_accuracy: 0.8 }
  ]);
  var shipStep = result.steps[2];
  return result.ok === true &&
    result.ledger.length === 4 &&
    result.steps[1].verdict === 'KILL' &&
    shipStep.verdict === 'SHIP-CANDIDATE' &&
    shipStep.promote === true &&
    result.promotions.length === 1 &&
    result.promotions[0].world === 'w-ship';
})());
check('full loop refuses a tampered ledger before Sentinel runs', (function () {
  var ledger = seedLedger();
  ledger[0].payload.note = 'tampered';
  var result = P0.runLoop(toJsonl(ledger), [
    { id: 'w1', emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: true }
  ]);
  return result.ok === false && result.steps.length === 1 && result.promotions.length === 0;
})());

console.log('---');
console.log('passed ' + passed + '/' + (passed + failed));
if (failed) {
  console.log('failures:');
  failures.forEach(function (f) { console.log('  ' + f); });
  process.exit(1);
}
