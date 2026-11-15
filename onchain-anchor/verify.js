/* Neuruh On-Chain Anchor — verifier v2.0.0 (vanilla JS, SubtleCrypto).
   The same logic as the Python builder (build_anchor_v2.py). The page loads
   this file; the downloadable verifier IS the page's verifier.
   Canonical form: JSON, keys sorted bytewise, separators (",", ":"),
   no whitespace, UTF-8. See CANONICALIZATION.md for the byte-level rules.
   Leaf = SHA-256 of the canonical entry JSON. Parent = SHA-256 of the
   concatenated raw 32-byte child hashes. An odd level duplicates its last
   node. Empty tree root = SHA-256 of zero bytes.
   No wallet, no keys, no network writes. Nothing leaves the browser
   except a fetch of the manifest itself. */
(function (global) {
  "use strict";
  var VERIFIER_VERSION = "2.0.0";
  var ENTRY_FIELDS = ["id", "kind", "url_or_source", "sha256", "retrieved_at",
    "raw_bytes_locator", "schema_version", "content_type", "content_length", "status"];
  var ENTRY_KINDS = ["site", "paper", "document", "ledger", "tool", "manifest", "observation"];
  var ENTRY_STATUSES = ["verified", "pending", "superseded"];
  var HEX64 = /^[0-9a-f]{64}$/;

  function canonicalStringify(v) {
    if (v === null) return "null";
    if (typeof v === "number" || typeof v === "boolean") return JSON.stringify(v);
    if (typeof v === "string") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(canonicalStringify).join(",") + "]";
    if (typeof v === "object") {
      var keys = Object.keys(v).sort();
      return "{" + keys.map(function (k) { return JSON.stringify(k) + ":" + canonicalStringify(v[k]); }).join(",") + "}";
    }
    throw new Error("cannot canonicalize value of type " + typeof v);
  }

  async function sha256Hex(str) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return bytesToHex(new Uint8Array(buf));
  }
  async function sha256Bytes(u8) {
    var buf = await crypto.subtle.digest("SHA-256", u8);
    return new Uint8Array(buf);
  }
  function hexToBytes(h) {
    var b = new Uint8Array(h.length / 2);
    for (var i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16);
    return b;
  }
  function bytesToHex(b) {
    return Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  }
  async function leafHash(entry) { return sha256Hex(canonicalStringify(entry)); }

  async function buildLevels(leafHexes) {
    if (leafHexes.length === 0) return [[]];
    var levels = [leafHexes.slice()];
    while (levels[levels.length - 1].length > 1) {
      var prev = levels[levels.length - 1], next = [];
      for (var i = 0; i < prev.length; i += 2) {
        var left = hexToBytes(prev[i]);
        var right = hexToBytes(prev[i + 1] !== undefined ? prev[i + 1] : prev[i]);
        var combined = new Uint8Array(64);
        combined.set(left, 0); combined.set(right, 32);
        next.push(bytesToHex(await sha256Bytes(combined)));
      }
      levels.push(next);
    }
    return levels;
  }
  async function merkleRoot(leafHexes) {
    if (leafHexes.length === 0) return sha256Hex("");
    var levels = await buildLevels(leafHexes);
    return levels[levels.length - 1][0];
  }
  async function getPath(index, levels) {
    var path = [], idx = index;
    for (var l = 0; l < levels.length - 1; l++) {
      var level = levels[l], isRight = idx % 2 === 1;
      var sibIdx = isRight ? idx - 1 : idx + 1;
      if (sibIdx >= level.length) sibIdx = idx; // odd level: node is its own sibling
      path.push({ hash: level[sibIdx], side: isRight ? "left" : "right", level: l });
      idx = Math.floor(idx / 2);
    }
    return path;
  }
  async function verifyPath(leafHex, path, root) {
    var cur = hexToBytes(leafHex);
    for (var i = 0; i < path.length; i++) {
      var sib = hexToBytes(path[i].hash), combined = new Uint8Array(64);
      if (path[i].side === "left") { combined.set(sib, 0); combined.set(cur, 32); }
      else { combined.set(cur, 0); combined.set(sib, 32); }
      cur = await sha256Bytes(combined);
    }
    return bytesToHex(cur) === root;
  }

  /* Manifest schema validation (item 85). Rejects unknown fields and bad hashes. */
  function validateEntry(e, where, errors) {
    if (typeof e !== "object" || e === null) { errors.push(where + ": entry is not an object"); return; }
    Object.keys(e).forEach(function (k) {
      if (ENTRY_FIELDS.indexOf(k) < 0) errors.push(where + ": unknown field " + k);
    });
    ENTRY_FIELDS.forEach(function (k) {
      if (!(k in e)) errors.push(where + ": missing field " + k);
    });
    if (typeof e.id !== "string" || !e.id) errors.push(where + ": id must be a non-empty string");
    if (ENTRY_KINDS.indexOf(e.kind) < 0) errors.push(where + ": bad kind " + e.kind);
    if (!(e.url_or_source === null || typeof e.url_or_source === "string")) errors.push(where + ": url_or_source must be string or null");
    if (!(e.sha256 === null || (typeof e.sha256 === "string" && HEX64.test(e.sha256)))) errors.push(where + ": sha256 must be null or 64 lowercase hex");
    if (typeof e.retrieved_at !== "string" || !e.retrieved_at) errors.push(where + ": retrieved_at must be an ISO-8601 string");
    if (typeof e.raw_bytes_locator !== "string" || !e.raw_bytes_locator) errors.push(where + ": raw_bytes_locator must be a non-empty string");
    if (e.schema_version !== "2.0") errors.push(where + ": schema_version must be 2.0");
    if (!(e.content_type === null || typeof e.content_type === "string")) errors.push(where + ": content_type must be string or null");
    if (!(e.content_length === null || (Number.isInteger(e.content_length) && e.content_length >= 0))) errors.push(where + ": content_length must be null or a non-negative integer");
    if (ENTRY_STATUSES.indexOf(e.status) < 0) errors.push(where + ": bad status " + e.status);
    if (e.status === "verified" && e.sha256 === null) errors.push(where + ": verified entry must have a sha256");
    if (e.status === "pending" && e.sha256 !== null) errors.push(where + ": pending entry must have sha256 null");
  }
  function validateManifest(m) {
    var errors = [];
    if (typeof m !== "object" || m === null) return { ok: false, errors: ["manifest is not an object"] };
    ["tool", "owner", "anchor_date", "created_at", "merkle_root", "leaf_count",
     "estate_root", "estate_leaf_count", "schema_version", "entries", "self_entries",
     "verifier", "anchor", "receipt_schema_version", "heuristic", "labeling_rule"
    ].forEach(function (k) { if (!(k in m)) errors.push("missing top-level field " + k); });
    if (m.schema_version !== "2.0") errors.push("schema_version must be 2.0");
    if (m.receipt_schema_version !== "1.1") errors.push("receipt_schema_version must be 1.1");
    if (!Array.isArray(m.heuristic)) errors.push("heuristic must be an array of entry ids");
    if (typeof m.labeling_rule !== "string" || !m.labeling_rule) errors.push("labeling_rule must be a non-empty string");
    if (typeof m.verifier !== "object" || !m.verifier || typeof m.verifier.sha256 !== "string" || !HEX64.test(m.verifier.sha256 || "")) errors.push("verifier.sha256 must be 64 lowercase hex");
    if (typeof m.anchor !== "object" || !m.anchor) errors.push("anchor must be an object");
    if (typeof m.merkle_root !== "string" || !HEX64.test(m.merkle_root || "")) errors.push("merkle_root must be 64 lowercase hex");
    if (typeof m.estate_root !== "string" || !HEX64.test(m.estate_root || "")) errors.push("estate_root must be 64 lowercase hex");
    if (!Array.isArray(m.entries)) errors.push("entries must be an array");
    else m.entries.forEach(function (e, i) { validateEntry(e, "entries[" + i + "]", errors); });
    if (!Array.isArray(m.self_entries)) errors.push("self_entries must be an array");
    else m.self_entries.forEach(function (e, i) { validateEntry(e, "self_entries[" + i + "]", errors); });
    if (Array.isArray(m.entries) && Array.isArray(m.self_entries)) {
      var n = m.entries.length + m.self_entries.length;
      if (m.leaf_count !== n) errors.push("leaf_count " + m.leaf_count + " does not equal entries + self_entries (" + n + ")");
      if (m.estate_leaf_count !== m.entries.length) errors.push("estate_leaf_count does not equal entries length");
    }
    return { ok: errors.length === 0, errors: errors };
  }

  /* The manifest's own content commitment (item 100): a file cannot contain
     its own hash, so this leaf commits to the exact canonical entry list. */
  async function manifestContentHash(entries) {
    return sha256Hex(canonicalStringify(entries));
  }

  /* Canonical verification receipt schema v1.1 (convergence items 3, 76, 77).
     One chain format for observation, forecast, outcome, gate, promotion,
     verification, anchor, and build receipts. receipt_version "1.1" is the
     SCHEMA version (distinct from the verifier tool version 2.0.0 and the
     manifest schema version 2.0). receipt_hash is the SHA-256 of the
     canonical receipt with receipt_hash and receipt_id removed;
     receipt_id is defined to equal receipt_hash. Every major receipt
     carries the current manifest Merkle root (merkle_root) and, once an
     anchor exists, the on-chain anchored root (anchor_root, null until
     then). A record hash (a forecast's own receipt, an observation_id)
     lives inside payload; the canonical receipt wraps it and chains it.
     Implemented identically in receipts.py. */
  var RECEIPT_VERSION = "1.1";
  var RECEIPT_ACTIONS = ["observation", "forecast", "outcome", "gate", "promotion",
    "verification", "anchor", "build"];
  async function makeReceipt(o) {
    var body = {
      receipt_version: RECEIPT_VERSION,
      verifier_version: VERIFIER_VERSION,
      action: o.action || "verification",
      actor: o.actor || ("anchor-v2 (verify.js " + VERIFIER_VERSION + ")"),
      inputs: o.inputs || {},
      payload: o.payload || o.inputs || {},
      root: o.root || null,
      merkle_root: o.merkleRoot || null,
      anchor_root: o.anchorRoot || null,
      result: o.result || null,
      timestamp: o.timestamp || new Date().toISOString(),
      prev_hash: o.prevHash || "GENESIS"
    };
    var receiptHash = await sha256Hex(canonicalStringify(body));
    body.receipt_hash = receiptHash;
    body.receipt_id = receiptHash;
    return body;
  }
  async function verifyReceiptChain(receipts) {
    var prev = "GENESIS";
    for (var i = 0; i < receipts.length; i++) {
      var r = receipts[i];
      if (r.receipt_version !== RECEIPT_VERSION) return { ok: false, error: "receipt " + i + " receipt_version is not 1.1", index: i };
      if (RECEIPT_ACTIONS.indexOf(r.action) < 0) return { ok: false, error: "receipt " + i + " bad action " + r.action, index: i };
      if (r.prev_hash !== prev) return { ok: false, error: "receipt " + i + " prev_hash does not link", index: i };
      if (r.receipt_id !== r.receipt_hash) return { ok: false, error: "receipt " + i + " receipt_id does not equal receipt_hash", index: i };
      var body = {};
      Object.keys(r).forEach(function (k) { if (k !== "receipt_hash" && k !== "receipt_id") body[k] = r[k]; });
      var h = await sha256Hex(canonicalStringify(body));
      if (h !== r.receipt_hash) return { ok: false, error: "receipt " + i + " receipt_hash mismatch", index: i };
      prev = r.receipt_hash;
    }
    return { ok: true, count: receipts.length };
  }

  /* Brier score (items 65, 66). pairs: [{p, o}] with p in [0,1], o in {0,1}. */
  function brierScore(pairs) {
    if (!pairs.length) return null;
    var s = 0;
    pairs.forEach(function (x) { s += (x.p - x.o) * (x.p - x.o); });
    return s / pairs.length;
  }
  function brierByType(rows) {
    var groups = {};
    rows.forEach(function (r) {
      (groups[r.forecast_type] = groups[r.forecast_type] || []).push({ p: r.probability, o: r.outcome });
    });
    var out = {};
    Object.keys(groups).forEach(function (k) { out[k] = { n: groups[k].length, brier: brierScore(groups[k]) }; });
    return out;
  }

  global.AnchorVerify = {
    VERIFIER_VERSION: VERIFIER_VERSION,
    RECEIPT_VERSION: RECEIPT_VERSION,
    ENTRY_FIELDS: ENTRY_FIELDS,
    canonicalStringify: canonicalStringify,
    sha256Hex: sha256Hex,
    sha256Bytes: sha256Bytes,
    hexToBytes: hexToBytes,
    bytesToHex: bytesToHex,
    leafHash: leafHash,
    buildLevels: buildLevels,
    merkleRoot: merkleRoot,
    getPath: getPath,
    verifyPath: verifyPath,
    validateManifest: validateManifest,
    manifestContentHash: manifestContentHash,
    makeReceipt: makeReceipt,
    verifyReceiptChain: verifyReceiptChain,
    brierScore: brierScore,
    brierByType: brierByType
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
