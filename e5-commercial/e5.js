/* E5 Commercial Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E5).
   Mechanics carried from the 2026-11-04 E5 build
   (~/workspace/e5-commercial-site/index.html, 1037 lines, live at
   https://e5-commercial.pages.dev/, HTTP 200, MD5 3b4a2440e0cdfcd1e2f2fdda18f23593).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E5 = factory();
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

  /* A lease row counts toward rent only when annual base rent is
     entered and greater than 0. Rent per SF is computed, never typed. */
  function rentRows(tenants) {
    var list = Array.isArray(tenants) ? tenants : [];
    return list.filter(function (t) {
      return t && isNum(t.rent) && t.rent > 0;
    });
  }

  /* Gross potential rent: sum of annual base rent over rent rows.
     Null when no rent row exists. */
  function grossPotentialRent(tenants) {
    var rows = rentRows(tenants);
    if (rows.length === 0) { return null; }
    return rows.reduce(function (a, t) { return a + t.rent; }, 0);
  }

  /* Leased SF: sum of SF over rent rows only. Null when no rent row. */
  function leasedSf(tenants) {
    var rows = rentRows(tenants);
    if (rows.length === 0) { return null; }
    return rows.reduce(function (a, t) { return a + (isNum(t.sf) ? t.sf : 0); }, 0);
  }

  /* Occupancy, percent: leased SF / rentable SF x 100. */
  function occupancyPct(leased, rentable) {
    if (!isNum(leased) || !isNum(rentable) || rentable <= 0) { return null; }
    return leased / rentable * 100;
  }

  /* Tenants sorted by annual rent, largest first. */
  function sortedByRent(tenants) {
    return rentRows(tenants).slice().sort(function (a, b) { return b.rent - a.rent; });
  }

  function topTenant(tenants) {
    var s = sortedByRent(tenants);
    return s.length ? s[0] : null;
  }

  function tenantPct(tenant, gpr) {
    if (!tenant || !isNum(gpr) || gpr <= 0) { return null; }
    return tenant.rent / gpr * 100;
  }

  function secondTenantPct(tenants, gpr) {
    var s = sortedByRent(tenants);
    if (s.length < 2) { return null; }
    return tenantPct(s[1], gpr);
  }

  /* WALT, rent-weighted years remaining. Null unless every rent row
     has years remaining entered. */
  function walt(tenants) {
    var rows = rentRows(tenants);
    if (rows.length === 0) { return null; }
    if (!rows.every(function (t) { return isNum(t.yrs); })) { return null; }
    var gpr = grossPotentialRent(tenants);
    if (!isNum(gpr) || gpr <= 0) { return null; }
    return rows.reduce(function (a, t) { return a + t.rent * t.yrs; }, 0) / gpr;
  }

  /* Rent-weighted average escalation, percent per year. Null unless
     every rent row has an escalation entered. */
  function weightedEscalation(tenants) {
    var rows = rentRows(tenants);
    if (rows.length === 0) { return null; }
    if (!rows.every(function (t) { return isNum(t.esc); })) { return null; }
    var gpr = grossPotentialRent(tenants);
    if (!isNum(gpr) || gpr <= 0) { return null; }
    return rows.reduce(function (a, t) { return a + t.rent * t.esc; }, 0) / gpr;
  }

  function verifiedCount(tenants) {
    return rentRows(tenants).filter(function (t) { return t.ver === "Verified"; }).length;
  }

  /* Complete lease row: name + years remaining + a verification
     selection. Used for the completeness meter. */
  function completeRowCount(tenants) {
    return rentRows(tenants).filter(function (t) {
      return typeof t.name === "string" && t.name.trim() !== "" && isNum(t.yrs) && t.ver;
    }).length;
  }

  /* Vacancy loss applies to gross potential rent only, never to other
     income. EGI = GPR x (1 - vacancy %) + other income. */
  function egi(gpr, vacancyPct, otherIncome) {
    if (!isNum(gpr) || !isNum(vacancyPct)) { return null; }
    return gpr * (1 - vacancyPct / 100) + clampNum(otherIncome, 0);
  }

  function vacancyLoss(gpr, vacancyPct) {
    if (!isNum(gpr) || !isNum(vacancyPct)) { return null; }
    return gpr * vacancyPct / 100;
  }

  /* Operating expenses: sum of the five lines. Null when no line is
     entered; a blank line is zero in the sum and is named as
     unentered in the receipt. */
  function opexTotal(lines) {
    var list = Array.isArray(lines) ? lines : [];
    var entered = list.filter(function (x) { return isNum(x); });
    if (entered.length === 0) { return null; }
    return list.reduce(function (a, x) { return a + clampNum(x, 0); }, 0);
  }

  function noi(egiValue, opex) {
    if (!isNum(egiValue) || !isNum(opex)) { return null; }
    return egiValue - opex;
  }

  function perSf(value, sf) {
    if (!isNum(value) || !isNum(sf) || sf <= 0) { return null; }
    return value / sf;
  }

  function opexRatio(opex, egiValue) {
    if (!isNum(opex) || !isNum(egiValue) || egiValue === 0) { return null; }
    return opex / egiValue * 100;
  }

  /* Stabilized value = stabilized NOI / cap rate. Null when stabilized
     NOI cannot be computed or the cap rate is missing or zero. */
  function stabilizedValue(stabNoi, capRatePct) {
    if (!isNum(stabNoi) || !isNum(capRatePct) || capRatePct <= 0) { return null; }
    return stabNoi / (capRatePct / 100);
  }

  /* Owner-user value = comparable sales $/SF x rentable SF. */
  function ownerUserValue(pricePerSf, rentableSf) {
    if (!isNum(pricePerSf) || !isNum(rentableSf)) { return null; }
    return pricePerSf * rentableSf;
  }

  /* 5-year rent schedule. Grows gross potential rent at the
     rent-weighted escalation rate only. No rollover, no vacancy
     change, no new leasing. A schedule, not a forecast. */
  function rentSchedule(gpr, wEscPct) {
    var out = [];
    for (var y = 1; y <= 5; y++) {
      var val = (isNum(gpr) && isNum(wEscPct))
        ? gpr * Math.pow(1 + wEscPct / 100, y - 1) : null;
      out.push({ year: y, rent: val });
    }
    return out;
  }

  /* Vacant SF used: typed value wins when entered, else rentable SF
     minus leased SF. Null when neither is known. */
  function vacantSfUsed(typedVacant, rentableSf, leased) {
    if (isNum(typedVacant)) { return typedVacant; }
    if (isNum(rentableSf) && isNum(leased)) { return Math.max(0, rentableSf - leased); }
    return null;
  }

  /* Lease-up cost, line by line. TI + LC are $/SF of vacant space.
     Free rent is vacant SF x market rent $/SF/mo x free months.
     Broker commission is a percent of first-year gross rent on the
     vacant space. */
  function leaseUpCost(vacantUsed, tiPerSf, lcPerSf, freeMonths, rentPerSfMo, commissionPct) {
    if (!isNum(vacantUsed)) {
      return { tiLc: null, freeCost: null, commCost: null, total: null, perSf: null };
    }
    var tiLc = vacantUsed * (clampNum(tiPerSf, 0) + clampNum(lcPerSf, 0));
    var freeCost = vacantUsed * clampNum(rentPerSfMo, 0) * clampNum(freeMonths, 0);
    var commCost = clampNum(commissionPct, 0) / 100 * (vacantUsed * clampNum(rentPerSfMo, 0) * 12);
    var total = tiLc + freeCost + commCost;
    return {
      tiLc: tiLc, freeCost: freeCost, commCost: commCost, total: total,
      perSf: vacantUsed > 0 ? total / vacantUsed : null
    };
  }

  /* MAO = (value x buy %) - lease-up cost - assignment buffer.
     Null when the value, the buy percent, or the lease-up cost is N/A. */
  function mao(value, buyPct, leaseUp, buffer) {
    if (!isNum(value) || !isNum(buyPct) || !isNum(leaseUp)) { return null; }
    return value * buyPct / 100 - leaseUp - clampNum(buffer, 15000);
  }

  /* Kill switch. E5 contract, carried from the 2026-11-04 E5 build.
     The two AUTO kills are computed from the lease table and cannot be
     unchecked away. A kill is a successful run, recommendation PASS. */
  function evaluateKills(input) {
    var fired = [];
    var top = input.top || null;
    var topPct = input.topPct;
    if (top && isNum(topPct) && topPct > 50 && isNum(top.yrs) && top.yrs < 2 && top.renew !== "Yes") {
      fired.push("Single tenant over 50% of income with under 2 years term and no renewal evidence (" +
        (top.name || "unnamed tenant") + " at " + topPct.toFixed(2) + "%, " + top.yrs +
        " years remaining, renewal " + (top.renew || "not stated") + ")");
    }
    var rows = rentRows(input.tenants || []);
    var verified = verifiedCount(input.tenants || []);
    if (rows.length === 0 || rows.some(function (t) { return t.ver !== "Verified"; })) {
      fired.push("Lease terms unverified (" + verified + " of " + rows.length + " rent rows verified)");
    }
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    return { killActive: fired.length > 0, fired: fired };
  }

  /* Risk flags, carried from the 2026-11-04 E5 build. Flags are not
     kills by themselves. killConc is passed in so the top-tenant flag
     only fires when the concentration kill did not. */
  function riskFlags(input) {
    var flags = [];
    if (isNum(input.topPct) && input.topPct > 50 && !input.killConc) {
      flags.push("Top tenant over 50% of income, but term or renewal keeps it from a kill");
    }
    if (isNum(input.walt) && input.walt < 3) {
      flags.push("WALT under 3 years (" + input.walt.toFixed(2) + ")");
    }
    if (isNum(input.occupancy) && input.occupancy < 85) {
      flags.push("Occupancy under 85% (" + input.occupancy.toFixed(2) + "%)");
    }
    if (isNum(input.vacancyPct) && input.vacancyPct > 10) {
      flags.push("Actual vacancy over 10% (" + input.vacancyPct.toFixed(2) + "%)");
    }
    if (!input.capSource || !String(input.capSource).trim()) {
      flags.push("Cap rate source missing");
    }
    if (isNum(input.stabValue) && isNum(input.ouValue) && input.stabValue < input.ouValue) {
      flags.push("Stabilized value below owner-user value");
    }
    if (isNum(input.secondPct) && input.secondPct > 30) {
      flags.push("Second tenant over 30% of income");
    }
    var rows = rentRows(input.tenants || []);
    if (rows.length && rows.some(function (t) { return t.renew === "Unknown"; })) {
      flags.push("At least one renewal option unknown");
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
      schema_version: "e5-commercial-receipt.v1.0",
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
    rentRows: rentRows,
    grossPotentialRent: grossPotentialRent,
    leasedSf: leasedSf,
    occupancyPct: occupancyPct,
    sortedByRent: sortedByRent,
    topTenant: topTenant,
    tenantPct: tenantPct,
    secondTenantPct: secondTenantPct,
    walt: walt,
    weightedEscalation: weightedEscalation,
    verifiedCount: verifiedCount,
    completeRowCount: completeRowCount,
    egi: egi,
    vacancyLoss: vacancyLoss,
    opexTotal: opexTotal,
    noi: noi,
    perSf: perSf,
    opexRatio: opexRatio,
    stabilizedValue: stabilizedValue,
    ownerUserValue: ownerUserValue,
    rentSchedule: rentSchedule,
    vacantSfUsed: vacantSfUsed,
    leaseUpCost: leaseUpCost,
    mao: mao,
    evaluateKills: evaluateKills,
    riskFlags: riskFlags,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
