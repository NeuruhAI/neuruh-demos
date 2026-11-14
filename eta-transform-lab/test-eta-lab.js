'use strict';
/* Node test suite for eta Transform Lab (app.js).
   Run: node --test test-eta-lab.js  (or: node test-eta-lab.js)
   Covers the demo core logic: eta math, gate, stub codebook, qubit
   verify tripwire, receipt hashing/chaining, tamper detection. */
const test = require('node:test');
const assert = require('node:assert/strict');
const nodeCrypto = require('node:crypto');
const lab = require('./app.js');

function nodeSha256(str) {
  return nodeCrypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

test('sha256Hex matches Node crypto on vectors', async () => {
  assert.equal(await lab.sha256Hex(''), nodeSha256(''));
  assert.equal(await lab.sha256Hex('abc'), nodeSha256('abc'));
  assert.equal(await lab.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await lab.sha256Hex('eta doctrine'), nodeSha256('eta doctrine'));
  assert.equal(await lab.sha256Hex('vacant-parcel-berrien'), nodeSha256('vacant-parcel-berrien'));
  assert.equal(await lab.sha256Hex('unicode: \u03b7 doctrine \u2603'), nodeSha256('unicode: \u03b7 doctrine \u2603'));
});

test('canonicalize sorts keys and keeps array order', () => {
  assert.equal(lab.canonicalize({ b: 1, a: { d: 4, c: 3 } }), '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(lab.canonicalize([3, 1, 2]), '[3,1,2]');
  assert.equal(lab.canonicalize('x'), '"x"');
});

test('computeEta STRONG preset reproduces sourced expected 86.0', () => {
  const p = lab.PRESETS.strong;
  const r = lab.computeEta(p.iq, p.ir, p.iv, p.ew, p.cv);
  assert.equal(r.eta, 86.0);
  assert.equal(r.numerator, 0.86);
  assert.equal(r.denominator, 1);
  assert.equal(r.raw, 0.86);
  assert.equal(r.scaled, 86);
  assert.equal(r.steps.length, 6);
});

test('computeEta FABRICATED preset reproduces sourced expected 0.0', () => {
  const p = lab.PRESETS.fabricated;
  const r = lab.computeEta(p.iq, p.ir, p.iv, p.ew, p.cv);
  assert.equal(r.eta, 0.0);
  assert.equal(r.numerator, 0);
});

test('computeEta marginal preset gives 51.2', () => {
  const p = lab.PRESETS.marginal;
  const r = lab.computeEta(p.iq, p.ir, p.iv, p.ew, p.cv);
  assert.equal(r.eta, 51.2);
});

test('computeEta: violations and waste punish, never reward', () => {
  const clean = lab.computeEta(0.9, 0.9, 0.9, 0, 0);
  const wasteful = lab.computeEta(0.9, 0.9, 0.9, 5, 0);
  const violating = lab.computeEta(0.9, 0.9, 0.9, 0, 3);
  assert.ok(wasteful.eta < clean.eta);
  assert.ok(violating.eta < clean.eta);
  assert.equal(clean.eta, 72.9);
  assert.equal(wasteful.eta, 12.2); // 0.729 / 6 * 100 = 12.15 -> 12.2
  assert.equal(violating.eta, 18.2); // 0.729 / 4 * 100 = 18.225 -> 18.2
});

test('computeEta clamps at 100 and rounds to 1 decimal', () => {
  const r = lab.computeEta(1, 1, 1, 0, 0);
  assert.equal(r.eta, 100);
  const r2 = lab.computeEta(0.95, 0.95, 0.95, 0, 0);
  assert.equal(r2.eta, 85.7); // 0.857375 * 100 = 85.7375 -> 85.7
});

test('computeEta rejects out-of-range inputs', () => {
  assert.throws(() => lab.computeEta(1.1, 1, 1, 0, 0), /I_quality/);
  assert.throws(() => lab.computeEta(0.5, -0.1, 1, 0, 0), /I_relevance/);
  assert.throws(() => lab.computeEta(0.5, 0.5, 2, 0, 0), /I_velocity/);
  assert.throws(() => lab.computeEta(0.5, 0.5, 0.5, -1, 0), /E_wasted/);
  assert.throws(() => lab.computeEta(0.5, 0.5, 0.5, 0, 1.5), /C_violations/);
  assert.throws(() => lab.computeEta(0.5, 0.5, 0.5, 0, NaN), /C_violations/);
});

test('gateDecision: STRONG passes, FABRICATED blocked with sourced reason', () => {
  const strong = lab.gateDecision(86.0, 0.9);
  assert.equal(strong.pass, true);
  assert.equal(strong.verdict, 'SEED');
  assert.deepEqual(strong.reasons, ['doctrine-eta 86 >= 70', 'feedback accuracy 0.9 >= 0.6']);
  const fab = lab.gateDecision(0.0, 0.9);
  assert.equal(fab.pass, false);
  assert.equal(fab.verdict, 'BLOCKED');
  assert.deepEqual(fab.reasons, ['doctrine-eta 0 < 70', 'feedback accuracy 0.9 >= 0.6']);
});

test('gateDecision: boundaries are inclusive, each condition independent', () => {
  assert.equal(lab.gateDecision(70, 0.6).pass, true);
  assert.equal(lab.gateDecision(69.9, 1).pass, false);
  assert.equal(lab.gateDecision(100, 0.59).pass, false);
  assert.equal(lab.gateDecision(70, 0.59).pass, false);
  assert.equal(lab.gateDecision(69.9, 0.59).pass, false);
  assert.equal(lab.gateDecision(70, 0.6).eta_ok, true);
  assert.equal(lab.gateDecision(70, 0.6).accuracy_ok, true);
});

test('gateDecision rejects bad accuracy', () => {
  assert.throws(() => lab.gateDecision(86, 1.2), /accuracy/);
  assert.throws(() => lab.gateDecision(86, -0.1), /accuracy/);
});

test('stubCentroid: STUB mode, dim 16, floats in [-1,1], deterministic', async () => {
  const a = await lab.stubCentroid('vacant-parcel-berrien');
  assert.equal(a.mode, 'stub-hashbucket');
  assert.equal(a.dim, 16);
  assert.equal(lab.CODEBOOK_DIM, 16);
  assert.equal(a.centroid.length, 16);
  a.centroid.forEach((f) => {
    assert.ok(typeof f === 'number' && f >= -1 && f <= 1, 'float out of range: ' + f);
  });
  assert.equal(a.digest, nodeSha256('vacant-parcel-berrien'));
  const b = await lab.stubCentroid('vacant-parcel-berrien');
  assert.deepEqual(b.centroid, a.centroid);
  assert.equal(b.codebook_id, a.codebook_id);
  const c = await lab.stubCentroid('other-group-label');
  assert.notDeepEqual(c.centroid, a.centroid);
  assert.notEqual(c.codebook_id, a.codebook_id);
  await assert.rejects(() => lab.stubCentroid(''), /non-empty/);
  await assert.rejects(() => lab.stubCentroid('   '), /non-empty/);
});

test('makeQubit and verifyQubit: id is first 16 hex, verify passes, tamper fails', async () => {
  const q = await lab.makeQubit('vacant-parcel-berrien', 86.0, ['exact_parcel_geometry', 'owner_phone'], 0.03, 'residual');
  assert.equal(q.qubit_id, q.provenance_hash.slice(0, 16));
  assert.equal(q.qubit_id.length, 16);
  assert.equal(q.provenance_hash, nodeSha256(lab.canonicalize(q.core)));
  assert.equal(q.core.codebook_mode, 'stub-hashbucket');
  assert.equal(q.core.eta_doctrine, 86.0);
  assert.equal(q.core.loss_pct, 0.03);
  const v = await lab.verifyQubit(q);
  assert.equal(v.pass, true);
  assert.equal(v.hash_ok, true);
  assert.equal(v.id_ok, true);
  const tampered = JSON.parse(JSON.stringify(q));
  tampered.core.eta_doctrine = 99.9;
  const v2 = await lab.verifyQubit(tampered);
  assert.equal(v2.pass, false);
  assert.equal(v2.hash_ok, false);
  const tamperedId = JSON.parse(JSON.stringify(q));
  tamperedId.qubit_id = '0000000000000000';
  const v3 = await lab.verifyQubit(tamperedId);
  assert.equal(v3.pass, false);
  assert.equal(v3.id_ok, false);
});

test('receiptHash matches Node crypto over canonical JSON with hash stripped', async () => {
  const r = await lab.buildReceipt('eta-20261114-0001', 'eta-compute',
    { eta: 86.0, gate: 'SEED' }, 'GENESIS', '2026-11-14T00:00:00.000Z');
  const copy = JSON.parse(JSON.stringify(r));
  delete copy.provenance.report_hash_sha256;
  assert.equal(r.provenance.report_hash_sha256, nodeSha256(lab.canonicalize(copy)));
  assert.equal(r.prev_receipt_hash, 'GENESIS');
});

test('receipt chain links, verify passes, tamper and bad link fail', async () => {
  const r1 = await lab.buildReceipt('eta-20261114-0001', 'eta-compute',
    { eta: 86.0 }, 'GENESIS', '2026-11-14T00:00:00.000Z');
  const r2 = await lab.buildReceipt('eta-20261114-0002', 'gate-decision',
    { eta: 0.0 }, r1.provenance.report_hash_sha256, '2026-11-14T00:01:00.000Z');
  assert.equal(r2.prev_receipt_hash, r1.provenance.report_hash_sha256);
  assert.equal((await lab.verifyReceipt(r1, 'GENESIS')).pass, true);
  assert.equal((await lab.verifyReceipt(r2, r1.provenance.report_hash_sha256)).pass, true);
  assert.equal((await lab.verifyReceipt(r2, 'GENESIS')).pass, false);
  assert.equal((await lab.verifyReceipt(r2, 'GENESIS')).link_ok, false);
  const tampered = JSON.parse(JSON.stringify(r2));
  tampered.detail.eta = 99.9;
  const tv = await lab.verifyReceipt(tampered, r1.provenance.report_hash_sha256);
  assert.equal(tv.pass, false);
  assert.equal(tv.hash_ok, false);
  assert.equal(tv.link_ok, true);
});

test('receiptHash is stable across key order', async () => {
  const a = { format: 'receipt-v1.0', id: 'x', detail: { b: 2, a: 1 }, provenance: { report_hash_sha256: '' }, prev_receipt_hash: 'GENESIS', kind: 'eta-compute', created: 't' };
  const b = { created: 't', kind: 'eta-compute', prev_receipt_hash: 'GENESIS', provenance: { report_hash_sha256: '' }, id: 'x', detail: { a: 1, b: 2 }, format: 'receipt-v1.0' };
  assert.equal(await lab.receiptHash(a), await lab.receiptHash(b));
});

if (require.main === module) {
  // node test-eta-lab.js without --test still runs via the test runner above.
}
