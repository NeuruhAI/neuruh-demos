/* E8 Distressed Title Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E8).
   Mechanics carried from the 2026-11-04 E8 build
   (~/workspace/e8-distressed-title-site/index.html, 963 lines,
   68,746 bytes, MD5 594f410b520897339b3d7bbe2dfd8b7f, live at
   https://e8-distressed-title.pages.dev/, HTTP 200, byte-identical).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts.
   Two defects in the 2026-11-04 page script are FIXED here, not
   carried: (1) sample switching left stale lien rows behind, so
   loading Sample C then Sample A inflated total liens by $3,500;
   (2) the kill-list dedup compared short automatic labels against
   long manual labels and could never match, so a kill fired both
   ways appeared twice in kill_conditions_fired. See index.html
   section 14. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E8 = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isNum(x) {
    return typeof x === "number" && isFinite(x);
  }

  function round2(x) {
    if (!isNum(x)) { return null; }
    return Math.round(x * 100) / 100;
  }

  function fmt2(x) {
    if (!isNum(x)) { return "N/A"; }
    return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function money(x) {
    if (!isNum(x)) { return "N/A"; }
    return "$" + fmt2(x);
  }

  function clampNum(x, fallback) {
    return isNum(x) ? x : fallback;
  }

  /* Probate risk table, carried from the 2026-11-04 E8 build,
     section 03. Deduction is the dealability-score deduction. */
  var PROBATE = {
    none: { label: "No probate needed, living owner(s)", deduction: 0, level: "Low" },
    open_pr: { label: "Probate open, personal representative appointed", deduction: 8, level: "Low" },
    not_opened_counsel: { label: "Not opened, known heirs, probate counsel engaged", deduction: 15, level: "Moderate" },
    not_opened_no_counsel: { label: "Not opened, known heirs, no probate counsel", deduction: 25, level: "High" },
    dispute_counsel: { label: "Heir dispute or unknown heirs, probate counsel engaged", deduction: 25, level: "High" },
    dispute_no_counsel: { label: "Heir dispute or unknown heirs, no probate counsel", deduction: 35, level: "High" }
  };

  /* Tax risk table, carried from the 2026-11-04 E8 build,
     section 04. */
  var TAX = {
    current: { label: "Current, paid", deduction: 0, level: "Low" },
    delinq_1: { label: "Delinquent, 1 year", deduction: 10, level: "Moderate" },
    delinq_2: { label: "Delinquent, 2 or more years / tax sale pending", deduction: 20, level: "High" },
    unknown: { label: "Unknown", deduction: 15, level: "Unknown" }
  };

  var GATE_IDS = ["address_parcel", "source", "no_hallucination",
    "authority", "title", "probate"];

  var FLAG_IDS = ["flagCloud", "flagLisPendens", "flagCode",
    "flagQuietTitle", "flagIrs", "flagBankruptcy"];

  /* Lien stack, carried from the 2026-11-04 E8 build, section 02.
     Rows are sorted by the priority number entered; a row with no
     priority sorts last (99). Only rows with an amount above 0 count
     toward the totals. Senior liens are priority 1 and 2; junior
     liens are priority 3 and higher, or no priority entered.
     A row is incomplete when it has data but no amount or no source.
     The stack is incomplete when the operator has not checked the
     complete box, or when any row is incomplete. */
  function lienStack(liens, stackComplete) {
    var list = (Array.isArray(liens) ? liens : []).slice();
    list.sort(function (a, b) {
      var pa = isNum(a.priority) ? a.priority : 99;
      var pb = isNum(b.priority) ? b.priority : 99;
      return pa - pb;
    });
    var withAmount = list.filter(function (l) {
      return isNum(l.amount) && l.amount > 0;
    });
    var total = withAmount.reduce(function (s, l) { return s + l.amount; }, 0);
    var senior = withAmount.filter(function (l) {
      return isNum(l.priority) && l.priority <= 2;
    }).reduce(function (s, l) { return s + l.amount; }, 0);
    var junior = withAmount.filter(function (l) {
      return !isNum(l.priority) || l.priority > 2;
    }).reduce(function (s, l) { return s + l.amount; }, 0);
    var unverified = withAmount.filter(function (l) { return !l.verified; }).length;
    var incompleteRows = list.filter(function (l) {
      return l.hasData && (!isNum(l.amount) ||
        (typeof l.source !== "string" || l.source.trim() === ""));
    }).length;
    var hasLiens = withAmount.length > 0;
    var stackIncomplete = !stackComplete || incompleteRows > 0;
    return {
      liens: list, liensWithAmount: withAmount, total: total,
      senior: senior, junior: junior, hasLiens: hasLiens,
      withAmountCount: withAmount.length, unverified: unverified,
      incompleteRows: incompleteRows, stackIncomplete: stackIncomplete
    };
  }

  /* Probate risk, carried from the 2026-11-04 E8 build, section 03.
     A counsel path exists when probate is open with a personal
     representative, or counsel is engaged. Heir kill: an heir
     dispute or unknown heirs with no probate counsel, or known heirs
     not opened with more than one heir and no probate counsel. */
  function probateRisk(probatesKey, heirCount, heirsConsent) {
    var p = PROBATE[probatesKey] || null;
    var counselPath = probatesKey === "not_opened_counsel" ||
      probatesKey === "dispute_counsel" || probatesKey === "open_pr";
    var counselOut;
    if (probatesKey === "" || probatesKey === null || probatesKey === undefined) {
      counselOut = "N/A";
    } else if (counselPath) {
      counselOut = "Yes, counsel engaged";
    } else if (probatesKey === "none") {
      counselOut = "Not needed";
    } else {
      counselOut = "No counsel path";
    }
    var heirConsentOut;
    if (isNum(heirCount) && isNum(heirsConsent)) {
      heirConsentOut = heirsConsent + " of " + heirCount + " heirs consented";
    } else if (isNum(heirCount)) {
      heirConsentOut = heirCount + " known heirs, consent count N/A";
    } else {
      heirConsentOut = "N/A";
    }
    var heirKill = false;
    if (probatesKey === "dispute_no_counsel") { heirKill = true; }
    if (probatesKey === "not_opened_no_counsel" && isNum(heirCount) && heirCount > 1) {
      heirKill = true;
    }
    return {
      level: p ? p.level : null,
      deduction: p ? p.deduction : 0,
      label: p ? p.label : null,
      counselPath: counselPath, counselOut: counselOut,
      heirConsentOut: heirConsentOut, heirKill: heirKill
    };
  }

  /* Tax risk, carried from the 2026-11-04 E8 build, section 04.
     A tax sale pending, or an unknown tax balance, carries a
     warning. Delinquent taxes are normally senior to a mortgage. */
  function taxRisk(taxKey, taxOwed) {
    var t = TAX[taxKey] || null;
    var warning = "";
    if (taxKey === "delinq_2") {
      warning = "High tax risk: delinquent 2 or more years or a tax sale is pending. Confirm the tax sale date and the redemption deadline with the county treasurer before any other work.";
    } else if (taxKey === "unknown") {
      warning = "Tax status is unknown. Taxes are normally senior to a mortgage, so an unknown tax balance is an unknown senior lien. Confirm with the county treasurer.";
    }
    return {
      level: t ? t.level : null,
      deduction: t ? t.deduction : 0,
      label: t ? t.label : null,
      taxOwed: isNum(taxOwed) ? taxOwed : null,
      warning: warning
    };
  }

  /* Cure cost and equity, carried from the 2026-11-04 E8 build,
     section 05.
     Gross Equity = Estimated Value - Total Lien Stack (only when a
     value is entered and at least one lien has an amount).
     Net Equity = Gross Equity - Cure Cost - Repairs - Assignment
     Buffer (buffer defaults to $10,000, builder default, editable).
     Net equity needs a cure total and a repairs figure; without
     either it stays null, never zero.
     Cure Ratio = Cure Cost / Gross Equity (only when gross equity
     is positive).
     Cure kill: cure cost greater than gross equity. */
  function cureEquity(input) {
    var value = input.value;
    var totalLiens = input.totalLiens;
    var hasLiens = !!input.hasLiens;
    var cures = Array.isArray(input.cures) ? input.cures : [];
    var withAmount = cures.filter(function (c) {
      return isNum(c.amount) && c.amount > 0;
    });
    var cureTotal = withAmount.reduce(function (s, c) { return s + c.amount; }, 0);
    var hasCure = withAmount.length > 0;
    var repairs = input.repairs;
    var buffer = isNum(input.buffer) ? input.buffer : 10000;
    var grossEquity = (isNum(value) && hasLiens) ? value - totalLiens : null;
    var netEquity = (isNum(grossEquity) && hasCure && isNum(repairs))
      ? grossEquity - cureTotal - repairs - buffer : null;
    var cureRatio = (isNum(grossEquity) && grossEquity > 0 && hasCure)
      ? cureTotal / grossEquity : null;
    var cureKill = hasCure && isNum(grossEquity) && cureTotal > grossEquity;
    return {
      cureRowsWithAmount: withAmount, cureTotal: cureTotal,
      hasCure: hasCure, grossEquity: grossEquity,
      netEquity: netEquity, cureRatio: cureRatio,
      repairs: isNum(repairs) ? repairs : null,
      buffer: buffer, cureKill: cureKill
    };
  }

  /* Dealability score, carried from the 2026-11-04 E8 build,
     section 06. Deterministic rubric: start at 100, subtract the
     deductions below, clamp 0 to 100. A high score never overrides
     a kill condition.
     - Lien stack incomplete: 40
     - Unverified liens: 8 each, capped at 24
     - Probate risk: table deduction
     - Tax risk: table deduction
     - Cure ratio: gross equity zero or negative: 30; ratio above
       50%: 20; above 25%: 10; above 10%: 5
     - Title flags: 5 each, capped at 15
     - Repairs unknown: 5 */
  function dealabilityScore(input) {
    var deductions = [];
    if (input.hasLiens && input.stackIncomplete) {
      deductions.push({ label: "Lien stack incomplete", points: 40 });
    }
    if (isNum(input.unverified) && input.unverified > 0) {
      deductions.push({
        label: "Unverified liens (" + input.unverified + " x 8)",
        points: Math.min(input.unverified * 8, 24)
      });
    }
    if (input.probateLabel) {
      deductions.push({
        label: "Probate risk: " + input.probateLabel,
        points: input.probateDeduction || 0
      });
    }
    if (input.taxLabel) {
      deductions.push({
        label: "Tax risk: " + input.taxLabel,
        points: input.taxDeduction || 0
      });
    }
    if (isNum(input.grossEquity) && input.grossEquity <= 0 && input.hasCure) {
      deductions.push({
        label: "Cure ratio: gross equity is zero or negative", points: 30
      });
    } else if (isNum(input.cureRatio) && input.cureRatio > 0.5) {
      deductions.push({
        label: "Cure ratio above 50% (" + (input.cureRatio * 100).toFixed(2) + "%)",
        points: 20
      });
    } else if (isNum(input.cureRatio) && input.cureRatio > 0.25) {
      deductions.push({
        label: "Cure ratio above 25% (" + (input.cureRatio * 100).toFixed(2) + "%)",
        points: 10
      });
    } else if (isNum(input.cureRatio) && input.cureRatio > 0.1) {
      deductions.push({
        label: "Cure ratio above 10% (" + (input.cureRatio * 100).toFixed(2) + "%)",
        points: 5
      });
    }
    if (isNum(input.flagCount) && input.flagCount > 0) {
      deductions.push({
        label: "Title flags (" + input.flagCount + " x 5)",
        points: Math.min(input.flagCount * 5, 15)
      });
    }
    if (input.repairsKnown === "no") {
      deductions.push({ label: "Repairs unknown", points: 5 });
    }
    var totalDed = deductions.reduce(function (s, d) { return s + d.points; }, 0);
    var score = Math.max(0, Math.min(100, 100 - totalDed));
    var band = score >= 70 ? "70-100 Dealable"
      : (score >= 40 ? "40-69 Conditional" : "0-39 Not dealable");
    return {
      deductions: deductions, totalDeductions: totalDed,
      score: score, band: band
    };
  }

  /* Gates, carried from the 2026-11-04 E8 build, section 08.
     Any gate at fail or hold shows HOLD. */
  function evaluateGates(gateValues) {
    var passed = [], failed = [];
    GATE_IDS.forEach(function (id) {
      if (gateValues && gateValues[id] === "pass") { passed.push(id); }
      else { failed.push(id); }
    });
    return { ok: failed.length === 0, passed: passed, failed: failed };
  }

  /* Kill switch (E13), carried from the 2026-11-04 E8 build,
     section 09. The three automatic kills are computed and cannot
     be unchecked away. A kill is a successful run, recommendation
     PASS. Do not soften it.
     Auto kill 1: lien stack incomplete.
     Auto kill 2: heir complexity with no probate counsel path.
     Auto kill 3: cure cost greater than equity.
     FIX (builder, 2026-11-14): the 2026-11-04 dedup compared the
     short automatic label against the long manual label with
     indexOf, which never matches, so a kill fired both ways was
     listed twice in kill_conditions_fired. The filter below drops
     an automatic entry when a manual label starts with it, so each
     kill appears once in the combined list. The manual and automatic
     lists are still shown separately on the page. */
  function evaluateKills(input) {
    var manual = Array.isArray(input.manualKills) ? input.manualKills.slice() : [];
    var auto = Array.isArray(input.autoKills) ? input.autoKills.slice() : [];
    var autoDeduped = auto.filter(function (a) {
      return !manual.some(function (m) { return m === a || m.indexOf(a) === 0; });
    });
    var all = manual.concat(autoDeduped);
    return {
      manual: manual, auto: auto, all: all,
      killActive: all.length > 0
    };
  }

  /* Closing structure, carried from the 2026-11-04 E8 build,
     section 07. Assignment only when ALL of: score 70 or higher,
     no kill fired, probate is none or open with a personal
     representative, cure cost $5,000 or less, net equity positive,
     title company does not require a double close, and no
     assignment fee disclosure risk. Everything else dealable goes
     double close. PASS means no structure is recommended. */
  function closingStructure(input) {
    if (input.killActive) {
      return {
        structure: "PASS - no structure",
        reasons: ["A kill condition fired. No closing structure is recommended on a PASS."]
      };
    }
    var reasons = [];
    var assignOk = input.score >= 70 &&
      (input.probateKey === "none" || input.probateKey === "open_pr") &&
      (!input.hasCure || input.cureTotal <= 5000) &&
      (isNum(input.netEquity) && input.netEquity > 0) &&
      input.titleCompanyRequires !== "yes" &&
      input.feeDisclosureRisk !== "yes";
    if (assignOk) {
      reasons.push("Score " + input.score + " is 70 or higher.");
      reasons.push("Probate is clear: " + (input.probateLabel || "N/A") + ".");
      reasons.push("Cure cost " + money(input.cureTotal) + " is $5,000 or less.");
      reasons.push("Net equity " + money(input.netEquity) + " is positive.");
      return { structure: "Assignment", reasons: reasons };
    }
    if (input.score < 70) {
      reasons.push("Score " + input.score + " is below 70.");
    }
    if (!(input.probateKey === "none" || input.probateKey === "open_pr")) {
      reasons.push("Probate is not clear: " + (input.probateLabel || "not stated") + ".");
    }
    if (input.hasCure && input.cureTotal > 5000) {
      reasons.push("Cure cost " + money(input.cureTotal) + " is above $5,000.");
    }
    if (!isNum(input.netEquity) || input.netEquity <= 0) {
      reasons.push("Net equity is not positive.");
    }
    if (input.titleCompanyRequires === "yes") {
      reasons.push("Title company requires a double close.");
    }
    if (input.feeDisclosureRisk === "yes") {
      reasons.push("Assignment fee disclosure risk flagged.");
    }
    reasons.push("Double close lets the title company clear title on the first leg.");
    return { structure: "Double close", reasons: reasons };
  }

  /* Recommendation, carried from the 2026-11-04 E8 build.
     Kill active: PASS. Gates not all passed, or value, liens,
     stack completeness, probate, tax, cure, or repairs missing:
     HOLD. Otherwise: READY FOR REVIEW. No offer without Jeramie. */
  function recommendation(input) {
    if (input.killActive) { return "PASS"; }
    if (input.gatesFailedCount > 0 || !isNum(input.value) || !input.hasLiens ||
      !input.stackComplete || input.probateKey === "" || input.taxKey === "" ||
      !input.hasCure || !isNum(input.repairs)) {
      return "HOLD";
    }
    return "READY FOR REVIEW";
  }

  /* Risk flags, carried from the 2026-11-04 E8 build, section 09.
     Flags are not kills by themselves. Checked title flags plus
     probate risk, tax risk, cure ratio above 25 percent, and
     negative gross equity. */
  function riskFlags(input) {
    var flags = [];
    (input.checkedFlags || []).forEach(function (label) { flags.push(label); });
    if (input.probateLevel && input.probateLevel !== "Low") {
      flags.push("Probate risk: " + input.probateLevel);
    }
    if (input.taxLevel && input.taxLevel !== "Low" && input.taxLevel !== "Unknown") {
      flags.push("Tax risk: " + input.taxLevel);
    }
    if (input.taxLevel === "Unknown") {
      flags.push("Tax status unknown");
    }
    if (isNum(input.cureRatio) && input.cureRatio > 0.25) {
      flags.push("Cure ratio above 25%");
    }
    if (isNum(input.grossEquity) && input.grossEquity < 0) {
      flags.push("Negative gross equity");
    }
    return flags;
  }

  /* Completeness, carried from the 2026-11-04 E8 build.
     Eight items: address, parcel ID, estimated value, lien stack
     complete with at least one lien, probate status, tax status,
     cure cost entered, repairs entered. */
  function completeness(items) {
    var list = Array.isArray(items) ? items : [];
    var done = list.filter(function (x) { return x[1]; }).length;
    var pct = list.length ? Math.round(done / list.length * 100) : 0;
    var missing = list.filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; });
    return { done: done, total: list.length, pct: pct, missing: missing };
  }

  /* Canonical JSON: object keys sorted recursively, arrays in order.
     The receipt hash is computed over this string with the hash field
     stripped, so the same receipt always hashes the same way. */
  function canonicalJSON(value) {
    if (value === null || typeof value !== "object") { return JSON.stringify(value); }
    if (Array.isArray(value)) {
      return "[" + value.map(canonicalJSON).join(",") + "]";
    }
    var keys = Object.keys(value).sort();
    var parts = keys.map(function (k) {
      return JSON.stringify(k) + ":" + canonicalJSON(value[k]);
    });
    return "{" + parts.join(",") + "}";
  }

  /* Build one receipt object WITHOUT its hash field. Caller hashes
     canonicalJSON(receipt) and stores the result as receipt.hash.
     prevHash is GENESIS for the first receipt in a session. */
  function buildReceipt(fields, prevHash, seq) {
    var receipt = {
      schema_version: "e8-distressed-title-receipt.v1.0",
      seq: seq,
      prev_hash: prevHash,
      issued_at: new Date().toISOString(),
      fields: fields
    };
    return receipt;
  }

  /* Verify a chain in Node or in the browser. hashFn takes a canonical
     JSON string and returns a hex hash string (sync in Node, or a
     Promise in the browser; this function supports both by returning
     a Promise when any hashFn result is a Promise). */
  function verifyChain(receipts, hashFn) {
    var results = [];
    var prev = "GENESIS";
    var chainOk = true;
    function step(i) {
      if (i >= receipts.length) {
        return { ok: chainOk, results: results };
      }
      var r = receipts[i];
      if (r.prev_hash !== prev) {
        chainOk = false;
        results.push({ seq: r.seq, ok: false, reason: "prev_hash does not match prior hash" });
        return step(i + 1);
      }
      var copy = {};
      Object.keys(r).forEach(function (k) { if (k !== "hash") { copy[k] = r[k]; } });
      var h = hashFn(canonicalJSON(copy));
      if (h && typeof h.then === "function") {
        return h.then(function (hex) {
          var ok = hex === r.hash;
          if (!ok) { chainOk = false; }
          results.push({ seq: r.seq, ok: ok, reason: ok ? "hash matches" : "hash mismatch" });
          prev = r.hash;
          return step(i + 1);
        });
      }
      var okSync = h === r.hash;
      if (!okSync) { chainOk = false; }
      results.push({ seq: r.seq, ok: okSync, reason: okSync ? "hash matches" : "hash mismatch" });
      prev = r.hash;
      return step(i + 1);
    }
    return step(0);
  }

  return {
    isNum: isNum,
    round2: round2,
    fmt2: fmt2,
    money: money,
    PROBATE: PROBATE,
    TAX: TAX,
    GATE_IDS: GATE_IDS,
    FLAG_IDS: FLAG_IDS,
    lienStack: lienStack,
    probateRisk: probateRisk,
    taxRisk: taxRisk,
    cureEquity: cureEquity,
    dealabilityScore: dealabilityScore,
    evaluateGates: evaluateGates,
    evaluateKills: evaluateKills,
    closingStructure: closingStructure,
    recommendation: recommendation,
    riskFlags: riskFlags,
    completeness: completeness,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
