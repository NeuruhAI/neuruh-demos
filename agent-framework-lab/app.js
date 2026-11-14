/* A.G.E.N.T. Framework Lab: pure logic.
   Usable in the browser and in Node (the test file requires it).
   No em dashes anywhere in this file.
   Every stated fact below comes from the vault dossier MTH-001, the
   collision note COLL-AGENT, or the three IP Registry rows. Anything
   marked LAB DESIGN is this lab's own rubric, not a source claim. */

/* The five letters, Meaning 1 (registry canonical expansion).
   Source: IP Registry rows CORE-FW-AGENT-1.0-GA, AI-FW-AGENT-001, AI-FW-211.
   AI-FW-211 spells N as Niche-Tuned and T as Tools-for-growth; the
   other two rows spell them Niche and Tools. Both wordings are shown. */
var LETTERS = [
  { letter: "A", name: "Auto-bundled", alt: null,
    gloss: "The agent ships with its tools bundled, not assembled later." },
  { letter: "G", name: "Generative", alt: null,
    gloss: "The stack generates from one input file." },
  { letter: "E", name: "Execution-ready", alt: null,
    gloss: "The stack is deployable with a deployment path, not a draft." },
  { letter: "N", name: "Niche", alt: "Niche-Tuned",
    gloss: "Built for one niche vertical, not generic." },
  { letter: "T", name: "Tools", alt: "Tools-for-growth",
    gloss: "Tools for growth ship in the bundle." }
];

/* The seven stack components of AI-FW-211: one input file becomes a
   complete deployable agent stack made of these seven parts.
   Source: IP Registry row AI-FW-211, Description field, verbatim list. */
var COMPONENTS = [
  { id: "gpt", label: "Public GPT" },
  { id: "memory", label: "Memory file" },
  { id: "ui", label: "Branded UI" },
  { id: "crm", label: "CRM / Sheet / Notion integration" },
  { id: "leads", label: "Lead forms" },
  { id: "email", label: "Email follow-ups" },
  { id: "spawn", label: "Spawn triggers" }
];

/* The six sample verticals filed on AI-FW-211. Source: same row. */
var VERTICALS = ["HVAC", "Estate Sales", "Resale", "Real Estate", "Defense", "Creative"];

/* The five AaaS platform parts named on AI-FW-211.
   Source: IP Registry row AI-FW-211, Description field. */
var AAAS_PARTS = [
  "Agent Constructor",
  "Self-Evolving Memory",
  "Feedback Learning Loop",
  "Franchise Kit Generator",
  "Explore Optimizer"
];

/* LAB DESIGN: how each letter is checked against the selected stack.
   No source states a scoring rule or thresholds. This rubric is the
   lab's own design, labeled as such on the page.
   A: bundle completeness = selected components / 7.
   G: generative pair = public GPT + memory file. Both = 1, one = 0.5, none = 0.
   E: execution path = CRM integration + lead forms + spawn triggers. Score = count / 3.
   N: niche = 1 when a stated sample vertical is picked, else 0.
   T: tools for growth = email follow-ups + spawn triggers + CRM integration. Score = count / 3.
   Each letter returns { letter, name, score, detail, status }.
   Status bands (lab design): score 1 = PASS, 0.5 to under 1 = PARTIAL, below 0.5 = FAIL. */
function letterChecks(selectedIds, vertical) {
  var selected = {};
  (selectedIds || []).forEach(function (id) { selected[id] = true; });
  var total = COMPONENTS.length;
  var count = 0;
  COMPONENTS.forEach(function (c) { if (selected[c.id]) { count += 1; } });

  var gCount = (selected.gpt ? 1 : 0) + (selected.memory ? 1 : 0);
  var gScore = gCount === 2 ? 1 : (gCount === 1 ? 0.5 : 0);

  var eParts = ["crm", "leads", "spawn"];
  var eCount = 0;
  eParts.forEach(function (id) { if (selected[id]) { eCount += 1; } });

  var tParts = ["email", "spawn", "crm"];
  var tCount = 0;
  tParts.forEach(function (id) { if (selected[id]) { tCount += 1; } });

  var nScore = (vertical && VERTICALS.indexOf(vertical) !== -1) ? 1 : 0;

  var raw = [
    { letter: "A", name: "Auto-bundled", score: total === 0 ? 0 : count / total,
      detail: count + " of " + total + " stack components selected." },
    { letter: "G", name: "Generative", score: gScore,
      detail: gCount + " of 2 generative parts selected (public GPT, memory file)." },
    { letter: "E", name: "Execution-ready", score: eCount / 3,
      detail: eCount + " of 3 execution-path parts selected (CRM integration, lead forms, spawn triggers)." },
    { letter: "N", name: "Niche", score: nScore,
      detail: nScore === 1 ? ("Vertical picked: " + vertical + " (one of the 6 stated sample verticals).")
                           : "No stated sample vertical picked." },
    { letter: "T", name: "Tools", score: tCount / 3,
      detail: tCount + " of 3 tools-for-growth parts selected (email follow-ups, spawn triggers, CRM integration)." }
  ];
  return raw.map(function (r) {
    r.status = r.score === 1 ? "PASS" : (r.score >= 0.5 ? "PARTIAL" : "FAIL");
    return r;
  });
}

/* LAB DESIGN: overall bundle score is the plain mean of the five
   letter scores, shown as a percent. Verdict bands are the lab's own. */
function bundleScore(checks) {
  if (!checks || checks.length === 0) { return { error: "No letter checks to score." }; }
  var sum = 0;
  checks.forEach(function (c) { sum += c.score; });
  var mean = sum / checks.length;
  var percent = Math.round(mean * 1000) / 10;
  var verdict;
  if (percent >= 90) { verdict = "Complete stack"; }
  else if (percent >= 70) { verdict = "Shippable with gaps"; }
  else if (percent >= 50) { verdict = "Partial bundle"; }
  else { verdict = "Not execution-ready"; }
  return { mean: mean, percent: percent, verdict: verdict };
}

/* Canonical JSON: keys sorted recursively, arrays kept in order.
   Used for receipt hashing. The hash field is stripped before hashing. */
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

/* Build the receipt object without its hash. The caller hashes
   canonicalStringify(stripHash(receipt)) and sets receipt.hash. */
function buildReceiptObject(id, vertical, selectedIds, checks, result, prevHash, issuedAt) {
  return {
    format: "receipt-v1.0",
    id: id,
    lab: "agent-framework-lab",
    framework: "A.G.E.N.T. Framework",
    framework_tier: "UNKNOWN (not stated; not listed in the Framework Atlas)",
    simulation: true,
    issued_at: issuedAt,
    prev_hash: prevHash,
    input: { vertical: vertical, components: selectedIds.slice().sort() },
    letters: checks.map(function (c) {
      return { letter: c.letter, name: c.name, score: c.score, status: c.status };
    }),
    result: { percent: result.percent, verdict: result.verdict }
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LETTERS: LETTERS,
    COMPONENTS: COMPONENTS,
    VERTICALS: VERTICALS,
    AAAS_PARTS: AAAS_PARTS,
    letterChecks: letterChecks,
    bundleScore: bundleScore,
    canonicalStringify: canonicalStringify,
    stripHash: stripHash,
    buildReceiptObject: buildReceiptObject
  };
}
