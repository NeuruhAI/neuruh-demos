/* DOM smoke check for the Unified Chain demo (jsdom).
   Loads index.html, evaluates unified-chain.js + app.js in the page,
   waits for DOMContentLoaded (app.js defers init to it when the document
   is still loading, as it is under jsdom at eval time), then drives the
   controls and asserts every stage responds.
   Run: node dom-smoke.js
   jsdom is resolved from a sibling workspace install (no new dependency
   added to this demo). Exits 0 only when every check passes. */
var fs = require('fs');
var path = require('path');
var JSDOM = require('/home/hatch/workspace/defynal-scorer-test/node_modules/jsdom').JSDOM;

var passed = 0;
var failed = 0;
var failures = [];
function check(name, cond, detail) {
  if (cond) { passed += 1; console.log('PASS ' + name); }
  else { failed += 1; failures.push(name + (detail ? ' :: ' + detail : '')); console.log('FAIL ' + name + (detail ? ' :: ' + detail : '')); }
}
function finish() {
  console.log('---');
  console.log('passed ' + passed + '/' + (passed + failed));
  if (failed) {
    console.log('failures:');
    failures.forEach(function (f) { console.log('  ' + f); });
    process.exit(1);
  }
}

var dir = __dirname;
var html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
var core = fs.readFileSync(path.join(dir, 'unified-chain.js'), 'utf8');
var app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

var dom = new JSDOM(html, { url: 'https://neuruhai.github.io/neuruh-demos/unified-chain/', runScripts: 'outside-only' });
var win = dom.window;
win.eval(core);
win.eval(app);
var doc = win.document;
function $(id) { return doc.getElementById(id); }
function fire(el) { el.dispatchEvent(new win.Event('input', { bubbles: true })); }
function click(el) { el.dispatchEvent(new win.Event('click', { bubbles: true })); }

function runChecks() {
  /* Stage 1: claim id auto-generated on load */
  check('stage 1 claim id auto-generated', /^UC-\d{4}-\d{2}-\d{2}-\d{4}$/.test($('claimIdOut').value), $('claimIdOut').value);

  /* Stage 2: header responds to byte edits */
  $('byte-confidence').value = '200';
  fire($('byte-confidence'));
  check('stage 2 header hex updates on input', $('headerHex').textContent.indexOf('C8') !== -1, $('headerHex').textContent);

  /* Worked example preset reproduces the recorded hex */
  click($('presetWorked'));
  check('worked preset stamps 1F 07 01 07 0F A5 2D 01', $('headerHex').textContent === '1F 07 01 07 0F A5 2D 01', $('headerHex').textContent);
  check('worked preset sets claim id OPP-2026-RE-0042', $('claimIdOut').value === 'OPP-2026-RE-0042');

  /* Stage 3: intersection responds; default is PARTIAL */
  click($('presetDefault'));
  check('stage 3 default verdict PARTIAL', $('interVerdict').textContent === 'PARTIAL', $('interVerdict').textContent);
  check('stage 3 blocked lists shown', $('interReason').textContent.indexOf('6, 7') !== -1 && $('interReason').textContent.indexOf('5') !== -1, $('interReason').textContent);
  $('interAllowed').value = '0,1,2,3,4,5,6,7';
  $('interAvailable').value = '0,1,2,3,4,5,6,7';
  fire($('interAllowed')); fire($('interAvailable'));
  check('stage 3 edits reach PROCEED when allowed and available cover proposed', $('interVerdict').textContent === 'PROCEED', $('interVerdict').textContent);

  /* Stage 4: write-gate responds to evidence */
  $('evInput').value = '2';
  fire($('evInput'));
  check('stage 4 ev 2 shows REJECT', $('gateVerdict').textContent === 'REJECT', $('gateVerdict').textContent);
  $('evInput').value = '9';
  $('contraSelect').value = 'contradicts';
  fire($('evInput')); fire($('contraSelect'));
  check('stage 4 contradiction at ev 9 shows QUARANTINE', $('gateVerdict').textContent === 'QUARANTINE', $('gateVerdict').textContent);
  $('contraSelect').value = 'none';
  fire($('contraSelect'));
  check('stage 4 ev 9 no contradiction shows WRITE', $('gateVerdict').textContent === 'WRITE', $('gateVerdict').textContent);
  /* Decay responds */
  $('decayAge').value = '14';
  fire($('decayAge'));
  check('stage 4 decay at 14 days lead preset is 0.25', $('decayOut').textContent === '0.25', $('decayOut').textContent);

  /* Stage 5: CRUCIBLE responds */
  click($('presetKill'));
  check('stage 5 kill preset shows 5.7 KILL', $('crucibleScore').textContent === '5.7' && $('crucibleOut').textContent === 'KILL',
    $('crucibleScore').textContent + ' ' + $('crucibleOut').textContent);

  /* Stage 6 + 7: run the chain, seal a receipt, promotion decides */
  click($('presetPass'));
  click($('runChainBtn'));
  check('stage 6 receipt sealed with a SHA-256 hash', /[0-9a-f]{64}/.test($('receiptOut').textContent), $('receiptOut').textContent.slice(0, 120));
  check('stage 6 receipt marked VALID on seal', $('receiptOut').textContent.indexOf('VALID') !== -1);
  check('stage 7 promotion PROCEED on passing preset', $('promoOut').textContent.indexOf('PROCEED') !== -1, $('promoOut').textContent.slice(0, 120));

  /* Stage 6 verify box: genuine validates, tampered rejected */
  var sealed = $('receiptOut').querySelector('pre').textContent;
  $('verifyInput').value = sealed;
  click($('verifyBtn'));
  check('verify box accepts the genuine receipt', $('verifyOut').textContent.indexOf('VALID') !== -1, $('verifyOut').textContent);
  click($('tamperBtn'));
  check('tamper button produces TAMPERED', $('verifyOut').textContent.indexOf('TAMPERED') !== -1, $('verifyOut').textContent);

  /* Stage 8 + 9: outcome + next mission */
  $('outcomeResult').value = 'success';
  $('outcomeNotes').value = 'buyer replied';
  click($('recordOutcomeBtn'));
  check('stage 8 outcome ledger lists the outcome', $('outcomeLedger').textContent.indexOf('success') !== -1 && $('outcomeLedger').textContent.indexOf('buyer replied') !== -1);
  check('stage 8 ledger chain VALID', $('outcomeLedger').textContent.indexOf('VALID') !== -1);
  check('stage 9 next mission card appears', $('missionOut').textContent.indexOf('follow-up') !== -1 || $('missionOut').textContent.indexOf('Follow up') !== -1, $('missionOut').textContent.slice(0, 120));
  check('stage 9 send-to-stage-1 button enabled', $('missionBtn').disabled === false);
  click($('missionBtn'));
  check('stage 9 mission lands in stage 1 as a new claim', $('claimInput').value.indexOf('Follow up on') !== -1, $('claimInput').value.slice(0, 80));

  finish();
}

if (doc.readyState === 'loading') {
  doc.addEventListener('DOMContentLoaded', runChecks);
} else {
  runChecks();
}
