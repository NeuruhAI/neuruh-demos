/* E4 Development Feasibility Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E4).
   Mechanics carried verbatim from the 2026-11-04 E4 build
   (e4-development-feasibility-site/index.html, live at
   e4-development-feasibility.pages.dev). Every money figure this
   module computes is a MODELED ESTIMATE, NOT A VALUATION, NOT AN
   APPRAISAL. No offer, no recommendation to buy or sell. Builder
   defaults are labeled as such in index.html and are editable by
   the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E4 = factory();
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

  /* Buildable units: the smaller of proposed units and the maximum
     the zoning record allows. If only proposed is known, it stands.
     If neither is known, null. Carried from the 2026-11-04 E4 build. */
  function buildableUnits(proposed, maxAllowed) {
    if (isNum(proposed) && isNum(maxAllowed)) { return Math.min(proposed, maxAllowed); }
    if (isNum(proposed)) { return proposed; }
    return null;
  }

  function density(buildable, acres) {
    if (!isNum(buildable) || !isNum(acres) || acres <= 0) { return null; }
    return buildable / acres;
  }

  function buildableSf(siteSf, unbuildableSf) {
    if (!isNum(siteSf)) { return null; }
    return siteSf - (isNum(unbuildableSf) ? unbuildableSf : 0);
  }

  /* Hard costs. Subtotal is (buildable x per-unit) + site work.
     Contingency is a percent of the subtotal. Low and High scenarios
     scale the Base hard total by 0.90 and 1.10. Those factors come
     from the 2026-11-04 E4 build. Returns each step plus a human
     readable working line per step. */
  function computeHardCosts(input) {
    var buildable = input.buildable;
    var hardPerUnit = isNum(input.hardPerUnit) ? input.hardPerUnit : null;
    var siteWork = isNum(input.siteWork) ? input.siteWork : 0;
    var contingencyPct = isNum(input.contingencyPct) ? input.contingencyPct : null;
    if (!isNum(buildable) || hardPerUnit === null) {
      return {
        subtotal: null, contingency: null, totalBase: null,
        totalLow: null, totalHigh: null,
        steps: ["Hard cost per unit or buildable units are missing, so hard costs cannot be computed."]
      };
    }
    var subtotal = buildable * hardPerUnit + siteWork;
    var contingency = contingencyPct === null ? null : round2(subtotal * contingencyPct / 100);
    var totalBase = round2(subtotal + (contingency === null ? 0 : contingency));
    var totalLow = totalBase === null ? null : round2(totalBase * 0.90);
    var totalHigh = totalBase === null ? null : round2(totalBase * 1.10);
    return {
      subtotal: subtotal,
      contingency: contingency,
      totalBase: totalBase,
      totalLow: totalLow,
      totalHigh: totalHigh,
      steps: [
        "Hard subtotal = " + buildable + " units x " + fmt2(hardPerUnit) + " + " + fmt2(siteWork) + " site work = " + fmt2(subtotal),
        "Contingency = " + fmt2(subtotal) + " x " + (contingencyPct === null ? "N/A" : contingencyPct + "%") + " = " + fmt2(contingency),
        "Hard total (Base) = " + fmt2(subtotal) + " + " + fmt2(contingency === null ? 0 : contingency) + " = " + fmt2(totalBase),
        "Hard total (Low) = " + fmt2(totalBase) + " x 0.90 = " + fmt2(totalLow),
        "Hard total (High) = " + fmt2(totalBase) + " x 1.10 = " + fmt2(totalHigh)
      ]
    };
  }

  /* Soft costs: six lines summed. Returns null when no line is
     entered at all, so an untouched form stays N/A instead of zero. */
  function computeSoftTotal(parts) {
    var keys = ["entitlementLegal", "architectureEngineering", "permitsFees", "financingCarrying", "marketingSales", "developerOverhead"];
    var total = 0;
    var any = false;
    keys.forEach(function (k) {
      if (isNum(parts[k])) { total += parts[k]; any = true; }
    });
    return any ? total : null;
  }

  /* Gross revenue: buildable units times average sale price per unit. */
  function computeRevenue(buildable, avgSalePrice) {
    if (!isNum(buildable) || !isNum(avgSalePrice)) { return null; }
    return buildable * avgSalePrice;
  }

  /* Required profit: target margin percent times gross revenue. */
  function requiredProfit(revenue, targetMarginPct) {
    if (!isNum(revenue) || !isNum(targetMarginPct)) { return null; }
    return round2(revenue * targetMarginPct / 100);
  }

  /* Total cost before land: hard total plus soft total. */
  function totalCostBeforeLand(hardTotal, softTotal) {
    if (!isNum(hardTotal) || !isNum(softTotal)) { return null; }
    return round2(hardTotal + softTotal);
  }

  /* Residual land value: gross revenue minus hard total minus soft
     total minus required profit. */
  function computeResidual(revenue, hardTotal, softTotal, reqProfit) {
    if (!isNum(revenue) || !isNum(hardTotal) || !isNum(softTotal) || !isNum(reqProfit)) { return null; }
    return round2(revenue - hardTotal - softTotal - reqProfit);
  }

  /* Margin before land: (gross revenue - hard total - soft total) /
     gross revenue. Returns a decimal, not a percent. */
  function marginBeforeLand(revenue, hardTotal, softTotal) {
    if (!isNum(revenue) || revenue <= 0 || !isNum(hardTotal) || !isNum(softTotal)) { return null; }
    return (revenue - hardTotal - softTotal) / revenue;
  }

  function profitAfterLand(revenue, totalCost, landAsking) {
    if (!isNum(revenue) || !isNum(totalCost) || !isNum(landAsking)) { return null; }
    return round2(revenue - totalCost - landAsking);
  }

  function marginAfterLand(revenue, profitAfter) {
    if (!isNum(revenue) || revenue <= 0 || !isNum(profitAfter)) { return null; }
    return profitAfter / revenue;
  }

  /* Timeline: entitlement + construction + sellout months. Monthly
     carrying is the financing and carrying total divided by total
     months. */
  function computeTimeline(entMonths, conMonths, sellMonths) {
    var ent = isNum(entMonths) ? entMonths : null;
    var con = isNum(conMonths) ? conMonths : null;
    var sell = isNum(sellMonths) ? sellMonths : null;
    if (ent === null && con === null && sell === null) { return { totalMonths: null }; }
    return { totalMonths: (ent === null ? 0 : ent) + (con === null ? 0 : con) + (sell === null ? 0 : sell) };
  }

  function monthlyCarrying(carryingTotal, totalMonths) {
    if (!isNum(carryingTotal) || !isNum(totalMonths) || totalMonths <= 0) { return null; }
    return round2(carryingTotal / totalMonths);
  }

  /* Builder comps. A usable comp needs address, sale price, sale
     date, and source URL. Anything less is excluded from the count. */
  function usableBuilderComps(comps) {
    var list = Array.isArray(comps) ? comps : [];
    return list.filter(function (c) {
      return c && c.address && isNum(c.sale_price) && c.sale_date && c.source_url;
    });
  }

  /* Kill switch. Contract kills carried from the 2026-11-04 E4 build:
     residual land value negative on Base costs; entitlement timeline
     unknowable; no usable builder comp (fires only once revenue is
     computable, as in the 2026-11-04 build). Manual kills are extra
     checkbox kills passed in as labels. */
  function evaluateKills(input) {
    var fired = [];
    if (isNum(input.residualBase) && input.residualBase < 0) {
      fired.push("Residual land value negative on Base costs (" + fmt2(input.residualBase) + ")");
    }
    if (input.entitlementKnown === "unknown") {
      fired.push("Entitlement timeline unknowable");
    }
    if (isNum(input.revenue) && (!isNum(input.usableCompCount) || input.usableCompCount < 1)) {
      fired.push("No builder comp");
    }
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    return { killActive: fired.length > 0, fired: fired };
  }

  /* Risk flags. Thresholds carried from the 2026-11-04 E4 build:
     thin residual under $50,000 on Base costs; residual negative on
     High hard costs; margin before land below target margin; single
     builder comp only; total timeline over 36 months; contingency
     below 5 percent; soft costs over 20 percent of hard costs;
     zoning caps units below proposal. Entitlement risk checks and
     no-legal-access are passed in by the page. */
  function riskFlags(input) {
    var flags = [];
    if (isNum(input.residualBase) && input.residualBase >= 0 && input.residualBase < 50000) {
      flags.push("Thin residual: " + fmt2(input.residualBase) + " on Base costs, under $50,000");
    }
    if (isNum(input.residualHigh) && input.residualHigh < 0) {
      flags.push("Residual turns negative on High hard costs (" + fmt2(input.residualHigh) + ")");
    }
    if (isNum(input.marginBefore) && isNum(input.targetMarginPct) && input.marginBefore < input.targetMarginPct / 100) {
      flags.push("Margin before land " + (input.marginBefore * 100).toFixed(2) + "% is below target margin " + input.targetMarginPct.toFixed(2) + "%");
    }
    if (input.usableCompCount === 1) {
      flags.push("Single builder comp only");
    }
    if (isNum(input.totalMonths) && input.totalMonths > 36) {
      flags.push("Total timeline " + input.totalMonths + " months exceeds 36 months");
    }
    if (isNum(input.contingencyPct) && input.contingencyPct < 5) {
      flags.push("Contingency " + input.contingencyPct.toFixed(2) + "% is below 5%");
    }
    if (isNum(input.softTotal) && isNum(input.hardBase) && input.hardBase > 0 && input.softTotal / input.hardBase > 0.20) {
      flags.push("Soft costs exceed 20% of hard costs");
    }
    if (isNum(input.proposed) && isNum(input.maxAllowed) && input.proposed > input.maxAllowed) {
      flags.push("Zoning caps units below proposal (" + input.proposed + " proposed, " + input.maxAllowed + " allowed)");
    }
    (input.entitlementRisks || []).forEach(function (r) { flags.push("Entitlement risk: " + r); });
    if (input.access === "No legal access") {
      flags.push("No legal access recorded");
    }
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
      schema_version: "e4-development-feasibility-receipt.v1.0",
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
    buildableUnits: buildableUnits,
    density: density,
    buildableSf: buildableSf,
    computeHardCosts: computeHardCosts,
    computeSoftTotal: computeSoftTotal,
    computeRevenue: computeRevenue,
    requiredProfit: requiredProfit,
    totalCostBeforeLand: totalCostBeforeLand,
    computeResidual: computeResidual,
    marginBeforeLand: marginBeforeLand,
    profitAfterLand: profitAfterLand,
    marginAfterLand: marginAfterLand,
    computeTimeline: computeTimeline,
    monthlyCarrying: monthlyCarrying,
    usableBuilderComps: usableBuilderComps,
    evaluateKills: evaluateKills,
    riskFlags: riskFlags,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
