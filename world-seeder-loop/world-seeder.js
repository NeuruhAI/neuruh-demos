/* World Seeder Loop - demo logic (UMD: Node and browser).
 *
 * SIMULATION. This file implements the demo's own illustrative logic.
 * It does NOT contain recovered code. The dossier (Batch 016) records that
 * detect_clusters(), find_edges(), the config/header block, and
 * world_activator.py were never recovered. Where this demo needs cluster
 * logic, it uses its own labeled illustrative implementation below.
 *
 * Grounded facts this file encodes (from the dossier):
 * - The edges data contract: edges nest under top_edges with fields
 *   from / to / from_title / to_title / score / shared_keywords /
 *   vertical_match. Top 50 of 500. Reading e["source"] or e["from"] at
 *   top level parses 0 edges (the May 12 bug).
 * - The May 9 result: 4 clusters from 500 edges, 4 Worlds, self-scored
 *   emergence 94 / 89 / 94 / 87, filed to the Notion IP Registry.
 * - The CRUCIBLE gate formula: score = max(0, emergence - objections)
 *   x multiplier. Multipliers: contract 1.00, pilot 0.50, lead 0.30,
 *   none 0.15. Verdicts: score < 20 KILL, 20-49 ITERATE, >= 50 with a
 *   real external signal SHIP-CANDIDATE, >= 50 without one ITERATE.
 *   (Same gate as the p0-seam-loop reference implementation.)
 * - Gates in the recovered main(): emergence < 40 skips the cluster;
 *   an already-existing World name skips the write. world_activator.py
 *   scaffolds repos for Worlds scoring > 85.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.WorldSeeder = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- Data contract: the May 12 bug, reproduced ---------- */

  /* The buggy top-level read. The May 12 code read e["source"] / e["from"]
   * at the top level of the file. The file is an object, not an array, and
   * its real edges live under top_edges. Result: 500 edges found, 0 parsed. */
  function readTopLevel(data) {
    var arr = null;
    if (Array.isArray(data)) arr = data;
    else if (data && Array.isArray(data.edges)) arr = data.edges;
    else return { parsed: 0, edges: [] };
    var edges = [];
    for (var i = 0; i < arr.length; i++) {
      var e = arr[i] || {};
      if (e.source || e.from) edges.push(e);
    }
    return { parsed: edges.length, edges: edges };
  }

  /* The correct contract read: data["top_edges"], then e["from"] /
   * e["from_title"] per edge. */
  function readContract(data) {
    if (!data || !Array.isArray(data.top_edges)) return { parsed: 0, edges: [] };
    var edges = [];
    for (var i = 0; i < data.top_edges.length; i++) {
      var e = data.top_edges[i] || {};
      edges.push({
        from: e.from || "",
        to: e.to || "",
        from_title: e.from_title || "",
        to_title: e.to_title || "",
        score: typeof e.score === "number" ? e.score : 0,
        shared_keywords: Array.isArray(e.shared_keywords) ? e.shared_keywords.slice() : [],
        vertical_match: !!e.vertical_match
      });
    }
    return { parsed: edges.length, edges: edges, total_edges: data.total_edges || edges.length };
  }

  /* ---------- CRUCIBLE gate (same formula as p0-seam-loop) ---------- */

  var MULTIPLIERS = { contract: 1.00, pilot: 0.50, lead: 0.30, none: 0.15 };

  function signalMultiplier(signal) {
    if (signal === "contract" || signal === "revenue" || signal === "signed contract") return MULTIPLIERS.contract;
    if (signal === "pilot" || signal === "paid pilot") return MULTIPLIERS.pilot;
    if (signal === "lead" || signal === "one real lead") return MULTIPLIERS.lead;
    return MULTIPLIERS.none;
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  function crucibleScore(emergenceRaw, objectionPenalty, signal) {
    var base = Math.max(0, emergenceRaw - objectionPenalty);
    return round2(base * signalMultiplier(signal));
  }

  function crucibleVerdict(input) {
    var i = input || {};
    var score = crucibleScore(i.emergence_raw, i.objection_penalty || 0, i.signal || "none");
    var externalSignal = !!i.external_signal;
    var verdict, reason;
    if (score < 20) {
      verdict = "KILL";
      reason = "score " + score + " below 20";
    } else if (score < 50) {
      verdict = "ITERATE";
      reason = "score " + score + " in 20-49 band";
    } else if (externalSignal) {
      verdict = "SHIP-CANDIDATE";
      reason = "score " + score + " at or above 50 with a real external signal";
    } else {
      verdict = "ITERATE";
      reason = "score " + score + " at or above 50 but no real external signal, downgraded to ITERATE";
    }
    return { score: score, multiplier: signalMultiplier(i.signal || "none"), verdict: verdict, reason: reason, external_signal: externalSignal };
  }

  /* ---------- May 9 result (historical, transcript-recorded) ---------- */

  /* Self-scored emergence numbers, exactly as the transcript records them.
   * They are NOT validated quality evidence. See the CRUCIBLE tension. */
  var MAY9_WORLDS = [
    { cluster: "Core Infrastructure", nodes: 16, world: "Sovereign AI Infrastructure", emergence: 94 },
    { cluster: "Real Estate Intelligence", nodes: 28, world: "Real Estate Intelligence Platform", emergence: 89 },
    { cluster: "AI Platform Core", nodes: 10, world: "Sovereign Agent Platform", emergence: 94 },
    { cluster: "Lead Generation & Sales", nodes: 5, world: "Lead Conversion Intelligence", emergence: 87 }
  ];

  /* CRUCIBLE scoring of the May 9 Worlds. Objections = 0 because no
   * adversary pass was ever run, so zero objections were RECORDED, not
   * zero found. Signal = none: no external signal (lead, pilot, contract)
   * enters the May 9 number. With multiplier 0.15, even a perfect
   * self-score of 100 tops out at 15, below the 20 KILL line. */
  function may9Crucible() {
    return MAY9_WORLDS.map(function (w) {
      var gate = crucibleVerdict({ emergence_raw: w.emergence, objection_penalty: 0, signal: "none", external_signal: false });
      return {
        cluster: w.cluster, nodes: w.nodes, world: w.world,
        emergence_self_scored: w.emergence,
        objections_recorded: 0,
        multiplier: gate.multiplier,
        crucible_score: gate.score,
        verdict: gate.verdict,
        reason: gate.reason
      };
    });
  }

  /* ---------- Illustrative clustering (DEMO ONLY, not recovered) ---------- */

  /* The recovered detect_clusters() body was never found. Its keyword to
   * cluster map is UNKNOWN. The buckets below are this demo's own
   * illustrative implementation, invented for the simulator only. They
   * are not the recovered code and must never be presented as such. */
  var ILLUSTRATIVE_BUCKETS = [
    { cluster: "Core Infrastructure", keywords: ["infrastructure", "sovereign", "compute", "hosting", "network"] },
    { cluster: "Real Estate Intelligence", keywords: ["real estate", "parcel", "tax lien", "probate", "lead gen", "property"] },
    { cluster: "AI Platform Core", keywords: ["ai platform", "agent", "orchestration", "model", "prompt"] },
    { cluster: "Lead Generation & Sales", keywords: ["lead", "sales", "conversion", "outreach", "crm"] }
  ];

  function illustrativeClusterOf(edge) {
    var kws = (edge.shared_keywords || []).join(" ").toLowerCase();
    var title = ((edge.from_title || "") + " " + (edge.to_title || "")).toLowerCase();
    var hay = kws + " " + title;
    for (var b = 0; b < ILLUSTRATIVE_BUCKETS.length; b++) {
      var bucket = ILLUSTRATIVE_BUCKETS[b];
      for (var k = 0; k < bucket.keywords.length; k++) {
        if (hay.indexOf(bucket.keywords[k]) !== -1) return bucket.cluster;
      }
    }
    return "Unclustered";
  }

  function clusterEdgesIllustrative(edges) {
    var clusters = {};
    (edges || []).forEach(function (e) {
      var name = illustrativeClusterOf(e);
      if (!clusters[name]) clusters[name] = { name: name, edges: [], nodes: {} };
      clusters[name].edges.push(e);
      if (e.from_title) clusters[name].nodes[e.from_title] = true;
      if (e.to_title) clusters[name].nodes[e.to_title] = true;
    });
    return Object.keys(clusters).sort().map(function (name) {
      var c = clusters[name];
      return { name: name, edges: c.edges, nodes: Object.keys(c.nodes).sort(), node_count: Object.keys(c.nodes).length, edge_count: c.edges.length };
    });
  }

  /* Illustrative emergence score for the simulator only. Formula:
   * min(99, 20 + 6 per node + 2 per edge). It is the demo's own scoring,
   * not the recovered find_edges() logic (which was never recovered) and
   * not the May 9 self-scores. Labeled as such in the UI. */
  function illustrativeEmergence(cluster) {
    return Math.min(99, 20 + 6 * cluster.node_count + 2 * cluster.edge_count);
  }

  /* Deterministic World draft for the simulator. No LLM call. The real
   * generate_world_spec() called Claude with the recovered prompt; this
   * demo drafts from a template so the loop runs entirely in the browser. */
  function draftWorldSpec(cluster) {
    var emergence = illustrativeEmergence(cluster);
    return {
      world_name: cluster.name + " World",
      asset_id: "WORLD-DEMO-" + cluster.name.toUpperCase().replace(/[^A-Z]+/g, "-") + "-1.0",
      cluster: cluster.name,
      nodes: cluster.nodes,
      node_count: cluster.node_count,
      edge_count: cluster.edge_count,
      emergence_score: emergence,
      layer: "L2-World",
      build_state: "Not Started",
      seeded_by: "world-seeder-loop demo (illustrative, not world_seeder.py)"
    };
  }

  /* ---------- Full pipeline simulator ---------- */

  /* Mirrors the recovered main() gates: emergence < 40 skips the cluster;
   * an already-existing World name skips the write. Activator flag at > 85.
   * CRUCIBLE verdict computed per World with signal "none" unless the
   * caller passes an external signal. */
  function runPipeline(data, existingWorldNames, externalSignal) {
    var read = readContract(data);
    var steps = [];
    steps.push({ step: "2AM connector.py", detail: "Read " + read.parsed + " edges from top_edges (of " + (read.total_edges || read.parsed) + " total)" });
    var clusters = clusterEdgesIllustrative(read.edges);
    steps.push({ step: "3AM world_seeder.py", detail: "Detected " + clusters.length + " cluster(s) with the demo illustrative cluster map: " + clusters.map(function (c) { return c.name + " (" + c.node_count + " nodes)"; }).join(", ") });
    var seeded = [];
    var skipped = [];
    (existingWorldNames || []).forEach(function () {});
    var existing = {};
    (existingWorldNames || []).forEach(function (n) { existing[String(n).toLowerCase()] = true; });
    clusters.forEach(function (cluster) {
      if (cluster.name === "Unclustered") {
        skipped.push({ cluster: cluster.name, reason: "no keyword bucket matched, no World drafted" });
        return;
      }
      var spec = draftWorldSpec(cluster);
      if (spec.emergence_score < 40) {
        skipped.push({ cluster: cluster.name, world: spec.world_name, emergence: spec.emergence_score, reason: "low emergence score (" + spec.emergence_score + "), below the 40 floor, skipped" });
        return;
      }
      if (existing[spec.world_name.toLowerCase()]) {
        skipped.push({ cluster: cluster.name, world: spec.world_name, emergence: spec.emergence_score, reason: "World already exists, skipped" });
        return;
      }
      var gate = crucibleVerdict({ emergence_raw: spec.emergence_score, objection_penalty: 0, signal: externalSignal || "none", external_signal: !!(externalSignal && externalSignal !== "none") });
      spec.crucible_score = gate.score;
      spec.crucible_verdict = gate.verdict;
      spec.crucible_reason = gate.reason;
      spec.activator_scaffold = spec.emergence_score > 85;
      seeded.push(spec);
    });
    steps.push({ step: "3AM+ world_activator.py", detail: seeded.filter(function (s) { return s.activator_scaffold; }).length + " of " + seeded.length + " seeded Worlds score above 85 and would get a repo scaffolded" });
    steps.push({ step: "Sun 4AM feedback_loop.py", detail: "Threshold self-adjustment is NOT simulated here: the feedback loop needs prediction accuracy data the demo does not have" });
    return {
      edges_parsed: read.parsed,
      clusters: clusters,
      seeded: seeded,
      skipped: skipped,
      steps: steps,
      report: {
        date: "2026-05-09 (simulated run date shown for the May 9 replay; live runs use today)",
        clusters_detected: clusters.length,
        worlds_seeded: seeded.length,
        worlds: seeded.map(function (s) { return { world_name: s.world_name, emergence_score: s.emergence_score, crucible_score: s.crucible_score, crucible_verdict: s.crucible_verdict }; })
      }
    };
  }

  /* ---------- Sample data ---------- */

  /* Six edges in the exact contract shape. Used by the data-contract test. */
  var SAMPLE_EDGES_FILE = {
    date: "2026-05-09",
    total_edges: 500,
    top_edges: [
      { from: "ASSET-SAL-001", to: "ASSET-AXON-002", from_title: "Stacked Agent Logic", to_title: "Axon Signal Router", score: 91, shared_keywords: ["agent", "orchestration"], vertical_match: true },
      { from: "ASSET-LANDOS-010", to: "ASSET-RECIPE-004", from_title: "LANDOS Tax Signal", to_title: "Tax Lien Recipe", score: 88, shared_keywords: ["real estate", "tax lien", "lead gen"], vertical_match: true },
      { from: "ASSET-DEED-003", to: "ASSET-RECIPE-004", from_title: "DeedSonar CRM", to_title: "Tax Lien Recipe", score: 87, shared_keywords: ["real estate", "lead gen", "crm"], vertical_match: true },
      { from: "ASSET-CORE-007", to: "ASSET-AXON-002", from_title: "Sovereign Compute Core", to_title: "Axon Signal Router", score: 86, shared_keywords: ["infrastructure", "sovereign", "compute"], vertical_match: true },
      { from: "ASSET-OUTREACH-012", to: "ASSET-DEED-003", from_title: "Outreach Sequencer", to_title: "DeedSonar CRM", score: 84, shared_keywords: ["lead", "sales", "outreach", "conversion"], vertical_match: true },
      { from: "ASSET-PROMPT-020", to: "ASSET-SAL-001", from_title: "Prompt Memory Loop", to_title: "Stacked Agent Logic", score: 83, shared_keywords: ["agent", "prompt", "model"], vertical_match: true }
    ]
  };

  /* Default simulator input: 8 edges forming two clusters. */
  var SIMULATOR_DEFAULT = {
    date: "2026-05-09",
    total_edges: 500,
    top_edges: [
      { from: "ASSET-LANDOS-010", to: "ASSET-RECIPE-004", from_title: "LANDOS Tax Signal", to_title: "Tax Lien Recipe", score: 88, shared_keywords: ["real estate", "tax lien", "lead gen"], vertical_match: true },
      { from: "ASSET-DEED-003", to: "ASSET-RECIPE-004", from_title: "DeedSonar CRM", to_title: "Tax Lien Recipe", score: 87, shared_keywords: ["real estate", "lead gen", "crm"], vertical_match: true },
      { from: "ASSET-PARCEL-021", to: "ASSET-LANDOS-010", from_title: "Parcel Reality Bench", to_title: "LANDOS Tax Signal", score: 85, shared_keywords: ["real estate", "parcel", "property"], vertical_match: true },
      { from: "ASSET-PROBATE-030", to: "ASSET-DEED-003", from_title: "Probate Signal Feed", to_title: "DeedSonar CRM", score: 82, shared_keywords: ["real estate", "probate", "lead gen"], vertical_match: true },
      { from: "ASSET-CORE-007", to: "ASSET-AXON-002", from_title: "Sovereign Compute Core", to_title: "Axon Signal Router", score: 86, shared_keywords: ["infrastructure", "sovereign", "compute"], vertical_match: true },
      { from: "ASSET-CORE-008", to: "ASSET-CORE-007", from_title: "Host Network Fabric", to_title: "Sovereign Compute Core", score: 81, shared_keywords: ["infrastructure", "network", "hosting"], vertical_match: true },
      { from: "ASSET-OUTREACH-012", to: "ASSET-DEED-003", from_title: "Outreach Sequencer", to_title: "DeedSonar CRM", score: 84, shared_keywords: ["lead", "sales", "outreach", "conversion"], vertical_match: true },
      { from: "ASSET-SAL-001", to: "ASSET-AXON-002", from_title: "Stacked Agent Logic", to_title: "Axon Signal Router", score: 91, shared_keywords: ["agent", "orchestration"], vertical_match: true }
    ]
  };

  return {
    MULTIPLIERS: MULTIPLIERS,
    MAY9_WORLDS: MAY9_WORLDS,
    SAMPLE_EDGES_FILE: SAMPLE_EDGES_FILE,
    SIMULATOR_DEFAULT: SIMULATOR_DEFAULT,
    ILLUSTRATIVE_BUCKETS: ILLUSTRATIVE_BUCKETS,
    readTopLevel: readTopLevel,
    readContract: readContract,
    signalMultiplier: signalMultiplier,
    crucibleScore: crucibleScore,
    crucibleVerdict: crucibleVerdict,
    may9Crucible: may9Crucible,
    illustrativeClusterOf: illustrativeClusterOf,
    clusterEdgesIllustrative: clusterEdgesIllustrative,
    illustrativeEmergence: illustrativeEmergence,
    draftWorldSpec: draftWorldSpec,
    runPipeline: runPipeline
  };
}));
