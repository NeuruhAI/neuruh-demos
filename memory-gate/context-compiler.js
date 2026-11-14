/* memory-gate: context compiler (JGI Section 39).
 *
 * The paper says maximize relevant information utility subject to token
 * budget, using relevance, source authority, freshness, confidence,
 * directness, and diversity, with a redundancy penalty. It gives no
 * formula. The rule below is an ILLUSTRATIVE implementation of the
 * paper's concept, copied from the JGI Memory Workbench Tool 6, not a
 * formula from the paper: items are ranked by utility per token, filled
 * greedily under the budget, and a second item from the same source
 * loses half its utility (rounded).
 *
 * Items and their token costs and utilities are the Workbench sample
 * set, verbatim. Nothing here is a live measurement.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MemoryGate = root.MemoryGate || {};
    root.MemoryGate.ContextCompiler = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PLANES = [
    "working", "episodic", "semantic", "procedural",
    "negative", "strategic", "capability", "epistemic"
  ];

  /* Workbench sample items, verbatim: name, tokens, utility, source. */
  var ITEMS = {
    working: [
      { n: "Current mission: score Berrien leads", t: 300, u: 90, s: "mission log" },
      { n: "Open threads: 5 estate sellers", t: 200, u: 60, s: "mission log" }
    ],
    episodic: [
      { n: "Oct 15 pull failed 18 nights", t: 250, u: 80, s: "pull log" },
      { n: "Nov 2 evening log: 0 touches", t: 150, u: 50, s: "memory log" }
    ],
    semantic: [
      { n: "Berrien FIPS 26021, tax delinquent 42.4", t: 200, u: 85, s: "county record" },
      { n: "Recipe R1: tax lien signals", t: 300, u: 75, s: "recipe registry" }
    ],
    procedural: [
      { n: "How to run a lead pull", t: 400, u: 70, s: "runbook" },
      { n: "How to score a parcel", t: 350, u: 65, s: "runbook" }
    ],
    negative: [
      { n: "Do not send from a stale list", t: 150, u: 95, s: "negative register" },
      { n: "Do not quote a price unprompted", t: 100, u: 70, s: "negative register" }
    ],
    strategic: [
      { n: "Goal: 50 qualified conversations", t: 200, u: 60, s: "goal file" },
      { n: "Money conversion over volume", t: 150, u: 55, s: "goal file" }
    ],
    capability: [
      { n: "LANDOS engine: 50 signals", t: 250, u: 55, s: "estate inventory" },
      { n: "DeedSonar: 219 migrations", t: 300, u: 45, s: "estate inventory" }
    ],
    epistemic: [
      { n: "Pull outage: host-side, unconfirmed fix", t: 200, u: 80, s: "pull log" },
      { n: "Confidence in Berrien list: low", t: 150, u: 75, s: "calibration log" }
    ]
  };

  var RULE_NOTE =
    "Illustrative rule only: the JGI paper gives no formula. Items rank by " +
    "utility per token and fill greedily under the budget; a second item " +
    "from the same source loses half its utility (rounded).";

  /* Compile a context packet.
   * opts: { task (string), budget (number, tokens), planes (array of plane
   * keys, in the order the caller lists them) }.
   * Returns { task, budget, used, utility, planes, kept, text } where kept
   * is [{ plane, name, tokens, utility, penalty }] in packet order.
   */
  function compileContext(opts) {
    var o = opts || {};
    var task = typeof o.task === "string" ? o.task : "";
    var budget = parseInt(o.budget, 10);
    if (isNaN(budget) || budget < 0) budget = 0;
    var planes = Array.isArray(o.planes) ? o.planes.filter(function (p) {
      return PLANES.indexOf(p) !== -1;
    }) : [];
    var items = [];
    planes.forEach(function (p) {
      ITEMS[p].forEach(function (it) {
        items.push({ plane: p, n: it.n, t: it.t, u: it.u, s: it.s });
      });
    });
    items.sort(function (a, b) { return (b.u / b.t) - (a.u / a.t); });
    var used = {};
    var total = 0;
    var totalU = 0;
    var kept = [];
    items.forEach(function (it) {
      var u = it.u;
      if (used[it.s]) { u = Math.round(u / 2); }
      if (total + it.t <= budget) {
        total += it.t;
        totalU += u;
        used[it.s] = true;
        kept.push({
          plane: it.plane,
          name: it.n,
          tokens: it.t,
          utility: u,
          penalty: used[it.s] && it.u !== u
        });
      }
    });
    var out = "Task: " + task + "\nBudget: " + budget + " tokens | Used: " + total +
      " tokens | Utility: " + totalU + "\nPlanes: " + planes.join(", ") + "\n\n";
    out += kept.length ? kept.map(function (k, i) {
      return (i + 1) + ". [" + k.plane + "] " + k.name + " (" + k.tokens +
        " tokens, utility " + k.utility +
        (k.penalty ? ", redundancy penalty applied" : "") + ")";
    }).join("\n") : "No items fit the budget.";
    return {
      task: task,
      budget: budget,
      used: total,
      utility: totalU,
      planes: planes,
      kept: kept,
      text: out,
      illustrative: true,
      ruleNote: RULE_NOTE
    };
  }

  return {
    PLANES: PLANES,
    ITEMS: ITEMS,
    RULE_NOTE: RULE_NOTE,
    compileContext: compileContext
  };
});
