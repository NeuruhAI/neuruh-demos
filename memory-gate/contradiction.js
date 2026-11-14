/* memory-gate: contradiction graph (JGI Section 38).
 *
 * Paper rule: contradictions are objects, not annoyances. A contradiction
 * records claim A, claim B, sources, freshness, authority, possible
 * resolution, and impact. Prioritize contradictions based on whether
 * resolving them changes action. Changes-action contradictions sort first;
 * order among equal-priority items is stable (insertion order kept).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MemoryGate = root.MemoryGate || {};
    root.MemoryGate.Contradiction = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function normalizeChangesAction(v) {
    if (v === true || v === "yes" || v === "Yes" || v === "YES") return true;
    if (v === false || v === "no" || v === "No" || v === "NO") return false;
    throw new Error("createContradiction: changesAction must be a boolean or 'yes'/'no'");
  }

  /* Build a contradiction object. changesAction may be boolean or "yes"/"no". */
  function createContradiction(input) {
    if (!input || typeof input !== "object") {
      throw new Error("createContradiction: input must be an object");
    }
    if (typeof input.claimA !== "string" || !input.claimA.trim()) {
      throw new Error("createContradiction: claimA must be a non-empty string");
    }
    if (typeof input.claimB !== "string" || !input.claimB.trim()) {
      throw new Error("createContradiction: claimB must be a non-empty string");
    }
    var changesAction = normalizeChangesAction(input.changesAction);
    return {
      claimA: input.claimA,
      claimB: input.claimB,
      sources: input.sources || "",
      freshness: input.freshness || "",
      authority: input.authority || "",
      possibleResolution: input.possibleResolution || "",
      changesAction: changesAction,
      priority: changesAction ? "HIGH" : "LOW",
      priorityReason: changesAction
        ? "HIGH priority: resolving this changes action."
        : "LOW priority: action is the same either way."
    };
  }

  /* Sort contradictions so changes-action items come first.
   * Stable: equal-priority items keep their original order.
   * Returns a new array; the input is not mutated.
   */
  function prioritizeContradictions(list) {
    if (!Array.isArray(list)) {
      throw new Error("prioritizeContradictions: list must be an array");
    }
    return list
      .map(function (item, index) { return { item: item, index: index }; })
      .sort(function (a, b) {
        var pa = a.item.changesAction ? 1 : 0;
        var pb = b.item.changesAction ? 1 : 0;
        if (pb !== pa) return pb - pa;
        return a.index - b.index;
      })
      .map(function (entry) { return entry.item; });
  }

  return {
    createContradiction: createContradiction,
    prioritizeContradictions: prioritizeContradictions
  };
});
