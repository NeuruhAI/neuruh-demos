/* E6 Self-Storage Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E6).
   Mechanics carried from the 2026-11-04 E6 build
   (~/workspace/e6-self-storage-site/index.html, 73,009 bytes, live at
   https://e6-self-storage.pages.dev/, HTTP 200, MD5
   155a97636d7bae39cdbd430f11c45087).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E6 = factory();
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

  /* A unit row is valid only when size, count, and rate are all
     entered and positive, occupied is entered, and occupied never
     exceeds count. A row that is partly filled but not valid is an
     error, not a silent skip. */
  function validUnit(u) {
    if (!u) { return false; }
    return isNum(u.size) && u.size > 0 &&
      isNum(u.count) && u.count > 0 &&
      isNum(u.rate) && u.rate > 0 &&
      isNum(u.occupied) && u.occupied >= 0 && u.occupied <= u.count;
  }

  function unitRows(units) {
    var list = Array.isArray(units) ? units : [];
    return list.map(function (u) {
      var pgi = (isNum(u.count) && isNum(u.rate)) ? u.count * u.rate : null;
      var actual = (isNum(u.occupied) && isNum(u.rate)) ? u.occupied * u.rate : null;
      return {
        type: u.type || "", size: u.size, count: u.count,
        occupied: u.occupied, rate: u.rate,
        pgiMonthly: pgi, actualMonthly: actual, valid: validUnit(u)
      };
    });
  }

  /* Unit mix totals. Only valid rows count toward totals. A row with
     any of count, occupied, or rate entered that is not valid sets
     unitError. Null when no valid row exists. */
  function unitTotals(units) {
    var rows = unitRows(units);
    var valid = rows.filter(function (r) { return r.valid; });
    var unitError = false;
    rows.forEach(function (r) {
      if (isNum(r.count) && isNum(r.occupied) && r.occupied > r.count) { unitError = true; }
      if ((isNum(r.count) || isNum(r.occupied) || isNum(r.rate)) && !r.valid) { unitError = true; }
    });
    if (valid.length === 0) {
      return {
        rows: rows, validRows: valid, unitError: unitError,
        totalUnits: null, totalOccupied: null, totalSf: null,
        occupancy: null, pgiMonthly: null, pgiAnnual: null,
        actualMonthly: null, actualAnnual: null, vacancyLoss: null,
        hasUnits: false
      };
    }
    var totalUnits = 0, totalOcc = 0, totalSf = 0, pgiM = 0, actualM = 0;
    valid.forEach(function (r) {
      totalUnits += r.count;
      totalOcc += r.occupied;
      totalSf += r.count * r.size;
      pgiM += r.pgiMonthly;
      actualM += r.actualMonthly;
    });
    var pgiAnnual = pgiM * 12;
    var actualAnnual = actualM * 12;
    return {
      rows: rows, validRows: valid, unitError: unitError,
      totalUnits: totalUnits, totalOccupied: totalOcc, totalSf: totalSf,
      occupancy: totalUnits > 0 ? totalOcc / totalUnits : null,
      pgiMonthly: pgiM, pgiAnnual: pgiAnnual,
      actualMonthly: actualM, actualAnnual: actualAnnual,
      vacancyLoss: pgiAnnual - actualAnnual,
      hasUnits: totalUnits > 0
    };
  }

  /* A rate comp row is usable only when facility, unit size, rate,
     source name, source date, and source reference are all filled
     and the rate is greater than 0. Distinct sources are compared
     case-insensitively on the source name. */
  function rateRows(rates) {
    var list = Array.isArray(rates) ? rates : [];
    return list.map(function (r) {
      var usable = typeof r.facility === "string" && r.facility.trim() !== "" &&
        typeof r.size === "string" && r.size.trim() !== "" &&
        isNum(r.rate) && r.rate > 0 &&
        typeof r.source === "string" && r.source.trim() !== "" &&
        typeof r.date === "string" && r.date !== "" &&
        typeof r.ref === "string" && r.ref.trim() !== "";
      return {
        facility: r.facility || "", size: r.size || "", rate: r.rate,
        source: r.source || "", date: r.date || "", ref: r.ref || "",
        usable: usable
      };
    });
  }

  function rateTotals(rates, validUnits) {
    var rows = rateRows(rates);
    var usable = rows.filter(function (r) { return r.usable; });
    var seen = [];
    usable.forEach(function (r) {
      var s = r.source.trim().toLowerCase();
      if (seen.indexOf(s) === -1) { seen.push(s); }
    });
    var distinctSources = seen.length;
    var sourceNames = [];
    usable.forEach(function (r) {
      var s = r.source.trim();
      if (sourceNames.indexOf(s) === -1) { sourceNames.push(s); }
    });
    function rangeOf(vals) {
      var xs = vals.filter(function (x) { return isNum(x); });
      if (xs.length === 0) { return null; }
      return { low: Math.min.apply(null, xs), high: Math.max.apply(null, xs) };
    }
    var subjRates = (validUnits || []).map(function (u) { return u.rate; });
    return {
      rows: rows, usable: usable, usableCount: usable.length,
      distinctSources: distinctSources, sourceNames: sourceNames,
      rateRange: rangeOf(usable.map(function (r) { return r.rate; })),
      subjectRateRange: rangeOf(subjRates)
    };
  }

  /* Operating expenses: sum of the eight lines. Null when no line is
     entered; a blank line is zero in the sum and is named as
     unentered in the receipt. */
  function opexTotal(lines) {
    var list = Array.isArray(lines) ? lines : [];
    var entered = list.filter(function (x) { return isNum(x); });
    if (entered.length === 0) { return null; }
    return list.reduce(function (a, x) { return a + clampNum(x, 0); }, 0);
  }

  /* Stabilized math, carried from the 2026-11-04 E6 build, section 05.
     Stabilized GPR = PGI annual x stabilized occupancy.
     Stabilized EGI = stabilized GPR + other income.
     Stabilized NOI = stabilized EGI - total operating expenses.
     Value = stabilized NOI / cap rate.
     Break-even occupancy = (total opex - other income) / PGI annual.
     Break-even rent monthly = (total opex - other income) / 12 / occupied units. */
  function stabilized(input) {
    var pgiAnnual = input.pgiAnnual;
    var actualAnnual = input.actualAnnual;
    var totalUnits = input.totalUnits;
    var totalOcc = input.totalOccupied;
    var totalSf = input.totalSf;
    var stabOccPct = input.stabOccPct;
    var other = clampNum(input.otherIncome, 0);
    var capPct = input.capPct;
    var opex = input.opex;
    var stabGPR = (isNum(pgiAnnual) && isNum(stabOccPct)) ? pgiAnnual * stabOccPct / 100 : null;
    var stabEGI = stabGPR !== null ? stabGPR + other : null;
    var actualEGI = isNum(actualAnnual) ? actualAnnual + other : null;
    var actualNOI = (actualEGI !== null && isNum(opex)) ? actualEGI - opex : null;
    var stabNOI = (stabEGI !== null && isNum(opex)) ? stabEGI - opex : null;
    var opexRatio = (isNum(opex) && stabEGI !== null && stabEGI !== 0) ? opex / stabEGI : null;
    var value = (stabNOI !== null && isNum(capPct) && capPct > 0) ? stabNOI / (capPct / 100) : null;
    var beOcc = (isNum(opex) && isNum(pgiAnnual) && pgiAnnual > 0) ? (opex - other) / pgiAnnual : null;
    var beRent = (isNum(opex) && isNum(totalOcc) && totalOcc > 0) ? (opex - other) / 12 / totalOcc : null;
    return {
      stabGPR: stabGPR, stabEGI: stabEGI, actualEGI: actualEGI,
      actualNOI: actualNOI, stabNOI: stabNOI, opexRatio: opexRatio,
      value: value, beOcc: beOcc, beRent: beRent,
      noiPerUnit: (stabNOI !== null && isNum(totalUnits) && totalUnits > 0) ? stabNOI / totalUnits : null,
      noiPerSF: (stabNOI !== null && isNum(totalSf) && totalSf > 0) ? stabNOI / totalSf : null
    };
  }

  /* Expansion upside, carried from the 2026-11-04 E6 build, section 06.
     Added rent uses the stabilized occupancy from section 05.
     Yield on cost = added NOI / expansion cost. */
  function expansion(input) {
    var units = input.expUnits, rate = input.expRate, cost = input.expCost;
    var pct = input.expOpexPct, stabOccPct = input.stabOccPct;
    var expRent = (isNum(units) && isNum(rate) && isNum(stabOccPct))
      ? units * rate * 12 * stabOccPct / 100 : null;
    var expOpex = (expRent !== null && isNum(pct)) ? expRent * pct / 100 : null;
    var expNOI = (expRent !== null && expOpex !== null) ? expRent - expOpex : null;
    var expYield = (expNOI !== null && isNum(cost) && cost > 0) ? expNOI / cost : null;
    return {
      expRent: expRent, expOpex: expOpex, expNOI: expNOI,
      expYield: expYield,
      costPerUnit: (isNum(cost) && isNum(units) && units > 0) ? cost / units : null
    };
  }

  /* Remote-management potential, carried from the 2026-11-04 E6 build,
     section 07. Score is the count of remote-ready systems in place
     divided by 6. Saving is onsite cost minus remote cost. */
  function remote(input) {
    var count = input.remoteCount || 0;
    var score = count / 6;
    var onsite = input.onsiteCost, remoteCost = input.remoteCost;
    var saving = (isNum(onsite) && isNum(remoteCost)) ? onsite - remoteCost : null;
    var verdict;
    if (score >= 0.83 && saving !== null && saving > 0) {
      verdict = "Strong remote candidate: most systems in place and remote costs less than onsite.";
    } else if (score >= 0.5) {
      verdict = "Partially remote-ready: some systems in place, onsite cover is still likely needed.";
    } else {
      verdict = "Onsite management likely required: fewer than half the remote systems are in place.";
    }
    return { count: count, score: score, saving: saving, verdict: verdict };
  }

  /* Kill switch. E6 contract, carried from the 2026-11-04 E6 build,
     section E13. The two AUTO kills are computed from the occupancy
     verification and the rate sources and cannot be unchecked away.
     A kill is a successful run, recommendation PASS. */
  function evaluateKills(input) {
    var fired = [];
    if (input.occVerify === "unverified") {
      fired.push("Occupancy unverifiable");
    }
    var usableCount = input.usableCount || 0;
    var distinctSources = input.distinctSources || 0;
    if (usableCount > 0 && distinctSources < 2) {
      fired.push("Street rates from a single source");
    }
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    return { killActive: fired.length > 0, fired: fired };
  }

  /* Risk flags, carried from the 2026-11-04 E6 build. Flags are not
     kills by themselves. */
  function riskFlags(input) {
    var flags = [];
    if (input.occVerify === "owner_statement") {
      flags.push("Occupancy from owner statement only, not a rent roll");
    }
    if (input.occVerify === "site_count") {
      flags.push("Occupancy from site count only, not a rent roll");
    }
    if (input.occTrend === "Falling") {
      flags.push("Occupancy falling over 12 months");
    }
    if (isNum(input.delinquencyPct) && input.delinquencyPct > 5) {
      flags.push("Delinquency above 5 percent");
    }
    if (isNum(input.usableCount) && input.usableCount > 0 && input.usableCount < 3) {
      flags.push("Fewer than 3 usable rate comps");
    }
    if (input.expPermit === "Not permitted / unknown") {
      flags.push("Expansion not permitted or unknown");
    }
    if (isNum(input.opexRatio) && input.opexRatio > 0.5) {
      flags.push("Operating expense ratio above 50 percent");
    }
    if (isNum(input.stabNOI) && input.stabNOI < 0) {
      flags.push("Stabilized NOI is negative");
    }
    if (isNum(input.remoteScore) && input.remoteScore < 0.5) {
      flags.push("Remote readiness below 50 percent");
    }
    if (input.unitError) {
      flags.push("Unit mix row incomplete or occupied above count");
    }
    (input.manualRisks || []).forEach(function (label) { flags.push(label); });
    return flags;
  }

  /* Recommendation, carried from the 2026-11-04 E6 build. A kill
     means PASS. Otherwise gates, unit mix, and rate evidence decide
     between HOLD and READY FOR HUMAN REVIEW. No offer is ever made. */
  function recommendation(input) {
    if (input.killActive) { return "PASS - do not proceed"; }
    if (input.gatesOk === false) { return "HOLD"; }
    if (!input.hasUnits || (isNum(input.usableCount) && input.usableCount < 3)) {
      return "HOLD - evidence incomplete";
    }
    return "READY FOR HUMAN REVIEW - no offer without Jeramie";
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
      schema_version: "e6-self-storage-receipt.v1.0",
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
    validUnit: validUnit,
    unitRows: unitRows,
    unitTotals: unitTotals,
    rateRows: rateRows,
    rateTotals: rateTotals,
    opexTotal: opexTotal,
    stabilized: stabilized,
    expansion: expansion,
    remote: remote,
    evaluateKills: evaluateKills,
    riskFlags: riskFlags,
    recommendation: recommendation,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
