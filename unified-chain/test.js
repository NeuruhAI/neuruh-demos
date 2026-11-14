/* Node tests for the Unified Chain demo (unified-chain.js).
   Run: node test.js
   Exits 0 only when every check passes. */
var U = require('./unified-chain.js');
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

/* --- SHA-256 correctness: pure-JS implementation vs Node crypto --- */
check('sha256 abc vector', U.sha256(U.toUtf8('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
check('sha256 empty vector', U.sha256(U.toUtf8('')) === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
check('sha256 matches Node crypto', U.hashStr('unified chain 2026-11-14') === nodeSha256('unified chain 2026-11-14'));

/* --- Step 2: N-Cell/64 header, worked example --- */
check('worked example OPP-2026-RE-0042 stamps to 1f0701070fa52d01', (function () {
  var h = U.stampHeader(U.WORKED_HEADER_FIELDS);
  return h.hexCompact.toLowerCase() === '1f0701070fa52d01' && h.hex === '1F 07 01 07 0F A5 2D 01';
})());
check('worked header fields decode', (function () {
  var f = U.stampHeader(U.WORKED_HEADER_FIELDS).fields;
  return f.routeMask === 0x1f && f.organMask === 0x07 && f.lifecycleMask === 0x01 &&
    f.authorityMask === 0x07 && f.memoryMask === 0x0f && f.confidence === 165 &&
    f.risk === 45 && f.outputMask === 0x01;
})());
check('header defaults are 00 07 00 00 00 80 00 00', (function () {
  var h = U.stampHeader({});
  return h.hex === '00 07 00 00 00 80 00 00' && h.fields.confidence === 128 && h.fields.organMask === 0x07;
})());
check('header clamps out-of-range bytes', (function () {
  var h = U.stampHeader({ confidence: 999, risk: -5 });
  return h.fields.confidence === 255 && h.fields.risk === 0;
})());

/* --- Step 3: governance intersection --- */
check('default sets (D-001) are PARTIAL: propose 8, allow 6, available 5, intersection 5', (function () {
  var g = U.governanceIntersection(U.DEFAULT_SETS.proposed, U.DEFAULT_SETS.allowed, U.DEFAULT_SETS.available);
  return g.verdict === 'PARTIAL' && g.counts.proposed === 8 && g.counts.allowed === 6 &&
    g.counts.available === 5 && g.counts.intersection === 5;
})());
check('default sets separate blockedPolicy [6,7] from blockedInfra [5]', (function () {
  var g = U.intersectionDetail(U.DEFAULT_SETS.proposed, U.DEFAULT_SETS.allowed, U.DEFAULT_SETS.available);
  return JSON.stringify(g.blockedPolicy) === '[6,7]' && JSON.stringify(g.blockedInfra) === '[5]';
})());
check('PROCEED preset reaches PROCEED with empty blocked lists', (function () {
  var g = U.intersectionDetail(U.PROCEED_SETS.proposed, U.PROCEED_SETS.allowed, U.PROCEED_SETS.available);
  return g.verdict === 'PROCEED' && g.blockedPolicy.length === 0 && g.blockedInfra.length === 0;
})());
check('intersection BLOCKED when nothing overlaps', (function () {
  var g = U.governanceIntersection([0, 1], [2, 3], [2, 3]);
  return g.verdict === 'BLOCKED' && g.intersection.length === 0;
})());
check('intersection NO PROPOSAL when proposed is empty', (function () {
  var g = U.governanceIntersection([], [0, 1], [0, 1]);
  return g.verdict === 'NO PROPOSAL';
})());
check('intersection BLOCKED splits policy vs infra', (function () {
  var g = U.intersectionDetail([0, 1, 2], [1], []);
  return g.verdict === 'BLOCKED' && JSON.stringify(g.blockedPolicy) === '[0,2]' && JSON.stringify(g.blockedInfra) === '[1]';
})());

/* --- Step 4: memory write-gate boundaries (illustrative thresholds) --- */
check('write-gate ev 2 REJECT', U.evaluateWrite(goodMemory(2)).verdict === 'REJECT');
check('write-gate ev 3 QUARANTINE (boundary, not REJECT)', U.evaluateWrite(goodMemory(3)).verdict === 'QUARANTINE');
check('write-gate ev 5 QUARANTINE', U.evaluateWrite(goodMemory(5)).verdict === 'QUARANTINE');
check('write-gate ev 6 WRITE (boundary)', U.evaluateWrite(goodMemory(6)).verdict === 'WRITE');
check('write-gate ev 9 WRITE', U.evaluateWrite(goodMemory(9)).verdict === 'WRITE');
check('write-gate contradiction QUARANTINE even at ev 9', U.evaluateWrite(goodMemory(9, 'contradicts')).verdict === 'QUARANTINE');
check('write-gate supersedes at ev 8 still WRITE', U.evaluateWrite(goodMemory(8, 'supersedes')).verdict === 'WRITE');
check('write-gate thresholds are labelled illustrative', U.ILLUSTRATIVE_THRESHOLDS.rejectBelow === 3 && U.ILLUSTRATIVE_THRESHOLDS.quarantineBelow === 6);

/* --- Step 4b: decay F(t) = 2^(-t/h) --- */
check('decay at one half-life is 0.5', U.decay(7, 7) === 0.5);
check('decay at age 0 is 1', U.decay(0, 7) === 1);
check('decay presets match the recorded half-lives', (
  U.DECAY_PRESETS.runtime.halfLifeDays === 0.0167 &&
  U.DECAY_PRESETS.repo.halfLifeDays === 0.5 &&
  U.DECAY_PRESETS.lead.halfLifeDays === 7 &&
  U.DECAY_PRESETS.strategy.halfLifeDays === 30 &&
  U.DECAY_PRESETS.historical.halfLifeDays === 365
));
check('decayWithPreset lead at 7 days is 0.5', U.decayWithPreset(7, 'lead') === 0.5);

/* --- Step 5: CRUCIBLE --- */
check('CRUCIBLE worked example (94-56)x0.15 = 5.7 KILL', (function () {
  var v = U.crucibleVerdict({ emergence_raw: 94, objection_penalty: 56, signal: 'none' });
  return v.score === 5.7 && v.verdict === 'KILL';
})());
check('multiplier ladder contract 1.00 pilot 0.50 lead 0.30 none 0.15', (
  U.signalMultiplier('contract') === 1.00 &&
  U.signalMultiplier('pilot') === 0.50 &&
  U.signalMultiplier('lead') === 0.30 &&
  U.signalMultiplier('none') === 0.15
));
check('CRUCIBLE ITERATE band 20-49', (function () {
  var v = U.crucibleVerdict({ emergence_raw: 60, objection_penalty: 10, signal: 'pilot' });
  return v.score === 25 && v.verdict === 'ITERATE';
})());
check('CRUCIBLE score 50+ with external signal is SHIP-CANDIDATE', (function () {
  var v = U.crucibleVerdict({ emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: true });
  return v.score === 80 && v.verdict === 'SHIP-CANDIDATE';
})());
check('CRUCIBLE score 50+ without external signal downgrades to ITERATE', (function () {
  var v = U.crucibleVerdict({ emergence_raw: 90, objection_penalty: 10, signal: 'contract', external_signal: false });
  return v.score === 80 && v.verdict === 'ITERATE';
})());
check('strike 1 KILL does not move', (function () {
  var s = U.applyStrike({ strikes: 0, moved: false }, 'KILL');
  return s.strikes === 1 && s.kill_move === false && s.moved === false;
})());
check('strike 2 KILL does not move', (function () {
  var s = U.applyStrike({ strikes: 1, moved: false }, 'KILL');
  return s.strikes === 2 && s.kill_move === false && s.moved === false;
})());
check('strike 3 KILL moves', (function () {
  var s = U.applyStrike({ strikes: 2, moved: false }, 'KILL');
  return s.strikes === 3 && s.kill_move === true && s.moved === true;
})());
check('non-KILL verdict does not add a strike', (function () {
  var s = U.applyStrike({ strikes: 1, moved: false }, 'ITERATE');
  return s.strikes === 1 && s.kill_move === false;
})());

/* --- Step 6: receipt v1.0, hash chain --- */
check('receipt hash matches Node crypto SHA-256', (function () {
  var r = U.buildReceipt({ type: 'seed', seq: 1, payload: { x: 1 }, timestamp_utc: '2026-11-14T00:00:00.000Z' });
  var stripped = JSON.parse(JSON.stringify(r));
  delete stripped.provenance.report_hash_sha256;
  return r.provenance.report_hash_sha256 === nodeSha256(U.canonical(stripped));
})());
check('first receipt prev hash is GENESIS', (function () {
  var r = U.buildReceipt({ type: 'seed', seq: 1, payload: {} });
  return r.provenance.prev_receipt_hash === 'GENESIS' && r.receipt_version === '1.0';
})());
check('chain verify accepts a genuine chain', (function () {
  var st = U.newChainState();
  var r1 = U.runChain(U.workedExampleInput(), st);
  var r2 = U.runChain(U.passingPresetInput(), st);
  return r1.receiptValid && r2.receiptValid && U.verifyChain(st.ledger).ok === true && st.ledger.length === 2;
})());
check('chain verify rejects a tampered payload', (function () {
  var st = U.newChainState();
  U.runChain(U.workedExampleInput(), st);
  U.runChain(U.passingPresetInput(), st);
  st.ledger[0].payload.claim = 'tampered after sealing';
  return U.verifyChain(st.ledger).ok === false;
})());
check('verifyReceipt rejects a tampered receipt', (function () {
  var r = U.buildReceipt({ type: 'seed', seq: 1, payload: { x: 1 }, timestamp_utc: '2026-11-14T00:00:00.000Z' });
  var bad = JSON.parse(JSON.stringify(r));
  bad.payload.x = 2;
  return U.verifyReceipt(bad).ok === false && U.verifyReceipt(r).ok === true;
})());
check('second receipt links to the first hash', (function () {
  var st = U.newChainState();
  U.runChain(U.workedExampleInput(), st);
  var r2 = U.runChain(U.passingPresetInput(), st);
  return r2.receipt.provenance.prev_receipt_hash === st.ledger[0].provenance.report_hash_sha256;
})());

/* --- Step 7: unified promotion decision matrix --- */
function promo(i, m, c, o) {
  return U.decidePromotionUnified({ intersectionVerdict: i, memoryVerdict: m, crucibleVerdict: c, overrideQuarantine: !!o });
}
check('promotion PROCEED when all gates pass', promo('PROCEED', 'WRITE', 'SHIP-CANDIDATE').promote === true);
check('promotion PROCEED with ITERATE crucible (not KILL) under the unified rule', promo('PROCEED', 'WRITE', 'ITERATE').promote === true);
check('promotion STOP when intersection PARTIAL', (function () {
  var p = promo('PARTIAL', 'WRITE', 'SHIP-CANDIDATE');
  return p.promote === false && p.blockingGates.indexOf('intersection') !== -1;
})());
check('promotion STOP when CRUCIBLE KILL', (function () {
  var p = promo('PROCEED', 'WRITE', 'KILL');
  return p.promote === false && p.blockingGates.indexOf('crucible') !== -1;
})());
check('promotion STOP when write-gate REJECT', (function () {
  var p = promo('PROCEED', 'REJECT', 'SHIP-CANDIDATE');
  return p.promote === false && p.blockingGates.indexOf('memory-gate') !== -1;
})());
check('promotion STOP when write-gate QUARANTINE without override', (function () {
  var p = promo('PROCEED', 'QUARANTINE', 'SHIP-CANDIDATE');
  return p.promote === false && p.overrideUsed === false;
})());
check('promotion PROCEED when QUARANTINE with explicit override, override noted', (function () {
  var p = promo('PROCEED', 'QUARANTINE', 'SHIP-CANDIDATE', true);
  return p.promote === true && p.overrideUsed === true;
})());
check('promotion names every blocking gate at once', (function () {
  var p = promo('BLOCKED', 'REJECT', 'KILL');
  return p.promote === false && p.blockingGates.length === 3;
})());

/* --- Full chain runs --- */
check('runChain worked example: header hex, PROCEED, valid receipt', (function () {
  var r = U.runChain(U.workedExampleInput(), U.newChainState());
  return r.header.hexCompact.toLowerCase() === '1f0701070fa52d01' &&
    r.intersection.verdict === 'PROCEED' && r.promotion.promote === true && r.receiptValid === true;
})());
check('runChain default preset (D-001): PARTIAL blocks promotion', (function () {
  var r = U.runChain(U.defaultPresetInput(), U.newChainState());
  return r.intersection.verdict === 'PARTIAL' && r.promotion.promote === false &&
    r.promotion.blockingGates.indexOf('intersection') !== -1;
})());
check('runChain kill preset: 5.7 KILL, strike 1, no move', (function () {
  var r = U.runChain(U.killPresetInput(), U.newChainState());
  return r.crucible.score === 5.7 && r.crucible.verdict === 'KILL' &&
    r.strike.strikes === 1 && r.strike.kill_move === false && r.promotion.promote === false;
})());
check('three KILL runs in one state move the file at strike 3', (function () {
  var st = U.newChainState();
  U.runChain(U.killPresetInput(), st);
  U.runChain(U.killPresetInput(), st);
  var r3 = U.runChain(U.killPresetInput(), st);
  return r3.strike.strikes === 3 && r3.strike.kill_move === true && st.moved === true;
})());
check('claim ids are sequential and dated', (function () {
  U.resetClaimSeq();
  var a = U.nextClaimId('2026-11-14');
  var b = U.nextClaimId('2026-11-14');
  return a === 'UC-2026-11-14-0001' && b === 'UC-2026-11-14-0002';
})());

/* --- Steps 8-9: outcome ledger and next mission --- */
check('recordOutcome chains onto the same ledger and verifies', (function () {
  var st = U.newChainState();
  var r = U.runChain(U.workedExampleInput(), st);
  var o = U.recordOutcome(st, { claimId: r.claimId, result: 'success', notes: 'buyer replied' });
  return o.receiptValid === true && o.chainOk === true && st.ledger.length === 2 &&
    st.outcomes.length === 1 && o.receipt.type === 'unified-chain-outcome';
})());
check('next mission after success is a follow-up pre-filled into stage 1', (function () {
  var m = U.nextMission({ claimId: 'UC-2026-11-14-0001', result: 'success', notes: 'buyer replied' });
  return m.kind === 'follow-up' && m.claim.indexOf('UC-2026-11-14-0001') !== -1;
})());
check('next mission after failure is a rework claim naming the failure', (function () {
  var m = U.nextMission({ claimId: 'UC-2026-11-14-0001', result: 'failure', notes: 'no reply in 7 days' });
  return m.kind === 'rework' && m.claim.indexOf('failure') !== -1;
})());

console.log('---');
console.log('passed ' + passed + '/' + (passed + failed));
if (failed) {
  console.log('failures:');
  failures.forEach(function (f) { console.log('  ' + f); });
  process.exit(1);
}
