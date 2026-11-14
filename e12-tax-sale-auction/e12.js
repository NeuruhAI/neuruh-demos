/* E12 Tax Sale / Auction Bid Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E12).
   Mechanics carried from the 2026-11-04 E12 build
   (~/workspace/e12-tax-sale-auction-site/index.html, 986 lines,
   73,954 bytes, MD5 eb154a70ca1aa98810c24f581f1d49ed, live at
   https://e12-tax-sale-auction.pages.dev/, HTTP 200, byte-identical).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E12 = factory();
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
    if (x < 0) { return "-$" + fmt2(-x); }
    return "$" + fmt2(x);
  }

  /* Holding cost, carried from the 2026-11-04 E12 build, section 07.
     Monthly Holding = Taxes + Insurance + Maintenance + Interest +
     Other (all per month). Holding Months = Redemption Months +
     Post-Redemption Months. Holding Total = Monthly Holding x
     Holding Months. Holding during redemption = Monthly Holding x
     Redemption Months. If the redemption period is unknown,
     redemption months is null, holding months and holding total are
     N/A, and max bid is N/A.
     Carried quirk: a blank monthly line counts as 0, so monthly
     holding is always a number (even $0.00 on an empty form), while
     holding total is N/A until redemption months are entered. */
  function holding(input) {
    var tax = input.tax, insurance = input.insurance, maint = input.maint;
    var interest = input.interest, other = input.other;
    var monthlyHold = (isNum(tax) ? tax : 0) + (isNum(insurance) ? insurance : 0) +
      (isNum(maint) ? maint : 0) + (isNum(interest) ? interest : 0) +
      (isNum(other) ? other : 0);
    var redemptionMonths = input.redemptionMonths;
    var postMonths = input.postMonths;
    var holdMonths = (isNum(redemptionMonths) && isNum(postMonths))
      ? redemptionMonths + postMonths : null;
    var holdTotal = isNum(holdMonths) ? monthlyHold * holdMonths : null;
    var holdRedemption = isNum(redemptionMonths)
      ? monthlyHold * redemptionMonths : null;
    return {
      monthlyHold: monthlyHold, holdMonths: holdMonths,
      holdTotal: holdTotal, holdRedemption: holdRedemption
    };
  }

  /* Title costs, carried from the 2026-11-04 E12 build, section 06.
     Title Costs Total = Title Search + Quiet Title Budget +
     Recording + Closing. Costs at Purchase = Title Search +
     Recording + Closing (sunk if redeemed; quiet title is spent
     only if not redeemed). Title total is N/A only when all four
     parts are blank; costs at purchase is N/A only when search,
     recording, and closing are all blank. A blank part otherwise
     counts as 0. */
  function titleCosts(input) {
    var search = input.search, quiet = input.quiet;
    var recording = input.recording, closing = input.closing;
    var titleTotal = null;
    if (isNum(search) || isNum(quiet) || isNum(recording) || isNum(closing)) {
      titleTotal = (isNum(search) ? search : 0) + (isNum(quiet) ? quiet : 0) +
        (isNum(recording) ? recording : 0) + (isNum(closing) ? closing : 0);
    }
    var costsAtPurchase = null;
    if (isNum(search) || isNum(recording) || isNum(closing)) {
      costsAtPurchase = (isNum(search) ? search : 0) +
        (isNum(recording) ? recording : 0) + (isNum(closing) ? closing : 0);
    }
    return {
      titleTotal: titleTotal, costsAtPurchase: costsAtPurchase,
      quiet: quiet
    };
  }

  /* Max bid, carried from the 2026-11-04 E12 build, section 04.
     Desired Profit = Resale Value x Profit Percent / 100.
     Max Bid = Resale Value - Repairs - Holding Total -
     Title Costs Total - Desired Profit - Senior Liens.
     Headroom = Max Bid - Minimum Bid. Max bid is the hammer bid
     before any buyer premium. Planned bid defaults to max bid when
     no planned bid is entered. Max bid is N/A when any of its six
     inputs is N/A, including blank repairs. */
  function maxBidCalc(input) {
    var resale = input.resale, repairs = input.repairs;
    var holdTotal = input.holdTotal, titleTotal = input.titleTotal;
    var profitPct = input.profitPct, senior = input.senior;
    var minBid = input.minBid, plannedInput = input.plannedBid;
    var profit = (isNum(resale) && isNum(profitPct))
      ? resale * profitPct / 100 : null;
    var maxBid = null;
    if (isNum(resale) && isNum(repairs) && isNum(holdTotal) &&
      isNum(titleTotal) && isNum(profit) && isNum(senior)) {
      maxBid = resale - repairs - holdTotal - titleTotal - profit - senior;
    }
    var headroom = (isNum(maxBid) && isNum(minBid)) ? maxBid - minBid : null;
    var plannedBid = isNum(plannedInput) ? plannedInput : maxBid;
    return {
      profit: profit, maxBid: maxBid, headroom: headroom,
      plannedBid: plannedBid
    };
  }

  /* Redemption risk, carried from the 2026-11-04 E12 build,
     section 05. Buyer Premium = Planned Bid x Buyer Premium
     Percent / 100. Deposit Due = Planned Bid x Deposit Percent /
     100. Interest Earned = Planned Bid x Redemption Rate / 100 x
     Redemption Months / 12. Redemption Payoff = Planned Bid +
     Interest Earned. Net if Redeemed = Interest Earned -
     (Monthly Holding x Redemption Months) - Costs at Purchase -
     Buyer Premium. Net if Kept = Resale Value - Repairs -
     Holding Total - Title Costs Total - Planned Bid - Buyer
     Premium. Expected Value = (1 - Redemption Probability) x
     Net if Kept + Redemption Probability x Net if Redeemed.
     The model is conservative: redemption payoff is bid plus
     interest only, and costs paid at purchase are not reimbursed. */
  function redemption(input) {
    var plannedBid = input.plannedBid, premiumPct = input.premiumPct;
    var depositPct = input.depositPct, rate = input.rate;
    var months = input.months, prob = input.prob;
    var holdRedemption = input.holdRedemption;
    var costsAtPurchase = input.costsAtPurchase;
    var resale = input.resale, repairs = input.repairs;
    var holdTotal = input.holdTotal, titleTotal = input.titleTotal;
    var premium = (isNum(plannedBid) && isNum(premiumPct))
      ? plannedBid * premiumPct / 100 : null;
    var deposit = (isNum(plannedBid) && isNum(depositPct))
      ? plannedBid * depositPct / 100 : null;
    var interest = (isNum(plannedBid) && isNum(rate) && isNum(months))
      ? plannedBid * rate / 100 * months / 12 : null;
    var payoff = (isNum(plannedBid) && isNum(interest))
      ? plannedBid + interest : null;
    var netRedeemed = null;
    if (isNum(interest) && isNum(holdRedemption) &&
      isNum(costsAtPurchase) && isNum(premium)) {
      netRedeemed = interest - holdRedemption - costsAtPurchase - premium;
    }
    var netKept = null;
    if (isNum(resale) && isNum(repairs) && isNum(holdTotal) &&
      isNum(titleTotal) && isNum(plannedBid) && isNum(premium)) {
      netKept = resale - repairs - holdTotal - titleTotal - plannedBid - premium;
    }
    var ev = null;
    if (isNum(netKept) && isNum(netRedeemed) && isNum(prob)) {
      ev = (1 - prob / 100) * netKept + (prob / 100) * netRedeemed;
    }
    return {
      premium: premium, deposit: deposit, interest: interest,
      payoff: payoff, netRedeemed: netRedeemed, netKept: netKept,
      expectedValue: ev
    };
  }

  /* Title kill and max-bid kill, carried from the 2026-11-04 E12
     build, section 06 and section 04. Title is a kill when it is
     uninsurable with no quiet-title budget (blank quiet-title
     budget counts as no budget). Max bid is a kill when it is
     below the minimum bid. */
  function titleKill(input) {
    var status = input.titleStatus, quiet = input.quiet;
    return status === "uninsurable" && (!isNum(quiet) || quiet === 0);
  }

  function maxBidKill(input) {
    var maxBid = input.maxBid, minBid = input.minBid;
    return isNum(maxBid) && isNum(minBid) && maxBid < minBid;
  }

  /* Gates, carried from the 2026-11-04 E12 build, section 09.
     Any gate at fail or hold shows HOLD. A gate defaults to hold
     in the page; this module treats anything other than "pass"
     as failed. */
  var GATE_IDS = ["address_parcel", "jurisdiction_rules", "source",
    "title", "no_hallucination", "authority"];

  function evaluateGates(gateValues) {
    var passed = [], failed = [];
    GATE_IDS.forEach(function (id) {
      if (gateValues && gateValues[id] === "pass") { passed.push(id); }
      else { failed.push(id); }
    });
    return { ok: failed.length === 0, passed: passed, failed: failed };
  }

  /* Kill switch (E13), carried from the 2026-11-04 E12 build,
     section 13 and system prompt section 4. Two contract kills:
     redemption period unknown; title uninsurable with no
     quiet-title budget. Three engine kills: max bid below the
     minimum bid; auction rules unverified with no county source;
     senior lien unpriced or exceeding equity. A kill is a
     successful run, recommendation PASS. Do not soften it.
     input.manualKills is an array of kill labels the operator
     checked. The auto-derived kills (title, max bid) are added
     from the computed conditions and are never duplicated. */
  var KILLS = [
    "Redemption period unknown (contract kill)",
    "Title uninsurable with no quiet-title budget (contract kill)",
    "Max bid below minimum bid, no profitable bid exists",
    "Auction rules unverified, no county or statute source",
    "Senior lien unpriced or exceeding equity"
  ];

  function evaluateKills(input) {
    var fired = [];
    function add(label) {
      if (fired.indexOf(label) === -1) { fired.push(label); }
    }
    (input.manualKills || []).forEach(function (label) { add(label); });
    if (input.redemptionUnknown) { add(KILLS[0]); }
    if (input.titleKill) { add(KILLS[1]); }
    if (input.maxBidKill) { add(KILLS[2]); }
    return { killActive: fired.length > 0, fired: fired };
  }

  /* Risk flags, carried from the 2026-11-04 E12 build, section 13.
     Flags are not kills by themselves. */
  function riskFlags(input) {
    var flags = [];
    if (isNum(input.prob) && input.prob >= 50) {
      flags.push("redemption probability " + input.prob + " percent, high");
    }
    if (input.titleStatus === "quiet_title") {
      flags.push("title needs quiet title");
    }
    if (input.titleStatus === "unknown") {
      flags.push("title status unknown");
    }
    if (input.titleStatus === "uninsurable") {
      flags.push("title uninsurable");
    }
    if (input.flagOccupied) { flags.push("occupied, no possession plan"); }
    if (input.flagNoPlan) { flags.push("no post-auction plan"); }
    if (input.occupancy === "owner_occupied" ||
      input.occupancy === "tenant_occupied") {
      flags.push("occupied at auction: " + input.occupancy);
    }
    if (isNum(input.monthlyHold) && input.monthlyHold > 0 &&
      isNum(input.holdTotal) && input.holdTotal > 10000) {
      flags.push("holding total over $10,000");
    }
    if (isNum(input.senior) && input.senior > 0) {
      flags.push("senior liens $" + input.senior.toLocaleString("en-US"));
    }
    if (!input.redemptionUnknown && isNum(input.redemptionMonths) &&
      input.redemptionMonths >= 12) {
      flags.push("redemption period 12 months or more");
    }
    if (isNum(input.plannedInput) && isNum(input.maxBid) &&
      input.plannedInput > input.maxBid) {
      flags.push("planned bid above max bid");
    }
    if (isNum(input.expectedValue) && input.expectedValue < 0) {
      flags.push("expected value negative");
    }
    return flags;
  }

  /* Recommendation, carried from the 2026-11-04 E12 build.
     Kill active: PASS - do not bid.
     Any failed gate or incomplete math: HOLD.
     Otherwise: READY FOR HUMAN REVIEW - no bid without Jeramie.
     Still an underwriting opinion only, not permission to bid.
     No offer without Jeramie. */
  function recommendation(input) {
    if (input.killActive) {
      return { status: "KILL", text: "PASS - do not bid" };
    }
    if (!input.gatesOk || input.incomplete) {
      return { status: "HOLD", text: "HOLD" };
    }
    return {
      status: "READY FOR REVIEW",
      text: "READY FOR HUMAN REVIEW - no bid without Jeramie"
    };
  }

  /* Completeness, carried from the 2026-11-04 E12 build, section 10.
     Eight required items: parcel ID, county, auction date,
     auction type, resale value, minimum bid, redemption period
     (entered or marked unknown), title status. */
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
      schema_version: "e12-tax-sale-auction-receipt.v1.0",
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
    holding: holding,
    titleCosts: titleCosts,
    maxBidCalc: maxBidCalc,
    redemption: redemption,
    titleKill: titleKill,
    maxBidKill: maxBidKill,
    GATE_IDS: GATE_IDS,
    evaluateGates: evaluateGates,
    KILLS: KILLS,
    evaluateKills: evaluateKills,
    riskFlags: riskFlags,
    recommendation: recommendation,
    completeness: completeness,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
