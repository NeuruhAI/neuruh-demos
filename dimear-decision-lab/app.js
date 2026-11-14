/* DIMEA 2.0 Decision Lab: pure logic.
   Usable in the browser and in Node (test file requires it).
   No em dashes anywhere in this file. */

var AXES = ["desire", "identity", "mission", "expression", "alignment"];

var AXIS_LABELS = {
  desire: "Desire",
  identity: "Identity",
  mission: "Mission",
  expression: "Expression",
  alignment: "Alignment"
};

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

/* Weighted mean of the five axis scores.
   scores: {axis: 0..10}. weights: {axis: number >= 0}.
   Returns {score, numerator, denominator, terms} or {error} if weights sum to 0. */
function scoreOption(scores, weights) {
  var numerator = 0;
  var denominator = 0;
  var terms = [];
  AXES.forEach(function (axis) {
    var s = Number(scores[axis]);
    var w = Number(weights[axis]);
    if (!isFinite(s) || s < 0 || s > 10) {
      throw new Error("Score for " + axis + " must be a number from 0 to 10.");
    }
    if (!isFinite(w) || w < 0) {
      throw new Error("Weight for " + axis + " must be a number 0 or above.");
    }
    numerator += w * s;
    denominator += w;
    terms.push({ axis: axis, score: s, weight: w, product: w * s });
  });
  if (denominator === 0) {
    return { error: "All weights are 0, so no weighted mean exists. Raise at least one weight." };
  }
  return { score: numerator / denominator, numerator: numerator, denominator: denominator, terms: terms };
}

/* Rank options by score, highest first. Ties keep input order and are flagged. */
function rankOptions(scored) {
  var ranked = scored.slice().sort(function (a, b) { return b.score - a.score; });
  var out = [];
  ranked.forEach(function (item, i) {
    var tie = false;
    if (i > 0 && Math.abs(item.score - ranked[i - 1].score) < 1e-9) { tie = true; }
    if (i + 1 < ranked.length && Math.abs(item.score - ranked[i + 1].score) < 1e-9) { tie = true; }
    out.push({ rank: i + 1, option: item.option, score: item.score, tie: tie });
  });
  return out;
}

/* Build the receipt object without its hash. The caller hashes
   canonicalStringify(stripHash(receipt)) and sets receipt.hash. */
function buildReceiptObject(id, caseId, options, weights, results, ranking, prevHash, issuedAt) {
  return {
    format: "receipt-v1.0",
    demo: "dimear-decision-lab",
    id: id,
    case_id: caseId,
    issued_at: issuedAt,
    inputs: { options: options, weights: weights },
    results: results,
    ranking: ranking,
    prev_hash: prevHash
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AXES: AXES,
    AXIS_LABELS: AXIS_LABELS,
    canonicalStringify: canonicalStringify,
    stripHash: stripHash,
    scoreOption: scoreOption,
    rankOptions: rankOptions,
    buildReceiptObject: buildReceiptObject
  };
}
