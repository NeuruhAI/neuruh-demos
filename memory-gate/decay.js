/* memory-gate: decay (JGI Section 35).
 *
 * Paper formula: F(t) = 2^(-t/h), where t is age and h is a
 * domain-specific half-life. The paper names the domains only by example
 * (runtime state minutes, repo state hours, lead state days, business
 * strategy weeks/months, historical fact years). The half-life values in
 * days below are the presets from the Memory Workbench demo.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MemoryGate = root.MemoryGate || {};
    root.MemoryGate.Decay = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DECAY_PRESETS = {
    runtime:    { key: "runtime",    label: "Runtime state: minutes",        halfLifeDays: 0.0167 },
    repo:       { key: "repo",       label: "Repo state: hours",             halfLifeDays: 0.5 },
    lead:       { key: "lead",       label: "Lead state: days",              halfLifeDays: 7 },
    strategy:   { key: "strategy",   label: "Business strategy: weeks",      halfLifeDays: 30 },
    historical: { key: "historical", label: "Historical fact: years",        halfLifeDays: 365 }
  };

  /* Retention F(t) = 2^(-t/h). t and h are both in days. */
  function decay(t, h) {
    if (typeof t !== "number" || !isFinite(t) || t < 0) {
      throw new Error("decay: age t must be a finite number >= 0 (days)");
    }
    if (typeof h !== "number" || !isFinite(h) || h <= 0) {
      throw new Error("decay: half-life h must be a finite number > 0 (days)");
    }
    return Math.pow(2, -t / h);
  }

  function decayWithPreset(t, presetKey) {
    var preset = DECAY_PRESETS[presetKey];
    if (!preset) {
      throw new Error("decayWithPreset: unknown preset '" + presetKey + "'");
    }
    return decay(t, preset.halfLifeDays);
  }

  return {
    DECAY_PRESETS: DECAY_PRESETS,
    decay: decay,
    decayWithPreset: decayWithPreset
  };
});
