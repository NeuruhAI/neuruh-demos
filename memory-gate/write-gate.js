/* memory-gate: write gate (JGI Section 34).
 *
 * The paper lists eight questions every durable memory write answers:
 * class, source, freshness, confidence, contradiction, relevance horizon,
 * fact vs inference, immutable history vs editable current state.
 *
 * THE PAPER GIVES NO NUMERIC THRESHOLDS. The rule below is an
 * ILLUSTRATIVE implementation of the paper's concept, not a formula from
 * the paper. Thresholds: evidence < 3 REJECT, contradiction QUARANTINE,
 * evidence < 6 QUARANTINE, else WRITE.
 *
 * DEAD BRANCH FIX: the Memory Workbench demo coded the quarantine branch
 * as (ev < 6 || (type === "Inference" && ev < 6)). The second disjunct is
 * subsumed by the first: any inference with ev < 6 already matches ev < 6,
 * so the type check could never change the outcome. It is removed here.
 * No new threshold was invented to replace it; the rule is simply ev < 6.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MemoryGate = root.MemoryGate || {};
    root.MemoryGate.WriteGate = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var MEMORY_CLASSES = [
    "Working", "Episodic", "Semantic", "Procedural",
    "Negative", "Strategic", "Capability", "Epistemic"
  ];
  var FRESHNESS_VALUES = ["Minutes", "Hours", "Days", "Weeks", "Months", "Years"];
  var CONFLICT_VALUES = ["none", "contradicts", "supersedes"];
  var KIND_VALUES = ["Fact", "Inference"];
  var MUTABILITY_VALUES = ["Immutable history", "Editable current state"];

  /* Illustrative thresholds. The paper gives no numeric thresholds. */
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

  /* Evaluate one write candidate against the eight gate questions.
   * Returns { verdict, reasons, input, illustrative, thresholdNote }.
   * Verdicts: REJECT, QUARANTINE, WRITE.
   */
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
      /* Dead branch removed: the old demo also tested (kind === "Inference" && ev < 6)
       * here, but that condition is subsumed by ev < 6 and could never fire on its own. */
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

  return {
    MEMORY_CLASSES: MEMORY_CLASSES,
    FRESHNESS_VALUES: FRESHNESS_VALUES,
    CONFLICT_VALUES: CONFLICT_VALUES,
    KIND_VALUES: KIND_VALUES,
    MUTABILITY_VALUES: MUTABILITY_VALUES,
    ILLUSTRATIVE_THRESHOLDS: ILLUSTRATIVE_THRESHOLDS,
    THRESHOLD_NOTE: THRESHOLD_NOTE,
    validate: validate,
    evaluateWrite: evaluateWrite
  };
});
