/* E2 Small Multifamily Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E2).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E2 = factory();
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

  function clampNum(x, fallback) {
    return isNum(x) ? x : fallback;
  }

  /* Rent roll: units are {rent, market, status, grade, deferred} with
     rent and market in dollars per month, status Occupied or Vacant. */
  function computeRentRoll(units) {
    var list = Array.isArray(units) ? units : [];
    var occupied = 0, vacant = 0, gradeD = 0, deferredRoll = 0;
    var grossActualMo = 0, grossStabMo = 0;
    var hasRent = false, hasMarket = false;
    list.forEach(function (u) {
      if (u.status === "Vacant") { vacant += 1; } else { occupied += 1; }
      if (u.grade === "D") { gradeD += 1; }
      if (isNum(u.rent)) { grossActualMo += u.rent; hasRent = true; }
      if (isNum(u.market)) { grossStabMo += u.market; hasMarket = true; }
      else if (isNum(u.rent)) { grossStabMo += u.rent; }
      if (isNum(u.deferred)) { deferredRoll += u.deferred; }
    });
    var counted = occupied + vacant;
    return {
      count: counted,
      occupied: occupied,
      vacant: vacant,
      vacancyRate: counted > 0 ? vacant / counted : null,
      grossActualMo: hasRent ? grossActualMo : null,
      grossStabMo: (hasMarket || hasRent) ? grossStabMo : null,
      gradeD: gradeD,
      deferredRoll: deferredRoll
    };
  }

  /* NOI bridge. One call computes one case (actual or stabilized).
     expenses: taxes, insurance, maintenance, utilities, reserves,
     otherExpense are dollars per year. mgmtPct is percent of EGI.
     Returns each step plus a human readable working line per step. */
  function computeNOI(input) {
    var grossAnnual = isNum(input.grossAnnual) ? input.grossAnnual : null;
    var vacancyPct = clampNum(input.vacancyPct, 0);
    var otherIncome = clampNum(input.otherIncome, 0);
    var taxes = clampNum(input.taxes, 0);
    var insurance = clampNum(input.insurance, 0);
    var maintenance = clampNum(input.maintenance, 0);
    var utilities = clampNum(input.utilities, 0);
    var reserves = clampNum(input.reserves, 0);
    var otherExpense = clampNum(input.otherExpense, 0);
    var mgmtPct = clampNum(input.mgmtPct, 0);
    if (grossAnnual === null) {
      return {
        grossAnnual: null, vacancyLoss: null, otherIncome: otherIncome,
        egi: null, mgmtFee: null, totalExpenses: null, noi: null,
        steps: ["Gross scheduled rent is missing, so NOI cannot be computed."]
      };
    }
    var vacancyLoss = grossAnnual * vacancyPct / 100;
    var egi = grossAnnual - vacancyLoss + otherIncome;
    var mgmtFee = egi * mgmtPct / 100;
    var totalExpenses = taxes + insurance + maintenance + mgmtFee + utilities + reserves + otherExpense;
    var noi = egi - totalExpenses;
    return {
      grossAnnual: grossAnnual,
      vacancyLoss: vacancyLoss,
      otherIncome: otherIncome,
      egi: egi,
      mgmtFee: mgmtFee,
      totalExpenses: totalExpenses,
      noi: noi,
      steps: [
        "Vacancy loss = " + fmt2(grossAnnual) + " x " + vacancyPct + "% = " + fmt2(vacancyLoss),
        "EGI = " + fmt2(grossAnnual) + " - " + fmt2(vacancyLoss) + " + " + fmt2(otherIncome) + " = " + fmt2(egi),
        "Management fee = " + fmt2(egi) + " x " + mgmtPct + "% = " + fmt2(mgmtFee),
        "Operating expenses = " + fmt2(taxes) + " + " + fmt2(insurance) + " + " + fmt2(maintenance) + " + " + fmt2(mgmtFee) + " + " + fmt2(utilities) + " + " + fmt2(reserves) + " + " + fmt2(otherExpense) + " = " + fmt2(totalExpenses),
        "NOI = " + fmt2(egi) + " - " + fmt2(totalExpenses) + " = " + fmt2(noi)
      ]
    };
  }

  function fmt2(x) {
    if (!isNum(x)) { return "N/A"; }
    return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* Standard amortizing monthly payment. Returns null on bad input. */
  function monthlyPayment(principal, annualRatePct, years) {
    if (!isNum(principal) || !isNum(annualRatePct) || !isNum(years) || years <= 0) { return null; }
    var r = annualRatePct / 100 / 12;
    var n = years * 12;
    if (r === 0) { return principal / n; }
    var f = Math.pow(1 + r, n);
    return principal * r * f / (f - 1);
  }

  function dscr(noi, annualDebtService) {
    if (!isNum(noi) || !isNum(annualDebtService) || annualDebtService <= 0) { return null; }
    return noi / annualDebtService;
  }

  /* Cap rate implied value. capRatePct must be over 0. */
  function stabilizedValue(noi, capRatePct) {
    if (!isNum(noi) || !isNum(capRatePct) || capRatePct <= 0) { return null; }
    return noi / (capRatePct / 100);
  }

  /* Value range at cap rate plus and minus spread (builder default 0.5pp).
     low value uses the high cap rate, high value uses the low cap rate. */
  function valueRange(noi, capRatePct, spreadPp) {
    var spread = isNum(spreadPp) ? spreadPp : 0.5;
    if (!isNum(noi) || !isNum(capRatePct) || capRatePct <= 0) {
      return { low: null, mid: null, high: null, lowCap: null, highCap: null, spreadPp: spread };
    }
    var lowCap = capRatePct + spread;
    var highCap = capRatePct - spread;
    if (highCap <= 0) { highCap = 0.1; }
    return {
      low: stabilizedValue(noi, lowCap),
      mid: stabilizedValue(noi, capRatePct),
      high: stabilizedValue(noi, highCap),
      lowCap: lowCap,
      highCap: highCap,
      spreadPp: spread
    };
  }

  function cashFlow(noi, annualDebtService) {
    if (!isNum(noi) || !isNum(annualDebtService)) { return null; }
    return noi - annualDebtService;
  }

  function cashOnCash(annualCashFlow, downPayment) {
    if (!isNum(annualCashFlow) || !isNum(downPayment) || downPayment <= 0) { return null; }
    return annualCashFlow / downPayment;
  }

  function breakEvenOccupancy(totalExpenses, annualDebtService, grossStabAnnual) {
    if (!isNum(totalExpenses) || !isNum(annualDebtService) || !isNum(grossStabAnnual) || grossStabAnnual <= 0) { return null; }
    return (totalExpenses + annualDebtService) / grossStabAnnual * 100;
  }

  /* Kill switch. Contract kills carried from the 2026-11-04 E2 build:
     rent roll unverifiable; vacancy over 30 percent with no lease-up
     plan; DSCR below 1.0 on stabilized NOI. Manual kills are extra
     checkbox kills passed in as labels. */
  function evaluateKills(input) {
    var fired = [];
    if (input.rentVerifiable === "no") { fired.push("Rent roll unverifiable"); }
    if (isNum(input.vacancyRate) && input.vacancyRate > 0.30 && !input.leaseUpPlan) {
      fired.push("Vacancy over 30 percent with no lease-up plan");
    }
    if (isNum(input.dscrStab) && input.dscrStab < 1.0) {
      fired.push("DSCR below 1.0 on stabilized NOI");
    }
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    return { killActive: fired.length > 0, fired: fired };
  }

  function dscrBand(dscrStab) {
    if (!isNum(dscrStab)) { return "unknown"; }
    if (dscrStab < 1.0) { return "kill"; }
    if (dscrStab < 1.25) { return "thin"; }
    return "comfortable";
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
      schema_version: "e2-small-multifamily-receipt.v1.0",
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
    computeRentRoll: computeRentRoll,
    computeNOI: computeNOI,
    monthlyPayment: monthlyPayment,
    dscr: dscr,
    stabilizedValue: stabilizedValue,
    valueRange: valueRange,
    cashFlow: cashFlow,
    cashOnCash: cashOnCash,
    breakEvenOccupancy: breakEvenOccupancy,
    evaluateKills: evaluateKills,
    dscrBand: dscrBand,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
