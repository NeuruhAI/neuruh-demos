/* E3 Rental / BRRRR Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E3).
   Mechanics carried from the 2026-11-04 E3 build
   (~/workspace/e3-rental-brrrr-site/index.html, 843 lines, live at
   https://e3-rental-brrrr.pages.dev/, HTTP 200, MD5 47f5fb3377fa4c6781dca2feddcb60d5).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E3 = factory();
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

  function clampNum(x, fallback) {
    return isNum(x) ? x : fallback;
  }

  /* Standard amortizing monthly payment. Returns null on bad input.
     Zero rate pays principal straight over the term. */
  function monthlyPayment(principal, annualRatePct, years) {
    if (!isNum(principal) || !isNum(annualRatePct) || !isNum(years) || years <= 0 || principal < 0) { return null; }
    var r = annualRatePct / 100 / 12;
    var n = years * 12;
    if (r === 0) { return principal / n; }
    var f = Math.pow(1 + r, n);
    return principal * r * f / (f - 1);
  }

  /* One cash-flow scenario. rent and vacancyPct are the scenario rent
     and vacancy. fixedMonthly is taxes + insurance + HOA + utilities +
     other, in dollars per month. varPct is maintenance + capex +
     management, as percent of gross rent. refiPayment is the monthly
     refinance payment, or null when it cannot be computed.
     Returns each step plus human readable working lines. */
  function scenario(rent, vacancyPct, fixedMonthly, varPct, refiPayment) {
    if (!isNum(rent) || !isNum(vacancyPct)) {
      return {
        rent: isNum(rent) ? rent : null, vacancyPct: isNum(vacancyPct) ? vacancyPct : null,
        egi: null, varExp: null, opEx: null, noi: null, debt: isNum(refiPayment) ? refiPayment : null,
        cf: null, cfYr: null,
        steps: ["Rent or vacancy is missing, so this scenario cannot be computed."]
      };
    }
    var fixed = clampNum(fixedMonthly, 0);
    var vp = clampNum(varPct, 0);
    var egi = rent * (1 - vacancyPct / 100);
    var varExp = rent * vp / 100;
    var opEx = fixed + varExp;
    var noi = egi - opEx;
    var debt = isNum(refiPayment) ? refiPayment : null;
    var cf = debt === null ? null : noi - debt;
    return {
      rent: rent, vacancyPct: vacancyPct, egi: egi, varExp: varExp,
      opEx: opEx, noi: noi, debt: debt, cf: cf, cfYr: cf === null ? null : cf * 12,
      steps: [
        "Effective gross income = " + fmt2(rent) + " x (1 - " + vacancyPct + "% / 100) = " + fmt2(egi),
        "Variable expenses = " + fmt2(rent) + " x " + vp + "% / 100 = " + fmt2(varExp),
        "Operating expenses = " + fmt2(fixed) + " + " + fmt2(varExp) + " = " + fmt2(opEx),
        "NOI = " + fmt2(egi) + " - " + fmt2(opEx) + " = " + fmt2(noi),
        debt === null ? "Cash flow is N/A: refinance payment cannot be computed."
          : "Cash flow = " + fmt2(noi) + " - " + fmt2(debt) + " = " + fmt2(cf) + " / mo, " + fmt2(cf * 12) + " / yr"
      ]
    };
  }

  /* Scenario adjustments, builder defaults carried from the 2026-11-04
     E3 build and labeled as such on the page. Optimistic: rent +5%,
     vacancy halved. Pessimistic: rent -10%, vacancy +10 points, capped
     at 50%. Both use the same operating expenses and refinance payment. */
  function scenarioInputs(marketRent, vacancyPct) {
    if (!isNum(marketRent) || !isNum(vacancyPct)) {
      return { base: null, optimistic: null, pessimistic: null };
    }
    return {
      base: { rent: marketRent, vacancyPct: vacancyPct },
      optimistic: { rent: marketRent * 1.05, vacancyPct: Math.max(0, vacancyPct / 2) },
      pessimistic: { rent: marketRent * 0.90, vacancyPct: Math.min(50, vacancyPct + 10) }
    };
  }

  /* All-in cost = purchase price + repairs base + purchase closing +
     holding costs. Null when purchase price or repairs base is missing. */
  function allInCost(purchase, repBase, purchClosing, holding) {
    if (!isNum(purchase) || !isNum(repBase)) { return null; }
    return purchase + repBase + clampNum(purchClosing, 0) + clampNum(holding, 0);
  }

  /* Total cash invested = (purchase price - initial loan) + repairs base
     + purchase closing + holding costs. */
  function cashInvested(purchase, initialLoan, repBase, purchClosing, holding) {
    if (!isNum(purchase) || !isNum(repBase)) { return null; }
    return (purchase - clampNum(initialLoan, 0)) + repBase + clampNum(purchClosing, 0) + clampNum(holding, 0);
  }

  /* Refinance math. Loan = ARV x LTV. Net proceeds = loan - initial
     loan payoff - refinance closing costs. */
  function refinance(arv, ltvPct, refiRate, refiTerm, refiClosing, initialLoan) {
    var loan = (isNum(arv) && isNum(ltvPct)) ? arv * ltvPct / 100 : null;
    var payment = monthlyPayment(loan, refiRate, refiTerm);
    var net = loan === null ? null : loan - clampNum(initialLoan, 0) - clampNum(refiClosing, 0);
    return { loan: loan, payment: payment, netProceeds: net };
  }

  /* Cash left in deal = total cash invested - net refinance proceeds.
     Null when either side cannot be computed. */
  function cashLeft(invested, netProceeds) {
    if (!isNum(invested) || !isNum(netProceeds)) { return null; }
    return invested - netProceeds;
  }

  function dscr(noiAnnual, debtAnnual) {
    if (!isNum(noiAnnual) || !isNum(debtAnnual) || debtAnnual <= 0) { return null; }
    return noiAnnual / debtAnnual;
  }

  /* Break-even occupancy, percent: (annual operating expenses + annual
     debt service) / gross scheduled annual rent x 100. */
  function breakEvenOccupancy(opExAnnual, debtAnnual, grossAnnual) {
    if (!isNum(opExAnnual) || !isNum(debtAnnual) || !isNum(grossAnnual) || grossAnnual <= 0) { return null; }
    return (opExAnnual + debtAnnual) / grossAnnual * 100;
  }

  /* Cap rate on all-in cost, percent: annual NOI / all-in cost x 100. */
  function capRate(noiAnnual, allIn) {
    if (!isNum(noiAnnual) || !isNum(allIn) || allIn <= 0) { return null; }
    return noiAnnual / allIn * 100;
  }

  /* Cash-on-cash return, decimal: annual cash flow / cash left in deal.
     Only when cash left is greater than 0; when cash left is 0 or
     negative the capital is already out and the ratio is N/A. */
  function cashOnCash(annualCashFlow, leftInDeal) {
    if (!isNum(annualCashFlow) || !isNum(leftInDeal) || leftInDeal <= 0) { return null; }
    return annualCashFlow / leftInDeal;
  }

  /* Monthly rent as percent of all-in cost. */
  function rentRatio(marketRent, allIn) {
    if (!isNum(marketRent) || !isNum(allIn) || allIn <= 0) { return null; }
    return marketRent / allIn * 100;
  }

  /* Usable rent comp = address + rent over 0 + grade + source + date.
     Minimum 2 usable rent comps for a GO. */
  function usableRentComps(comps) {
    var list = Array.isArray(comps) ? comps : [];
    var usable = list.filter(function (c) {
      return c && typeof c.address === "string" && c.address.trim() !== "" &&
        isNum(c.rent) && c.rent > 0 &&
        typeof c.grade === "string" && c.grade !== "" &&
        typeof c.source === "string" && c.source.trim() !== "" &&
        typeof c.date === "string" && c.date !== "";
    });
    return { total: list.length, usable: usable.length, usableList: usable };
  }

  /* Kill switch. E3 contract, carried from the 2026-11-04 E3 build:
     cash left in deal cannot be computed because ARV is N/A, because
     repair scope is N/A (repairs base blank), or because purchase
     price is N/A. A kill is a successful run, recommendation PASS. */
  function evaluateKills(input) {
    var fired = [];
    if (!isNum(input.arv)) { fired.push("ARV is N/A"); }
    if (!isNum(input.repBase)) { fired.push("repair scope is N/A (repairs base is blank)"); }
    if (!isNum(input.purchase)) { fired.push("purchase price is N/A"); }
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    return { killActive: fired.length > 0, fired: fired };
  }

  function dscrBand(dscrValue) {
    if (!isNum(dscrValue)) { return "unknown"; }
    if (dscrValue < 1.0) { return "kill"; }
    if (dscrValue < 1.25) { return "thin"; }
    return "comfortable";
  }

  /* Risk flags, carried from the 2026-11-04 E3 build. Flags are not
     kills by themselves. Inputs are the computed deal numbers plus
     grade, usable comp count, and checked manual risk labels. */
  function riskFlags(input) {
    var flags = [];
    if (isNum(input.dscr) && input.dscr < 1) {
      flags.push("DSCR below 1.00 on base NOI (" + input.dscr.toFixed(3) + ")");
    }
    if (isNum(input.baseCf) && input.baseCf < 0) {
      flags.push("Negative base cash flow (" + fmt2(input.baseCf) + " / mo)");
    }
    if (isNum(input.breakEvenPct)) {
      if (input.breakEvenPct > 100) {
        flags.push("Break-even occupancy above 100% (" + input.breakEvenPct.toFixed(2) + "%)");
      } else if (input.breakEvenPct > 90) {
        flags.push("Break-even occupancy above 90% (" + input.breakEvenPct.toFixed(2) + "%)");
      }
    }
    if (input.grade === "D") { flags.push("Rent grade D: seller claim only, lease proxy"); }
    if (isNum(input.usableComps) && input.usableComps < 2) {
      flags.push("Fewer than 2 usable rent comps (" + input.usableComps + ")");
    }
    if (isNum(input.pesCf) && input.pesCf < 0 && isNum(input.baseCf) && input.baseCf >= 0) {
      flags.push("Pessimistic cash flow negative while base is positive");
    }
    if (isNum(input.cashLeft) && isNum(input.allIn) && input.allIn > 0 && input.cashLeft / input.allIn > 0.50) {
      flags.push("Cash left in deal above 50% of all-in cost");
    }
    (input.manualRisks || []).forEach(function (label) { flags.push(label); });
    return flags;
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
      schema_version: "e3-rental-brrrr-receipt.v1.0",
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
    monthlyPayment: monthlyPayment,
    scenario: scenario,
    scenarioInputs: scenarioInputs,
    allInCost: allInCost,
    cashInvested: cashInvested,
    refinance: refinance,
    cashLeft: cashLeft,
    dscr: dscr,
    breakEvenOccupancy: breakEvenOccupancy,
    capRate: capRate,
    cashOnCash: cashOnCash,
    rentRatio: rentRatio,
    usableRentComps: usableRentComps,
    evaluateKills: evaluateKills,
    dscrBand: dscrBand,
    riskFlags: riskFlags,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
