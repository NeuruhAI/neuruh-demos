/* E7 Mobile Home Park Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E7).
   Mechanics carried from the 2026-11-04 E7 build
   (~/workspace/e7-mobile-home-park-site/index.html, 1142 lines,
   77,303 bytes, MD5 de604172d65d629de06f2d33d3d895fb, live at
   https://e7-mobile-home-park.pages.dev/, HTTP 200, byte-identical).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E7 = factory();
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

  /* Pad math, carried from the 2026-11-04 E7 build, section 02.
     Vacant pads = total pads - occupied pads. A negative vacant
     count is an error: vacant and fillable both stay null.
     Fillable vacant pads = vacant pads - unusable pads, floored at 0.
     TOH = occupied pads - POH count. A negative TOH stays null.
     Occupancy = occupied pads / total pads x 100.
     POH share = POH count / occupied pads x 100. */
  function padMath(input) {
    var total = input.total, occ = input.occupied;
    var unusable = clampNum(input.unusable, 0);
    var poh = input.poh;
    var vacant = null, fillable = null, toh = null;
    var occPct = null, pohShare = null;
    if (isNum(total) && isNum(occ)) {
      vacant = total - occ;
      if (vacant < 0) {
        vacant = null;
      } else {
        fillable = Math.max(0, vacant - unusable);
      }
      occPct = total > 0 ? occ / total * 100 : null;
    }
    if (isNum(occ) && isNum(poh)) {
      toh = occ - poh;
      if (toh < 0) { toh = null; }
      pohShare = occ > 0 ? poh / occ * 100 : null;
    }
    return {
      vacant: vacant, fillable: fillable, toh: toh,
      occupancyPct: occPct, pohSharePct: pohShare
    };
  }

  /* Income, carried from the 2026-11-04 E7 build, section 04.
     Gross lot rent income = occupied pads x lot rent x 12.
     POH home rent income = POH count x home rent x 12, shown on its
     own line so it can never be mistaken for lot rent. If POH count
     is above zero and home rent is blank, home rent income is null.
     If POH count is zero or blank, home rent income is 0.
     Gross income = lot rent income + POH home rent income + other.
     Effective gross income = gross income x (1 - loss percent).
     NOI = effective gross income - operating expenses. */
  function income(input) {
    var occ = input.occupied, lotRent = input.lotRent;
    var poh = input.poh, homeRent = input.homeRent;
    var other = clampNum(input.otherIncome, 0);
    var lossPct = clampNum(input.lossPct, 0);
    var opex = input.opex;
    var lotIncome = (isNum(occ) && isNum(lotRent)) ? occ * lotRent * 12 : null;
    var homeIncome = null;
    if (isNum(poh) && poh > 0) {
      homeIncome = isNum(homeRent) ? poh * homeRent * 12 : null;
    } else {
      homeIncome = 0;
    }
    var gross = (lotIncome === null || homeIncome === null)
      ? null : lotIncome + homeIncome + other;
    var loss = gross === null ? null : gross * lossPct / 100;
    var egi = gross === null ? null : gross - loss;
    var noi = (egi === null || !isNum(opex)) ? null : egi - opex;
    var opexPerPad = (isNum(opex) && isNum(input.total) && input.total > 0)
      ? opex / input.total : null;
    var noiPerPad = (isNum(noi) && isNum(occ) && occ > 0) ? noi / occ : null;
    return {
      lotIncome: lotIncome, homeIncome: homeIncome, otherIncome: other,
      gross: gross, loss: loss, egi: egi, noi: noi,
      opexPerPad: opexPerPad, noiPerPad: noiPerPad
    };
  }

  /* Private utilities check, carried from the 2026-11-04 E7 build.
     Any private system counts: the utilities select, the water
     system, or the sewer system. */
  function isPrivateUtil(input) {
    var u = input.utilities, w = input.waterSystem, s = input.sewerSystem;
    return u === "private" || u === "private_water_public_sewer" ||
      u === "public_water_private_sewer" || u === "well_septic" ||
      w === "private" || w === "well" || s === "private" || s === "septic";
  }

  /* Infill upside, carried from the 2026-11-04 E7 build, section 06.
     Infill is valued only on fillable vacant pads.
     Added lot rent income = fillable pads x market lot rent x 12.
     Net added NOI = added income - (fillable pads x added opex).
     Total infill cost = fillable pads x infill cost per pad.
     Stabilized NOI = current NOI + net added NOI.
     Stabilized value = stabilized NOI / cap rate. */
  function infill(input) {
    var fillable = input.fillable, marketRent = input.marketRent;
    var addedOpexPerPad = clampNum(input.addedOpexPerPad, 0);
    var infillCostPerPad = input.infillCostPerPad;
    var noi = input.noi, capRatePct = input.capRatePct;
    var infillIncome = (isNum(fillable) && isNum(marketRent))
      ? fillable * marketRent * 12 : null;
    var infillOpex = isNum(fillable) ? fillable * addedOpexPerPad : null;
    var infillNet = (infillIncome === null || infillOpex === null)
      ? null : infillIncome - infillOpex;
    var infillCostTotal = (isNum(fillable) && isNum(infillCostPerPad))
      ? fillable * infillCostPerPad : null;
    var stabNoi = (isNum(noi) && isNum(infillNet)) ? noi + infillNet : null;
    var stabValue = (isNum(stabNoi) && isNum(capRatePct) && capRatePct > 0)
      ? stabNoi / (capRatePct / 100) : null;
    return {
      infillIncome: infillIncome, infillOpex: infillOpex,
      infillNet: infillNet, infillCostTotal: infillCostTotal,
      stabNoi: stabNoi, stabValue: stabValue
    };
  }

  /* Valuation, carried from the 2026-11-04 E7 build, section 07.
     Value = NOI / cap rate. Value per pad = value / total pads.
     Price per pad = asking price / total pads.
     Price per occupied pad = asking price / occupied pads.
     Wholesale MAO = stabilized value - infrastructure liability
     - total infill cost - assignment buffer (builder default $15,000,
     editable). If the liability is unpriced, MAO is null. */
  function valuation(input) {
    var noi = input.noi, capRatePct = input.capRatePct;
    var asking = input.asking, total = input.total, occ = input.occupied;
    var stabValue = input.stabValue, liability = input.liability;
    var infillCostTotal = input.infillCostTotal;
    var buffer = clampNum(input.buffer, 15000);
    var value = (isNum(noi) && isNum(capRatePct) && capRatePct > 0)
      ? noi / (capRatePct / 100) : null;
    var valuePerPad = (isNum(value) && isNum(total) && total > 0)
      ? value / total : null;
    var valuePerOcc = (isNum(value) && isNum(occ) && occ > 0)
      ? value / occ : null;
    var pricePerPad = (isNum(asking) && isNum(total) && total > 0)
      ? asking / total : null;
    var pricePerOcc = (isNum(asking) && isNum(occ) && occ > 0)
      ? asking / occ : null;
    var askVsValue = (isNum(asking) && isNum(value)) ? asking - value : null;
    var liabilityPerPad = (isNum(liability) && isNum(total) && total > 0)
      ? liability / total : null;
    var mao = (isNum(stabValue) && isNum(liability) && isNum(infillCostTotal))
      ? stabValue - liability - infillCostTotal - buffer : null;
    return {
      value: value, valuePerPad: valuePerPad, valuePerOcc: valuePerOcc,
      pricePerPad: pricePerPad, pricePerOcc: pricePerOcc,
      askVsValue: askVsValue, liabilityPerPad: liabilityPerPad,
      mao: mao, buffer: buffer
    };
  }

  /* Rent roll rows. A row is usable only when the pad, the lot rent,
     and the source reference are all filled and the rent is above 0.
     Carried from the 2026-11-04 E7 build, section 03. */
  function rollUsableCount(rows) {
    var list = Array.isArray(rows) ? rows : [];
    return list.filter(function (r) {
      return r && typeof r.pad === "string" && r.pad.trim() !== "" &&
        isNum(r.rent) && r.rent > 0 &&
        typeof r.source === "string" && r.source.trim() !== "";
    }).length;
  }

  /* Gates, carried from the 2026-11-04 E7 build, section 08.
     Any gate at fail or hold shows HOLD. */
  function evaluateGates(gateValues) {
    var ids = ["address_parcel", "source", "rent_verification",
      "infrastructure", "no_hallucination", "authority"];
    var passed = [], failed = [];
    ids.forEach(function (id) {
      if (gateValues && gateValues[id] === "pass") { passed.push(id); }
      else { failed.push(id); }
    });
    return { ok: failed.length === 0, passed: passed, failed: failed };
  }

  /* Kill switch (E13), carried from the 2026-11-04 E7 build,
     section 09 and system prompt section 5. The three AUTO kills are
     computed and cannot be unchecked away. A kill is a successful
     run, recommendation PASS. Do not soften it.
     Kill 1: private utilities with no inspection in hand.
     Kill 2: lot rent unverifiable (seller claim only).
     Kill 3: infrastructure liability unpriced, once NOI exists.
     Note the carried quirk: kill 3 does not fire on an empty run,
     because NOI is null until income is entered. */
  function evaluateKills(input) {
    var fired = [];
    if (input.privateUtil && input.inspectionStatus !== "inspected") {
      fired.push("Private utilities with no inspection");
    }
    if (input.rentVerification === "unverified") {
      fired.push("Lot rent unverifiable");
    }
    if (!input.liabilityPriced && isNum(input.noi)) {
      fired.push("Infrastructure liability unpriced");
    }
    (input.manualKills || []).forEach(function (label) { fired.push(label); });
    return { killActive: fired.length > 0, fired: fired };
  }

  /* Recommendation, carried from the 2026-11-04 E7 build.
     Kill active: PASS - do not proceed.
     Gates not all passed: HOLD.
     NOI or value null: HOLD - NOI or value is N/A.
     Otherwise: READY FOR HUMAN REVIEW - no offer without Jeramie. */
  function recommendation(input) {
    if (input.killActive) { return "PASS - do not proceed"; }
    if (!input.gatesOk) { return "HOLD"; }
    if (!isNum(input.noi) || !isNum(input.value)) { return "HOLD - NOI or value is N/A"; }
    return "READY FOR HUMAN REVIEW - no offer without Jeramie";
  }

  /* Risk flags, carried from the 2026-11-04 E7 build, section 09.
     Flags are not kills by themselves. */
  function riskFlags(input) {
    var flags = [];
    if (isNum(input.pohSharePct) && input.pohSharePct > 50) {
      flags.push("POH share above 50 percent of occupied pads: this is a home business, not a lot rent business");
    }
    if (isNum(input.occupancyPct) && input.occupancyPct < 80) {
      flags.push("Occupancy below 80 percent");
    }
    if (isNum(input.occupancyPct) && input.occupancyPct < 60) {
      flags.push("Occupancy below 60 percent");
    }
    if (input.privateUtil) {
      flags.push("Private utilities in use");
    }
    if (input.roadsCondition === "Poor") {
      flags.push("Roads in Poor condition");
    }
    if (input.pohCondition === "Poor") {
      flags.push("POH condition Poor");
    }
    if (isNum(input.rollUsable) && input.rollUsable < 3) {
      flags.push("Fewer than 3 usable rent roll rows");
    }
    if (isNum(input.fillable) && input.fillable > 0 && !isNum(input.monthsToFill)) {
      flags.push("Infill timeline not stated");
    }
    if (isNum(input.liability) && isNum(input.value) && input.value > 0 &&
      input.liability / input.value > 0.10) {
      flags.push("Infrastructure liability exceeds 10 percent of value");
    }
    if (isNum(input.pricePerPad) && isNum(input.valuePerPad) &&
      input.pricePerPad > input.valuePerPad) {
      flags.push("Asking price per pad exceeds value per pad");
    }
    if (isNum(input.poh) && input.poh > 0 && !isNum(input.homeRent)) {
      flags.push("POH home rent not entered while POH count is above zero");
    }
    if (!isNum(input.lotRent)) {
      flags.push("Lot rent not entered");
    }
    if (!isNum(input.liability)) {
      flags.push("Infrastructure liability not priced");
    }
    if (isNum(input.vacant) && isNum(input.unusable) && input.unusable > input.vacant) {
      flags.push("Unusable pads exceed vacant pads");
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
      schema_version: "e7-mobile-home-park-receipt.v1.0",
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
    padMath: padMath,
    income: income,
    isPrivateUtil: isPrivateUtil,
    infill: infill,
    valuation: valuation,
    rollUsableCount: rollUsableCount,
    evaluateGates: evaluateGates,
    evaluateKills: evaluateKills,
    recommendation: recommendation,
    riskFlags: riskFlags,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
