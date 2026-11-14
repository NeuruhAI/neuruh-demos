/* memory-gate: consolidation (JGI Section 36).
 *
 * Paper rule: periodically compress large episodic histories, never delete
 * raw evidence, create higher-order summaries with backlinks, preserve
 * provenance. The paper gives no scoring formula. The cpRec rule below is
 * an ILLUSTRATIVE implementation: importance (1-10) and age (days) decide
 * compress, keep working, or drop. Raw evidence is never deleted; a "drop"
 * drops the working copy only, with raw evidence retained.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MemoryGate = root.MemoryGate || {};
    root.MemoryGate.Consolidation = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var RAW_EVIDENCE_NOTE =
    "Raw evidence is never deleted (Section 36). Summaries keep backlinks. " +
    "A Drop recommendation drops the working copy only; raw evidence is retained.";
  var RULE_NOTE =
    "Illustrative rule only: the JGI paper gives no scoring formula. " +
    "Importance and age decide compress, keep working, or drop.";

  /* cpRec: the consolidation recommendation for one memory.
   * imp: importance 1-10. age: age in days.
   */
  function cpRec(imp, age) {
    if (typeof imp !== "number" || !isFinite(imp)) {
      throw new Error("cpRec: importance must be a finite number");
    }
    if (typeof age !== "number" || !isFinite(age) || age < 0) {
      throw new Error("cpRec: age must be a finite number >= 0 (days)");
    }
    if (imp >= 7 && age >= 30) return "Compress into durable memory";
    if (imp >= 7) return "Keep working";
    if (imp >= 4 && age >= 90) return "Compress (summary only, keep raw evidence)";
    if (imp >= 4) return "Keep working";
    if (age >= 30) return "Drop (raw evidence retained per Section 36)";
    return "Keep working, review soon";
  }

  /* Run the planner over a list of { name, importance, age } items.
   * Returns { items: [{ name, importance, age, recommendation }], counts }.
   */
  function consolidate(items) {
    if (!Array.isArray(items)) {
      throw new Error("consolidate: items must be an array");
    }
    var counts = {};
    var out = items.map(function (item) {
      var rec = cpRec(item.importance, item.age);
      counts[rec] = (counts[rec] || 0) + 1;
      return {
        name: item.name,
        importance: item.importance,
        age: item.age,
        recommendation: rec
      };
    });
    return { items: out, counts: counts, rawEvidenceNote: RAW_EVIDENCE_NOTE };
  }

  return {
    RAW_EVIDENCE_NOTE: RAW_EVIDENCE_NOTE,
    RULE_NOTE: RULE_NOTE,
    cpRec: cpRec,
    consolidate: consolidate
  };
});
