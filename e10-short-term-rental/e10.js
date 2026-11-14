/* E10 Short-Term / Mid-Term Rental Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E10).
   Mechanics carried from the 2026-11-04 E10 build
   (~/workspace/e10-short-term-rental-site/index.html, 78,037 bytes,
   MD5 58b19d97ec5343dd401ed1702005c07c, live at
   https://e10-short-term-rental.pages.dev/, HTTP 200, byte-identical).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E10 = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isNum(x) {
    return typeof x === "number" && isFinite(x);
  }

  function clampNum(x, fallback) {
    return isNum(x) ? x : fallback;
  }

  /* Gate, kill, and risk definitions, carried verbatim from the
     2026-11-04 E10 build, sections 11 (gates), 13 (E13 kills),
     and 09 (regulation risks). */
  var GATES = [
    { id: "address_parcel", label: "Address / parcel gate: address and parcel confirmed from at least 2 public sources" },
    { id: "source", label: "Source gate: every ADR, occupancy, rent, zoning, and ordinance fact carries a source reference and date" },
    { id: "legality", label: "Legality gate: zoning, HOA, and ordinance verified from the map, documents, and ordinance text, not from a seller claim" },
    { id: "no_hallucination", label: "No-hallucination gate: no invented prices, occupancy, ADR, or ordinance text; unverifiable fields are N/A" },
    { id: "furnishing", label: "Furnishing gate: furnishing total is the sum of priced lines, or N/A with the missing source named" },
    { id: "authority", label: "Authority gate: underwriting opinion only; no offer without Jeramie; offer authorized is false" }
  ];

  var KILLS = [
    { id: "k_str_illegal", label: "STR illegal in the jurisdiction" },
    { id: "k_adr_single", label: "ADR from a single platform estimate" },
    { id: "k_hoa_prohibits", label: "HOA / condo prohibits STR" },
    { id: "k_permit_unavailable", label: "Permit / registration unavailable or denied" },
    { id: "k_be_high", label: "Break-even occupancy above 85 percent" }
  ];

  var RISKS = [
    { id: "r_pending", label: "Pending ordinance, cap, or ban under discussion" },
    { id: "r_night_cap", label: "Night cap limits booked nights below the seasonal plan" },
    { id: "r_owner_occ", label: "Owner-occupancy requirement limits use" },
    { id: "r_hoa_change", label: "HOA rule change risk: STR rule could change" },
    { id: "r_insurance", label: "STR insurance unavailable or priced above the entered number" },
    { id: "r_tax_reg", label: "Tax registration or local STR tax not confirmed" },
    { id: "r_seasonality", label: "Seasonality concentration: most revenue depends on peak season" },
    { id: "r_single_platform", label: "Single-platform dependence for bookings" },
    { id: "r_enforcement", label: "Active enforcement or neighbor complaints on record" },
    { id: "r_furn_unbid", label: "Furnishing cost unbid: lines are estimates, not quotes" }
  ];

  function riskLabel(id) {
    var found = null;
    RISKS.forEach(function (r) { if (r.id === id) { found = r.label; } });
    return found;
  }

  function killLabel(id) {
    var found = null;
    KILLS.forEach(function (k) { if (k.id === id) { found = k.label; } });
    return found;
  }

  function seasonCalc(days, occ, adr) {
    if (days === null || occ === null || adr === null) {
      return { nights: null, revenue: null };
    }
    var nights = days * (occ / 100);
    return { nights: nights, revenue: nights * adr };
  }

  /* Full deal computation. Input is a plain object of numbers (or
     null), select strings, and id arrays; see the test file for the
     exact shape. Returns every computed value plus statuses, gates,
     kills, flags, choice, and recommendation, mirroring the
     2026-11-04 E10 build calc() line for line, including its carried
     quirks, which are noted where they occur. */
  function compute(input) {
    var i = input || {};

    /* Section 03: primary ADR and occupancy, average of sources present. */
    var adr1 = isNum(i.adr1) ? i.adr1 : null;
    var adr2 = isNum(i.adr2) ? i.adr2 : null;
    var adrVals = [];
    if (adr1 !== null) { adrVals.push(adr1); }
    if (adr2 !== null) { adrVals.push(adr2); }
    var adrCount = adrVals.length;
    var primaryAdr = adrCount
      ? adrVals.reduce(function (a, b) { return a + b; }, 0) / adrCount
      : null;
    var occ1 = isNum(i.occ1) ? i.occ1 : null;
    var occ2 = isNum(i.occ2) ? i.occ2 : null;
    var occVals = [];
    if (occ1 !== null) { occVals.push(occ1); }
    if (occ2 !== null) { occVals.push(occ2); }
    var primaryOcc = occVals.length
      ? occVals.reduce(function (a, b) { return a + b; }, 0) / occVals.length
      : null;
    var primaryGross = (primaryAdr !== null && primaryOcc !== null)
      ? primaryAdr * (primaryOcc / 100) * 365
      : null;

    /* Seasonality. Booked nights = days x occupancy, revenue = nights x ADR. */
    var peak = seasonCalc(isNum(i.peakDays) ? i.peakDays : null,
      isNum(i.peakOcc) ? i.peakOcc : null, isNum(i.peakAdr) ? i.peakAdr : null);
    var shoulder = seasonCalc(isNum(i.shoulderDays) ? i.shoulderDays : null,
      isNum(i.shoulderOcc) ? i.shoulderOcc : null,
      isNum(i.shoulderAdr) ? i.shoulderAdr : null);
    var off = seasonCalc(isNum(i.offDays) ? i.offDays : null,
      isNum(i.offOcc) ? i.offOcc : null, isNum(i.offAdr) ? i.offAdr : null);
    var seasonDays = clampNum(i.peakDays, 0) + clampNum(i.shoulderDays, 0) +
      clampNum(i.offDays, 0);
    var seasonComplete = peak.revenue !== null && shoulder.revenue !== null &&
      off.revenue !== null;
    var totalNights = seasonComplete
      ? peak.nights + shoulder.nights + off.nights
      : null;
    var seasonGross = seasonComplete
      ? peak.revenue + shoulder.revenue + off.revenue
      : null;
    var blendedAdr = (seasonGross !== null && totalNights)
      ? seasonGross / totalNights
      : null;
    var blendedOcc = totalNights !== null ? totalNights / 365 : null;
    var grossMethod = "N/A", annualGross = null;
    if (seasonComplete && seasonDays === 365) {
      grossMethod = "Seasonal"; annualGross = seasonGross;
    } else if (primaryGross !== null) {
      grossMethod = "Primary (ADR x occupancy x 365)"; annualGross = primaryGross;
    }
    var seasonWarning = seasonComplete && seasonDays !== 365;

    /* Section 02: legality warnings, carried from the source. */
    var strLegal = i.strLegal || "";
    var hoaStatus = i.hoaStatus || "";
    var legalWarning = "";
    if (strLegal === "illegal") {
      legalWarning = "STR is illegal in this jurisdiction. This is a kill condition. Recommendation is PASS in section 13.";
    } else if (hoaStatus === "prohibits") {
      legalWarning = "HOA prohibits STR. This is a kill condition. Recommendation is PASS in section 13.";
    }

    /* Section 04: furnishing. Total is the sum of the lines.
       Amortisation uses a 60 month useful life, stated as an assumption. */
    var furnTotal = clampNum(i.furnFurniture, 0) + clampNum(i.furnAppliances, 0) +
      clampNum(i.furnLinens, 0) + clampNum(i.furnDecor, 0) +
      clampNum(i.furnTech, 0) + clampNum(i.furnSupplies, 0) +
      clampNum(i.furnPhoto, 0) + clampNum(i.furnOther, 0);
    var furnAmort = furnTotal / 60;
    var cashInvested = clampNum(i.downPayment, 0) + clampNum(i.closingCosts, 0) +
      furnTotal;

    /* Section 05: fixed and variable costs. PITI is entered monthly;
       this tool does not compute a mortgage payment. */
    var fixedEx = clampNum(i.costPiti, 0) + clampNum(i.costHoa, 0) +
      clampNum(i.costUtilities, 0) + clampNum(i.costInternet, 0) +
      clampNum(i.costInsurance, 0) + clampNum(i.costSupplies, 0) +
      clampNum(i.costMaint, 0) + clampNum(i.costStrTax, 0);
    var fixedMonthly = fixedEx + furnAmort;
    var avgStay = isNum(i.avgStay) ? i.avgStay : null;
    var turnovers = (totalNights !== null && avgStay !== null && avgStay > 0)
      ? totalNights / avgStay
      : null;
    var cleanAnnual = turnovers === null
      ? null
      : turnovers * clampNum(i.cleanPerTurn, 0);
    var platformAnnual = annualGross === null
      ? null
      : annualGross * (clampNum(i.platformPct, 0) / 100);
    var mgmtAnnual = annualGross === null
      ? null
      : annualGross * (clampNum(i.mgmtPct, 0) / 100);

    /* Section 06: LTR fallback and MTR. Carried quirk: LTR annual
       costs are null unless at least one of PITI, LTR insurance, or
       maintenance was entered, while MTR annual costs are always
       computed because fixedMonthly is always a number. */
    var ltrRent = isNum(i.ltrRent) ? i.ltrRent : null;
    var ltrVac = isNum(i.ltrVacancy) ? i.ltrVacancy : null;
    var ltrGross = (ltrRent !== null && ltrVac !== null)
      ? ltrRent * 12 * (1 - ltrVac / 100)
      : null;
    var ltrCostsAnnual = (isNum(i.costPiti) || isNum(i.ltrInsurance) ||
      isNum(i.costMaint))
      ? (clampNum(i.costPiti, 0) + clampNum(i.ltrInsurance, 0) +
        clampNum(i.costMaint, 0)) * 12
      : null;
    var ltrCf = (ltrGross !== null && ltrCostsAnnual !== null)
      ? ltrGross - ltrCostsAnnual
      : null;
    var mtrRent = isNum(i.mtrRent) ? i.mtrRent : null;
    var mtrOcc = isNum(i.mtrOcc) ? i.mtrOcc : null;
    var mtrGross = (mtrRent !== null && mtrOcc !== null)
      ? mtrRent * 12 * (mtrOcc / 100)
      : null;
    var mtrCostsAnnual = fixedMonthly * 12 + clampNum(i.mtrCleanMonthly, 0) * 12;
    var mtrCf = mtrGross !== null ? mtrGross - mtrCostsAnnual : null;

    /* Section 07: break-even, solved from fixed costs and the
       variable rates, not guessed. */
    var varRate = (clampNum(i.platformPct, 0) + clampNum(i.mgmtPct, 0)) / 100;
    var cleanFactor = (blendedAdr !== null && avgStay !== null && avgStay > 0)
      ? clampNum(i.cleanPerTurn, 0) / (blendedAdr * avgStay)
      : null;
    var denom = cleanFactor === null ? null : 1 - varRate - cleanFactor;
    var beRevenue = (denom !== null && denom > 0) ? fixedMonthly / denom : null;
    var beOcc = (beRevenue !== null && blendedAdr !== null)
      ? beRevenue / (blendedAdr * 30.4167)
      : null;
    var beNights = (beRevenue !== null && blendedAdr !== null)
      ? beRevenue / blendedAdr
      : null;
    var beMargin = (blendedOcc !== null && beOcc !== null)
      ? blendedOcc - beOcc
      : null;

    /* Section 08: STR cash flow, stabilized and Year 1. Year 1 uses
       the upfront furnishing total instead of amortisation, so Year 1
       is lower by design. */
    var strCostsStab = (annualGross !== null && cleanAnnual !== null &&
      platformAnnual !== null && mgmtAnnual !== null)
      ? fixedMonthly * 12 + platformAnnual + mgmtAnnual + cleanAnnual
      : null;
    var strCfStab = (annualGross !== null && strCostsStab !== null)
      ? annualGross - strCostsStab
      : null;
    var strCfMonthly = strCfStab === null ? null : strCfStab / 12;
    var strCocStab = (strCfStab !== null && cashInvested > 0)
      ? strCfStab / cashInvested
      : null;
    var strCfY1 = (annualGross !== null && cleanAnnual !== null &&
      platformAnnual !== null && mgmtAnnual !== null)
      ? annualGross - (fixedEx * 12 + platformAnnual + mgmtAnnual + cleanAnnual) - furnTotal
      : null;
    var strCocY1 = (strCfY1 !== null && cashInvested > 0)
      ? strCfY1 / cashInvested
      : null;

    /* Section 09: regulation risk flags, from the checked boxes. */
    var riskIds = Array.isArray(i.riskIds) ? i.riskIds : [];
    var riskFired = [];
    riskIds.forEach(function (id) {
      var label = riskLabel(id);
      if (label) { riskFired.push(label); }
    });

    /* Section 11: gates fail closed. */
    var gateValues = i.gates || {};
    var gatesPassed = [], gatesFailed = [];
    GATES.forEach(function (g) {
      var v = gateValues[g.id] || "hold";
      if (v === "pass") { gatesPassed.push(g.id); } else { gatesFailed.push(g.id); }
    });

    /* Section 13: E13 kill switch. AUTO kills are computed from the
       inputs; manual kills are the checked boxes not already auto.
       Carried quirk: the permit kill is a manual checkbox in the
       source, but the source calc() also fires it on the AUTO path
       when the box is checked, so it is treated as auto here and
       excluded from the manual list, exactly as in the source.
       Carried quirk: the ADR auto kill fires when exactly one ADR
       source is present regardless of the single-platform select,
       and does not fire when no ADR source is present even if the
       select says single platform only. */
    var manualIds = Array.isArray(i.manualKillIds) ? i.manualKillIds : [];
    var autoKills = [], autoKillIds = [];
    if (strLegal === "illegal") {
      autoKills.push("STR illegal in the jurisdiction");
      autoKillIds.push("k_str_illegal");
    }
    if (adrCount === 1 ||
      ((i.singlePlatform || "no") === "yes" && adrCount > 0)) {
      autoKills.push("ADR from a single platform estimate");
      autoKillIds.push("k_adr_single");
    }
    if (hoaStatus === "prohibits") {
      autoKills.push("HOA / condo prohibits STR");
      autoKillIds.push("k_hoa_prohibits");
    }
    if (manualIds.indexOf("k_permit_unavailable") !== -1) {
      autoKills.push("Permit / registration unavailable or denied");
      autoKillIds.push("k_permit_unavailable");
    }
    var manualKills = [];
    manualIds.forEach(function (id) {
      if (autoKillIds.indexOf(id) === -1) {
        var label = killLabel(id);
        if (label) { manualKills.push(label); }
      }
    });
    var killFired = autoKills.concat(manualKills);
    var killActive = killFired.length > 0;

    /* Section 10: STR / MTR / LTR choice. Winner is the highest
       stabilized monthly cash flow, unless a kill fires (PASS) or
       STR wins with 3 or more regulation risk flags (then the next
       best strategy is recommended and the STR win is flagged as
       high risk). Carried quirk: in the high-risk STR-win case the
       source names the winner "MTR / LTR - STR win flagged high
       risk" instead of the actual next-best strategy; carried
       verbatim. */
    var strM = strCfMonthly;
    var mtrM = mtrCf === null ? null : mtrCf / 12;
    var ltrM = ltrCf === null ? null : ltrCf / 12;
    var winner = "N/A", reason = "";
    if (killActive) {
      winner = "PASS - do not proceed as STR";
      reason = "Kill condition fired: " + killFired.join("; ") +
        ". The STR exit is stopped. LTR and MTR cash flows are shown for information only and are not a go signal for this deal as underwritten.";
    } else if (strM === null || mtrM === null || ltrM === null) {
      winner = "N/A - incomplete";
      reason = "One or more strategy cash flows are N/A. Enter seasonality, costs, MTR rent and occupancy, and LTR rent and vacancy to compare all three strategies.";
    } else {
      var ranked = [{ n: "STR", v: strM }, { n: "MTR", v: mtrM },
        { n: "LTR", v: ltrM }].sort(function (a, b) { return b.v - a.v; });
      if (ranked[0].n === "STR" && riskFired.length >= 3) {
        winner = "MTR / LTR - STR win flagged high risk";
        reason = "STR has the highest monthly cash flow at " + moneyText(strM) +
          ", ahead of " + ranked[1].n + " at " + moneyText(ranked[1].v) +
          " and " + ranked[2].n + " at " + moneyText(ranked[2].v) +
          ", but STR carries " + riskFired.length + " regulation risk flags (" +
          riskFired.join("; ") + "). Under the stated choice rule the next best strategy is recommended instead, and the STR win is flagged as high risk, not as a go signal.";
      } else {
        winner = ranked[0].n;
        reason = ranked[0].n + " wins on stabilized monthly cash flow at " +
          moneyText(ranked[0].v) + ", ahead of " + ranked[1].n + " at " +
          moneyText(ranked[1].v) + " and " + ranked[2].n + " at " +
          moneyText(ranked[2].v) + ". Break-even occupancy is " +
          pctText(beOcc) + " against blended occupancy " + pctText(blendedOcc) +
          ", a margin of " + marginText(beMargin) +
          ". Regulation risk flags: " + riskFired.length + ".";
      }
    }

    /* Recommendation, carried from section 13. PASS is a successful
       run, not a failed one. */
    var recommendation = "", recKind = "", recDetail = "";
    if (killActive) {
      recommendation = "PASS"; recKind = "pass";
      recDetail = "PASS. Kill condition fired: " + killFired.join("; ") +
        ". A PASS is a successful run, not a failed one. Do not proceed as an STR on this deal as underwritten.";
    } else if (gatesFailed.length) {
      recommendation = "HOLD"; recKind = "hold";
      recDetail = "HOLD. Failed or held gates: " + gatesFailed.join(", ") +
        ". Cash flow numbers below are held numbers only. No offer without Jeramie.";
    } else if (strM === null || mtrM === null || ltrM === null) {
      recommendation = "HOLD"; recKind = "hold";
      recDetail = "HOLD. Cash flow comparison is incomplete. See section 10.";
    } else {
      recommendation = "READY FOR REVIEW - " + winner; recKind = "review";
      recDetail = "READY FOR REVIEW. All gates pass and no kill fired. Recommended strategy: " +
        winner + ". This is still an underwriting opinion only, not an offer. No offer without Jeramie.";
    }

    /* Completeness, carried from the sticky panel and section 11. */
    var items = [
      ["Street address", !!(i.address && String(i.address).trim())],
      ["Parcel ID", !!(i.parcelId && String(i.parcelId).trim())],
      ["Zoning district", !!(i.zoning && String(i.zoning).trim())],
      ["Ordinance citation", !!(i.ordinanceCite && String(i.ordinanceCite).trim())],
      ["ADR source 1", adr1 !== null],
      ["ADR source 2", adr2 !== null],
      ["Occupancy source", occ1 !== null],
      ["Seasonality complete (365 days)", seasonComplete && seasonDays === 365],
      ["Furnishing lines entered", furnTotal > 0],
      ["PITI entered", isNum(i.costPiti)],
      ["LTR rent entered", ltrRent !== null],
      ["MTR rent entered", mtrRent !== null]
    ];
    var done = items.filter(function (x) { return x[1]; }).length;
    var pct = Math.round(done / items.length * 100);
    var missing = items.filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; });

    return {
      primaryAdr: primaryAdr, primaryOcc: primaryOcc, adrCount: adrCount,
      primaryGross: primaryGross,
      peak: peak, shoulder: shoulder, off: off,
      seasonDays: seasonDays, seasonComplete: seasonComplete,
      totalNights: totalNights, seasonGross: seasonGross,
      blendedAdr: blendedAdr, blendedOcc: blendedOcc,
      grossMethod: grossMethod, annualGross: annualGross,
      seasonWarning: seasonWarning, legalWarning: legalWarning,
      furnTotal: furnTotal, furnAmort: furnAmort, cashInvested: cashInvested,
      fixedEx: fixedEx, fixedMonthly: fixedMonthly,
      turnovers: turnovers, cleanAnnual: cleanAnnual,
      platformAnnual: platformAnnual, mgmtAnnual: mgmtAnnual,
      ltrGross: ltrGross, ltrCostsAnnual: ltrCostsAnnual, ltrCf: ltrCf,
      ltrCfMonthly: ltrCf === null ? null : ltrCf / 12,
      mtrGross: mtrGross, mtrCostsAnnual: mtrCostsAnnual, mtrCf: mtrCf,
      mtrCfMonthly: mtrM,
      varRate: varRate, cleanFactor: cleanFactor,
      beRevenue: beRevenue, beOcc: beOcc, beNights: beNights,
      beMargin: beMargin,
      strGross: annualGross, strCostsStab: strCostsStab,
      strCfStab: strCfStab, strCfMonthly: strCfMonthly,
      strCocStab: strCocStab, strCfY1: strCfY1,
      strCfY1Monthly: strCfY1 === null ? null : strCfY1 / 12,
      strCocY1: strCocY1,
      riskFired: riskFired, riskCount: riskFired.length,
      gatesPassed: gatesPassed, gatesFailed: gatesFailed,
      gatesOk: gatesFailed.length === 0,
      autoKills: autoKills, autoKillIds: autoKillIds,
      manualKills: manualKills, killFired: killFired, killActive: killActive,
      choiceStr: strM, choiceMtr: mtrM, choiceLtr: ltrM,
      winner: winner, reason: reason,
      recommendation: recommendation, recKind: recKind, recDetail: recDetail,
      completeness: { pct: pct, done: done, total: items.length, missing: missing }
    };
  }

  function moneyText(v) {
    if (v === null || v === undefined || !isFinite(v)) { return "N/A"; }
    if (v < 0) {
      return "-$" + Math.abs(v).toLocaleString("en-US",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return "$" + v.toLocaleString("en-US",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pctText(v) {
    if (v === null || v === undefined || !isFinite(v)) { return "N/A"; }
    return (v * 100).toFixed(2) + "%";
  }

  function marginText(v) {
    if (v === null || v === undefined || !isFinite(v)) { return "N/A"; }
    return (v * 100).toFixed(2) + " points";
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
      schema_version: "e10-short-term-rental-receipt.v1.0",
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
    GATES: GATES,
    KILLS: KILLS,
    RISKS: RISKS,
    compute: compute,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
