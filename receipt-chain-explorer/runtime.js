// runtime.js - walk the Receipt-Chain Explorer in jsdom and verify chain logic.
// Run: NODE_PATH=/home/hatch/workspace/your_files/axon-lattice-code-map/node_modules node runtime.js
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');

let pass = 0, fail = 0;
function check(name, ok) {
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name); }
}
function click(dom, el) {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
}

function makeDom() {
  const dom = new JSDOM(html, {
    url: 'https://example.com/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
  dom.window.URL.createObjectURL = function () { return 'blob:stub'; };
  dom.window.URL.revokeObjectURL = function () {};
  return dom;
}

// --- Test 1: SHA-256 known vectors (pure-JS implementation, verbatim copy) ---
(function () {
  const dom = makeDom();
  const w = dom.window;
  check('sha256 abc vector', w.sha256(w.toUtf8('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  check('sha256 empty vector', w.sha256(w.toUtf8('')) === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  check('sha256 long vector', w.sha256(w.toUtf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')) === '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  check('canonical sorts keys', w.canonical({ b: 1, a: 2 }) === '{"a":2,"b":1}');
  check('no FNV-1a hash used (only the doc-control sentence names it)',
    html.indexOf('fnv') === -1 && (html.match(/FNV/g) || []).length === 1);
  check('page labeled SIMULATION', html.indexOf('SIMULATION') >= 0);
})();

// --- Test 2: sample chain preloads and verifies VALID ---
(function () {
  const dom = makeDom();
  const doc = dom.window.document;
  const w = dom.window;
  const receipts = w.__rce.getReceipts();
  check('sample chain has 3 receipts', receipts.length === 3);
  check('receipt 1 is the real pipeline receipt', receipts[0].receipt_id === 'rcpt-20261114-0001');
  check('receipt 1 hash matches pipeline file', receipts[0].provenance.report_hash_sha256 === '5f46f39eedada8fd65556f0724c40fbb783af9f0b8595e8e090eacede2d206f0');
  check('receipt 1 prev is GENESIS', receipts[0].provenance.prev_receipt_hash === 'GENESIS');
  check('receipt 2 is synthetic', receipts[1].synthetic === true);
  check('receipt 2 chains to receipt 1', receipts[1].provenance.prev_receipt_hash === receipts[0].provenance.report_hash_sha256);
  check('receipt 3 chains to receipt 2', receipts[2].provenance.prev_receipt_hash === receipts[1].provenance.report_hash_sha256);
  check('receipt 2 hash is the Node-computed value', receipts[1].provenance.report_hash_sha256 === 'd4e2de110595c337dcd48b6976eabd09a533c0e125ddecb22671626085516b06');
  check('receipt 3 hash is the Node-computed value', receipts[2].provenance.report_hash_sha256 === '563c7665d3c00c2da30c8599b76a41ed4ac6c2ee4c9b706777559fe7fabe41f1');
  // Independent recompute of every sample hash with Node crypto + page canonical.
  const crypto = require('crypto');
  let allRecompute = true;
  receipts.forEach(function (r) {
    const copy = JSON.parse(JSON.stringify(r));
    const claimed = copy.provenance.report_hash_sha256;
    delete copy.provenance.report_hash_sha256;
    const recomputed = crypto.createHash('sha256').update(w.canonical(copy), 'utf8').digest('hex');
    if (recomputed !== claimed) allRecompute = false;
  });
  check('all 3 sample hashes recompute with Node crypto', allRecompute);
  check('verdict banner says CHAIN VALID', doc.getElementById('verdict').textContent.indexOf('CHAIN VALID') === 0);
  check('verdict banner counts 3 receipts', doc.getElementById('verdict').textContent.indexOf('3 receipts') >= 0);
  const cards = doc.querySelectorAll('.rcard');
  check('3 receipt cards rendered', cards.length === 3);
  check('card 1 shows PASS', cards[0].textContent.indexOf('PASS') >= 0);
  check('card 2 shows PASS', cards[1].textContent.indexOf('PASS') >= 0);
  check('card 3 shows PASS', cards[2].textContent.indexOf('PASS') >= 0);
  check('card 1 shows REAL', cards[0].textContent.indexOf('REAL') >= 0);
  check('card 2 shows SYNTHETIC', cards[1].textContent.indexOf('SYNTHETIC') >= 0);
  check('card 1 shows verdict QUEUED-NOT-SENT', cards[0].textContent.indexOf('QUEUED-NOT-SENT') >= 0);
  check('card 1 shows truncated hash 5f46f39e', cards[0].textContent.indexOf('5f46f39e') >= 0);
  const results = w.__rce.getResults();
  check('all 3 link results ok', results.length === 3 && results.every(function (r) { return r.ok; }));
})();

// --- Test 3: tamper demo breaks the chain at exactly receipt 2 ---
(function () {
  const dom = makeDom();
  const doc = dom.window.document;
  const w = dom.window;
  click(dom, doc.getElementById('tamperDemo'));
  const verdict = doc.getElementById('verdict').textContent;
  check('tamper verdict says CHAIN BROKEN', verdict.indexOf('CHAIN BROKEN') === 0);
  check('tamper verdict names rcpt-20261114-0002', verdict.indexOf('rcpt-20261114-0002') >= 0);
  check('tamper verdict does not name receipt 1 or 3', verdict.indexOf('rcpt-20261114-0001') === -1 && verdict.indexOf('rcpt-20261114-0003') === -1);
  const results = w.__rce.getResults();
  check('tamper: receipt 1 still ok', results[0].ok === true);
  check('tamper: receipt 2 fails', results[1].ok === false);
  check('tamper: receipt 2 fails on hash, not link', results[1].hashOk === false && results[1].linkOk === true);
  check('tamper: receipt 3 own hash still ok', results[2].hashOk === true);
  const cards = doc.querySelectorAll('.rcard');
  check('tamper: card 1 still PASS', cards[0].textContent.indexOf('PASS') >= 0);
  check('tamper: card 2 shows FAIL', cards[1].textContent.indexOf('FAIL') >= 0);
  check('tamper: outcome shows replx', doc.getElementById('jsonlInput').value.indexOf('replx') >= 0);
  check('tamper note explains the one-char flip', doc.getElementById('tamperNote').textContent.indexOf('one character flipped') >= 0);
  // Restore returns to VALID.
  click(dom, doc.getElementById('restoreSample'));
  check('restore returns CHAIN VALID', doc.getElementById('verdict').textContent.indexOf('CHAIN VALID') === 0);
  check('restore removes replx', doc.getElementById('jsonlInput').value.indexOf('replx') === -1);
})();

// --- Test 4: paste path, broken prev link, and bad JSON ---
(function () {
  const dom = makeDom();
  const doc = dom.window.document;
  const w = dom.window;
  // Corrupt receipt 3 prev hash AND re-sign receipt 3 over the corrupted
  // content, so its own hash still recomputes and only the link breaks.
  // (Changing prev without re-signing breaks the hash first, which is also
  // a break, but it tests the hash check, not the link check.)
  const crypto = require('crypto');
  const sample = w.__rce.getSample();
  sample[2].provenance.prev_receipt_hash = '0000000000000000000000000000000000000000000000000000000000000000';
  const copy3 = JSON.parse(JSON.stringify(sample[2]));
  delete copy3.provenance.report_hash_sha256;
  sample[2].provenance.report_hash_sha256 = crypto.createHash('sha256').update(w.canonical(copy3), 'utf8').digest('hex');
  doc.getElementById('jsonlInput').value = sample.map(function (r) { return JSON.stringify(r); }).join('\n');
  click(dom, doc.getElementById('verifyChain'));
  const verdict = doc.getElementById('verdict').textContent;
  check('corrupt prev: CHAIN BROKEN at rcpt-20261114-0003', verdict.indexOf('CHAIN BROKEN at rcpt-20261114-0003') === 0);
  check('corrupt prev: reason is prev hash', verdict.indexOf('prev hash does not match') >= 0);
  const results = w.__rce.getResults();
  check('corrupt prev: receipt 3 hash still ok, link fails', results[2].hashOk === true && results[2].linkOk === false);
  // Wrong GENESIS: receipt 1 prev changed.
  const sample2 = w.__rce.getSample();
  sample2[0].provenance.prev_receipt_hash = 'NOTGENESIS';
  doc.getElementById('jsonlInput').value = sample2.map(function (r) { return JSON.stringify(r); }).join('\n');
  click(dom, doc.getElementById('verifyChain'));
  check('wrong GENESIS breaks at receipt 1', doc.getElementById('verdict').textContent.indexOf('CHAIN BROKEN at rcpt-20261114-0001') === 0);
  // Bad JSON line reports a parse error and does not crash.
  doc.getElementById('jsonlInput').value = '{"receipt_version":"1.0"}\n{not json';
  click(dom, doc.getElementById('verifyChain'));
  check('bad JSON reports parse error', doc.getElementById('parseError').textContent.indexOf('Parse error on line 2') === 0);
})();

// --- Test 5: export does not throw; JSONL round-trips ---
(function () {
  const dom = makeDom();
  const doc = dom.window.document;
  const w = dom.window;
  let threw = false;
  try { click(dom, doc.getElementById('exportChain')); } catch (e) { threw = true; }
  check('export click does not throw', !threw);
  const text = doc.getElementById('jsonlInput').value;
  const lines = text.split('\n').filter(function (l) { return l.trim(); });
  check('export source JSONL has 3 lines', lines.length === 3);
  check('export source JSONL parses', lines.every(function (l) { try { JSON.parse(l); return true; } catch (e) { return false; } }));
  check('raw view shows the chain', doc.getElementById('rawView').textContent.indexOf('rcpt-20261114-0001') >= 0);
})();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
