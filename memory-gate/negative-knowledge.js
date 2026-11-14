/* memory-gate: negative-knowledge register (JGI Section 37).
 *
 * Paper rule: record failed method, reason, environment, evidence,
 * correction, and whether the failure was intrinsic or contextual.
 * Negative knowledge prevents repeated expensive mistakes: adding a claim
 * that is already registered as known-false returns BLOCKED with the
 * original record, so the false claim is never relearned.
 * Matching is case-insensitive and ignores leading/trailing whitespace.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MemoryGate = root.MemoryGate || {};
    root.MemoryGate.NegativeKnowledge = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FAILURE_KINDS = ["Intrinsic", "Contextual"];

  function normalizeClaim(claim) {
    return String(claim).trim().toLowerCase();
  }

  function NegativeKnowledgeRegister() {
    this.entries = [];
  }

  /* Look up a claim. Returns the original record, or null. */
  NegativeKnowledgeRegister.prototype.check = function (claim) {
    if (typeof claim !== "string" || !claim.trim()) return null;
    var key = normalizeClaim(claim);
    for (var i = 0; i < this.entries.length; i++) {
      if (normalizeClaim(this.entries[i].claim) === key) return this.entries[i];
    }
    return null;
  };

  /* Add a failed method / known-false claim.
   * Input: { claim (or method), reason, environment, evidence, correction, kind }.
   * Returns { status: "RECORDED", record } or
   *         { status: "BLOCKED", reason, existing } with the original record.
   */
  NegativeKnowledgeRegister.prototype.add = function (entry) {
    if (!entry || typeof entry !== "object") {
      throw new Error("NegativeKnowledgeRegister.add: entry must be an object");
    }
    var claim = entry.claim || entry.method;
    if (typeof claim !== "string" || !claim.trim()) {
      throw new Error("NegativeKnowledgeRegister.add: claim (or method) must be a non-empty string");
    }
    var kind = entry.kind || "Contextual";
    if (FAILURE_KINDS.indexOf(kind) === -1) {
      throw new Error("NegativeKnowledgeRegister.add: kind must be one of: " + FAILURE_KINDS.join(", "));
    }
    var existing = this.check(claim);
    if (existing) {
      return {
        status: "BLOCKED",
        reason: "This claim is already recorded as known-false. It will not be relearned.",
        existing: existing
      };
    }
    var record = {
      claim: claim.trim(),
      reason: entry.reason || "",
      environment: entry.environment || "",
      evidence: entry.evidence || "",
      correction: entry.correction || "",
      kind: kind
    };
    this.entries.push(record);
    return { status: "RECORDED", record: record };
  };

  NegativeKnowledgeRegister.prototype.list = function () {
    return this.entries.slice();
  };

  NegativeKnowledgeRegister.prototype.size = function () {
    return this.entries.length;
  };

  return {
    FAILURE_KINDS: FAILURE_KINDS,
    normalizeClaim: normalizeClaim,
    NegativeKnowledgeRegister: NegativeKnowledgeRegister
  };
});
