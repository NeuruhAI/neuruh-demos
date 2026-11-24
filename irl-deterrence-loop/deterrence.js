/* IRL Deterrence & Recursive Attribution Engine, v1.0.
   Pure logic module. No DOM, no network, no side effects.
   Enforces CRUCIBLE eta gate, G-1 human authorization, lawful-channel
   allowlist, and Brier-scored recursive threshold updates. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.IRLDeterrence = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LAWFUL_CHANNELS = [
    "licensed_pi",
    "process_server",
    "civil_subpoena",
    "registrar_abuse",
    "law_enforcement_referral"
  ];

  function computeEta(iq, ir, iv, eWasted, cViolations) {
    var denom = 1 + Math.max(0, Number(eWasted) || 0) + Math.max(0, Number(cViolations) || 0);
    var raw = ((Number(iq) || 0) * (Number(ir) || 0) * (Number(iv) || 0)) / denom;
    var clamped = Math.max(0, Math.min(100, raw));
    return { raw: Math.round(raw * 100) / 100, eta: Math.round(clamped * 100) / 100 };
  }

  function evaluateCrucible(input) {
    var calc = computeEta(input.iq, input.ir, input.iv, input.eWasted, input.cViolations);
    var uncited = Number(input.uncitedCount) || 0;
    var pass = calc.eta >= 70 && uncited === 0;
    var reasons = [];
    if (calc.eta < 70) { reasons.push("eta below 70 (" + calc.eta + ")"); }
    if (uncited > 0) { reasons.push("uncited claims present (" + uncited + ")"); }
    return {
      verdict: pass ? "PASS" : "FLAG",
      eta: calc.eta,
      raw: calc.raw,
      uncitedCount: uncited,
      reasons: reasons
    };
  }

  function evaluateAuthorityGate(req, nowIso) {
    var reasons = [];
    var nowMs = Date.parse(nowIso || new Date().toISOString());
    var expMs = Date.parse(req.expiry || "");

    if (!req.authorizer || !String(req.authorizer).trim()) {
      reasons.push("missing authorizer");
    }
    if (!req.scope || !String(req.scope).trim()) {
      reasons.push("missing scope");
    }
    if (!isFinite(expMs) || expMs <= nowMs) {
      reasons.push("authority expired or invalid");
    }
    if (LAWFUL_CHANNELS.indexOf(req.channel) === -1) {
      reasons.push("channel not on lawful allowlist: " + req.channel);
    }
    if (req.humanApproved !== true) {
      reasons.push("G-1 violation: mandatory human approval missing");
    }
    if (req.crucibleVerdict !== "PASS") {
      reasons.push("CRUCIBLE gate not passed");
    }
    if ((Number(req.attributionProb) || 0) < (Number(req.currentThreshold) || 0.75)) {
      reasons.push("attribution confidence below active threshold");
    }

    return {
      decision: reasons.length === 0 ? "ALLOW" : "DENY",
      reasons: reasons
    };
  }

  function updateRecursiveState(state, outcome) {
    var prob = Math.max(0, Math.min(1, Number(outcome.predictedProb) || 0));
    var confirmed = outcome.identityConfirmed ? 1 : 0;
    var brier = Math.round(Math.pow(prob - confirmed, 2) * 10000) / 10000;

    var prevThresh = Number(state.threshold) || 0.75;
    var nextThresh = prevThresh;
    var action = "HOLD";

    if (confirmed === 0) {
      nextThresh = Math.min(0.95, Math.round((prevThresh + 0.05) * 1000) / 1000);
      action = "TIGHTEN_THRESHOLD";
    } else if (outcome.damagesHalted) {
      nextThresh = Math.max(0.65, Math.round((prevThresh - 0.01) * 1000) / 1000);
      action = "RELAX_SLIGHTLY";
    }

    var history = (state.history || []).concat([{
      caseId: outcome.caseId,
      predictedProb: prob,
      identityConfirmed: !!outcome.identityConfirmed,
      damagesHalted: !!outcome.damagesHalted,
      costUsd: Number(outcome.costUsd) || 0,
      recoveredUsd: Number(outcome.recoveredUsd) || 0,
      brier: brier,
      thresholdBefore: prevThresh,
      thresholdAfter: nextThresh,
      action: action
    }]);

    var meanBrier = Math.round(
      (history.reduce(function (s, h) { return s + h.brier; }, 0) / history.length) * 10000
    ) / 10000;

    return {
      threshold: nextThresh,
      resolvedCount: history.length,
      meanBrier: meanBrier,
      history: history
    };
  }

  return {
    LAWFUL_CHANNELS: LAWFUL_CHANNELS,
    computeEta: computeEta,
    evaluateCrucible: evaluateCrucible,
    evaluateAuthorityGate: evaluateAuthorityGate,
    updateRecursiveState: updateRecursiveState
  };
});
