/* Sovereign Conglomerate Explorer: page logic. Static only, no backend,
   no data leaves the page. All facts come from data.json, which cites
   its sources. Anything unstated is UNKNOWN, never invented. */
(function () {
  'use strict';

  var DATA = null;
  var selectedId = null;
  var receipts = [];
  var GENESIS = 'GENESIS';

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function unknown(v) { return v === 'UNKNOWN' || v === null || v === undefined || v === ''; }

  function tierBadge(tier) {
    var cls = tier === 'UNKNOWN' ? 'badge-unknown' : 'badge-' + tier.toLowerCase();
    return '<span class="badge ' + cls + '">Tier ' + esc(tier) + '</span>';
  }

  function renderNodes() {
    var wrap = el('node-grid');
    wrap.innerHTML = DATA.verticals.map(function (v) {
      var anchorNames = v.anchors.length
        ? v.anchors.map(function (a) { return esc(a.name); }).join(', ')
        : 'UNKNOWN: none stated';
      return '<button class="node-card" data-id="' + esc(v.id) + '" type="button">' +
        '<span class="node-name">' + esc(v.name) + '</span>' +
        '<span class="node-tier">' + tierBadge(v.tier) + '</span>' +
        '<span class="node-role">' + esc(v.role) + '</span>' +
        '<span class="node-anchors">Anchors: ' + anchorNames + '</span>' +
        '</button>';
    }).join('');
    wrap.querySelectorAll('.node-card').forEach(function (card) {
      card.addEventListener('click', function () { showDetail(card.getAttribute('data-id')); });
    });
  }

  function showDetail(id) {
    selectedId = id;
    var v = DATA.verticals.find(function (x) { return x.id === id; });
    if (!v) { return; }
    document.querySelectorAll('.node-card').forEach(function (c) {
      c.classList.toggle('selected', c.getAttribute('data-id') === id);
    });
    var anchors = v.anchors.length
      ? '<ul>' + v.anchors.map(function (a) {
          return '<li><strong>' + esc(a.name) + '</strong> ' + tierBadge(a.tier) +
            '<br>' + esc(a.fact) + '<br><span class="src">Source: ' + esc(a.source) + '</span></li>';
        }).join('') + '</ul>'
      : '<p class="unknown-line">UNKNOWN: no anchor component is stated for this vertical in the codex, atlas, or dashboard.</p>';
    var notes = v.notes.length
      ? '<ul>' + v.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>'
      : '';
    el('detail').innerHTML =
      '<h3>' + esc(v.name) + '</h3>' +
      '<dl class="fact-list">' +
      '<dt>Role</dt><dd>' + esc(v.role) + ' <span class="src">Source: ' + esc(v.role_source) + '</span></dd>' +
      '<dt>Tier</dt><dd>' + tierBadge(v.tier) + ' <span class="src">' + esc(v.tier_source) + '</span></dd>' +
      '<dt>Status</dt><dd>' + esc(v.status) + ' <span class="src">Source: ' + esc(v.status_source) + '</span></dd>' +
      '<dt>Dependencies</dt><dd>' + esc(v.dependencies) + ' <span class="src">' + esc(v.dependencies_source) + '</span></dd>' +
      '</dl>' +
      '<h4>Anchor components (stated only)</h4>' + anchors +
      (notes ? '<h4>Notes</h4>' + notes : '');
    el('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderSubstrate() {
    var wrap = el('substrate');
    wrap.innerHTML = DATA.substrate.map(function (layer) {
      var comps = layer.components.length
        ? '<ul>' + layer.components.map(function (c) {
            return '<li><strong>' + esc(c.name) + '</strong> ' + tierBadge(c.tier) +
              '<br>' + esc(c.fact) + '<br><span class="src">Source: ' + esc(c.source) + '</span></li>';
          }).join('') + '</ul>'
        : '<p class="unknown-line">UNKNOWN: no component is stated for this layer in the codex or atlas.</p>';
      var unks = layer.unknowns.length
        ? '<p class="unknown-line">UNKNOWN: ' + layer.unknowns.map(esc).join(' ') + '</p>'
        : '';
      return '<section class="layer"><h3>' + esc(layer.name) + '</h3>' + comps + unks + '</section>';
    }).join('');
  }

  function renderStatusBoard() {
    var a = DATA.atlas_entry;
    var c = DATA.codex;
    var rel = DATA.vault.related_entry;
    el('status-board').innerHTML =
      '<table class="data-table"><thead><tr><th>Field</th><th>Stated value</th><th>Source</th></tr></thead><tbody>' +
      '<tr><td>Name</td><td>Sovereign Conglomerate</td><td>Codex Vol VI; Framework Atlas</td></tr>' +
      '<tr><td>Function</td><td>' + esc(a.function) + '</td><td>Codex Vol VI, verbatim</td></tr>' +
      '<tr><td>Posture</td><td>' + esc(a.posture) + '</td><td>Codex Vol VI, verbatim</td></tr>' +
      '<tr><td>Tier</td><td>' + tierBadge(a.tier) + '</td><td>' + esc(a.tier_source) + '</td></tr>' +
      '<tr><td>Dependencies</td><td>None stated</td><td>' + esc(a.dependency_note) + '</td></tr>' +
      '<tr><td>Register entry</td><td>UNKNOWN: none. No matching entry in the 28-entry master asset register.</td><td>Framework Atlas, frameworks.json</td></tr>' +
      '<tr><td>Repository</td><td>UNKNOWN: no repository is stated for Sovereign Conglomerate.</td><td>Codex; atlas; vault search 2026-11-14</td></tr>' +
      '<tr><td>Owner</td><td>Entity: ' + esc(c.entity) + '. Principal: ' + esc(c.principal) + '.</td><td>Codex document header, NRH-DOC-CODEX-001 rev A</td></tr>' +
      '<tr><td>State</td><td><strong>DESIGNED, not VERIFIED.</strong> A positioning framework. Nothing about it is code-verified; no tests, no commit anchor, no deployed artifact is stated.</td><td>Codex tier definitions; atlas tier UNKNOWN</td></tr>' +
      '<tr><td>Vault dossier</td><td>GAP: no standalone dossier exists in the vault.</td><td>Vault search 2026-11-14. See related entry below.</td></tr>' +
      '</tbody></table>' +
      '<h4>Related vault record (not a dossier)</h4>' +
      '<p><strong>' + esc(rel.title) + '</strong> (' + esc(rel.asset_id) + '), status ' + esc(rel.status) +
      ', vertical ' + esc(rel.vertical) + ', layer ' + esc(rel.layer) + ', filed ' + esc(rel.date_filed) + '.' +
      ' ' + esc(rel.description) + ' GitHub repo: ' + esc(rel.github_repo || 'empty') +
      '. DOI: ' + esc(rel.doi || 'empty') + '. ORCID: ' + esc(rel.orcid) +
      '. Publish platform: ' + esc(rel.publish_platform) + '.' +
      ' <span class="src">Source: ' + esc(DATA.vault.related_entry_source) + '</span></p>' +
      '<h4>Codex headline numbers (source claims, audit 30 Jun 2026)</h4>' +
      '<p>' + esc(c.volume_0_headlines.working_codebases) + '. ' +
      esc(c.volume_0_headlines.live_properties) + '. ' +
      esc(c.volume_0_headlines.revenue_verified_products) + '. ' +
      esc(c.volume_0_headlines.sellable_lines) + '. ' +
      esc(c.volume_0_headlines.signals) + '. ' +
      esc(c.volume_0_headlines.tests_landos) + '. ' +
      esc(c.volume_0_headlines.records_scored) + '. ' +
      'These are source claims counted by the codex demo, not re-verified here. No dollar valuation is claimable pre-MRR, by the Valuation Honesty Rule.</p>';
  }

  function fillSelects() {
    [el('cmp-a'), el('cmp-b')].forEach(function (sel) {
      sel.innerHTML = DATA.verticals.map(function (v) {
        return '<option value="' + esc(v.id) + '">' + esc(v.name) + '</option>';
      }).join('');
    });
    el('cmp-a').value = 'real-estate';
    el('cmp-b').value = 'defense';
  }

  async function runComparison() {
    var aId = el('cmp-a').value;
    var bId = el('cmp-b').value;
    var a = DATA.verticals.find(function (x) { return x.id === aId; });
    var b = DATA.verticals.find(function (x) { return x.id === bId; });
    if (!a || !b) { return; }
    if (aId === bId) {
      el('cmp-result').innerHTML = '<p class="unknown-line">Pick two different verticals to compare.</p>';
      return;
    }
    var rows = window.SovCongReceipt.compareVerticals(a, b);
    var diffCount = rows.filter(function (r) { return r.differs; }).length;
    var html = '<table class="data-table"><thead><tr><th>Field</th><th>' + esc(a.name) +
      '</th><th>' + esc(b.name) + '</th><th>Differs</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr class="' + (r.differs ? 'row-diff' : 'row-same') + '"><td>' + esc(r.field) +
          '</td><td>' + esc(r.a) + '</td><td>' + esc(r.b) + '</td><td>' +
          (r.differs ? 'YES' : 'no') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<p>' + diffCount + ' of ' + rows.length + ' fields differ. UNKNOWN values are shown plainly and are never filled in.</p>';
    el('cmp-result').innerHTML = html;

    var input = { a: aId, b: bId };
    var output = { rows: rows, diff_count: diffCount };
    var prevHash = receipts.length ? receipts[receipts.length - 1].receipt_hash : GENESIS;
    var receipt = await window.SovCongReceipt.buildReceipt(input, output, prevHash);
    receipt.seq = receipts.length + 1;
    receipt.created = new Date().toISOString();
    receipts.push(receipt);
    renderReceipts();
  }

  function renderReceipts() {
    var wrap = el('receipt-list');
    if (!receipts.length) {
      wrap.innerHTML = '<p>No comparison run yet this session. Run a comparison to emit the first receipt. Its prev_hash will be GENESIS.</p>';
      return;
    }
    wrap.innerHTML = receipts.map(function (r, i) {
      return '<article class="receipt" data-index="' + i + '">' +
        '<h4>Receipt ' + r.seq + ' (v' + esc(r.receipt_version) + ')</h4>' +
        '<dl class="fact-list">' +
        '<dt>Input</dt><dd>' + esc(JSON.stringify(r.input)) + '</dd>' +
        '<dt>input_hash</dt><dd class="mono">' + esc(r.input_hash) + '</dd>' +
        '<dt>output_hash</dt><dd class="mono">' + esc(r.output_hash) + '</dd>' +
        '<dt>prev_hash</dt><dd class="mono">' + esc(r.prev_hash) + '</dd>' +
        '<dt>receipt_hash</dt><dd class="mono">' + esc(r.receipt_hash) + '</dd>' +
        '<dt>Created</dt><dd>' + esc(r.created) + ' (session-local time)</dd>' +
        '</dl>' +
        '<button class="verify-btn" data-index="' + i + '" type="button">Verify this receipt</button> ' +
        '<span class="verify-result" id="verify-' + i + '"></span>' +
        '</article>';
    }).join('');
    wrap.querySelectorAll('.verify-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var idx = parseInt(btn.getAttribute('data-index'), 10);
        var out = el('verify-' + idx);
        out.textContent = 'Verifying...';
        var expectedPrev = idx === 0 ? GENESIS : receipts[idx - 1].receipt_hash;
        try {
          var res = await window.SovCongReceipt.verifyReceipt(receipts[idx], expectedPrev);
          var lines = res.checks.map(function (c) {
            return (c.pass ? 'PASS' : 'FAIL') + ': ' + c.name;
          }).join(' | ');
          out.textContent = (res.pass ? 'PASS. ' : 'FAIL. ') + lines;
          out.className = 'verify-result ' + (res.pass ? 'pass' : 'fail');
        } catch (err) {
          out.textContent = 'FAIL: ' + err.message;
          out.className = 'verify-result fail';
        }
      });
    });
  }

  function init() {
    fetch('data.json').then(function (resp) { return resp.json(); }).then(function (data) {
      DATA = data;
      renderNodes();
      renderSubstrate();
      renderStatusBoard();
      fillSelects();
      renderReceipts();
      el('run-cmp').addEventListener('click', runComparison);
      showDetail('real-estate');
      el('swap-cmp').addEventListener('click', function () {
        var a = el('cmp-a').value;
        el('cmp-a').value = el('cmp-b').value;
        el('cmp-b').value = a;
      });
    }).catch(function (err) {
      el('detail').innerHTML = '<p class="fail">Failed to load data.json: ' + esc(err.message) + '</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
