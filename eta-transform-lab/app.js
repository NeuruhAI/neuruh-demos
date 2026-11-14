'use strict';
/* eta Transform Lab. Static demo, no backend, nothing leaves the page. */
/* SIMULATION throughout: this page re-implements the sourced eta doctrine
   formula in the browser. It does not run the Mac code, does not seed a
   world, and does not connect to any repo, database, or live system. */

/* PURE LOGIC - also tested in Node (see test-eta-lab.js) */

/* SHA-256 via Web Crypto (async). Same call path in the browser and in
   Node (Node 18+ exposes globalThis.crypto.subtle). */
async function sha256Hex(str) {
  var data = new TextEncoder().encode(str);
  var buf = await globalThis.crypto.subtle.digest('SHA-256', data);
  var bytes = new Uint8Array(buf);
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
  }
  return out;
}

function canonicalize(v) {
  if (v === null || typeof v !== 'object') { return JSON.stringify(v); }
  if (Array.isArray(v)) { return '[' + v.map(canonicalize).join(',') + ']'; }
  return '{' + Object.keys(v).sort().map(function (k) {
    return JSON.stringify(k) + ':' + canonicalize(v[k]);
  }).join(',') + '}';
}

function round1(x) { return Math.round(x * 10) / 10; }
function round4(x) { return Math.round(x * 10000) / 10000; }

/* Input validation. Builder design (mine): I_quality, I_relevance,
   I_velocity live on 0 to 1, matching the dossier statement that raw eta
   is bounded (0,1] and scaled 0 to 100. E_wasted and C_violations are
   non-negative integer counts. Feedback accuracy lives on 0 to 1. */
function validateEtaInputs(iq, ir, iv, ew, cv) {
  var names = [['I_quality', iq], ['I_relevance', ir], ['I_velocity', iv]];
  names.forEach(function (pair) {
    if (typeof pair[1] !== 'number' || isNaN(pair[1]) || pair[1] < 0 || pair[1] > 1) {
      throw new Error(pair[0] + ' must be a number from 0 to 1.');
    }
  });
  [['E_wasted', ew], ['C_violations', cv]].forEach(function (pair) {
    if (typeof pair[1] !== 'number' || isNaN(pair[1]) || pair[1] < 0 || Math.floor(pair[1]) !== pair[1]) {
      throw new Error(pair[0] + ' must be a non-negative integer count.');
    }
  });
}

function validateAccuracy(a) {
  if (typeof a !== 'number' || isNaN(a) || a < 0 || a > 1) {
    throw new Error('Feedback accuracy must be a number from 0 to 1.');
  }
}

/* Doctrine-eta, pinned form from the vault dossier (MTH-023):
   eta = (I_quality x I_relevance x I_velocity) / (1 + E_wasted + C_violations)
   bounded 0 to 100. The 1+ denominator pins the paren ambiguity: violations
   only ever subtract. Raw eta is scaled x100 and rounded to 1 decimal. */
function computeEta(iq, ir, iv, ew, cv) {
  validateEtaInputs(iq, ir, iv, ew, cv);
  var numerator = iq * ir * iv;
  var denominator = 1 + ew + cv;
  var raw = numerator / denominator;
  var scaled = raw * 100;
  var clamped = Math.min(100, scaled);
  var eta = round1(clamped);
  return {
    eta: eta,
    numerator: numerator,
    denominator: denominator,
    raw: raw,
    scaled: scaled,
    clamped: clamped,
    steps: [
      'Step 1, numerator: I_quality x I_relevance x I_velocity = ' + iq + ' x ' + ir + ' x ' + iv + ' = ' + numerator,
      'Step 2, denominator: 1 + E_wasted + C_violations = 1 + ' + ew + ' + ' + cv + ' = ' + denominator,
      'Step 3, raw eta: ' + numerator + ' / ' + denominator + ' = ' + raw,
      'Step 4, scale to 0-100: ' + raw + ' x 100 = ' + scaled,
      'Step 5, bound at 100: min(100, ' + scaled + ') = ' + clamped,
      'Step 6, round to 1 decimal: eta = ' + eta
    ]
  };
}

/* The gate, from the vault dossier (MTH-023) and neuruh.config.json as
   quoted there: a world seeds ONLY if doctrine-eta >= 70 AND feedback
   accuracy >= 0.6. */
var ETA_THRESHOLD = 70;
var ACCURACY_THRESHOLD = 0.6;

function gateDecision(eta, accuracy) {
  validateAccuracy(accuracy);
  if (typeof eta !== 'number' || isNaN(eta)) {
    throw new Error('eta must be a number.');
  }
  var etaOk = eta >= ETA_THRESHOLD;
  var accOk = accuracy >= ACCURACY_THRESHOLD;
  var reasons = [];
  reasons.push(etaOk
    ? 'doctrine-eta ' + eta + ' >= 70'
    : 'doctrine-eta ' + eta + ' < 70');
  reasons.push(accOk
    ? 'feedback accuracy ' + accuracy + ' >= 0.6'
    : 'feedback accuracy ' + accuracy + ' < 0.6');
  return {
    pass: etaOk && accOk,
    eta_ok: etaOk,
    accuracy_ok: accOk,
    verdict: (etaOk && accOk) ? 'SEED' : 'BLOCKED',
    reasons: reasons
  };
}

/* Codebook stub, from the vault dossier (MTH-023, Batch 010 dossier section 10):
   deterministic hash-bucket centroids. SHA-256 of the group label, bytes to
   floats in [-1,1], dim 16, mode stub-hashbucket. Same group in, same
   centroid out. This is NOT a learned codebook and NOT a semantic embedding.
   Builder design (mine): float = byte / 127.5 - 1 over the first 16 digest
   bytes, rounded to 4 decimals; codebook id = first 6 hex chars as an integer. */
var CODEBOOK_DIM = 16;
var CODEBOOK_MODE = 'stub-hashbucket';

async function stubCentroid(label) {
  if (typeof label !== 'string' || label.trim().length === 0) {
    throw new Error('Group label must be a non-empty string.');
  }
  var digest = await sha256Hex(label);
  var floats = [];
  for (var i = 0; i < CODEBOOK_DIM; i++) {
    var byte = parseInt(digest.slice(i * 2, i * 2 + 2), 16);
    floats.push(round4(byte / 127.5 - 1));
  }
  return {
    label: label,
    mode: CODEBOOK_MODE,
    dim: CODEBOOK_DIM,
    digest: digest,
    codebook_id: parseInt(digest.slice(0, 6), 16),
    centroid: floats
  };
}

/* Knowledge qubit core, from the vault note MTH-011 Knowledge Qubits and the
   Batch 010 dossier: shape (codebook centroid), modifier (residual, here
   carried as the content residual text), shared group, eta_doctrine, loss
   manifest, provenance hash, qubit_id = first 16 hex of the core hash.
   verify() re-hashes the core and compares to provenance. */
async function makeQubit(group, eta, droppedFields, lossPct, contentResidual) {
  if (typeof eta !== 'number' || isNaN(eta)) {
    throw new Error('eta must be a number.');
  }
  if (typeof lossPct !== 'number' || isNaN(lossPct) || lossPct < 0 || lossPct > 1) {
    throw new Error('loss_pct must be a number from 0 to 1.');
  }
  var shape = await stubCentroid(group);
  var core = {
    codebook_mode: CODEBOOK_MODE,
    content_residual: contentResidual || '',
    dropped: droppedFields || [],
    eta_doctrine: eta,
    loss_pct: lossPct,
    shape: shape.centroid,
    shared_group: group
  };
  var provenance = await sha256Hex(canonicalize(core));
  return {
    core: core,
    provenance_hash: provenance,
    qubit_id: provenance.slice(0, 16)
  };
}

async function verifyQubit(qubit) {
  var recomputed = await sha256Hex(canonicalize(qubit.core));
  var hashOk = recomputed === qubit.provenance_hash;
  var idOk = qubit.qubit_id === qubit.provenance_hash.slice(0, 16);
  return { hash_ok: hashOk, id_ok: idOk, pass: hashOk && idOk, recomputed: recomputed };
}

/* Receipt v1.0. Hash is SHA-256 over canonical JSON with the
   provenance.report_hash_sha256 field stripped, so the hash never
   influences itself. First receipt chains from GENESIS. */
async function receiptHash(receipt) {
  var copy = JSON.parse(JSON.stringify(receipt));
  if (copy.provenance) { delete copy.provenance.report_hash_sha256; }
  return sha256Hex(canonicalize(copy));
}

async function buildReceipt(id, kind, detail, prevHash, created) {
  var r = {
    created: created,
    detail: detail,
    format: 'receipt-v1.0',
    id: id,
    kind: kind,
    prev_receipt_hash: prevHash,
    provenance: { report_hash_sha256: '' }
  };
  r.provenance.report_hash_sha256 = await receiptHash(r);
  return r;
}

async function verifyReceipt(receipt, prevHash) {
  var recomputed = await receiptHash(receipt);
  var hashOk = (recomputed === receipt.provenance.report_hash_sha256);
  var linkOk = (receipt.prev_receipt_hash === prevHash);
  return { hash_ok: hashOk, link_ok: linkOk, pass: hashOk && linkOk, recomputed: recomputed };
}
/* END PURE LOGIC */

/* Sourced presets. The dossier states the expected outputs (STRONG 86.0,
   FABRICATED 0.0) but not the inputs that produce them. The inputs below
   are builder choices (mine) picked so the sourced formula reproduces the
   sourced expected outputs exactly. STRONG accuracy 0.90 is also my choice:
   the dossier states the gate needs accuracy >= 0.6 but gives no accuracy
   for the STRONG case. */
var PRESETS = {
  strong: { label: 'STRONG', iq: 0.86, ir: 1.00, iv: 1.00, ew: 0, cv: 0, accuracy: 0.90 },
  fabricated: { label: 'FABRICATED', iq: 0.00, ir: 0.00, iv: 0.00, ew: 0, cv: 0, accuracy: 0.90 },
  marginal: { label: 'Marginal (builder choice)', iq: 0.80, ir: 0.80, iv: 0.80, ew: 0, cv: 0, accuracy: 0.90 }
};

/* Page state */
var receipts = [];
var receiptSeq = 0;
var lastQubit = null;
var lastCentroid = null;

function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function num(id) {
  var v = parseFloat($(id).value);
  return v;
}

function intNum(id) {
  var v = parseInt($(id).value, 10);
  return v;
}

function setInputs(p) {
  $('in-iq').value = p.iq;
  $('in-ir').value = p.ir;
  $('in-iv').value = p.iv;
  $('in-ew').value = p.ew;
  $('in-cv').value = p.cv;
  $('in-accuracy').value = p.accuracy;
}

async function emitReceipt(kind, detail) {
  receiptSeq += 1;
  var id = 'eta-20261114-' + ('0000' + receiptSeq).slice(-4);
  var prevHash = receipts.length === 0 ? 'GENESIS' : receipts[receipts.length - 1].provenance.report_hash_sha256;
  var created = new Date().toISOString();
  var receipt = await buildReceipt(id, kind, detail, prevHash, created);
  receipts.push(receipt);
  renderReceipts();
  return receipt;
}

async function runEta() {
  var out = $('eta-output');
  try {
    var iq = num('in-iq'), ir = num('in-ir'), iv = num('in-iv');
    var ew = intNum('in-ew'), cv = intNum('in-cv');
    var acc = num('in-accuracy');
    var calc = computeEta(iq, ir, iv, ew, cv);
    var gate = gateDecision(calc.eta, acc);
    var stepsHtml = '<ol>' + calc.steps.map(function (s) { return '<li><code>' + esc(s) + '</code></li>'; }).join('') + '</ol>';
    out.innerHTML = '<p class="big">eta = <strong>' + esc(calc.eta) + '</strong></p>'
      + stepsHtml
      + '<p>Gate: <strong class="' + (gate.pass ? 'pass' : 'fail') + '">' + esc(gate.verdict) + '</strong></p>'
      + '<ul>' + gate.reasons.map(function (r) { return '<li><code>' + esc(r) + '</code></li>'; }).join('') + '</ul>'
      + '<p class="muted">Thresholds: doctrine-eta &gt;= 70 AND feedback accuracy &gt;= 0.6 (neuruh.config.json as quoted in the Batch 010 dossier, section 9).</p>';
    await emitReceipt('eta-compute', {
      accuracy: acc,
      c_violations: cv,
      e_wasted: ew,
      eta: calc.eta,
      gate: gate.verdict,
      gate_reasons: gate.reasons,
      i_quality: iq,
      i_relevance: ir,
      i_velocity: iv
    });
  } catch (e) {
    out.innerHTML = '<p class="fail">Error: ' + esc(e.message) + '</p>';
  }
}

async function runPreset(key) {
  var p = PRESETS[key];
  setInputs(p);
  $('preset-note').textContent = 'Loaded preset ' + p.label + '. Inputs are builder choices that reproduce the sourced expected output; the formula and thresholds are sourced. Press Run eta and gate to compute.';
  await runEta();
}

async function runCodebook() {
  var out = $('codebook-output');
  var label = $('in-group').value.trim();
  try {
    var shape = await stubCentroid(label);
    lastCentroid = shape;
    out.innerHTML = '<p>Group: <strong>' + esc(shape.label) + '</strong> | codebook id: <code>' + esc(shape.codebook_id) + '</code> | mode: <code>' + esc(shape.mode) + '</code> | dim: ' + shape.dim + '</p>'
      + '<p>SHA-256 of label: <code>' + esc(shape.digest) + '</code></p>'
      + '<p>Centroid (16 floats in [-1, 1], first 16 digest bytes, byte / 127.5 - 1):</p>'
      + '<pre>' + esc(JSON.stringify(shape.centroid, null, 1)) + '</pre>'
      + '<p class="warn">STUB: this is a deterministic hash bucket, not a learned codebook and not a semantic embedding. Two unrelated groups can land near each other by chance; the centroid carries no meaning about the group. Swap path (sourced): replace the stub with a learned lookup, flip codebook_mode to "learned", re-embed existing qubits. Nothing rebuilds.</p>';
    await emitReceipt('codebook-lookup', {
      codebook_id: shape.codebook_id,
      digest: shape.digest,
      group: shape.label,
      mode: shape.mode
    });
  } catch (e) {
    out.innerHTML = '<p class="fail">Error: ' + esc(e.message) + '</p>';
  }
}

async function runQubit() {
  var out = $('qubit-output');
  try {
    var group = $('in-qgroup').value.trim();
    var etaVal = num('in-qeta');
    var lossPct = num('in-qloss');
    var droppedRaw = $('in-qdropped').value.trim();
    var dropped = droppedRaw === '' ? [] : droppedRaw.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    var residual = $('in-qresidual').value;
    var qubit = await makeQubit(group, etaVal, dropped, lossPct, residual);
    lastQubit = qubit;
    out.innerHTML = '<p>qubit_id: <code>' + esc(qubit.qubit_id) + '</code> (first 16 hex of the provenance hash)</p>'
      + '<p>Provenance hash: <code>' + esc(qubit.provenance_hash) + '</code></p>'
      + '<p>Group: <strong>' + esc(group) + '</strong> | eta_doctrine: ' + esc(etaVal) + ' | loss_pct: ' + esc(lossPct) + ' | dropped: ' + (dropped.length ? esc(dropped.join(', ')) : 'none declared') + '</p>'
      + '<p><button type="button" id="verify-qubit">Verify qubit (re-hash core)</button> <span id="qubit-verdict" class="verdict">not verified yet</span></p>'
      + '<details><summary>Qubit core JSON (canonical form hashed)</summary><pre>' + esc(JSON.stringify(qubit.core, null, 2)) + '</pre></details>'
      + '<p class="muted">verify() re-hashes the core and compares it to the provenance hash. A tampered core fails. This is the tamper tripwire described in the Knowledge Qubits vault note (MTH-011).</p>';
    $('verify-qubit').addEventListener('click', async function () {
      var v = await verifyQubit(lastQubit);
      var el = $('qubit-verdict');
      el.textContent = v.pass ? 'PASS (core re-hash matches provenance, qubit_id matches)' : 'FAIL (hash_ok=' + v.hash_ok + ', id_ok=' + v.id_ok + ')';
      el.className = 'verdict ' + (v.pass ? 'pass' : 'fail');
    });
    await emitReceipt('qubit-build', {
      eta_doctrine: etaVal,
      group: group,
      loss_pct: lossPct,
      dropped: dropped,
      qubit_id: qubit.qubit_id,
      provenance_hash: qubit.provenance_hash
    });
  } catch (e) {
    out.innerHTML = '<p class="fail">Error: ' + esc(e.message) + '</p>';
  }
}

function renderReceipts() {
  var host = $('receipt-list');
  host.innerHTML = '';
  if (receipts.length === 0) {
    host.innerHTML = '<p class="muted">No receipts yet this session. Run the calculator, the codebook lookup, or the qubit builder to emit one.</p>';
    return;
  }
  receipts.forEach(function (r, idx) {
    var card = document.createElement('div');
    card.className = 'rcard';
    card.innerHTML = '<h4>' + esc(r.id) + ' <span class="verdict" id="verdict-' + esc(r.id) + '">not verified yet</span></h4>'
      + '<p>Kind: ' + esc(r.kind) + ' | Created: ' + esc(r.created) + '</p>'
      + '<p>Prev hash: <code>' + esc(r.prev_receipt_hash) + '</code></p>'
      + '<p>Receipt hash: <code>' + esc(r.provenance.report_hash_sha256) + '</code></p>'
      + '<p><button type="button" data-idx="' + idx + '" class="verify-btn">Verify</button></p>'
      + '<details><summary>Raw receipt JSON</summary><pre>' + esc(JSON.stringify(r, null, 2)) + '</pre></details>';
    host.appendChild(card);
  });
  var btns = host.querySelectorAll('.verify-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', async function (ev) {
      var idx = parseInt(ev.target.getAttribute('data-idx'), 10);
      var r = receipts[idx];
      var prev = idx === 0 ? 'GENESIS' : receipts[idx - 1].provenance.report_hash_sha256;
      var v = await verifyReceipt(r, prev);
      var el = $('verdict-' + r.id);
      el.textContent = v.pass ? 'PASS (hash recomputes, link matches)' : 'FAIL (hash_ok=' + v.hash_ok + ', link_ok=' + v.link_ok + ')';
      el.className = 'verdict ' + (v.pass ? 'pass' : 'fail');
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    renderReceipts();
    $('run-eta').addEventListener('click', runEta);
    $('preset-strong').addEventListener('click', function () { runPreset('strong'); });
    $('preset-fabricated').addEventListener('click', function () { runPreset('fabricated'); });
    $('preset-marginal').addEventListener('click', function () { runPreset('marginal'); });
    $('run-codebook').addEventListener('click', runCodebook);
    $('run-qubit').addEventListener('click', runQubit);
    $('fill-qeta').addEventListener('click', function () {
      try {
        var calc = computeEta(num('in-iq'), num('in-ir'), num('in-iv'), intNum('in-ew'), intNum('in-cv'));
        $('in-qeta').value = calc.eta;
      } catch (e) {
        $('qubit-output').innerHTML = '<p class="fail">Error: ' + esc(e.message) + '</p>';
      }
    });
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ACCURACY_THRESHOLD: ACCURACY_THRESHOLD,
    CODEBOOK_DIM: CODEBOOK_DIM,
    CODEBOOK_MODE: CODEBOOK_MODE,
    ETA_THRESHOLD: ETA_THRESHOLD,
    PRESETS: PRESETS,
    buildReceipt: buildReceipt,
    canonicalize: canonicalize,
    computeEta: computeEta,
    gateDecision: gateDecision,
    makeQubit: makeQubit,
    receiptHash: receiptHash,
    sha256Hex: sha256Hex,
    stubCentroid: stubCentroid,
    validateAccuracy: validateAccuracy,
    validateEtaInputs: validateEtaInputs,
    verifyQubit: verifyQubit,
    verifyReceipt: verifyReceipt
  };
}
