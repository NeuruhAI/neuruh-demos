/* NCP Lab: pure logic for the Neuruh Cognitive Platform demo.
   Usable in the browser and in Node (the test file requires it).
   No em dashes anywhere in this file.
   All stated NCP facts come from the sources listed in index.html.
   Everything marked LAB DESIGN is this demo's own choice, not a paper claim. */

/* --- Stated constants (source: Ecosystem Codex NRH-DOC-CODEX-001 rev A,
   Volume III, and the Framework Atlas entry for NCP) --- */
var SOURCE_ATOMIC_NODE_COUNT = 1890; /* stated Phase 1 AtomicNode count */
var SOURCE_BYPASS_PCT = 98; /* stated 98 percent LLM-bypass claim, source claim only */
var PIN_THRESHOLD = 3.0; /* stated in the AXON Lattice Substrate transcript */
var ORGAN_THRESHOLD = 6.0; /* stated in the AXON Lattice Substrate transcript */

/* --- LAB DESIGN: the demo models a small lattice, not the stated 1,890 nodes.
   A 24-node model keeps every node visible on one screen. The stated count
   (1,890) is shown on the page and is never claimed to be simulated here. --- */
var MODEL_NODE_COUNT = 24;
var MODEL_ROLES = ["SIGNAL", "VALUATION", "CLOSE", "INGEST", "SCORE", "DISPATCH"];

/* --- LAB DESIGN: stated conditional shortcuts, from the AXON Lattice
   Substrate transcript. The transcript states these two condition tags:
   a resale jump SIGNAL to CLOSE when the signal is "price_delta over 40%",
   and a real-estate jump VALUATION to CLOSE when the buyer is
   "standing cash". The demo fires them on those exact phrases. --- */
var CONDITIONAL_SHORTCUTS = [
  { from: "SIGNAL", to: "CLOSE", condition: "price_delta over 40%", label: "Resale: SIGNAL to CLOSE" },
  { from: "VALUATION", to: "CLOSE", condition: "standing cash", label: "Real estate: VALUATION to CLOSE" }
];

/* Phase 2 modules, stated in the codex. All are SPECCED, not compiled. */
var PHASE2_MODULES = [
  { name: "PHALANX", state: "SPECCED, not compiled" },
  { name: "SYMBIOTE", state: "SPECCED, not compiled" },
  { name: "UIR", state: "SPECCED, not compiled" },
  { name: "Firecracker Micro-VMs", state: "SPECCED, not compiled" }
];

/* --- Canonical JSON: keys sorted recursively, arrays kept in order.
   Used for receipt hashing. The hash field is stripped before hashing. --- */
function canonicalStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalStringify).join(",") + "]";
  }
  var keys = Object.keys(value).sort();
  var parts = keys.map(function (k) {
    return JSON.stringify(k) + ":" + canonicalStringify(value[k]);
  });
  return "{" + parts.join(",") + "}";
}

function stripHash(obj) {
  var copy = {};
  Object.keys(obj).forEach(function (k) {
    if (k !== "hash") { copy[k] = obj[k]; }
  });
  return copy;
}

/* --- FNV-1a 32-bit hash. LAB DESIGN: the demo's deterministic way to map a
   task string onto a model node. The real router's mapping is not stated
   in any source read, so this demo does not claim to reproduce it. --- */
function fnv1a(str) {
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function normalizeTask(text) {
  return String(text).trim().toLowerCase().replace(/\s+/g, " ");
}

/* Build the fresh model lattice: 24 nodes, roles cycling in fixed order. */
function makeNodeModel() {
  var nodes = [];
  for (var i = 0; i < MODEL_NODE_COUNT; i++) {
    nodes.push({
      id: "N-" + String(i + 1).padStart(3, "0"),
      index: i,
      role: MODEL_ROLES[i % MODEL_ROLES.length],
      heat: 0,
      pinned: false,
      organ_candidate: false,
      distinct_tasks: []
    });
  }
  return nodes;
}

/* Fresh router session state. */
function makeSession() {
  return {
    nodes: makeNodeModel(),
    seen: {}, /* normalized task text -> node id (the Shortcut Edge Layer) */
    routed: 0,
    bypassed: 0,
    receipts: 0
  };
}

/* Find the conditional shortcut whose condition phrase appears in the task.
   Returns the shortcut object or null. Matching is case-insensitive. */
function findConditionalShortcut(taskText) {
  var lower = String(taskText).toLowerCase();
  for (var i = 0; i < CONDITIONAL_SHORTCUTS.length; i++) {
    if (lower.indexOf(CONDITIONAL_SHORTCUTS[i].condition) !== -1) {
      return CONDITIONAL_SHORTCUTS[i];
    }
  }
  return null;
}

/* Route one task through the model Convergence Router.
   Returns { error } on empty input, else a result with a step-by-step log.
   Steps mirror the stated loop: route, log, heat, mint, bloom, repeat. */
function routeTask(session, taskText) {
  var task = normalizeTask(taskText);
  if (!task) {
    return { error: "Enter a task first. An empty task routes nowhere." };
  }
  var steps = [];
  var shortcut = findConditionalShortcut(task);
  var selHit = Object.prototype.hasOwnProperty.call(session.seen, task);
  var nodeIndex = fnv1a(task) % MODEL_NODE_COUNT;
  var node = session.nodes[nodeIndex];

  steps.push({ n: 1, name: "Normalize task", detail: "Task text lowercased and collapsed to \"" + task + "\"." });
  steps.push({ n: 2, name: "Hash to node", detail: "FNV-1a hash " + fnv1a(task) + " mod " + MODEL_NODE_COUNT + " = index " + nodeIndex + ", node " + node.id + " (" + node.role + "). LAB DESIGN hash mapping." });

  var bypassed = false;
  var shortcutFired = null;
  if (selHit) {
    steps.push({ n: 3, name: "Shortcut Edge Layer lookup", detail: "HIT. This exact task was routed before, to " + session.seen[task] + ". The learned shortcut fires first, before any fresh lookup." });
    bypassed = true;
  } else {
    steps.push({ n: 3, name: "Shortcut Edge Layer lookup", detail: "MISS. No learned shortcut exists for this task yet. The router proceeds to the fresh lookup." });
    session.seen[task] = node.id;
  }

  if (shortcut) {
    steps.push({ n: 4, name: "Conditional shortcut", detail: shortcut.label + ": condition \"" + shortcut.condition + "\" holds, so the router jumps " + shortcut.from + " to " + shortcut.to + " without an LLM call. Stated in the lattice transcript." });
    shortcutFired = shortcut.label;
    bypassed = true;
  } else {
    steps.push({ n: 4, name: "Conditional shortcut", detail: "None. No stated condition phrase appears in this task." });
  }

  var heatBefore = node.heat;
  node.heat = Math.round((node.heat + 1) * 10) / 10;
  if (node.distinct_tasks.indexOf(task) === -1) {
    node.distinct_tasks.push(task);
  }
  steps.push({ n: 5, name: "Log and heat", detail: "Route logged. Node " + node.id + " heat " + heatBefore.toFixed(1) + " to " + node.heat.toFixed(1) + ". Distinct tasks through this node: " + node.distinct_tasks.length + "." });

  var pinnedNow = false;
  var organNow = false;
  if (!node.pinned && node.heat >= PIN_THRESHOLD) {
    node.pinned = true;
    pinnedNow = true;
    steps.push({ n: 6, name: "RAM-disk pin", detail: "Heat crossed the pin threshold " + PIN_THRESHOLD.toFixed(1) + ". Node " + node.id + " is pinned to the RAM-disk tier (simulated /dev/shm). Stated threshold, simulated pin." });
  } else if (node.pinned) {
    steps.push({ n: 6, name: "RAM-disk pin", detail: "Node " + node.id + " is already pinned (heat " + node.heat.toFixed(1) + ")." });
  } else {
    steps.push({ n: 6, name: "RAM-disk pin", detail: "Heat " + node.heat.toFixed(1) + " is below the pin threshold " + PIN_THRESHOLD.toFixed(1) + ". Node stays cold." });
  }

  if (!node.organ_candidate && node.heat >= ORGAN_THRESHOLD && node.distinct_tasks.length >= 2) {
    node.organ_candidate = true;
    organNow = true;
    steps.push({ n: 7, name: "Bloom and breadth bar", detail: "Heat crossed the organ threshold " + ORGAN_THRESHOLD.toFixed(1) + " and the breadth bar passed (" + node.distinct_tasks.length + " distinct tasks, need 2). Node " + node.id + " is an organ candidate. Breadth bar is a LAB DESIGN rule; the transcript states the bar exists but does not state its number." });
  } else if (node.organ_candidate) {
    steps.push({ n: 7, name: "Bloom and breadth bar", detail: "Node " + node.id + " is already an organ candidate." });
  } else if (node.heat >= ORGAN_THRESHOLD) {
    steps.push({ n: 7, name: "Bloom and breadth bar", detail: "Heat crossed " + ORGAN_THRESHOLD.toFixed(1) + " but the breadth bar failed (only " + node.distinct_tasks.length + " distinct task, need 2). No bloom. Same task repeated does not widen the organ." });
  } else {
    steps.push({ n: 7, name: "Bloom and breadth bar", detail: "Heat " + node.heat.toFixed(1) + " is below the organ threshold " + ORGAN_THRESHOLD.toFixed(1) + ". No bloom yet." });
  }

  session.routed += 1;
  if (bypassed) { session.bypassed += 1; }
  steps.push({ n: 8, name: "Resolve", detail: bypassed ? "Resolved without an LLM call (shortcut or cache path). This is the Semantic Cache Vault path the source claims bypasses 98 percent of calls." : "Resolved by routing to node " + node.id + ". In the stated system this path may still call the LLM; the demo counts it as a non-bypassed route." });

  return {
    task: task,
    node_id: node.id,
    node_role: node.role,
    node_index: nodeIndex,
    hash: fnv1a(task),
    sel_hit: selHit,
    shortcut_fired: shortcutFired,
    bypassed: bypassed,
    heat_before: heatBefore,
    heat_after: node.heat,
    pinned: node.pinned,
    pinned_now: pinnedNow,
    organ_candidate: node.organ_candidate,
    organ_now: organNow,
    distinct_tasks: node.distinct_tasks.length,
    session_routed: session.routed,
    session_bypassed: session.bypassed,
    steps: steps
  };
}

/* --- LLM-bypass calculator. Mirrors Codex Calculator 1 (Volume III):
   the source claims a 98 percent bypass rate. Inputs are the user's own.
   No money is involved: the output is calls avoided and calls to the LLM. --- */
function bypassCalc(monthlyCalls, pct) {
  var calls = Number(monthlyCalls);
  var p = Number(pct);
  if (!isFinite(calls) || calls < 0 || Math.floor(calls) !== calls) {
    return { error: "Monthly calls must be a whole number, 0 or above." };
  }
  if (!isFinite(p) || p < 0 || p > 100) {
    return { error: "Bypass percent must be a number from 0 to 100." };
  }
  var avoided = Math.round(calls * p / 100);
  var toLlm = calls - avoided;
  return {
    monthly_calls: calls,
    bypass_pct: p,
    calls_avoided: avoided,
    calls_to_llm: toLlm,
    steps: [
      { n: 1, name: "Calls avoided", detail: calls + " x " + p + " / 100 = " + (calls * p / 100) + ", rounded to " + avoided + "." },
      { n: 2, name: "Calls still to the LLM", detail: calls + " - " + avoided + " = " + toLlm + "." },
      { n: 3, name: "Reading", detail: "At the source-claimed 98 percent, " + avoided + " of " + calls + " monthly calls resolve without a model call. The 98 percent figure is a source claim, not verified by this demo." }
    ]
  };
}

/* Build the receipt object without its hash. The caller hashes
   canonicalStringify(stripHash(receipt)) and sets receipt.hash. */
function buildReceiptObject(id, kind, summary, inputs, results, prevHash, issuedAt) {
  return {
    format: "receipt-v1.0",
    demo: "ncp-lab",
    id: id,
    issued_at: issuedAt,
    kind: kind,
    summary: summary,
    inputs: inputs,
    results: results,
    prev_hash: prevHash
  };
}

var NcpLabExports = {
  SOURCE_ATOMIC_NODE_COUNT: SOURCE_ATOMIC_NODE_COUNT,
  SOURCE_BYPASS_PCT: SOURCE_BYPASS_PCT,
  PIN_THRESHOLD: PIN_THRESHOLD,
  ORGAN_THRESHOLD: ORGAN_THRESHOLD,
  MODEL_NODE_COUNT: MODEL_NODE_COUNT,
  MODEL_ROLES: MODEL_ROLES,
  CONDITIONAL_SHORTCUTS: CONDITIONAL_SHORTCUTS,
  PHASE2_MODULES: PHASE2_MODULES,
  canonicalStringify: canonicalStringify,
  stripHash: stripHash,
  fnv1a: fnv1a,
  normalizeTask: normalizeTask,
  makeNodeModel: makeNodeModel,
  makeSession: makeSession,
  findConditionalShortcut: findConditionalShortcut,
  routeTask: routeTask,
  bypassCalc: bypassCalc,
  buildReceiptObject: buildReceiptObject
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = NcpLabExports;
}
if (typeof window !== "undefined") {
  window.NcpLab = NcpLabExports;
}
