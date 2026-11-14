/* PMLA Memory Loop Lab: core logic.
 * SIMULATION. Reference implementation only. Not the production PMLA engine.
 *
 * SOURCING, stated plainly:
 * - SHA-256, UTF-8 encoder, canonical JSON, receipt v1.0 (buildReceipt,
 *   hashReceipt, verifyReceipt, verifyChain), GENESIS first prev hash:
 *   copied VERBATIM from the live governance-loop demo
 *   (https://neuruhai.github.io/neuruh-demos/governance-loop/governance-loop.js),
 *   which states it is verbatim from the land-report store. No retyping.
 * - Write-gate constants, validate, evaluateWrite, illustrative thresholds
 *   (ev below 3 REJECT, contradicts QUARANTINE, ev below 6 QUARANTINE,
 *   else WRITE): adapted from the live memory-gate demo
 *   (https://neuruhai.github.io/neuruh-demos/memory-gate/write-gate.js).
 *   The JGI paper gives no numeric thresholds; these are labeled
 *   ILLUSTRATIVE everywhere they appear, never paper rules. The dead
 *   inference branch the memory-gate demo removed stays removed here.
 * - Decay formula F(t) = 2^(-t/h) and the five half-life presets
 *   (runtime 0.0167d, repo 0.5d, lead 7d, strategy 30d, historical 365d):
 *   from the live memory-gate demo decay.js (JGI Section 35). The paper
 *   names the domains only by example; the preset values are the Memory
 *   Workbench demo presets.
 * - NEW here (my design, labeled NEW): the 5-block prompt parser/builder,
 *   the prompt library (facts verbatim from the content bank, cited per
 *   prompt; assembly is mine), the session memory store, the loop runner
 *   (runTurn), and the decay step-by-step breakdown.
 *
 * The 5-block structure (Identity, Context, History, Rules, Handoff) is
 * the registry-stated PMLA protocol structure: Notion IP Registry
 * AI-PT-010, per vault 01-Core-Architecture/PMLA.md and the court verdict
 * in 00-Collisions/Collision - PMLA.md (2026-11-09).
 *
 * No dollar valuations anywhere. No owner or property PII. No data leaves
 * the page: the store lives in page memory for the session only.
 *
 * UMD: same file loads in Node (require) and in the browser
 * (window.PmlaLoop). The browser verify path uses Web Crypto independently
 * of the pure-JS SHA-256 used to seal receipts; Node tests use node crypto
 * as the independent check on both.
 */
(function (root, factory) {
  if (typeof module === "object" && module !== null && module.exports) {
    module.exports = factory();
  } else {
    root.PmlaLoop = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- SHA-256 (pure JS, VERBATIM from governance-loop.js) ---------- */
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, mw = mp(2, 32), i, j, result = "";
    var words = [], bitLen = ascii.length * 8;
    var hash = sha256.h = sha256.h || [], k = sha256.k = sha256.k || [];
    var pc = k.length, isC = {};
    for (var cand = 2; pc < 64; cand++) {
      if (!isC[cand]) {
        for (i = 0; i < 313; i += cand) isC[i] = cand;
        hash[pc] = (mp(cand, 0.5) * mw) | 0;
        k[pc++] = (mp(cand, 1 / 3) * mw) | 0;
      }
    }
    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return null;
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (bitLen / mw) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
          + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? "0" : "") + b.toString(16);
    }
    return result;
  }

  function toUtf8(str) {
    var out = "";
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) out += str.charAt(i);
      else if (c < 2048) out += String.fromCharCode((c >> 6) | 192, (c & 63) | 128);
      else if (c < 55296 || c > 57343) out += String.fromCharCode((c >> 12) | 224, ((c >> 6) & 63) | 128, (c & 63) | 128);
      else {
        i++; var c2 = str.charCodeAt(i);
        var cp = 0x10000 + (((c & 0x3FF) << 10) | (c2 & 0x3FF));
        out += String.fromCharCode((cp >> 18) | 240, ((cp >> 12) & 63) | 128, ((cp >> 6) & 63) | 128, (cp & 63) | 128);
      }
    }
    return out;
  }

  function hashStr(s) { return sha256(toUtf8(s)); }

  /* canonical JSON: sorted keys, arrays in order (VERBATIM from governance-loop.js) */
  function canonical(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
    return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + canonical(v[k]); }).join(",") + "}";
  }

  var GENESIS = "GENESIS";
  var RECEIPT_VERSION = "1.0";

  function deepCopy(v) { return JSON.parse(JSON.stringify(v)); }

  /* ---------- receipt v1.0 (VERBATIM from governance-loop.js) ---------- */
  function buildReceipt(opts) {
    var o = opts || {};
    var receipt = {
      receipt_version: RECEIPT_VERSION,
      type: o.type || "event",
      seq: o.seq || 0,
      payload: o.payload || {},
      provenance: {
        report_hash_sha256: null,
        timestamp_utc: o.timestamp_utc || new Date().toISOString(),
        prev_receipt_hash: (o.prevHash === undefined || o.prevHash === null) ? GENESIS : o.prevHash
      }
    };
    var forHash = deepCopy(receipt);
    delete forHash.provenance.report_hash_sha256;
    receipt.provenance.report_hash_sha256 = hashStr(canonical(forHash));
    return receipt;
  }

  /* Recompute the hash of a sealed receipt. Returns null when malformed. */
  function hashReceipt(receipt) {
    try {
      var forHash = deepCopy(receipt);
      if (!forHash.provenance) return null;
      delete forHash.provenance.report_hash_sha256;
      return hashStr(canonical(forHash));
    } catch (e) {
      return null;
    }
  }

  function verifyReceipt(receipt) {
    if (!receipt || typeof receipt !== "object") return { ok: false, error: "not an object" };
    if (receipt.receipt_version !== RECEIPT_VERSION) return { ok: false, error: "bad receipt_version: " + receipt.receipt_version };
    if (!receipt.provenance || typeof receipt.provenance.report_hash_sha256 !== "string") return { ok: false, error: "missing report_hash_sha256" };
    if (typeof receipt.provenance.prev_receipt_hash !== "string") return { ok: false, error: "missing prev_receipt_hash" };
    var recomputed = hashReceipt(receipt);
    if (recomputed === null) return { ok: false, error: "unhashable receipt" };
    if (recomputed !== receipt.provenance.report_hash_sha256) return { ok: false, error: "hash mismatch: stored " + receipt.provenance.report_hash_sha256.slice(0, 12) + " recomputed " + recomputed.slice(0, 12) };
    return { ok: true, error: null };
  }

  function verifyChain(receipts) {
    var errors = [];
    if (!Array.isArray(receipts) || receipts.length === 0) {
      return { ok: false, errors: ["empty ledger"] };
    }
    receipts.forEach(function (r, i) {
      var v = verifyReceipt(r);
      if (!v.ok) errors.push("receipt " + i + ": " + v.error);
      if (i === 0) {
        if (r.provenance && r.provenance.prev_receipt_hash !== GENESIS) {
          errors.push("receipt 0: first prev hash must be GENESIS, got " + r.provenance.prev_receipt_hash);
        }
      } else {
        var prevHash = receipts[i - 1].provenance && receipts[i - 1].provenance.report_hash_sha256;
        if (r.provenance && r.provenance.prev_receipt_hash !== prevHash) {
          errors.push("receipt " + i + ": broken link, prev " + String(r.provenance.prev_receipt_hash).slice(0, 12) + " does not match receipt " + (i - 1) + " hash " + String(prevHash).slice(0, 12));
        }
      }
    });
    return { ok: errors.length === 0, errors: errors };
  }

  /* ---------- decay (JGI Section 35, from memory-gate decay.js) ---------- */
  /* Paper formula: F(t) = 2^(-t/h), t age and h half-life, both in days.
   * The paper names the domains only by example. The half-life values
   * below are the presets from the Memory Workbench demo. */
  var DECAY_PRESETS = {
    runtime:    { key: "runtime",    label: "Runtime state: minutes",        halfLifeDays: 0.0167 },
    repo:       { key: "repo",       label: "Repo state: hours",             halfLifeDays: 0.5 },
    lead:       { key: "lead",       label: "Lead state: days",              halfLifeDays: 7 },
    strategy:   { key: "strategy",   label: "Business strategy: weeks",      halfLifeDays: 30 },
    historical: { key: "historical", label: "Historical fact: years",        halfLifeDays: 365 }
  };

  function decay(t, h) {
    if (typeof t !== "number" || !isFinite(t) || t < 0) {
      throw new Error("decay: age t must be a finite number >= 0 (days)");
    }
    if (typeof h !== "number" || !isFinite(h) || h <= 0) {
      throw new Error("decay: half-life h must be a finite number > 0 (days)");
    }
    return Math.pow(2, -t / h);
  }

  function decayWithPreset(t, presetKey) {
    var preset = DECAY_PRESETS[presetKey];
    if (!preset) {
      throw new Error("decayWithPreset: unknown preset '" + presetKey + "'");
    }
    return decay(t, preset.halfLifeDays);
  }

  /* NEW (my design): step-by-step decay breakdown for the calculator.
   * Returns the inputs, the exponent, the retention, the percent, and a
   * five-point table (t = 0, h/2, h, 2h, 4h). Throws on bad input via decay(). */
  function decaySteps(t, presetKey) {
    var preset = DECAY_PRESETS[presetKey];
    if (!preset) {
      throw new Error("decaySteps: unknown preset '" + presetKey + "'");
    }
    var h = preset.halfLifeDays;
    var f = decay(t, h);
    var exponent = -t / h;
    var points = [0, h / 2, h, 2 * h, 4 * h].map(function (tt) {
      return { t: tt, f: decay(tt, h) };
    });
    return {
      presetKey: presetKey,
      presetLabel: preset.label,
      t: t,
      h: h,
      exponent: exponent,
      f: f,
      percent: f * 100,
      table: points
    };
  }

  /* ---------- write gate (JGI Section 34, from memory-gate write-gate.js) ---------- */
  /* THE PAPER GIVES NO NUMERIC THRESHOLDS. The rule below is an
   * ILLUSTRATIVE implementation of the paper's concept, not a formula
   * from the paper. Thresholds: evidence < 3 REJECT, contradiction
   * QUARANTINE, evidence < 6 QUARANTINE, else WRITE. */
  var MEMORY_CLASSES = [
    "Working", "Episodic", "Semantic", "Procedural",
    "Negative", "Strategic", "Capability", "Epistemic"
  ];
  var FRESHNESS_VALUES = ["Minutes", "Hours", "Days", "Weeks", "Months", "Years"];
  var CONFLICT_VALUES = ["none", "contradicts", "supersedes"];
  var KIND_VALUES = ["Fact", "Inference"];
  var MUTABILITY_VALUES = ["Immutable history", "Editable current state"];

  var ILLUSTRATIVE_THRESHOLDS = { rejectBelow: 3, quarantineBelow: 6 };
  var THRESHOLD_NOTE =
    "Illustrative thresholds only: the JGI paper gives no numeric " +
    "thresholds. REJECT below 3, QUARANTINE below 6, else WRITE.";

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function validate(input) {
    var problems = [];
    if (!input || typeof input !== "object") {
      return ["input must be an object answering the eight gate questions"];
    }
    if (MEMORY_CLASSES.indexOf(input.memoryClass) === -1) {
      problems.push("memoryClass must be one of: " + MEMORY_CLASSES.join(", "));
    }
    if (!isNonEmptyString(input.source)) {
      problems.push("source must be a non-empty string");
    }
    if (!isNonEmptyString(input.freshness) || FRESHNESS_VALUES.indexOf(input.freshness) === -1) {
      problems.push("freshness must be one of: " + FRESHNESS_VALUES.join(", "));
    }
    if (typeof input.evidence !== "number" || !isFinite(input.evidence) ||
        input.evidence < 0 || input.evidence > 10) {
      problems.push("evidence (confidence) must be a number from 0 to 10");
    }
    if (CONFLICT_VALUES.indexOf(input.contradiction) === -1) {
      problems.push("contradiction must be one of: " + CONFLICT_VALUES.join(", "));
    }
    if (!isNonEmptyString(input.relevanceHorizon)) {
      problems.push("relevanceHorizon must be a non-empty string");
    }
    if (KIND_VALUES.indexOf(input.kind) === -1) {
      problems.push("kind must be one of: " + KIND_VALUES.join(", "));
    }
    if (MUTABILITY_VALUES.indexOf(input.mutability) === -1) {
      problems.push("mutability must be one of: " + MUTABILITY_VALUES.join(", "));
    }
    return problems;
  }

  function evaluateWrite(input) {
    var problems = validate(input);
    if (problems.length > 0) {
      return {
        verdict: "REJECT",
        reasons: ["Gate input invalid: " + problems.join("; ")],
        input: input || null,
        illustrative: true,
        thresholdNote: THRESHOLD_NOTE
      };
    }
    var ev = input.evidence;
    var reasons = [];
    var verdict;
    if (ev < ILLUSTRATIVE_THRESHOLDS.rejectBelow) {
      verdict = "REJECT";
      reasons.push("Evidence strength " + ev + " is below " + ILLUSTRATIVE_THRESHOLDS.rejectBelow + ". Insufficient evidence to write.");
    } else if (input.contradiction === "contradicts") {
      verdict = "QUARANTINE";
      reasons.push("Contradicts an existing memory. Held for resolution under Section 38 before any write.");
    } else if (ev < ILLUSTRATIVE_THRESHOLDS.quarantineBelow) {
      verdict = "QUARANTINE";
      reasons.push("Evidence strength " + ev + " is below " + ILLUSTRATIVE_THRESHOLDS.quarantineBelow + ". Held for corroboration.");
    } else {
      verdict = "WRITE";
      reasons.push(
        "Evidence strength " + ev + ", no contradiction, " +
        input.kind.toLowerCase() + " accepted as " + input.mutability.toLowerCase() + "."
      );
      if (input.contradiction === "supersedes") {
        reasons.push("Supersedes an existing memory; the superseded record is retained as history, not deleted.");
      }
    }
    return {
      verdict: verdict,
      reasons: reasons,
      input: {
        memoryClass: input.memoryClass,
        source: input.source,
        freshness: input.freshness,
        evidence: ev,
        contradiction: input.contradiction,
        relevanceHorizon: input.relevanceHorizon,
        kind: input.kind,
        mutability: input.mutability
      },
      illustrative: true,
      thresholdNote: THRESHOLD_NOTE
    };
  }

  /* ---------- NEW: 5-block PMLA prompts ---------- */
  /* The 5-block structure (Identity, Context, History, Rules, Handoff)
   * is the registry-stated PMLA protocol structure (Notion IP Registry
   * AI-PT-010, per vault CORE-003 and the 2026-11-09 court verdict).
   * The parser and builder below are my implementation of that stated
   * structure, not a paper claim. */
  var BLOCKS = ["Identity", "Context", "History", "Rules", "Handoff"];

  function parseBlocks(promptText) {
    var blocks = {};
    BLOCKS.forEach(function (b) { blocks[b] = ""; });
    var found = [];
    var text = (typeof promptText === "string") ? promptText : "";
    var lines = text.split(/\r?\n/);
    var current = null;
    lines.forEach(function (line) {
      var m = line.match(/^##\s+(.+?)\s*$/);
      if (m) {
        var name = null;
        BLOCKS.forEach(function (b) {
          if (b.toLowerCase() === m[1].toLowerCase()) name = b;
        });
        current = name;
        if (name && found.indexOf(name) === -1) found.push(name);
        return;
      }
      if (current) {
        blocks[current] = blocks[current] ? blocks[current] + "\n" + line : line;
      }
    });
    BLOCKS.forEach(function (b) { blocks[b] = blocks[b].trim(); });
    var missing = BLOCKS.filter(function (b) { return found.indexOf(b) === -1; });
    return {
      blocks: blocks,
      found: found,
      missing: missing,
      hasHeadings: found.length > 0,
      structured: found.length === BLOCKS.length
    };
  }

  function buildPrompt(blocks) {
    var b = blocks || {};
    return BLOCKS.map(function (name) {
      return "## " + name + "\n" + (b[name] || "");
    }).join("\n\n");
  }

  /* NEW: prompt library. Each Context carries one bank fact VERBATIM with
   * its bank item cited. The Identity, History, Rules, and Handoff text
   * is assembled for this demo (mine, labeled on the page). The 5-block
   * shape is the registry-stated AI-PT-010 structure. */
  var LIBRARY = [
    {
      id: "L1",
      title: "Framework catalog (bank item 19)",
      bankItem: 19,
      bankRef: "content-bank.md item 19",
      fact: "31 named frameworks in the agent catalog: PMLA, SAL, DIMEA 2.0, Master Command Protocol, etc.",
      blocks: {
        Identity: "PMLA memory loop lab. You are the loop operator, running one prompt through the memory loop.",
        Context: "31 named frameworks in the agent catalog: PMLA, SAL, DIMEA 2.0, Master Command Protocol, etc.",
        History: "No prior turns stored in this session. This is the first loop turn for this fact.",
        Rules: "Retain only what passes the write gate. Never invent a fact that is not in the Context block.",
        Handoff: "Store this prompt if the gate writes it, so the next turn recalls it instead of starting blank."
      }
    },
    {
      id: "L2",
      title: "Atomic agent model (bank item 20)",
      bankItem: 20,
      bankRef: "content-bank.md item 20",
      fact: "Atomic agent model: Protons (core logic), Neutrons (data stability), Electrons (tool execution).",
      blocks: {
        Identity: "PMLA memory loop lab. You are the loop operator, running one prompt through the memory loop.",
        Context: "Atomic agent model: Protons (core logic), Neutrons (data stability), Electrons (tool execution).",
        History: "No prior turns stored in this session. This is the first loop turn for this fact.",
        Rules: "Retain only what passes the write gate. Never invent a fact that is not in the Context block.",
        Handoff: "Store this prompt if the gate writes it, so the next turn recalls it instead of starting blank."
      }
    },
    {
      id: "L3",
      title: "Recipe system (bank item 9)",
      bankItem: 9,
      bankRef: "content-bank.md item 9",
      fact: "Recipe system: 30 canonical recipe families (R1-R30), 36 rows in live Supabase registry, 4 active hunt recipes.",
      blocks: {
        Identity: "PMLA memory loop lab. You are the loop operator, running one prompt through the memory loop.",
        Context: "Recipe system: 30 canonical recipe families (R1-R30), 36 rows in live Supabase registry, 4 active hunt recipes.",
        History: "No prior turns stored in this session. This is the first loop turn for this fact.",
        Rules: "Retain only what passes the write gate. Never invent a fact that is not in the Context block.",
        Handoff: "Store this prompt if the gate writes it, so the next turn recalls it instead of starting blank."
      }
    },
    {
      id: "L4",
      title: "LANDOS hunt receipt (bank item 10)",
      bankItem: 10,
      bankRef: "content-bank.md item 10",
      fact: "LANDOS hunt 6071b7ad: 153 leads scored, 153 updated, 153 IDs synced, zero new minted.",
      blocks: {
        Identity: "PMLA memory loop lab. You are the loop operator, running one prompt through the memory loop.",
        Context: "LANDOS hunt 6071b7ad: 153 leads scored, 153 updated, 153 IDs synced, zero new minted.",
        History: "No prior turns stored in this session. This is the first loop turn for this fact.",
        Rules: "Retain only what passes the write gate. Never invent a fact that is not in the Context block.",
        Handoff: "Store this prompt if the gate writes it, so the next turn recalls it instead of starting blank."
      }
    }
  ];

  function libraryPrompt(id) {
    var found = null;
    LIBRARY.forEach(function (entry) {
      if (entry.id === id) found = entry;
    });
    if (!found) return null;
    return {
      id: found.id,
      title: found.title,
      bankItem: found.bankItem,
      bankRef: found.bankRef,
      fact: found.fact,
      text: buildPrompt(found.blocks)
    };
  }

  /* ---------- NEW: session memory store and loop runner ---------- */
  /* The store lives in page memory only. Reset creates a fresh store;
   * nothing is persisted, nothing leaves the page. */
  function createStore() {
    return { turn: 0, entries: [], receipts: [], current: null };
  }

  function storeState(store) {
    if (!store || store.entries.length === 0) return "STORE: empty, 0 written";
    return "STORE: " + store.entries.length + " written, current is turn " + store.current.turn;
  }

  /* Run one loop turn. Steps, in order:
   * 1. PROMPT: the submitted text, parsed into the 5 blocks.
   * 2. WRITE GATE: illustrative gate verdict on the eight questions.
   * 3. MEMORY STORE: WRITE stores the prompt; REJECT and QUARANTINE do not.
   * 4. RECALL: what this turn recalled at its start (the stored prompt
   *    from the previous written turn, or nothing), and what the next
   *    turn will recall (this turn's stored prompt, or nothing new).
   * 5. REFINE: the stored prompt is loaded for editing; the user edits
   *    and runs the next turn. (The page performs the load; the runner
   *    reports what is available to refine.)
   * Every turn seals one receipt v1.0, chained to the previous receipt
   * hash, GENESIS first. */
  function runTurn(store, input) {
    var s = store || createStore();
    var i = input || {};
    var promptText = (typeof i.prompt === "string") ? i.prompt : "";
    s.turn += 1;
    var turn = s.turn;
    var recalledAtStart = s.current
      ? { turn: s.current.turn, prompt: s.current.prompt }
      : null;
    var parsed = parseBlocks(promptText);
    var gate = evaluateWrite(i.gate || {});
    var stored = gate.verdict === "WRITE";
    var entry = null;
    if (stored) {
      entry = { turn: turn, prompt: promptText, blocks: parsed.blocks, gateVerdict: gate.verdict };
      s.entries.push(entry);
      s.current = entry;
    }
    var prevHash = s.receipts.length === 0
      ? GENESIS
      : s.receipts[s.receipts.length - 1].provenance.report_hash_sha256;
    var receipt = buildReceipt({
      type: "pmla-memory-loop",
      seq: turn,
      payload: {
        turn: turn,
        prompt: promptText,
        prompt_blocks: parsed.blocks,
        blocks_found: parsed.found,
        gate_verdict: gate.verdict,
        gate_reasons: gate.reasons,
        stored: stored,
        store_count: s.entries.length,
        recalled_from_turn: recalledAtStart ? recalledAtStart.turn : null
      },
      prevHash: prevHash,
      timestamp_utc: i.timestamp_utc || undefined
    });
    s.receipts.push(receipt);
    return {
      turn: turn,
      prompt: promptText,
      parsed: parsed,
      recalledAtStart: recalledAtStart,
      gate: gate,
      stored: stored,
      storeCount: s.entries.length,
      storeState: storeState(s),
      willRecallNext: stored ? { turn: turn, prompt: promptText } : null,
      receipt: receipt,
      receiptId: "pmla-20261114-" + ("0000" + turn).slice(-4)
    };
  }

  return {
    GENESIS: GENESIS,
    RECEIPT_VERSION: RECEIPT_VERSION,
    sha256: sha256,
    toUtf8: toUtf8,
    hashStr: hashStr,
    canonical: canonical,
    buildReceipt: buildReceipt,
    hashReceipt: hashReceipt,
    verifyReceipt: verifyReceipt,
    verifyChain: verifyChain,
    DECAY_PRESETS: DECAY_PRESETS,
    decay: decay,
    decayWithPreset: decayWithPreset,
    decaySteps: decaySteps,
    MEMORY_CLASSES: MEMORY_CLASSES,
    FRESHNESS_VALUES: FRESHNESS_VALUES,
    CONFLICT_VALUES: CONFLICT_VALUES,
    KIND_VALUES: KIND_VALUES,
    MUTABILITY_VALUES: MUTABILITY_VALUES,
    ILLUSTRATIVE_THRESHOLDS: ILLUSTRATIVE_THRESHOLDS,
    THRESHOLD_NOTE: THRESHOLD_NOTE,
    validate: validate,
    evaluateWrite: evaluateWrite,
    BLOCKS: BLOCKS,
    parseBlocks: parseBlocks,
    buildPrompt: buildPrompt,
    LIBRARY: LIBRARY,
    libraryPrompt: libraryPrompt,
    createStore: createStore,
    storeState: storeState,
    runTurn: runTurn
  };
});
