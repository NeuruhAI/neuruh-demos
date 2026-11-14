/* Node test suite for QECA Lab core logic (qeca.js).
 * Run: node qeca.test.js  (or: node --test qeca.test.js)
 * No em dashes in this file.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const Q = require('./qeca.js');

function sha256(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

function approx(a, b, eps) {
  return Math.abs(a - b) <= (eps === undefined ? 1e-9 : eps);
}

/* Simulator */

test('uniform start: 32 states, probabilities sum to 1, entropy is 5 bits', () => {
  const amps = Q.initAmplitudes();
  assert.equal(amps.length, 32);
  const probs = Q.probabilities(amps);
  const sum = probs.reduce((a, b) => a + b, 0);
  assert.ok(approx(sum, 1));
  assert.ok(approx(probs[0], 1 / 32));
  assert.ok(approx(Q.shannonEntropy(probs), 5));
});

test('feedback round raises target probability and lowers entropy', () => {
  const amps = Q.initAmplitudes();
  const res = Q.feedbackRound(amps, 21, 0.6);
  assert.ok(res.after[21] > 1 / 32);
  assert.ok(Q.shannonEntropy(res.after) < 5);
  const sum = res.after.reduce((a, b) => a + b, 0);
  assert.ok(approx(sum, 1));
});

test('feedback round with strength 0 changes nothing', () => {
  const amps = Q.initAmplitudes();
  const res = Q.feedbackRound(amps, 5, 0);
  assert.ok(approx(res.after[5], 1 / 32));
});

test('feedback round rejects bad target and bad strength', () => {
  assert.throws(() => Q.feedbackRound(Q.initAmplitudes(), 32, 0.5), /target/);
  assert.throws(() => Q.feedbackRound(Q.initAmplitudes(), 3, 1.5), /strength/);
});

test('hamming distance and bit strings', () => {
  assert.equal(Q.hamming(0b10101, 0b10101), 0);
  assert.equal(Q.hamming(0b00000, 0b11111), 5);
  assert.equal(Q.hamming(0b10101, 0b10001), 1);
  assert.equal(Q.bitString(21), '10101');
  assert.equal(Q.bitString(0), '00000');
  assert.equal(Q.bitString(31), '11111');
});

test('runSimulation is deterministic for a fixed seed', () => {
  const a = Q.runSimulation({ seed: 20260317, target: 21, strength: 0.6, rounds: 3 });
  const b = Q.runSimulation({ seed: 20260317, target: 21, strength: 0.6, rounds: 3 });
  assert.deepEqual(a, b);
  assert.equal(a.steps.length, 4); // start + 3 rounds
  assert.ok(a.measured.state >= 0 && a.measured.state <= 31);
  assert.equal(a.finalTop.length, 8);
  assert.ok(a.finalTop[0].p >= a.finalTop[7].p); // sorted descending
});

test('runSimulation: worked case seed 7, target 21, strength 0.6, 3 rounds', () => {
  const r = Q.runSimulation({ seed: 7, target: 21, strength: 0.6, rounds: 3 });
  assert.ok(r.finalEntropy < 5);
  assert.ok(r.finalEntropy > 4.7);
  assert.ok(r.finalTop[0].state === 21); // target leads after 3 rounds at 0.6
  assert.ok(r.finalTop[0].p > 0.09 && r.finalTop[0].p < 0.1); // 0.0933
  assert.ok(approx(r.finalTop[0].p, 0.0933, 0.0001));
  assert.equal(r.measured.state, 0); // deterministic draw 0.0117 lands on state 0
  assert.ok(r.measured.p > 0);
});

test('measure samples inside the distribution and is seeded', () => {
  const amps = Q.initAmplitudes();
  const rng1 = Q.mulberry32(42);
  const rng2 = Q.mulberry32(42);
  const m1 = Q.measure(amps, rng1);
  const m2 = Q.measure(amps, rng2);
  assert.deepEqual(m1, m2);
  const rng3 = Q.mulberry32(43);
  const m3 = Q.measure(amps, rng3);
  assert.ok(m3.state >= 0 && m3.state <= 31);
});

/* QCM collapse */

test('qcmInit normalizes weights', () => {
  const s = Q.qcmInit([1, 1, 1, 1]);
  assert.deepEqual(s.weights, [0.25, 0.25, 0.25, 0.25]);
  assert.deepEqual(s.alive, [0, 1, 2, 3]);
});

test('qcmRound: strong positive evidence for candidate 1, negative for the rest, eliminates one', () => {
  let s = Q.qcmInit([0.25, 0.25, 0.25, 0.25]);
  s = Q.qcmRound(s, [1, -1, -1, -1]);
  // weights: c1 0.25*1.5=0.375, others 0.25*0.5=0.125, total 0.75
  assert.ok(approx(s.weights[0], 0.5));
  assert.ok(approx(s.weights[1], 0.125 / 0.75));
  assert.equal(s.eliminated.length, 0); // 0.1667 is above 0.12
  s = Q.qcmRound(s, [1, -1, -1, -1]);
  assert.equal(s.eliminated.length, 1); // lowest drops below 0.12
  assert.equal(s.alive.length, 3);
});

test('qcmRound: neutral evidence changes nothing and eliminates nothing', () => {
  let s = Q.qcmInit([0.25, 0.25, 0.25, 0.25]);
  s = Q.qcmRound(s, [0, 0, 0, 0]);
  assert.deepEqual(s.weights, [0.25, 0.25, 0.25, 0.25]);
  assert.equal(s.alive.length, 4);
});

test('qcmRound: repeated rounds converge to a single committed candidate', () => {
  let s = Q.qcmInit([0.25, 0.25, 0.25, 0.25]);
  for (let i = 0; i < 12 && s.committed === null; i++) {
    s = Q.qcmRound(s, [1, -1, -1, -1]);
  }
  assert.equal(s.committed, 0);
  assert.equal(s.alive.length, 1);
});

test('qcmRound rejects bad evidence; uniform -1 evidence only rescales', () => {
  const s = Q.qcmInit([0.25, 0.25, 0.25, 0.25]);
  assert.throws(() => Q.qcmRound(s, [2, 0, 0, 0]), /evidence/);
  assert.throws(() => Q.qcmRound(s, [0, 0, 0]), /evidence/);
  const flat = Q.qcmRound(s, [-1, -1, -1, -1]);
  assert.deepEqual(flat.weights, [0.25, 0.25, 0.25, 0.25]); // all halved, renormalization restores
});

/* HKRS / HASI */

test('hasiScore worked case: all 7s, multipliers 1, gives 7', () => {
  const r = Q.hasiScore({ creativity: 7, adaptability: 7, expertise: 7, vision: 7, difficulty: 1, scalability: 1 });
  assert.ok(approx(r.mean, 7));
  assert.ok(approx(r.score, 7));
  assert.equal(r.steps.length, 4);
});

test('hasiScore worked case: 9, 8, 10, 9 with difficulty 1.5 and scalability 1.2 gives 16.2', () => {
  const r = Q.hasiScore({ creativity: 9, adaptability: 8, expertise: 10, vision: 9, difficulty: 1.5, scalability: 1.2 });
  assert.ok(approx(r.mean, 9));
  assert.ok(approx(r.afterDifficulty, 13.5));
  assert.ok(approx(r.score, 16.2));
});

test('hasiScore worked case: all zeros gives 0', () => {
  const r = Q.hasiScore({ creativity: 0, adaptability: 0, expertise: 0, vision: 0, difficulty: 2, scalability: 2 });
  assert.ok(approx(r.score, 0));
});

test('hasiScore rejects out-of-range inputs', () => {
  const base = { creativity: 5, adaptability: 5, expertise: 5, vision: 5, difficulty: 1, scalability: 1 };
  assert.throws(() => Q.hasiScore({ ...base, creativity: 11 }), /creativity/);
  assert.throws(() => Q.hasiScore({ ...base, difficulty: 0.4 }), /difficulty/);
  assert.throws(() => Q.hasiScore({ ...base, scalability: 2.5 }), /scalability/);
});

/* Receipts */

test('canonical JSON sorts keys and strips hash', () => {
  const out = Q.canonical({ b: 1, hash: 'deadbeef', a: { d: 4, c: 3 } });
  assert.equal(out, '{"a":{"c":3,"d":4},"b":1}');
});

test('sha256Hex matches node crypto on a known vector', async () => {
  const got = await Q.sha256Hex('abc');
  assert.equal(got, sha256('abc'));
  assert.equal(got, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('pure-JS sha256 matches node crypto, including long and unicode input', () => {
  const fox = 'The quick brown fox jumps over the lazy dog';
  assert.equal(Q.sha256Js(fox), sha256(fox));
  assert.equal(Q.sha256Js(fox), 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
  const uni = 'QECA |psi> = sum a_i(t) |i> with unicode: caf\u00e9';
  assert.equal(Q.sha256Js(uni), sha256(uni));
  assert.equal(Q.sha256Js(''), sha256(''));
});

test('issueReceipt: first receipt has prev GENESIS and hash matches canonical body', async () => {
  const chain = Q.newChain();
  const r = await Q.issueReceipt(chain, 'simulator', { seed: 7 });
  assert.equal(r.seq, 0);
  assert.equal(r.prev, 'GENESIS');
  assert.equal(r.version, '1.0');
  const body = { version: '1.0', seq: 0, prev: 'GENESIS', kind: 'simulator', payload: { seed: 7 } };
  assert.equal(r.hash, sha256(Q.canonical(body)));
});

test('issueReceipt chains prev to the prior hash', async () => {
  const chain = Q.newChain();
  const r0 = await Q.issueReceipt(chain, 'a', { x: 1 });
  const r1 = await Q.issueReceipt(chain, 'b', { x: 2 });
  assert.equal(r1.seq, 1);
  assert.equal(r1.prev, r0.hash);
  assert.equal(chain.length, 2);
});

test('concurrent issueReceipt calls serialize: seqs 0-4, chain verifies', async () => {
  const chain = Q.newChain();
  const jobs = [];
  for (let i = 0; i < 5; i++) jobs.push(Q.issueReceipt(chain, 'burst', { i }));
  const receipts = await Promise.all(jobs);
  assert.deepEqual(receipts.map((r) => r.seq), [0, 1, 2, 3, 4]);
  assert.equal(receipts[0].prev, 'GENESIS');
  for (let i = 1; i < 5; i++) assert.equal(receipts[i].prev, receipts[i - 1].hash);
  const res = await Q.verifyChain(chain);
  assert.equal(res.ok, true);
});

test('verifyChain passes a good chain and fails a tampered payload', async () => {
  const chain = Q.newChain();
  await Q.issueReceipt(chain, 'simulator', { seed: 7, measured: 21 });
  await Q.issueReceipt(chain, 'hasi', { score: 7 });
  const good = await Q.verifyChain(chain);
  assert.equal(good.ok, true);
  assert.equal(good.checks.length, 2);
  chain[0].payload.measured = 5; // tamper
  const bad = await Q.verifyChain(chain);
  assert.equal(bad.ok, false);
  assert.equal(bad.checks[0].ok, false);
  assert.equal(bad.checks[1].ok, true); // second receipt still hashes, but prev link holds
});

test('verifyChain fails a broken prev link', async () => {
  const chain = Q.newChain();
  await Q.issueReceipt(chain, 'a', { x: 1 });
  await Q.issueReceipt(chain, 'b', { x: 2 });
  chain[1].prev = 'GENESIS';
  const res = await Q.verifyChain(chain);
  assert.equal(res.ok, false);
  assert.equal(res.checks[1].okPrev, false);
});
