/* QECA Lab core logic.
 * Pure functions, no DOM, no network. Usable in Node and in the browser.
 * Everything here is a classical emulation. No quantum hardware is involved.
 * Stated mechanics come from the sources listed on the demo page.
 * Rules the sources do not state are the builder's design and are labeled
 * as such on the page. No em dashes in this file.
 */
(function (root) {
  'use strict';

  var N_QUBITS = 5;
  var N_STATES = 32; // 2^5 basis states, from the stated 5-qubit system
  var SQRT32 = Math.sqrt(32);

  function fail(msg) { throw new Error(msg); }

  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }

  /* Seeded PRNG (mulberry32). Deterministic so a run can be replayed. */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hamming(a, b) {
    var x = a ^ b, count = 0;
    while (x) { count += x & 1; x >>>= 1; }
    return count;
  }

  function bitString(n) {
    var s = n.toString(2);
    while (s.length < N_QUBITS) s = '0' + s;
    return s;
  }

  /* Uniform superposition: every basis state starts with equal amplitude.
   * Stated form: |psi> = sum of a_i(t) |i>, product description. */
  function initAmplitudes() {
    var amps = [];
    for (var i = 0; i < N_STATES; i++) amps.push(1 / SQRT32);
    return amps;
  }

  function probabilities(amps) {
    if (!Array.isArray(amps) || amps.length !== N_STATES) fail('amplitudes must be 32 numbers');
    var total = 0, i;
    for (i = 0; i < N_STATES; i++) total += amps[i] * amps[i];
    if (!(total > 0)) fail('amplitudes must not all be zero');
    var out = [];
    for (i = 0; i < N_STATES; i++) out.push((amps[i] * amps[i]) / total);
    return out;
  }

  function normalizeAmps(amps) {
    var total = 0, i;
    for (i = 0; i < amps.length; i++) total += amps[i] * amps[i];
    var norm = Math.sqrt(total);
    if (!(norm > 0)) fail('amplitudes must not all be zero');
    var out = [];
    for (i = 0; i < amps.length; i++) out.push(amps[i] / norm);
    return out;
  }

  /* One AI feedback round. Builder's design, labeled on the page.
   * States close to the favored target (small Hamming distance) gain
   * amplitude; distant states lose relative share. Then renormalize.
   * boost_i = 1 + strength * (1 - hamming(i, target) / 5) */
  function feedbackRound(amps, target, strength) {
    if (!isInt(target) || target < 0 || target > 31) fail('target must be an integer 0-31');
    if (typeof strength !== 'number' || strength < 0 || strength > 1) fail('strength must be 0-1');
    var before = probabilities(amps);
    var boosted = [];
    for (var i = 0; i < N_STATES; i++) {
      var boost = 1 + strength * (1 - hamming(i, target) / N_QUBITS);
      boosted.push(amps[i] * boost);
    }
    var afterAmps = normalizeAmps(boosted);
    var after = probabilities(afterAmps);
    return { amps: afterAmps, before: before, after: after, target: target, strength: strength };
  }

  function shannonEntropy(probs) {
    var h = 0;
    for (var i = 0; i < probs.length; i++) {
      if (probs[i] > 0) h -= probs[i] * (Math.log(probs[i]) / Math.log(2));
    }
    return h;
  }

  function topStates(amps, n) {
    var probs = probabilities(amps);
    var rows = [];
    for (var i = 0; i < N_STATES; i++) rows.push({ state: i, bits: bitString(i), p: probs[i] });
    rows.sort(function (a, b) { return b.p - a.p; });
    return rows.slice(0, n);
  }

  /* Measurement: sample one basis state from the probability distribution
   * using the supplied rng. Collapse is to the sampled state. */
  function measure(amps, rng) {
    if (typeof rng !== 'function') fail('measure needs an rng function');
    var probs = probabilities(amps);
    var r = rng(), acc = 0;
    for (var i = 0; i < N_STATES; i++) {
      acc += probs[i];
      if (r < acc) return { state: i, bits: bitString(i), p: probs[i], draw: r };
    }
    return { state: 31, bits: bitString(31), p: probs[31], draw: r };
  }

  /* Run the full simulator: uniform start, N feedback rounds, then measure.
   * Returns every round so the page can show step-by-step working. */
  function runSimulation(opts) {
    var seed = opts.seed;
    var target = opts.target;
    var strength = opts.strength;
    var rounds = opts.rounds;
    if (!isInt(seed)) fail('seed must be an integer');
    if (!isInt(rounds) || rounds < 1 || rounds > 12) fail('rounds must be an integer 1-12');
    var amps = initAmplitudes();
    var rng = mulberry32(seed);
    var steps = [];
    steps.push({
      round: 0, label: 'uniform start',
      entropy: shannonEntropy(probabilities(amps)),
      top: topStates(amps, 3)
    });
    for (var r = 1; r <= rounds; r++) {
      var res = feedbackRound(amps, target, strength);
      amps = res.amps;
      steps.push({
        round: r, label: 'feedback round ' + r + ' toward |' + bitString(target) + '>',
        entropy: shannonEntropy(res.after),
        targetProb: res.after[target],
        top: topStates(amps, 3)
      });
    }
    var m = measure(amps, rng);
    return {
      seed: seed, target: target, strength: strength, rounds: rounds,
      finalTop: topStates(amps, 8),
      finalEntropy: shannonEntropy(probabilities(amps)),
      measured: m, steps: steps
    };
  }

  /* QCM candidate collapse walkthrough.
   * Stated mechanic (QCM Simulation doc, 2025-03-17, in the QECA folder):
   * maintain multiple candidate pathways and collapse them as evidence
   * arrives. The update and elimination rules below are the builder's
   * design and are labeled as such on the page.
   * Update: w_i *= (1 + 0.5 * evidence_i), evidence in [-1, 1], then
   * renormalize. Eliminate the lowest-weight candidate when it falls
   * below 0.12 while more than one candidate remains. */
  var QCM_ELIMINATE_BELOW = 0.12;

  function qcmInit(weights) {
    if (!Array.isArray(weights) || weights.length < 2) fail('qcm needs at least 2 weights');
    var total = 0, i;
    for (i = 0; i < weights.length; i++) {
      if (typeof weights[i] !== 'number' || weights[i] < 0) fail('qcm weights must be numbers >= 0');
      total += weights[i];
    }
    if (!(total > 0)) fail('qcm weights must not all be zero');
    var w = [];
    for (i = 0; i < weights.length; i++) w.push(weights[i] / total);
    return { weights: w, alive: w.map(function (_, i) { return i; }), eliminated: [], rounds: 0, committed: null };
  }

  function qcmRound(state, evidence) {
    if (!Array.isArray(evidence) || evidence.length !== state.weights.length) {
      fail('evidence must have one entry per candidate');
    }
    var i, w = state.weights.slice();
    for (i = 0; i < w.length; i++) {
      if (typeof evidence[i] !== 'number' || evidence[i] < -1 || evidence[i] > 1) {
        fail('evidence entries must be numbers in [-1, 1]');
      }
      w[i] = w[i] * (1 + 0.5 * evidence[i]);
      if (w[i] < 0) w[i] = 0;
    }
    var total = 0;
    for (i = 0; i < w.length; i++) total += w[i];
    if (!(total > 0)) fail('all candidates collapsed to zero; evidence cannot all be -1');
    for (i = 0; i < w.length; i++) w[i] = w[i] / total;
    var log = [];
    for (i = 0; i < w.length; i++) {
      log.push('candidate ' + (i + 1) + ': weight ' + w[i].toFixed(4));
    }
    var alive = state.alive.slice();
    var eliminated = state.eliminated.slice();
    if (alive.length > 1) {
      var lowest = -1, lowestW = Infinity;
      for (i = 0; i < alive.length; i++) {
        if (w[alive[i]] < lowestW) { lowestW = w[alive[i]]; lowest = alive[i]; }
      }
      if (lowestW < QCM_ELIMINATE_BELOW) {
        alive = alive.filter(function (c) { return c !== lowest; });
        eliminated.push(lowest);
        log.push('collapse: candidate ' + (lowest + 1) + ' eliminated at weight ' + lowestW.toFixed(4) + ' (below ' + QCM_ELIMINATE_BELOW + ')');
      } else {
        log.push('collapse: none, lowest live weight ' + lowestW.toFixed(4) + ' is at or above ' + QCM_ELIMINATE_BELOW);
      }
    } else {
      log.push('collapse: one candidate remains, committed');
    }
    return {
      weights: w, alive: alive, eliminated: eliminated,
      rounds: state.rounds + 1, log: log,
      committed: alive.length === 1 ? alive[0] : null
    };
  }

  /* HKRS / HASI calculator.
   * Stated (Collision - HKRS, vault; HKRS dossier CORE-008): the Human-AI
   * Synergy Index is a function of Creativity, Adaptability, Expertise,
   * Vision, with Difficulty and Scalability multipliers. The source states
   * the inputs, not the arithmetic. The arithmetic below (plain mean times
   * the two multipliers) is the builder's design and is labeled as such. */
  function hasiScore(input) {
    var fields = ['creativity', 'adaptability', 'expertise', 'vision'];
    var vals = {};
    var i;
    for (i = 0; i < fields.length; i++) {
      var v = input[fields[i]];
      if (typeof v !== 'number' || v < 0 || v > 10) fail(fields[i] + ' must be 0-10');
      vals[fields[i]] = v;
    }
    var d = input.difficulty, s = input.scalability;
    if (typeof d !== 'number' || d < 0.5 || d > 2) fail('difficulty must be 0.5-2');
    if (typeof s !== 'number' || s < 0.5 || s > 2) fail('scalability must be 0.5-2');
    var sum = vals.creativity + vals.adaptability + vals.expertise + vals.vision;
    var mean = sum / 4;
    var afterDifficulty = mean * d;
    var score = afterDifficulty * s;
    return {
      inputs: vals, difficulty: d, scalability: s,
      sum: sum, mean: mean,
      afterDifficulty: afterDifficulty, score: score,
      steps: [
        'sum = ' + vals.creativity + ' + ' + vals.adaptability + ' + ' + vals.expertise + ' + ' + vals.vision + ' = ' + sum,
        'mean = ' + sum + ' / 4 = ' + mean.toFixed(4),
        'after difficulty = ' + mean.toFixed(4) + ' x ' + d + ' = ' + afterDifficulty.toFixed(4),
        'HASI = ' + afterDifficulty.toFixed(4) + ' x ' + s + ' = ' + score.toFixed(4)
      ]
    };
  }

  /* Receipt v1.0: hash-chained, canonical JSON, hash stripped before hashing.
   * GENESIS is the prev value of the first receipt in a session. */
  function canonical(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      return '[' + obj.map(function (v) { return canonical(v); }).join(',') + ']';
    }
    var keys = Object.keys(obj).filter(function (k) { return k !== 'hash'; }).sort();
    var parts = keys.map(function (k) { return JSON.stringify(k) + ':' + canonical(obj[k]); });
    return '{' + parts.join(',') + '}';
  }

  /* Pure-JS SHA-256 fallback for environments without Web Crypto subtle
   * (plain http pages, jsdom). Verified against node:crypto in the tests. */
  var SHA_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function utf8Bytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    var s = unescape(encodeURIComponent(str));
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256Js(str) {
    var bytes = utf8Bytes(str);
    var bitLen = bytes.length * 8;
    var totalLen = bytes.length + 1 + 8;
    while (totalLen % 64 !== 0) totalLen++;
    var msg = new Uint8Array(totalLen);
    msg.set(bytes);
    msg[bytes.length] = 0x80;
    var hi = Math.floor(bitLen / 4294967296);
    var lo = bitLen >>> 0;
    msg[totalLen - 8] = (hi >>> 24) & 0xff;
    msg[totalLen - 7] = (hi >>> 16) & 0xff;
    msg[totalLen - 6] = (hi >>> 8) & 0xff;
    msg[totalLen - 5] = hi & 0xff;
    msg[totalLen - 4] = (lo >>> 24) & 0xff;
    msg[totalLen - 3] = (lo >>> 16) & 0xff;
    msg[totalLen - 2] = (lo >>> 8) & 0xff;
    msg[totalLen - 1] = lo & 0xff;
    var h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Array(64);
    for (var off = 0; off < totalLen; off += 64) {
      var t;
      for (t = 0; t < 16; t++) {
        w[t] = ((msg[off + t * 4] << 24) | (msg[off + t * 4 + 1] << 16) | (msg[off + t * 4 + 2] << 8) | msg[off + t * 4 + 3]) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        var s0 = (rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3)) >>> 0;
        var s1 = (rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10)) >>> 0;
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (t = 0; t < 64; t++) {
        var S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        var ch = ((e & f) ^ (~e & g)) >>> 0;
        var temp1 = (hh + S1 + ch + SHA_K[t] + w[t]) >>> 0;
        var S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        var temp2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    var out = '';
    for (var i = 0; i < 8; i++) {
      var hex = h[i].toString(16);
      while (hex.length < 8) hex = '0' + hex;
      out += hex;
    }
    return out;
  }

  function sha256Hex(str) {
    var subtle = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto.subtle : null;
    if (subtle) {
      var data = new TextEncoder().encode(str);
      return subtle.digest('SHA-256', data).then(function (buf) {
        var bytes = new Uint8Array(buf), out = '';
        for (var i = 0; i < bytes.length; i++) {
          var hex = bytes[i].toString(16);
          out += hex.length === 1 ? '0' + hex : hex;
        }
        return out;
      });
    }
    return Promise.resolve(sha256Js(str));
  }

  function newChain() { return []; }

  /* Receipt issuance is serialized per chain, so rapid successive tool
   * runs (concurrent async hash calls) cannot claim the same seq or
   * prev value. A failed issuance does not break the queue. */
  var chainQueues = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
  var chainQueueFallback = [];

  function queueFor(chain) {
    if (chainQueues) return chainQueues.get(chain) || Promise.resolve();
    for (var i = 0; i < chainQueueFallback.length; i++) {
      if (chainQueueFallback[i].chain === chain) return chainQueueFallback[i].next;
    }
    return Promise.resolve();
  }

  function setQueue(chain, next) {
    if (chainQueues) { chainQueues.set(chain, next); return; }
    for (var i = 0; i < chainQueueFallback.length; i++) {
      if (chainQueueFallback[i].chain === chain) { chainQueueFallback[i].next = next; return; }
    }
    chainQueueFallback.push({ chain: chain, next: next });
  }

  function issueReceipt(chain, kind, payload) {
    var prior = queueFor(chain);
    var next = prior.then(function () {
      var seq = chain.length;
      var prev = seq === 0 ? 'GENESIS' : chain[chain.length - 1].hash;
      var body = { version: '1.0', seq: seq, prev: prev, kind: kind, payload: payload };
      return sha256Hex(canonical(body)).then(function (hash) {
        var receipt = { version: '1.0', seq: seq, prev: prev, kind: kind, payload: payload, hash: hash };
        chain.push(receipt);
        return receipt;
      });
    });
    setQueue(chain, next.catch(function () {}));
    return next;
  }

  function verifyChain(chain) {
    var checks = [];
    var jobs = chain.map(function (r, i) {
      var body = { version: r.version, seq: r.seq, prev: r.prev, kind: r.kind, payload: r.payload };
      return sha256Hex(canonical(body)).then(function (hash) {
        var okHash = hash === r.hash;
        var expectPrev = i === 0 ? 'GENESIS' : chain[i - 1].hash;
        var okPrev = r.prev === expectPrev;
        var okSeq = r.seq === i;
        checks[i] = { seq: i, okHash: okHash, okPrev: okPrev, okSeq: okSeq, ok: okHash && okPrev && okSeq };
      });
    });
    return Promise.all(jobs).then(function () {
      var ok = checks.every(function (c) { return c.ok; });
      return { ok: ok, checks: checks };
    });
  }

  var api = {
    N_QUBITS: N_QUBITS, N_STATES: N_STATES,
    mulberry32: mulberry32, hamming: hamming, bitString: bitString,
    initAmplitudes: initAmplitudes, probabilities: probabilities,
    feedbackRound: feedbackRound, shannonEntropy: shannonEntropy,
    topStates: topStates, measure: measure, runSimulation: runSimulation,
    QCM_ELIMINATE_BELOW: QCM_ELIMINATE_BELOW,
    qcmInit: qcmInit, qcmRound: qcmRound,
    hasiScore: hasiScore,
    canonical: canonical, sha256Hex: sha256Hex, sha256Js: sha256Js,
    newChain: newChain, issueReceipt: issueReceipt, verifyChain: verifyChain
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.QECA = api;
})(typeof window !== 'undefined' ? window : globalThis);
