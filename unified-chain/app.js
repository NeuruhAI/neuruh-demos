/* Unified Chain demo: browser wiring (SIMULATION, browser-local).
   All computation lives in unified-chain.js. This file only reads form
   controls, calls the core, and renders results. No network calls. */
(function () {
  'use strict';
  var U = window.UnifiedChain;
  var state = U.newChainState();
  var lastReceipt = null;
  var lastMission = null;
  var lastClaimId = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(id, fallback) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? fallback : v;
  }
  function parseEdges(id) {
    return $(id).value.split(/[\s,]+/).filter(function (x) { return x !== ''; }).map(function (x) { return parseInt(x, 10); }).filter(function (x) { return !isNaN(x); });
  }
  function headerInputs() {
    var out = {};
    U.BYTE_NAMES.forEach(function (name) {
      var el = $('byte-' + name);
      out[name] = el ? (parseInt(el.value, 10) || 0) : 0;
    });
    return out;
  }
  function memoryInputs() {
    return {
      memoryClass: $('memClass').value,
      source: $('memSource').value,
      freshness: $('memFresh').value,
      evidence: num('evInput', 0),
      contradiction: $('contraSelect').value,
      relevanceHorizon: $('memHorizon').value,
      kind: $('memKind').value,
      mutability: $('memMut').value
    };
  }
  function collectInputs() {
    return {
      claimId: ($('claimIdOut').value || '').trim() || undefined,
      claim: $('claimInput').value,
      header: headerInputs(),
      proposed: parseEdges('interProposed'),
      allowed: parseEdges('interAllowed'),
      available: parseEdges('interAvailable'),
      memory: memoryInputs(),
      emergence_raw: num('emergInput', 0),
      objection_penalty: num('objInput', 0),
      signal: $('signalSelect').value,
      external_signal: $('extSignal').value === 'yes',
      overrideQuarantine: $('overrideQuarantine').checked,
      decayAgeDays: num('decayAge', 0),
      decayPreset: $('decayPreset').value
    };
  }

  function verdictClass(v) {
    if (v === 'PROCEED' || v === 'WRITE' || v === 'SHIP-CANDIDATE') return 'ok';
    if (v === 'KILL' || v === 'REJECT' || v === 'BLOCKED' || v === 'NO PROPOSAL') return 'bad';
    return 'warn';
  }

  function updateLive() {
    var inp = collectInputs();
    var h = U.stampHeader(inp.header);
    $('headerHex').textContent = h.hex;
    var worked = U.stampHeader(U.WORKED_HEADER_FIELDS);
    $('headerCheck').textContent = (h.hexCompact.toLowerCase() === U.WORKED_HEADER_HEX_COMPACT)
      ? 'MATCHES the worked example.'
      : 'Not the worked example hex. Load the worked example preset to reproduce 1f0701070fa52d01.';
    $('headerCheck').className = (h.hexCompact.toLowerCase() === U.WORKED_HEADER_HEX_COMPACT) ? 'ok' : 'warn';

    var g = U.intersectionDetail(inp.proposed, inp.allowed, inp.available);
    var iv = $('interVerdict');
    iv.textContent = g.verdict;
    iv.className = 'verdict ' + verdictClass(g.verdict);
    $('interDetail').textContent = 'E* = [' + g.intersection.join(', ') + ']  |  proposed ' + g.counts.proposed +
      ', allowed ' + g.counts.allowed + ', available ' + g.counts.available + ', intersection ' + g.counts.intersection;
    $('interReason').innerHTML = 'Blocked by policy (proposed but not allowed): <b>' + esc(g.blockedPolicy.join(', ') || 'none') + '</b><br>' +
      'Blocked by infrastructure (allowed but not available): <b>' + esc(g.blockedInfra.join(', ') || 'none') + '</b><br>' + esc(g.reason) + '.';

    var gate = U.evaluateWrite(inp.memory);
    var gv = $('gateVerdict');
    gv.textContent = gate.verdict;
    gv.className = 'verdict ' + verdictClass(gate.verdict);
    $('gateReasons').innerHTML = gate.reasons.map(function (r) { return esc(r); }).join('<br>') +
      '<br><span class="note">' + esc(U.THRESHOLD_NOTE) + '</span>';

    var hDays = U.DECAY_PRESETS[inp.decayPreset] ? U.DECAY_PRESETS[inp.decayPreset].halfLifeDays : 7;
    var ret = U.decay(inp.decayAgeDays, hDays);
    $('decayAgeOut').textContent = String(inp.decayAgeDays);
    $('decayOut').textContent = String(Math.round(ret * 10000) / 10000);

    var c = U.crucibleVerdict({ emergence_raw: inp.emergence_raw, objection_penalty: inp.objection_penalty, signal: inp.signal, external_signal: inp.external_signal });
    $('crucibleScore').textContent = String(c.score);
    var co = $('crucibleOut');
    co.textContent = c.verdict;
    co.className = 'verdict ' + verdictClass(c.verdict);
    $('crucibleReason').textContent = c.reason + '. Multiplier x' + c.multiplier.toFixed(2) + '.';
    $('strikeOut').textContent = String(state.strikes) + (state.moved ? ' (file moved at strike 3)' : '');

    var promo = U.decidePromotionUnified({
      intersectionVerdict: g.verdict,
      memoryVerdict: gate.verdict,
      crucibleVerdict: c.verdict,
      overrideQuarantine: inp.overrideQuarantine
    });
    renderPromo(promo, true);
  }

  function renderPromo(promo, preview) {
    var cls = promo.promote ? 'card promote' : 'card stop';
    var title = promo.promote ? 'PROCEED' : 'STOP';
    $('promoOut').innerHTML = '<div class="' + cls + '">' + title + (preview ? ' (live preview, no receipt sealed yet)' : '') + '. ' +
      esc(promo.reasons.join('; ')) + '.' +
      (promo.overrideUsed ? ' Override used and noted.' : '') + '</div>';
  }

  function renderReceipt(r) {
    lastReceipt = r.receipt;
    lastClaimId = r.claimId;
    $('claimIdOut').value = r.claimId;
    $('claimTsOut').value = r.timestamp;
    $('strikeOut').textContent = String(r.strike.strikes) + (r.strike.kill_move ? ' (KILL MOVE at strike 3: file moves)' : '');
    $('receiptOut').innerHTML =
      '<div class="card"><strong>Receipt seq ' + r.receipt.seq + ' sealed.</strong><br>' +
      'Claim: <b>' + esc(r.claimId) + '</b><br>' +
      'Hash: <span class="mono">' + esc(r.receipt.provenance.report_hash_sha256) + '</span><br>' +
      'Prev: <span class="mono">' + esc(r.receipt.provenance.prev_receipt_hash) + '</span><br>' +
      'Verified on seal: <span class="ok">' + (r.receiptValid ? 'VALID' : 'INVALID') + '</span></div>' +
      '<pre>' + esc(JSON.stringify(r.receipt, null, 2)) + '</pre>';
    renderPromo(r.promotion, false);
  }

  function renderOutcomes() {
    if (!state.outcomes.length) {
      $('outcomeLedger').innerHTML = '<div class="card">No outcomes recorded yet in this session.</div>';
      return;
    }
    var html = '<table class="data"><tr><th>Claim</th><th>Result</th><th>Notes</th><th>Receipt hash</th></tr>';
    state.outcomes.forEach(function (entry) {
      html += '<tr><td class="mono">' + esc(entry.outcome.claim_id || '') + '</td><td>' + esc(entry.outcome.result) + '</td><td>' +
        esc(entry.outcome.notes) + '</td><td class="mono">' + esc(entry.receipt.provenance.report_hash_sha256.slice(0, 16)) + '...</td></tr>';
    });
    html += '</table><p class="note">Ledger chain verifies: <b>' + (U.verifyChain(state.ledger).ok ? 'VALID' : 'BROKEN') + '</b>. ' +
      state.ledger.length + ' receipts in the session ledger.</p>';
    $('outcomeLedger').innerHTML = html;
  }

  function applyPreset(fn) {
    var p = fn();
    if (p.claimId) $('claimIdOut').value = p.claimId;
    if (p.claim) $('claimInput').value = p.claim;
    U.BYTE_NAMES.forEach(function (name) {
      var el = $('byte-' + name);
      if (el && p.header && p.header[name] !== undefined) el.value = String(p.header[name]);
    });
    $('interProposed').value = p.proposed.join(',');
    $('interAllowed').value = p.allowed.join(',');
    $('interAvailable').value = p.available.join(',');
    $('memClass').value = p.memory.memoryClass;
    $('memSource').value = p.memory.source;
    $('memFresh').value = p.memory.freshness;
    $('evInput').value = String(p.memory.evidence);
    $('contraSelect').value = p.memory.contradiction;
    $('memHorizon').value = p.memory.relevanceHorizon;
    $('memKind').value = p.memory.kind;
    $('memMut').value = p.memory.mutability;
    $('emergInput').value = String(p.emergence_raw);
    $('objInput').value = String(p.objection_penalty);
    $('signalSelect').value = p.signal;
    $('extSignal').value = p.external_signal ? 'yes' : 'no';
    $('decayAge').value = String(p.decayAgeDays || 7);
    $('decayPreset').value = p.decayPreset || 'lead';
    $('overrideQuarantine').checked = false;
    updateLive();
  }

  function init() {
    if (!$('claimIdOut').value) {
      $('claimIdOut').value = U.nextClaimId(new Date().toISOString().slice(0, 10));
    }
    $('claimTsOut').value = new Date().toISOString();
    var inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(function (el) {
      el.addEventListener('input', updateLive);
      el.addEventListener('change', updateLive);
    });
    $('runChainBtn').addEventListener('click', function () {
      var r = U.runChain(collectInputs(), state);
      renderReceipt(r);
      renderOutcomes();
    });
    $('verifyBtn').addEventListener('click', function () {
      var raw = $('verifyInput').value.trim();
      if (!raw) { $('verifyOut').innerHTML = '<div class="card">Paste a receipt JSON first.</div>'; return; }
      var parsed;
      try { parsed = JSON.parse(raw); } catch (e) {
        $('verifyOut').innerHTML = '<div class="card stop">TAMPERED / INVALID: not valid JSON.</div>';
        return;
      }
      var v = U.verifyReceipt(parsed);
      $('verifyOut').innerHTML = v.ok
        ? '<div class="card promote">VALID. Recomputed hash matches the stored hash.</div>'
        : '<div class="card stop">TAMPERED. ' + esc(v.error || 'verification failed') + '</div>';
    });
    $('tamperBtn').addEventListener('click', function () {
      if (!lastReceipt) { $('verifyOut').innerHTML = '<div class="card">Seal a receipt first, then tamper with it.</div>'; return; }
      var bad = JSON.parse(JSON.stringify(lastReceipt));
      if (bad.payload && typeof bad.payload.claim === 'string' && bad.payload.claim.length) {
        bad.payload.claim = bad.payload.claim + ' (tampered)';
      } else if (bad.payload) {
        bad.payload.tampered = true;
      }
      $('verifyInput').value = JSON.stringify(bad, null, 2);
      var v = U.verifyReceipt(bad);
      $('verifyOut').innerHTML = v.ok
        ? '<div class="card promote">VALID (unexpected: the tamper did not change the hashed content).</div>'
        : '<div class="card stop">TAMPERED, as expected. ' + esc(v.error || '') + '</div>';
    });
    $('recordOutcomeBtn').addEventListener('click', function () {
      var o = U.recordOutcome(state, {
        claimId: lastClaimId || ($('claimIdOut').value || '').trim() || null,
        result: $('outcomeResult').value,
        notes: $('outcomeNotes').value
      });
      renderOutcomes();
      lastMission = U.nextMission(o.outcome);
      $('missionOut').innerHTML = '<div class="card"><strong>Next mission queued (' + esc(lastMission.kind) + ').</strong><br>' +
        esc(lastMission.claim) + (lastMission.notes ? '<br>Notes carried forward: ' + esc(lastMission.notes) : '') +
        '<br><span class="note">Outcome receipt seq ' + o.receipt.seq + ' sealed and chained. Chain verifies: ' +
        (o.chainOk ? 'VALID' : 'BROKEN') + '.</span></div>';
      $('missionBtn').disabled = false;
    });
    $('missionBtn').addEventListener('click', function () {
      if (!lastMission) return;
      $('claimInput').value = lastMission.claim;
      $('claimIdOut').value = U.nextClaimId(new Date().toISOString().slice(0, 10));
      $('claimTsOut').value = new Date().toISOString();
      updateLive();
      window.scrollTo(0, 0);
      $('claimInput').focus();
    });
    $('presetWorked').addEventListener('click', function () { applyPreset(U.workedExampleInput); });
    $('presetPass').addEventListener('click', function () { applyPreset(U.passingPresetInput); });
    $('presetKill').addEventListener('click', function () { applyPreset(U.killPresetInput); });
    $('presetDefault').addEventListener('click', function () { applyPreset(U.defaultPresetInput); });
    updateLive();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
