'use strict';
/* Token-Swap Prompting Lab. Static demo, no backend, no data leaves the page. */
/* PURE LOGIC - also tested in Node (see build report) */

/* SHA-256 (sync, pure JS). Verified against Node crypto in the build test. */
function sha256Hex(ascii) {
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  var maxWord = Math.pow(2, 32), result = '';
  var words = [], asciiBitLength = ascii.length * 8;
  var hash = sha256Hex.h = sha256Hex.h || [], k = sha256Hex.k = sha256Hex.k || [];
  var primeCounter = k.length, isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (var i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) { ascii += '\x00'; }
  for (var i = 0; i < ascii.length; i++) {
    var j = ascii.charCodeAt(i);
    if (j >> 8) { return ''; }
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);
  for (var j = 0; j < words.length;) {
    var w = words.slice(j, j += 16), oldHash = hash;
    hash = hash.slice(0, 8);
    for (var i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2];
      var a = hash[0], e = hash[4];
      var temp1 = hash[7]
        + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (var i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
  }
  for (var i = 0; i < 8; i++) {
    for (var j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

function utf8(str) { return unescape(encodeURIComponent(str)); }
function sha256(str) { return sha256Hex(utf8(str)); }

function canonicalize(v) {
  if (v === null || typeof v !== 'object') { return JSON.stringify(v); }
  if (Array.isArray(v)) { return '[' + v.map(canonicalize).join(',') + ']'; }
  return '{' + Object.keys(v).sort().map(function (k) {
    return JSON.stringify(k) + ':' + canonicalize(v[k]);
  }).join(',') + '}';
}

function wordCount(s) {
  var t = s.trim();
  if (!t) { return 0; }
  return t.split(/\s+/).length;
}

function extractTokens(text) {
  var out = [], re = /(\[[A-Z][A-Z0-9_]*\]|<[A-Z][A-Z0-9_]*>)/g, m;
  while ((m = re.exec(text)) !== null) {
    if (out.indexOf(m[1]) === -1) { out.push(m[1]); }
  }
  return out;
}

/* Swap rule (design decision, mine): replace every occurrence of the exact
   token string with the replacement verbatim. No partial matches. */
function swapPrompt(text, token, value) {
  return text.split(token).join(value);
}

/* Drift check (design decision, mine). Deterministic, stated criteria.
   Returns an object of criterion name -> PASS, FAIL, or N/A.
   Never claims semantic equivalence. */
function driftCheck(beforeText, afterText, token, replacement, locked) {
  function count(c, s) { return s.split(c).length - 1; }
  var out = {};
  out.bracket_balance = (count('[', afterText) === count(']', afterText) &&
    count('<', afterText) === count('>', afterText)) ? 'PASS' : 'FAIL';
  out.token_replaced = (afterText.indexOf(token) === -1) ? 'PASS' : 'FAIL';
  out.locked_intact = (locked === null || locked === '') ? 'N/A'
    : (afterText.indexOf(locked) !== -1 ? 'PASS' : 'FAIL');
  out.replacement_nonempty = (replacement.trim().length > 0) ? 'PASS' : 'FAIL';
  var ratio = beforeText.length === 0 ? 0 : afterText.length / beforeText.length;
  out.length_ratio = (ratio >= 0.5 && ratio <= 2.0) ? 'PASS' : 'FAIL';
  out.word_delta = (Math.abs(wordCount(afterText) - wordCount(beforeText)) <= 30) ? 'PASS' : 'FAIL';
  return out;
}

/* Receipt v1.0. Hash is SHA-256 over canonical JSON with the
   provenance.report_hash_sha256 field stripped, so the hash never
   influences itself. First receipt chains from GENESIS. */
function receiptHash(receipt) {
  var copy = JSON.parse(JSON.stringify(receipt));
  if (copy.provenance) { delete copy.provenance.report_hash_sha256; }
  return sha256(canonicalize(copy));
}

function buildReceipt(id, templateId, token, replacement, beforeText, afterText, drift, prevHash, created) {
  var r = {
    created: created,
    drift: drift,
    format: 'receipt-v1.0',
    id: id,
    input_hash: sha256(beforeText),
    output_hash: sha256(afterText),
    prev_receipt_hash: prevHash,
    replacement: replacement,
    template: templateId,
    token: token,
    provenance: { report_hash_sha256: '' }
  };
  r.provenance.report_hash_sha256 = receiptHash(r);
  return r;
}

function verifyReceipt(receipt, prevHash) {
  var recomputed = receiptHash(receipt);
  var hashOk = (recomputed === receipt.provenance.report_hash_sha256);
  var linkOk = (receipt.prev_receipt_hash === prevHash);
  return { hash_ok: hashOk, link_ok: linkOk, pass: hashOk && linkOk };
}
/* END PURE LOGIC */

/* Content bank, verbatim from ~/workspace/distribution/content-bank.md.
   Cursor: index 8, updated 2026-11-13 21:55. 30 items. */
var BANK = [
  { n: 1, fact: 'SWARM page: full factual rebuild IN PROGRESS from the recovered SREIC architecture. 7 legions, 5,150 as a historical logical-agent design target (never live sessions), honest DESIGNED state labels. Do NOT present as shipped until deployed and verified at swarm.neuruh.com. The earlier scaffold at https://swarm-38g.pages.dev is not the final build.', proof: 'local source ~/workspace/swarm' },
  { n: 2, fact: 'neuruh.com/proof page BUILT 2026-09-26 on neuruh-web but NOT YET DEPLOYED (Mac-side deploy pending; GA4/legal decision unresolved). Do not claim it is live or link it as shipped until the deploy lands.', proof: 'neuruh-web branch feat/proof-receipts-20260926' },
  { n: 3, fact: '2021 Dutchmen Kodiak Ultra-Lite 332BHSL listed at $22,000 (repriced 2026-09-26 from $25,000; $21,000 floor), Benton Harbor MI. 38ft bunkhouse, sleeps 11, free-and-clear title.', proof: 'https://www.facebook.com/marketplace/item/27944663891896736' },
  { n: 4, fact: 'Submitted the camper to Kunes RV buy program 2026-09-26. Confirmation received, no fee.', proof: 'dealer-call-sheet.md' },
  { n: 5, fact: '4 YouTube Shorts published 2026-09-25/26 on the vintage-buying channel (POV, The Barn Find, Three Mistakes, The Recipe). VERIFIED LIVE 2026-09-26 11:15 EDT with matching titles.', proof: 'https://youtube.com/shorts/1rupFkBkvIE' },
  { n: 6, fact: 'Property Opportunity Scan $100 (changed from $350 on 2026-10-01 by Jeramie). Property Intelligence Dossier $1,500. Confirmed list prices 2026-10-01.', proof: 'neuruh.com/pricing' },
  { n: 7, fact: 'Free 10-minute qualifier call is the primary CTA. Book at cal.com/neuruh. Contact jeramie@neuruh.com.', proof: 'neuruh.com' },
  { n: 8, fact: 'Teach-first reply posted in Moda AI Club (8,000-member AI builder group) 2026-09-26. Value first, no pitch.', proof: 'https://www.facebook.com/groups/modaai/posts/1119781627243218/?comment_id=1119838433904204' },
  { n: 9, fact: 'Recipe system: 30 canonical recipe families (R1-R30), 36 rows in live Supabase registry, 4 active hunt recipes.', proof: 'estate inventory 2026-09-22' },
  { n: 10, fact: 'LANDOS hunt 6071b7ad: 153 leads scored, 153 updated, 153 IDs synced, zero new minted.', proof: 'hunt receipt 2026-09-25' },
  { n: 11, fact: 'DeedSonar: flagship all-in-one real-estate CRM/lead app, solely Jeramie Hicks (Bryan Franklin never signed; per 2026-10-22 correction).', proof: 'deedsonar.com' },
  { n: 12, fact: 'lead-recipe-os: the core lead engine. Most important work in the stack.', proof: 'NeuruhAI/lead-recipe-os' },
  { n: 13, fact: 'SREIC is not a standalone app. It is a Real Estate World inside Neuruh.', proof: 'integration blueprint 2026-09-08' },
  { n: 14, fact: 'First Pick: free open-source (CC0) sell-sheet connecting SW Michigan growers to Chicago buyers. No commission.', proof: 'firstpick-biz.pages.dev' },
  { n: 15, fact: 'Fallow: idle-parcel yield intelligence engine. LaPorte County pilot staged.', proof: 'estate docs' },
  { n: 16, fact: 'Parcel Reality Bench (prbench): benchmark grading models on county parcel records.', proof: 'NeuruhAI/prbench' },
  { n: 17, fact: 'CRUCIBLE: hash-chained receipt system as publication gate.', proof: 'estate docs' },
  { n: 18, fact: 'NRH Registry: canonical IP inventory across ~140-215 repos.', proof: 'registry' },
  { n: 19, fact: '31 named frameworks in the agent catalog: PMLA, SAL, DIMEA 2.0, Master Command Protocol, etc.', proof: 'catalog' },
  { n: 20, fact: 'Atomic agent model: Protons (core logic), Neutrons (data stability), Electrons (tool execution).', proof: 'swarm architecture blueprint' },
  { n: 21, fact: 'Master Command Protocol + Context MUX + Semantic Parity Checker.', proof: 'swarm blueprint' },
  { n: 22, fact: 'Canonical RE execution loop: LANDOS ingest, engine, signals, recipe, DeedSonar, acquisition, underwriting, outreach, outcome, learning.', proof: 'estate docs' },
  { n: 23, fact: 'DNC scrubbing is optional, never an automatic gate. Unchecked phones callable with visible warning.', proof: 'founder spec' },
  { n: 24, fact: 'Estate-identity layer: distinguishes estate, human, deceased-owner, documented case states.', proof: 'estate docs' },
  { n: 25, fact: '25+ years physical arbitrage: estate cleanouts, salvage, thrift, trading cards, motorcycles, equipment.', proof: 'bio' },
  { n: 26, fact: 'MIDDEN: small-town estate/thrift retail pilot in Michiana. Cash-flow plus lead feed.', proof: 'plans' },
  { n: 27, fact: 're.neuruh.com: real-estate sales front door. guide.neuruh.com: field guide.', proof: 'live sites' },
  { n: 28, fact: 'No paid spend until revenue exists. All marketing organic. Budget $0 rule.', proof: 'directive 2026-09-26' },
  { n: 29, fact: 'No dollar valuation claimed before recurring revenue.', proof: 'valuation honesty rule' },
  { n: 30, fact: 'Convergence over proliferation: repair existing infrastructure, never parallel prototypes.', proof: 'directive' }
];

/* Template library. Every template is drawn from a stated source; each card
   cites it. Wording that assembles stated fields into a template is labeled
   as assembly in the card note. No template is invented from nothing. */
var TEMPLATES = [
  {
    id: 'T1',
    name: 'IPP Master Template (ANGLE_TOKEN)',
    source: 'Vault: IPP methodology, Token-Swap Prompting Methodology section (hq-l2-bv-intent-preservation-protocol-ipp-universal-software-build-methodology.md). Verbatim.',
    text: '<ANGLE_TOKEN> | [LOCKED: ultra-photoreal 8K, golden-hour, global illumination, natural color science, zero stylization artifacts]',
    locked: '[LOCKED: ultra-photoreal 8K, golden-hour, global illumination, natural color science, zero stylization artifacts]',
    tokens: ['<ANGLE_TOKEN>'],
    presets: { '<ANGLE_TOKEN>': ['High-altitude aerial...', 'Eye-level cinematic hero shot...', 'Low-angle twilight view...'] },
    presetLabels: ['P1 (source)', 'P2 (source)', 'P3 (source)'],
    note: 'The source writes the token in angle brackets, not square brackets. The simulator accepts both forms. Swap options P1, P2, P3 are verbatim from the source.'
  },
  {
    id: 'T2',
    name: 'SHOT_LABEL, Midjourney output',
    source: 'Vault: Neuruh Command Codex, /image command (db-neuruh-command-system.md). Fields as stated; template assembly is mine.',
    text: 'SHOT_LABEL: [SCENE] | Geometry (locked): wide 16:9 frame, centered console | Scene: [SCENE_DESCRIPTION] | Lighting: [LIGHTING] | Palette: [PALETTE] | Mood: [MOOD] | Specs: [TECH_SPECS] --ar [ASPECT] --v [VERSION]',
    locked: 'Geometry (locked): wide 16:9 frame, centered console',
    tokens: ['[SCENE]', '[SCENE_DESCRIPTION]', '[LIGHTING]', '[PALETTE]', '[MOOD]', '[TECH_SPECS]', '[ASPECT]', '[VERSION]'],
    defaults: { '[SCENE]': 'Neuruh command-center dashboard', '[SCENE_DESCRIPTION]': 'a real product screenshot of the system console', '[LIGHTING]': 'low-key practical lighting', '[PALETTE]': 'emerald and slate', '[MOOD]': 'tactical, command-center', '[TECH_SPECS]': 'photorealistic, dark UI aesthetic', '[ASPECT]': '16:9', '[VERSION]': '6' },
    presets: {},
    presetLabels: [],
    note: 'Stated fields: SHOT_LABEL, locked geometry, scene description, lighting, color palette, mood, technical specs, Midjourney --ar and --v flags. Stated style direction: dark UI aesthetic, tactical/command-center feel, emerald and slate palette, Neuruh brand alignment. Geometry is locked, so it is not a swappable token. Default values are my choices from the stated style direction.'
  },
  {
    id: 'T3',
    name: 'SHOT_LABEL, DALL-E output',
    source: 'Vault: Neuruh Command Codex, /image command (db-neuruh-command-system.md). Fields as stated; template assembly is mine.',
    text: 'SHOT_LABEL: [SCENE]. Geometry (locked): wide 16:9 frame, centered console. Scene: [SCENE_DESCRIPTION]. Lighting: [LIGHTING]. Palette: [PALETTE]. Mood: [MOOD]. Technical specs: [TECH_SPECS]. Render as natural language, no flags.',
    locked: 'Geometry (locked): wide 16:9 frame, centered console',
    tokens: ['[SCENE]', '[SCENE_DESCRIPTION]', '[LIGHTING]', '[PALETTE]', '[MOOD]', '[TECH_SPECS]'],
    defaults: { '[SCENE]': 'Neuruh command-center dashboard', '[SCENE_DESCRIPTION]': 'a real product screenshot of the system console', '[LIGHTING]': 'low-key practical lighting', '[PALETTE]': 'emerald and slate', '[MOOD]': 'tactical, command-center', '[TECH_SPECS]': 'photorealistic, dark UI aesthetic' },
    presets: {},
    presetLabels: [],
    note: 'Same stated fields as T2, rendered as natural language for DALL-E with no --ar or --v flags, per the /image command. Default values are my choices from the stated style direction.'
  },
  {
    id: 'T4',
    name: 'Grok Wired Editorial SHOT_LABEL',
    source: 'Vault: session log 2026-03-30 (db-session-log.md). Stated values verbatim; template assembly is mine.',
    text: 'SHOT_LABEL: [SUBJECT] | Wired editorial aesthetic | Motif: [MOTIF] | Palette: [PALETTE] | Render: [RENDER] | Geometry, wardrobe, scene: locked',
    locked: 'Geometry, wardrobe, scene: locked',
    tokens: ['[SUBJECT]', '[MOTIF]', '[PALETTE]', '[RENDER]'],
    defaults: { '[SUBJECT]': 'fractured black monolith', '[MOTIF]': 'geometric neural lattice', '[PALETTE]': 'electric cyan', '[RENDER]': 'photorealistic 3D render' },
    presets: {},
    presetLabels: [],
    note: 'Stated example: Grok image prompt built for Wired editorial aesthetic (fractured black monolith, geometric neural lattice, electric cyan, photorealistic 3D render), locked geometry + wardrobe + scene. The four stated values are the defaults; each is swappable.'
  },
  {
    id: 'T5',
    name: 'Code-Generation Token-Swap',
    source: 'Vault: IPP methodology (same file as T1). Sentence as stated; template assembly is mine.',
    text: 'Build [FEATURE] following the locked architecture patterns, domain models, and security requirements. Vary only the implementation detail: [IMPLEMENTATION_DETAIL].',
    locked: 'locked architecture patterns, domain models, and security requirements',
    tokens: ['[FEATURE]', '[IMPLEMENTATION_DETAIL]'],
    defaults: { '[FEATURE]': 'a receipt verification endpoint', '[IMPLEMENTATION_DETAIL]': 'in-memory hash chain, no database' },
    presets: {},
    presetLabels: [],
    note: 'Source sentence: lock architectural patterns, domain models, and security requirements while allowing variation only in implementation details. Applied to code generation, per the source. Default values are my choices.'
  },
  {
    id: 'T6',
    name: 'Content Bank X Post',
    source: 'Content bank ~/workspace/distribution/content-bank.md: platform format rules plus bank item facts, verbatim.',
    text: '[FACT] [LINK]',
    locked: null,
    tokens: ['[FACT]', '[LINK]'],
    defaults: { '[FACT]': BANK[9].fact, '[LINK]': 'https://cal.com/neuruh' },
    presets: {},
    presetLabels: [],
    note: 'Stated X rule: under 280 chars, blunt, one link max. Stated link: cal.com/neuruh is the qualifier booking link (bank item 7). The FACT token offers all 30 bank items verbatim in the picker. No locked block exists for this template, so the locked-intact check reports N/A.'
  }
];

/* Page state */
var selectedTemplate = TEMPLATES[0];
var selectedToken = TEMPLATES[0].tokens[0];
var receipts = [];
var receiptSeq = 0;

function $(id) { return document.getElementById(id); }

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function highlightToken(text, token) {
  return esc(text).split(esc(token)).join('<mark class="tok">' + esc(token) + '</mark>');
}

function highlightValue(text, value) {
  if (!value) { return esc(text); }
  return esc(text).split(esc(value)).join('<mark class="val">' + esc(value) + '</mark>');
}

function renderTemplates() {
  var host = $('template-list');
  host.innerHTML = '';
  TEMPLATES.forEach(function (t) {
    var card = document.createElement('div');
    card.className = 'tcard' + (t.id === selectedTemplate.id ? ' sel' : '');
    card.innerHTML = '<h4>' + esc(t.id) + '. ' + esc(t.name) + '</h4>'
      + '<p class="src">Source: ' + esc(t.source) + '</p>'
      + '<pre>' + esc(t.text) + '</pre>'
      + '<p class="note">' + esc(t.note) + '</p>'
      + '<p class="slots">Swappable tokens: ' + t.tokens.map(esc).join(', ')
      + (t.locked ? ' | Locked (not swappable): ' + esc(t.locked) : ' | No locked block') + '</p>';
    card.addEventListener('click', function () { selectTemplate(t.id); });
    host.appendChild(card);
  });
}

function selectTemplate(id) {
  selectedTemplate = TEMPLATES.filter(function (t) { return t.id === id; })[0];
  selectedToken = selectedTemplate.tokens[0];
  renderTemplates();
  renderTokenSelect();
  updateReplacementHint();
  $('run-output').innerHTML = '<p class="muted">No run yet this session. Pick a token, type a replacement, press Run swap.</p>';
  $('drift-body').innerHTML = '<tr><td colspan="3" class="muted">No run yet.</td></tr>';
}

function renderTokenSelect() {
  var sel = $('token-select');
  sel.innerHTML = '';
  selectedTemplate.tokens.forEach(function (tok) {
    var o = document.createElement('option');
    o.value = tok;
    o.textContent = tok;
    sel.appendChild(o);
  });
  sel.value = selectedToken;
  var presets = selectedTemplate.presets && selectedTemplate.presets[selectedToken];
  var ph = $('preset-row');
  ph.innerHTML = '';
  if (presets) {
    presets.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.textContent = (selectedTemplate.presetLabels[i] || ('Preset ' + (i + 1))) + ': ' + p;
      b.addEventListener('click', function () { $('replacement').value = p; updateReplacementHint(); });
      ph.appendChild(b);
    });
  }
  var bankRow = $('bank-row');
  bankRow.innerHTML = '';
  if (selectedToken === '[FACT]') {
    var label = document.createElement('label');
    label.textContent = 'Bank item (verbatim fact): ';
    var bs = document.createElement('select');
    bs.id = 'bank-select';
    BANK.forEach(function (item) {
      var o = document.createElement('option');
      o.value = item.n;
      o.textContent = 'Item ' + item.n + ': ' + item.fact.slice(0, 80) + '...';
      bs.appendChild(o);
    });
    bs.value = '10';
    bs.addEventListener('change', function () {
      var item = BANK[parseInt(bs.value, 10) - 1];
      $('replacement').value = item.fact;
      $('bank-proof').textContent = 'Proof: ' + item.proof;
      updateReplacementHint();
    });
    label.appendChild(bs);
    bankRow.appendChild(label);
    var proof = document.createElement('p');
    proof.id = 'bank-proof';
    proof.className = 'muted';
    proof.textContent = 'Proof: ' + BANK[9].proof;
    bankRow.appendChild(proof);
  }
}

function updateReplacementHint() {
  var d = selectedTemplate.defaults && selectedTemplate.defaults[selectedToken];
  var inp = $('replacement');
  if (d && !inp.value) { inp.value = d; }
  $('token-echo').textContent = 'Token: ' + selectedToken + (d ? ' (source default shown)' : '');
}

function runSwap() {
  var beforeText = selectedTemplate.text;
  var token = selectedToken;
  var replacement = $('replacement').value;
  var afterText = swapPrompt(beforeText, token, replacement);
  var drift = driftCheck(beforeText, afterText, token, replacement, selectedTemplate.locked);

  $('before-pane').innerHTML = highlightToken(beforeText, token);
  $('after-pane').innerHTML = highlightValue(afterText, replacement);
  $('word-counts').textContent = 'Words before: ' + wordCount(beforeText)
    + ' | Words after: ' + wordCount(afterText)
    + ' | Delta: ' + (wordCount(afterText) - wordCount(beforeText))
    + ' | Chars before: ' + beforeText.length + ' | Chars after: ' + afterText.length;

  var labels = {
    bracket_balance: 'Bracket balance: [ ] and < > counts match in the output',
    token_replaced: 'Swapped token no longer appears in the output',
    locked_intact: 'Locked block survives verbatim in the output',
    replacement_nonempty: 'Replacement value is non-empty',
    length_ratio: 'Output length is 50% to 200% of input length (design threshold)',
    word_delta: 'Word-count delta within 30 words (design threshold)'
  };
  var rows = '';
  Object.keys(labels).forEach(function (k) {
    rows += '<tr><td>' + esc(labels[k]) + '</td><td class="' + drift[k].toLowerCase() + '">' + drift[k] + '</td>'
      + '<td class="muted">Design criterion, computed for real. No semantic equivalence is claimed.</td></tr>';
  });
  $('drift-body').innerHTML = rows;

  receiptSeq += 1;
  var id = 'tok-20261114-' + ('0000' + receiptSeq).slice(-4);
  var prevHash = receipts.length === 0 ? 'GENESIS' : receipts[receipts.length - 1].provenance.report_hash_sha256;
  var created = new Date().toISOString();
  var receipt = buildReceipt(id, selectedTemplate.id, token, replacement, beforeText, afterText, drift, prevHash, created);
  receipts.push(receipt);
  renderReceipts();
  $('run-output').innerHTML = '<p>Run complete. Receipt ' + esc(id) + ' emitted below. Drift: '
    + Object.keys(drift).map(function (k) { return k + '=' + drift[k]; }).join(', ') + '.</p>';
}

function renderReceipts() {
  var host = $('receipt-list');
  host.innerHTML = '';
  if (receipts.length === 0) {
    host.innerHTML = '<p class="muted">No receipts yet this session. Run the simulator to emit one.</p>';
    return;
  }
  receipts.forEach(function (r, idx) {
    var card = document.createElement('div');
    card.className = 'rcard';
    var prev = idx === 0 ? 'GENESIS' : receipts[idx - 1].provenance.report_hash_sha256;
    card.innerHTML = '<h4>' + esc(r.id) + ' <span class="verdict" id="verdict-' + esc(r.id) + '">not verified yet</span></h4>'
      + '<p>Template: ' + esc(r.template) + ' | Token: ' + esc(r.token) + '</p>'
      + '<p>Input hash: <code>' + esc(r.input_hash) + '</code></p>'
      + '<p>Output hash: <code>' + esc(r.output_hash) + '</code></p>'
      + '<p>Prev hash: <code>' + esc(r.prev_receipt_hash) + '</code></p>'
      + '<p>Receipt hash: <code>' + esc(r.provenance.report_hash_sha256) + '</code></p>'
      + '<p>Drift: ' + Object.keys(r.drift).map(function (k) { return esc(k) + '=' + esc(r.drift[k]); }).join(', ') + '</p>'
      + '<p><button type="button" data-idx="' + idx + '" class="verify-btn">Verify</button></p>'
      + '<details><summary>Raw receipt JSON</summary><pre>' + esc(JSON.stringify(r, null, 2)) + '</pre></details>';
    host.appendChild(card);
  });
  var btns = host.querySelectorAll('.verify-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function (ev) {
      var idx = parseInt(ev.target.getAttribute('data-idx'), 10);
      var r = receipts[idx];
      var prev = idx === 0 ? 'GENESIS' : receipts[idx - 1].provenance.report_hash_sha256;
      var v = verifyReceipt(r, prev);
      var el = $('verdict-' + r.id);
      el.textContent = v.pass ? 'PASS (hash recomputes, link matches)' : 'FAIL (hash_ok=' + v.hash_ok + ', link_ok=' + v.link_ok + ')';
      el.className = 'verdict ' + (v.pass ? 'pass' : 'fail');
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  renderTemplates();
  renderTokenSelect();
  updateReplacementHint();
  renderReceipts();
  $('token-select').addEventListener('change', function (ev) {
    selectedToken = ev.target.value;
    renderTokenSelect();
    updateReplacementHint();
  });
  $('replacement').addEventListener('input', updateReplacementHint);
  $('run-swap').addEventListener('click', runSwap);
  $('copy-after').addEventListener('click', function () {
    var txt = $('after-pane').textContent;
    if (navigator.clipboard) { navigator.clipboard.writeText(txt); }
  });
});
