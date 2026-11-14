// N-Cell Organ Manifest demo logic. SIMULATION only.
// Fetches one manifest JSON per organ, renders it, and stamps N-Cell/64
// headers whose organMask byte follows the selected manifest's own bit
// mapping. The bit mapping is manifest-defined, never a paper claim.
'use strict';

var ORGAN_IDS = ['sal', 'axon', 'qcm', 'hkrs', 'pmla-vault', 'mother-governance', 'n-observer', 'n-lab', 'world-emitter', 'founder-os'];

var BYTE_NAMES = [
  'routeMask',
  'organMask',
  'lifecycleMask',
  'authorityMask',
  'memoryMask',
  'confidence',
  'risk',
  'outputMask',
];

var current = null; // current manifest object
var previousHeader = null; // array of 8 byte values, or null

function el(id) {
  return document.getElementById(id);
}

function hex2(n) {
  return ('0' + n.toString(16)).slice(-2).toUpperCase();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function valueCell(value) {
  if (Array.isArray(value) && value.length === 1 && value[0] === 'unresolved') {
    return '<span class="unresolved">unresolved</span>';
  }
  if (Array.isArray(value)) {
    return esc(value.join(', '));
  }
  if (value && typeof value === 'object') {
    if (value.level === 'unresolved') {
      return '<span class="unresolved">unresolved</span> <span class="muted">(no level claimed)</span>';
    }
    return esc(value.level);
  }
  return esc(String(value));
}

function groundingCell(g) {
  var cls = g.status === 'unresolved' ? 'status-unresolved' : 'status-' + g.status;
  return '<span class="' + cls + '">' + esc(g.status) + '</span><br><span class="muted">' + esc(g.basis) + '</span>';
}

function renderManifest(m) {
  current = m;
  el('organTitle').textContent = m.organName + ' (' + m.organId + ')';
  el('paperRole').textContent = m.paperRole;
  el('paperBoundary').textContent = m.paperBoundary;
  el('paperSource').textContent = 'Source: ' + m.paperSource + ' Schema ' + m.schemaVersion + ', manifest ' + m.manifestVersion + '.';
  el('rawJson').textContent = JSON.stringify(m, null, 2);

  var rows = [
    ['capabilityFamilies', m.capabilityFamilies, m.grounding.capabilityFamilies],
    ['permittedRoutes', m.permittedRoutes, m.grounding.permittedRoutes],
    ['authorityCeiling', m.authorityCeiling, m.grounding.authorityCeiling],
    ['memoryPlanes', m.memoryPlanes, m.grounding.memoryPlanes],
    ['lifecycleStages', m.lifecycleStages, m.grounding.lifecycleStages],
    ['outputClasses', m.outputClasses, m.grounding.outputClasses],
  ];
  var html = '';
  rows.forEach(function (row) {
    html += '<tr><td class="mono">' + esc(row[0]) + '</td><td>' + valueCell(row[1]) + '</td><td>' + groundingCell(row[2]) + '</td></tr>';
  });
  el('fieldRows').innerHTML = html;

  var bitHtml = '';
  m.organMaskBits.forEach(function (entry) {
    bitHtml += '<tr><td class="mono">bit ' + entry.bit + '</td><td class="mono">' + esc(entry.capabilityFamily) + '</td><td class="mono">0x' + hex2(1 << entry.bit) + '</td></tr>';
  });
  el('bitRows').innerHTML = bitHtml;

  var checkHtml = '';
  m.organMaskBits.forEach(function (entry) {
    checkHtml += '<label><input type="checkbox" class="fam-check" data-bit="' + entry.bit + '" checked> bit ' + entry.bit + ': ' + esc(entry.capabilityFamily) + '</label>';
  });
  el('familyChecks').innerHTML = checkHtml;
}

function parseHexInput(id, fallback) {
  var raw = el(id).value.trim();
  var n = parseInt(raw, 16);
  if (isNaN(n) || n < 0 || n > 255) {
    return fallback;
  }
  return n;
}

function parseDecInput(id, fallback) {
  var n = parseInt(el(id).value, 10);
  if (isNaN(n) || n < 0 || n > 255) {
    return fallback;
  }
  return n;
}

function stampHeader() {
  if (!current) {
    return;
  }
  var organMask = 0;
  var checks = document.querySelectorAll('.fam-check');
  checks.forEach(function (box) {
    if (box.checked) {
      organMask |= 1 << parseInt(box.getAttribute('data-bit'), 10);
    }
  });

  var header = [
    parseHexInput('inRoute', 0),
    organMask,
    parseHexInput('inLifecycle', 0),
    parseHexInput('inAuthority', 0),
    parseHexInput('inMemory', 0),
    parseDecInput('inConfidence', 0),
    parseDecInput('inRisk', 0),
    parseHexInput('inOutput', 0),
  ];

  var hexString = header.map(hex2).join(' ');
  el('headerOut').textContent = 'N-Cell/64 header (' + current.organId + '): ' + hexString;

  var meanings = [
    'As entered (routes are unresolved in the manifest).',
    'Manifest-defined organMask: checked capability families for ' + current.organName + '.',
    'As entered (lifecycle stages are unresolved in the manifest).',
    'As entered. Manifest authority ceiling: ' + (current.authorityCeiling.level === 'unresolved' ? 'unresolved (no level claimed)' : current.authorityCeiling.level) + '.',
    'As entered (memory planes: ' + (Array.isArray(current.memoryPlanes) && current.memoryPlanes[0] === 'unresolved' ? 'unresolved' : current.memoryPlanes.join(', ')) + ').',
    'Quantized confidence 0-255.',
    'Quantized risk 0-255.',
    'As entered (output classes: ' + current.outputClasses.join(', ') + ').',
  ];
  var rows = '';
  header.forEach(function (b, i) {
    rows += '<tr><td class="mono">' + i + '</td><td class="mono">' + BYTE_NAMES[i] + '</td><td class="mono">0x' + hex2(b) + '</td><td class="mono">' + b + '</td><td>' + esc(meanings[i]) + '</td></tr>';
  });
  el('headerRows').innerHTML = rows;

  if (previousHeader) {
    var delta = header.map(function (b, i) {
      return b ^ previousHeader[i];
    });
    var changed = [];
    delta.forEach(function (d, i) {
      if (d !== 0) {
        changed.push('byte ' + i + ' (' + BYTE_NAMES[i] + ')');
      }
    });
    el('deltaOut').textContent = 'delta = ' + delta.map(hex2).join(' ') + (changed.length ? ' | changed: ' + changed.join(', ') : ' | no change from previous header');
  } else {
    el('deltaOut').textContent = 'First header stamped. Stamp again to see the XOR delta against this one.';
  }
  previousHeader = header;
}

function loadOrgan(id) {
  var buttons = document.querySelectorAll('#picker button');
  buttons.forEach(function (b) {
    b.setAttribute('aria-pressed', b.getAttribute('data-organ') === id ? 'true' : 'false');
  });
  fetch('manifests/' + id + '.json')
    .then(function (r) {
      if (!r.ok) {
        throw new Error('HTTP ' + r.status);
      }
      return r.json();
    })
    .then(function (m) {
      renderManifest(m);
      previousHeader = null;
      el('headerOut').textContent = 'No header stamped yet.';
      el('deltaOut').textContent = 'No previous header yet.';
      el('headerRows').innerHTML = '<tr><td colspan="5" class="muted">Stamp a header to see its bytes.</td></tr>';
    })
    .catch(function (err) {
      el('organTitle').textContent = 'failed to load ' + id + ': ' + err.message;
    });
}

function buildPicker(manifests) {
  var picker = el('picker');
  picker.innerHTML = '';
  ORGAN_IDS.forEach(function (id) {
    var m = manifests[id];
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-organ', id);
    b.setAttribute('aria-pressed', 'false');
    b.textContent = m ? m.organName : id;
    b.addEventListener('click', function () {
      loadOrgan(id);
    });
    picker.appendChild(b);
  });
}

// Load all manifests up front so the picker shows real organ names.
Promise.all(ORGAN_IDS.map(function (id) {
  return fetch('manifests/' + id + '.json').then(function (r) {
    return r.json();
  }).then(function (m) {
    return [id, m];
  });
})).then(function (pairs) {
  var byId = {};
  pairs.forEach(function (p) {
    byId[p[0]] = p[1];
  });
  buildPicker(byId);
  loadOrgan('sal');
}).catch(function (err) {
  el('organTitle').textContent = 'failed to load manifests: ' + err.message;
});

el('stampBtn').addEventListener('click', stampHeader);
