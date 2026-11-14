/* E11 Agricultural / Timber / Recreation Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E11).
   Mechanics carried from the 2026-11-04 E11 build
   (~/workspace/e11-agricultural-timber-site/index.html, 1005 lines,
   84,539 bytes, MD5 7a9c1269e5e9125c908ffdb22519c2ad, live at
   https://e11-agricultural-timber.pages.dev/, HTTP 200, byte-identical).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E11 = factory();
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

  function acresFmt(x) {
    if (!isNum(x)) { return "N/A"; }
    return fmt2(x) + " ac";
  }

  function pctFmt(x) {
    if (!isNum(x)) { return "N/A"; }
    return (x * 100).toFixed(2) + "%";
  }

  function clampNum(x, fallback) {
    return isNum(x) ? x : fallback;
  }

  /* Acreage, carried from the 2026-11-04 E11 build, section 02.
     Productive acres = tillable + timber + pasture. Wetland and waste
     acres are not productive. The breakdown (all five parts) must sum
     to total acres within 0.005. A null part counts as 0 in the sums
     but productive acres stay null unless at least one productive
     part was entered. */
  function acreage(input) {
    var till = input.till, timber = input.timber, pasture = input.pasture;
    var wet = input.wet, waste = input.waste, total = input.total;
    var tillN = isNum(till) ? till : 0;
    var timberN = isNum(timber) ? timber : 0;
    var pastureN = isNum(pasture) ? pasture : 0;
    var wetN = isNum(wet) ? wet : 0;
    var wasteN = isNum(waste) ? waste : 0;
    var prod = null;
    if (isNum(till) || isNum(timber) || isNum(pasture)) {
      prod = tillN + timberN + pastureN;
    }
    var hasAny = isNum(till) || isNum(timber) || isNum(pasture) ||
      isNum(wet) || isNum(waste);
    var breakdownSum = hasAny ? tillN + timberN + pastureN + wetN + wasteN : null;
    var reconciles = isNum(total) && isNum(breakdownSum) &&
      Math.abs(breakdownSum - total) < 0.005;
    return {
      prod: prod, breakdownSum: breakdownSum, reconciles: reconciles,
      tillN: tillN, timberN: timberN, pastureN: pastureN,
      wetN: wetN, wasteN: wasteN
    };
  }

  /* Cash rent, carried from the 2026-11-04 E11 build, section 04.
     Gross cash rent income = tillable acres x cash rent per acre.
     Gross rent yield = gross rent income / asking price, only when
     the asking price is above 0. Grade D rent is a rent proxy only;
     the source still computes gross rent, and this module carries
     that behavior verbatim (see the quirk note in index.html). */
  function rentMath(input) {
    var till = input.till, cashRent = input.cashRent, ask = input.ask;
    var grossRent = (isNum(till) && isNum(cashRent)) ? till * cashRent : null;
    var rentYield = (isNum(grossRent) && isNum(ask) && ask > 0)
      ? grossRent / ask : null;
    return { grossRent: grossRent, rentYield: rentYield };
  }

  /* Timber cruise value, carried from the 2026-11-04 E11 build,
     section 05. Timber cruise value = cruise volume x price per unit
     (MBF or tons). Null unless both volume and price are entered. */
  function cruiseValue(input) {
    var qty = input.qty, price = input.price;
    return (isNum(qty) && isNum(price)) ? qty * price : null;
  }

  /* Recreation value, carried from the 2026-11-04 E11 build,
     section 06. Recreation annual income = recreation acres x lease
     per acre. Recreation capitalized value = annual income / cap
     rate. The cap rate must be above 0. */
  function recreation(input) {
    var ac = input.acres, lease = input.lease, capPct = input.capPct;
    var income = (isNum(ac) && isNum(lease)) ? ac * lease : null;
    var capRate = (isNum(capPct) && capPct > 0) ? capPct / 100 : null;
    var value = (isNum(income) && isNum(capRate)) ? income / capRate : null;
    return { income: income, capRate: capRate, value: value };
  }

  /* Land comps, carried from the 2026-11-04 E11 build, section 09.
     A comp row is usable only when address, sale price, sale date,
     productive acres, and source URL are all filled. Price per
     productive acre = sale price / productive acres, only when
     productive acres are above 0. Minimum 3 usable comps. */
  function compPpa(row) {
    if (!row) { return null; }
    if (!isNum(row.sale_price) || !isNum(row.productive_acres) ||
      row.productive_acres <= 0) { return null; }
    return row.sale_price / row.productive_acres;
  }

  function compsUsable(rows) {
    var list = Array.isArray(rows) ? rows : [];
    return list.filter(function (c) {
      return c && typeof c.address === "string" && c.address.trim() !== "" &&
        isNum(c.sale_price) &&
        typeof c.sale_date === "string" && c.sale_date.trim() !== "" &&
        isNum(c.productive_acres) &&
        typeof c.source_url === "string" && c.source_url.trim() !== "";
    });
  }

  /* Rent comps, carried from the 2026-11-04 E11 build, section 04.
     A rent comp row is usable only when county, acres, rent per acre,
     and source URL are all filled. */
  function rentCompsUsable(rows) {
    var list = Array.isArray(rows) ? rows : [];
    return list.filter(function (r) {
      return r && typeof r.county === "string" && r.county.trim() !== "" &&
        isNum(r.acres) && isNum(r.rent_per_acre) &&
        typeof r.source_url === "string" && r.source_url.trim() !== "";
    });
  }

  /* Component value, carried from the 2026-11-04 E11 build,
     section 10. Component value = (tillable acres x tillable $ / acre)
     + (non-tillable productive acres x non-tillable $ / acre)
     + timber cruise value + recreation capitalized value. Every one
     of the four parts must be non-null; a part with no evidence is
     N/A, not zero, and the component value is N/A. Non-tillable
     productive acres = timber acres + pasture acres, and stay null
     unless at least one of timber or pasture was entered. */
  function componentValue(input) {
    var till = input.till, tillVal = input.tillVal;
    var timber = input.timber, pasture = input.pasture;
    var nonTillVal = input.nonTillVal;
    var cruiseVal = input.cruiseVal, recVal = input.recVal;
    var tillValue = (isNum(till) && isNum(tillVal)) ? till * tillVal : null;
    var nonTillAcres = null;
    if (isNum(timber) || isNum(pasture)) {
      nonTillAcres = (isNum(timber) ? timber : 0) + (isNum(pasture) ? pasture : 0);
    }
    var nonTillValue = (isNum(nonTillAcres) && isNum(nonTillVal))
      ? nonTillAcres * nonTillVal : null;
    var component = null;
    if (isNum(tillValue) && isNum(nonTillValue) && isNum(cruiseVal) &&
      isNum(recVal)) {
      component = tillValue + nonTillValue + cruiseVal + recVal;
    }
    return {
      tillValue: tillValue, nonTillAcres: nonTillAcres,
      nonTillValue: nonTillValue, component: component
    };
  }

  /* Price per acre, carried from the 2026-11-04 E11 build, section 10.
     Price per productive acre = asking price / productive acres.
     Price per total acre = asking price / total acres. Both need a
     divisor above 0. Component value minus asking price needs both. */
  function pricePerAcre(input) {
    var ask = input.ask, prod = input.prod, total = input.total;
    var component = input.component;
    var ppa = (isNum(ask) && isNum(prod) && prod > 0) ? ask / prod : null;
    var ppta = (isNum(ask) && isNum(total) && total > 0) ? ask / total : null;
    var compVsAsk = (isNum(component) && isNum(ask)) ? component - ask : null;
    return { ppa: ppa, ppta: ppta, compVsAsk: compVsAsk };
  }

  /* Highest and best use, carried from the 2026-11-04 E11 build,
     section 11. The four tests run in order. The source reports a
     failure if any test fails and completion only when all four are
     answered; the ordering itself (stop at the first failure) is not
     enforced by the source code, and this module carries that
     behavior verbatim (see the quirk note in index.html). */
  function hbuStatus(tests) {
    var list = Array.isArray(tests) ? tests : [];
    var fail = list.indexOf("fail") !== -1;
    var done = list.length === 4 && list.every(function (v) { return v !== ""; });
    var partial = list.some(function (v) { return v !== ""; });
    return { fail: fail, done: done, partial: partial };
  }

  /* Gates, carried from the 2026-11-04 E11 build, section 12.
     Any gate at fail or hold shows HOLD. A gate defaults to pass in
     the page; this module treats anything other than "pass" as failed. */
  var GATE_IDS = ["address_parcel", "acreage", "source", "rent_truth",
    "timber", "rights", "no_hallucination", "authority"];

  function evaluateGates(gateValues) {
    var passed = [], failed = [];
    GATE_IDS.forEach(function (id) {
      if (gateValues && gateValues[id] === "pass") { passed.push(id); }
      else { failed.push(id); }
    });
    return { ok: failed.length === 0, passed: passed, failed: failed };
  }

  /* Kill switch (E13), carried from the 2026-11-04 E11 build,
     section 13 and system prompt section 8. The eight operator-checked
     kills are the manual list. Three kills are also auto-derived from
     the inputs and cannot be unchecked away: no legal access; mineral
     rights unknown on a deal priced on mineral or water value;
     water rights unknown on a deal priced on mineral or water value.
     A kill is a successful run, recommendation PASS. Do not soften it.
     Carried quirk: the auto-derived water kill fires on Sample C
     even though its sample note names only the two checked kills. */
  var KILLS = [
    "Productive acres unverifiable (no survey, GIS, or FSA record)",
    "Mineral rights unknown on a deal priced on mineral value",
    "Water rights unknown on a deal priced on water value",
    "No legal access",
    "Address / parcel unconfirmed",
    "Timber cruise unverified on a deal priced on timber value",
    "Cash rent unverifiable on a deal priced on rent income",
    "Gate failure leaves component value or price per productive acre as N/A"
  ];

  function evaluateKills(input) {
    var fired = [];
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    if (input.access === "none" && fired.indexOf(KILLS[3]) === -1) {
      fired.push(KILLS[3] + " (from Section 08 access)");
    }
    if (input.priced === "yes" && input.mineral === "unknown" &&
      fired.indexOf(KILLS[1]) === -1) {
      fired.push(KILLS[1] + " (from Section 09 rights)");
    }
    if (input.priced === "yes" && input.water === "unknown" &&
      fired.indexOf(KILLS[2]) === -1) {
      fired.push(KILLS[2] + " (from Section 09 rights)");
    }
    return { killActive: fired.length > 0, fired: fired };
  }

  /* Risk flags, carried from the 2026-11-04 E11 build, section 13.
     All eight flags are operator-checked boxes. Flags are not kills
     by themselves. */
  var FLAGS = [
    "Easement burden (access by easement, shared drive, or utility easement)",
    "Floodplain or wetland portion over 10 percent of total acres",
    "Soil productivity index below county average",
    "Single-tenant cash rent, no backup tenant",
    "Recreation lease is seasonal or short term",
    "Mineral rights severed",
    "Timber overmature or immature, harvest timing uncertain",
    "No survey on file"
  ];

  /* Recommendation, carried from the 2026-11-04 E11 build.
     Kill active: KILL, recommendation PASS.
     Any failed gate, fewer than 3 usable comps, or component value /
     price per productive acre N/A: HOLD.
     Otherwise: READY FOR REVIEW. Still an underwriting opinion only,
     not an offer. No offer without Jeramie. */
  function recommendation(input) {
    if (input.killActive) { return { status: "KILL", text: "PASS" }; }
    if (!input.gatesOk || input.compShort || input.valueNa) {
      return { status: "HOLD", text: "HOLD" };
    }
    return { status: "READY FOR REVIEW", text: "READY FOR REVIEW" };
  }

  /* Completeness, carried from the 2026-11-04 E11 build, section 14.
     Eight required items: address, parcel ID, total acres, acreage
     breakdown reconciles, at least 3 usable comps, cash rent entered,
     component value computed, HBU stated. */
  function completeness(items) {
    var list = Array.isArray(items) ? items : [];
    var done = list.filter(function (x) { return x.done; }).length;
    var pctDone = list.length === 0 ? 0 : Math.round(done / list.length * 100);
    var missing = list.filter(function (x) { return !x.done; })
      .map(function (x) { return x.label; });
    return { done: done, total: list.length, pct: pctDone, missing: missing };
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
      schema_version: "e11-agricultural-timber-receipt.v1.0",
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
    acresFmt: acresFmt,
    pctFmt: pctFmt,
    acreage: acreage,
    rentMath: rentMath,
    cruiseValue: cruiseValue,
    recreation: recreation,
    compPpa: compPpa,
    compsUsable: compsUsable,
    rentCompsUsable: rentCompsUsable,
    componentValue: componentValue,
    pricePerAcre: pricePerAcre,
    hbuStatus: hbuStatus,
    GATE_IDS: GATE_IDS,
    evaluateGates: evaluateGates,
    KILLS: KILLS,
    evaluateKills: evaluateKills,
    FLAGS: FLAGS,
    recommendation: recommendation,
    completeness: completeness,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
