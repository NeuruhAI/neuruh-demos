/* Sovereign Conglomerate Explorer: receipt math.
   Pure functions only. No DOM. Works in the browser (Web Crypto) and
   in Node (global crypto.subtle exists in Node 19+).
   Receipt format v1.0, demo format modeled on hash chaining. This is
   not CRUCIBLE itself; CRUCIBLE is a separate Tier A gate. */
(function (root) {
  'use strict';

  function canonicalStringify(value) {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
      return '[' + value.map(canonicalStringify).join(',') + ']';
    }
    var keys = Object.keys(value).sort();
    var parts = keys.map(function (k) {
      return JSON.stringify(k) + ':' + canonicalStringify(value[k]);
    });
    return '{' + parts.join(',') + '}';
  }

  async function sha256Hex(text) {
    var subtle = null;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      subtle = crypto.subtle;
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      subtle = globalThis.crypto.subtle;
    }
    if (!subtle) {
      throw new Error('No Web Crypto subtle available');
    }
    var data = new TextEncoder().encode(text);
    var digest = await subtle.digest('SHA-256', data);
    var bytes = new Uint8Array(digest);
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      hex += ('0' + bytes[i].toString(16)).slice(-2);
    }
    return hex;
  }

  /* Compare two verticals by their stated fields only. Returns the
     rows the page renders. A row differs when the two canonical
     values are not equal. UNKNOWN is a value, never filled in. */
  function compareVerticals(a, b) {
    var fields = [
      { key: 'role', label: 'Role' },
      { key: 'tier', label: 'Tier' },
      { key: 'status', label: 'Status' },
      { key: 'dependencies', label: 'Dependencies' }
    ];
    var rows = fields.map(function (f) {
      var va = a[f.key];
      var vb = b[f.key];
      return {
        field: f.label,
        a: va,
        b: vb,
        differs: canonicalStringify(va) !== canonicalStringify(vb)
      };
    });
    rows.push({
      field: 'Anchors',
      a: a.anchors.map(function (x) { return x.name + ' (Tier ' + x.tier + ')'; }).join('; ') || 'UNKNOWN: none stated',
      b: b.anchors.map(function (x) { return x.name + ' (Tier ' + x.tier + ')'; }).join('; ') || 'UNKNOWN: none stated',
      differs: canonicalStringify(a.anchors) !== canonicalStringify(b.anchors)
    });
    return rows;
  }

  async function buildReceipt(input, output, prevHash) {
    var inputText = canonicalStringify(input);
    var outputText = canonicalStringify(output);
    var inputHash = await sha256Hex(inputText);
    var outputHash = await sha256Hex(outputText);
    var chainText = prevHash + inputHash + outputHash;
    var receiptHash = await sha256Hex(chainText);
    return {
      receipt_version: '1.0',
      tool: 'sovereign-conglomerate-explorer',
      input: input,
      output: output,
      input_hash: inputHash,
      output_hash: outputHash,
      prev_hash: prevHash,
      receipt_hash: receiptHash
    };
  }

  /* Recompute every hash from the stored input/output and check the
     chain link. Returns { pass, checks } with one line per check. */
  async function verifyReceipt(receipt, expectedPrevHash) {
    var checks = [];
    var inputHash = await sha256Hex(canonicalStringify(receipt.input));
    checks.push({ name: 'input_hash recomputed', pass: inputHash === receipt.input_hash });
    var outputHash = await sha256Hex(canonicalStringify(receipt.output));
    checks.push({ name: 'output_hash recomputed', pass: outputHash === receipt.output_hash });
    var receiptHash = await sha256Hex(receipt.prev_hash + receipt.input_hash + receipt.output_hash);
    checks.push({ name: 'receipt_hash recomputed', pass: receiptHash === receipt.receipt_hash });
    checks.push({ name: 'prev_hash matches chain', pass: receipt.prev_hash === expectedPrevHash });
    var pass = checks.every(function (c) { return c.pass; });
    return { pass: pass, checks: checks };
  }

  var api = {
    canonicalStringify: canonicalStringify,
    sha256Hex: sha256Hex,
    compareVerticals: compareVerticals,
    buildReceipt: buildReceipt,
    verifyReceipt: verifyReceipt
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.SovCongReceipt = api;
})(typeof window !== 'undefined' ? window : globalThis);
