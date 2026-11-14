/* Headless tests for the Vault Concept Explorer. No dependencies.
   Run: node test.js (exit 0 = all pass). Tests the same explorer.js the
   browser page loads, against the real concepts.json. */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const VE = require("./explorer.js");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "concepts.json"), "utf8"));

let n = 0;
function check(name, fn) {
  n += 1;
  fn();
  console.log("PASS " + n + ": " + name);
}

/* Data integrity */
check("246 rows, all CENSUS sourced", () => {
  assert.strictEqual(data.length, 246);
  assert.deepStrictEqual(VE.countBySource(data), { CENSUS: 246 });
});
check("no invented rows: every id matches CORE/RE/BIZ/RES/CRE/FND/TAX/DEF/MTH/EXT prefix", () => {
  const ok = new Set(["CORE", "RE", "BIZ", "RES", "CRE", "FND", "TAX", "DEF", "MTH", "EXT"]);
  data.forEach((c) => assert.ok(ok.has(c.id.split("-")[0]), c.id));
});
check("every row has name, section, classification, runtime, vault_path", () => {
  data.forEach((c) => {
    assert.ok(c.name && c.section && c.classification && c.runtime && c.vault_path, c.id);
  });
});
check("per-section counts match the Vault Overview", () => {
  const by = VE.countBySection(data);
  assert.deepStrictEqual(by, {
    "Core / Architecture": 62,
    "Real Estate / Land": 40,
    "Business / Operator AI": 20,
    "Resale / Collectibles / Equipment": 12,
    "Creator / IP / Media": 15,
    "Founder / Cognitive": 20,
    "Tax / Finance / Validation": 6,
    "Defense / Infrastructure / Edge": 16,
    "Methods / Frameworks": 24,
    "Additional Historical Systems": 31,
  });
});
check("11 collision rows flagged", () => {
  assert.strictEqual(data.filter((c) => c.collision).length, 11);
});

/* Search */
check("search 'sal' finds SAL by name and by alias", () => {
  const hits = VE.filterConcepts(data, { q: "sal" });
  assert.ok(hits.some((c) => c.id === "CORE-002"), "SAL row present");
  assert.ok(hits.length >= 1 && hits.length < 246);
});
check("search 'recipe' finds Recipe Engine and Lead Recipe OS", () => {
  const ids = VE.filterConcepts(data, { q: "recipe" }).map((c) => c.id);
  assert.ok(ids.includes("CORE-018"), "Recipe Engine");
  assert.ok(ids.includes("CORE-053"), "Lead Recipe OS");
});
check("search is case-insensitive and matches aliases", () => {
  const a = VE.filterConcepts(data, { q: "MCP" }).map((c) => c.id);
  const b = VE.filterConcepts(data, { q: "mcp" }).map((c) => c.id);
  assert.deepStrictEqual(a, b);
  assert.ok(a.includes("CORE-001"), "Master Command Protocol via MCP alias");
});
check("search with no match returns empty", () => {
  assert.strictEqual(VE.filterConcepts(data, { q: "zzzzqqq" }).length, 0);
});

/* Filters */
check("section filter: Tax / Finance / Validation returns 6", () => {
  assert.strictEqual(
    VE.filterConcepts(data, { section: "Tax / Finance / Validation" }).length, 6);
});
check("classification filter: COURT REQUIRED returns 31", () => {
  assert.strictEqual(
    VE.filterConcepts(data, { classification: "COURT REQUIRED" }).length, 31);
});
check("classification filter is substring, case-insensitive", () => {
  const hits = VE.filterConcepts(data, { classification: "court required" });
  assert.strictEqual(hits.length, 31);
});
check("runtime filter: repo evidenced returns 61 (60 exact REPO EXISTS + CORE-059 REPO EXISTS (NOT DEPLOYED))", () => {
  assert.strictEqual(VE.filterConcepts(data, { runtime: "repo" }).length, 61);
});
check("runtime filter: no repo returns 167", () => {
  assert.strictEqual(VE.filterConcepts(data, { runtime: "norepo" }).length, 167);
});
check("collision-only filter returns 11", () => {
  assert.strictEqual(VE.filterConcepts(data, { collisionOnly: true }).length, 11);
});
check("combined filters intersect: Core section + collision only returns 9", () => {
  const hits = VE.filterConcepts(data, { section: "Core / Architecture", collisionOnly: true });
  assert.strictEqual(hits.length, 9);
  assert.ok(hits.every((c) => c.section === "Core / Architecture" && c.collision));
});

/* Sort */
check("sort name A-Z puts A.G.E.N.T. Framework first", () => {
  const s = VE.sortConcepts(data, "name-asc");
  assert.strictEqual(s[0].name, "A.G.E.N.T. Framework");
  assert.strictEqual(s.length, 246);
});
check("sort name Z-A reverses name A-Z exactly", () => {
  const asc = VE.sortConcepts(data, "name-asc").map((c) => c.id);
  const desc = VE.sortConcepts(data, "name-desc").map((c) => c.id);
  assert.deepStrictEqual(desc, asc.slice().reverse());
});
check("sort id ascending starts BIZ-001", () => {
  assert.strictEqual(VE.sortConcepts(data, "id-asc")[0].id, "BIZ-001");
});
check("empty filters return all 246", () => {
  assert.strictEqual(VE.filterConcepts(data, {}).length, 246);
});

console.log("ALL " + n + " TESTS PASS");
