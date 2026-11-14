/* Node tests for the World Seeder Loop demo logic.
 * Run: node test.js (exit 0 = all pass). */
const assert = require("assert");
const WS = require("./world-seeder.js");

let n = 0;
function check(name, fn) {
  n++;
  fn();
  console.log("PASS " + n + ": " + name);
}

/* Data contract: the May 12 bug. */
check("top-level read parses 0 edges from the contract-shaped file", () => {
  const r = WS.readTopLevel(WS.SAMPLE_EDGES_FILE);
  assert.strictEqual(r.parsed, 0);
});
check("contract read parses all 6 sample edges", () => {
  const r = WS.readContract(WS.SAMPLE_EDGES_FILE);
  assert.strictEqual(r.parsed, 6);
  assert.strictEqual(r.edges[0].from, "ASSET-SAL-001");
  assert.strictEqual(r.edges[0].from_title, "Stacked Agent Logic");
  assert.strictEqual(r.total_edges, 500);
});
check("contract read on a file with no top_edges parses 0", () => {
  assert.strictEqual(WS.readContract({ date: "2026-05-09", total_edges: 500 }).parsed, 0);
});
check("top-level read on a bare array with source keys still counts them (bug shape)", () => {
  const r = WS.readTopLevel([{ source: "A", from: "A" }, { source: "B", from: "B" }]);
  assert.strictEqual(r.parsed, 2);
});

/* CRUCIBLE gate. */
check("May 9 Sovereign AI Infrastructure: (94 - 0) x 0.15 = 14.1 KILL", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 94, objection_penalty: 0, signal: "none", external_signal: false });
  assert.strictEqual(g.score, 14.1);
  assert.strictEqual(g.verdict, "KILL");
});
check("May 9 Real Estate Intelligence Platform: (89 - 0) x 0.15 = 13.35 KILL", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 89, objection_penalty: 0, signal: "none", external_signal: false });
  assert.strictEqual(g.score, 13.35);
  assert.strictEqual(g.verdict, "KILL");
});
check("May 9 Lead Conversion Intelligence: (87 - 0) x 0.15 = 13.05 KILL", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 87, objection_penalty: 0, signal: "none", external_signal: false });
  assert.strictEqual(g.score, 13.05);
  assert.strictEqual(g.verdict, "KILL");
});
check("even a perfect self-score of 100 with no signal tops out at 15, still KILL", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 100, objection_penalty: 0, signal: "none", external_signal: false });
  assert.strictEqual(g.score, 15);
  assert.strictEqual(g.verdict, "KILL");
});
check("one real lead lifts 94 to 28.2 ITERATE, not SHIP", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 94, objection_penalty: 0, signal: "lead", external_signal: true });
  assert.strictEqual(g.score, 28.2);
  assert.strictEqual(g.verdict, "ITERATE");
});
check("signed contract lifts 94 to 94 SHIP-CANDIDATE", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 94, objection_penalty: 0, signal: "contract", external_signal: true });
  assert.strictEqual(g.score, 94);
  assert.strictEqual(g.verdict, "SHIP-CANDIDATE");
});
check("94 with a contract signal but no external-signal flag downgrades to ITERATE", () => {
  const g = WS.crucibleVerdict({ emergence_raw: 94, objection_penalty: 0, signal: "contract", external_signal: false });
  assert.strictEqual(g.verdict, "ITERATE");
});
check("objections subtract before the multiplier: (94 - 56) x 0.15 = 5.7 KILL", () => {
  assert.strictEqual(WS.crucibleScore(94, 56, "none"), 5.7);
});
check("may9Crucible returns all 4 Worlds, all KILL", () => {
  const rows = WS.may9Crucible();
  assert.strictEqual(rows.length, 4);
  assert.deepStrictEqual(rows.map((r) => r.crucible_score), [14.1, 13.35, 14.1, 13.05]);
  assert.ok(rows.every((r) => r.verdict === "KILL"));
  assert.ok(rows.every((r) => r.objections_recorded === 0));
});

/* Illustrative clustering (demo only). */
check("sample edges cluster into the expected illustrative buckets", () => {
  const read = WS.readContract(WS.SAMPLE_EDGES_FILE);
  const clusters = WS.clusterEdgesIllustrative(read.edges);
  const names = clusters.map((c) => c.name);
  assert.ok(names.includes("Real Estate Intelligence"));
  assert.ok(names.includes("AI Platform Core"));
  assert.ok(names.includes("Core Infrastructure"));
  assert.ok(names.includes("Lead Generation & Sales"));
});
check("illustrative emergence formula: 20 + 6 per node + 2 per edge, capped 99", () => {
  assert.strictEqual(WS.illustrativeEmergence({ node_count: 4, edge_count: 3 }), 50);
  assert.strictEqual(WS.illustrativeEmergence({ node_count: 1, edge_count: 1 }), 28);
  assert.strictEqual(WS.illustrativeEmergence({ node_count: 30, edge_count: 50 }), 99);
});

/* Full pipeline simulator. */
check("default simulator run parses 8 edges and seeds Worlds", () => {
  const out = WS.runPipeline(WS.SIMULATOR_DEFAULT, [], "none");
  assert.strictEqual(out.edges_parsed, 8);
  assert.ok(out.seeded.length >= 2);
  assert.ok(out.seeded.every((s) => s.emergence_score >= 40));
  assert.strictEqual(out.report.worlds_seeded, out.seeded.length);
});
check("pipeline skips a World whose name already exists", () => {
  const first = WS.runPipeline(WS.SIMULATOR_DEFAULT, [], "none");
  const names = first.seeded.map((s) => s.world_name);
  const second = WS.runPipeline(WS.SIMULATOR_DEFAULT, names, "none");
  assert.strictEqual(second.seeded.length, 0);
  assert.ok(second.skipped.some((s) => s.reason.indexOf("already exists") !== -1));
});
check("pipeline skips a cluster below the 40 emergence floor", () => {
  const tiny = {
    date: "2026-05-09",
    total_edges: 1,
    top_edges: [
      { from: "A1", to: "B1", from_title: "Lone Parcel Node", to_title: "Lone Tax Node", score: 60, shared_keywords: ["real estate"], vertical_match: true }
    ]
  };
  const out = WS.runPipeline(tiny, [], "none");
  assert.strictEqual(out.seeded.length, 0);
  assert.ok(out.skipped.some((s) => s.reason.indexOf("below the 40 floor") !== -1));
});
check("pipeline flags activator scaffolding only above 85", () => {
  const out = WS.runPipeline(WS.SIMULATOR_DEFAULT, [], "none");
  out.seeded.forEach((s) => {
    assert.strictEqual(s.activator_scaffold, s.emergence_score > 85);
  });
});

console.log("All " + n + " tests passed.");
