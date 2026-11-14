/* E9 Creative Finance Underwriting Engine, v1.0, 2026-11-14.
   Pure calculation module. No DOM, no network, no side effects.
   Works in Node (module.exports) and in the browser (window.E9).
   Mechanics carried from the 2026-11-04 E9 build
   (~/workspace/e9-creative-finance-site/index.html, 894 lines,
   69,203 bytes, MD5 f69dcc7b3bd7b606503fb06560abd611, live at
   https://e9-creative-finance.pages.dev/, HTTP 200, byte-identical).
   Every money figure this module computes is a MODELED ESTIMATE,
   NOT A VALUATION, NOT AN APPRAISAL. No offer, no recommendation
   to buy or sell. Builder defaults are labeled as such in index.html
   and are editable by the user. They are not market facts. */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.E9 = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isNum(x) {
    return typeof x === "number" && isFinite(x);
  }

  function clampNum(x, fallback) {
    return isNum(x) ? x : fallback;
  }

  /* Amortizing payment, carried from the 2026-11-04 E9 build,
     section 03 formula box. P = PV x r / (1 - (1 + r)^-n),
     r = annual rate / 12, n = term in months. Zero rate means
     P = PV / n. Null principal or term returns null. */
  function pmt(pv, ratePct, months) {
    if (!isNum(pv) || !isNum(months) || months <= 0) { return null; }
    var r = (ratePct || 0) / 100 / 12;
    if (r === 0) { return pv / months; }
    return pv * r / (1 - Math.pow(1 + r, -months));
  }

  /* Balloon balance at month k, carried from the 2026-11-04 E9 build
     system prompt section 2.
     B = PV x (1 + r)^k - P x ((1 + r)^k - 1) / r. */
  function balloonBal(pv, ratePct, months, atMonth) {
    if (!isNum(pv) || !isNum(atMonth) || atMonth <= 0) { return null; }
    var r = (ratePct || 0) / 100 / 12;
    var p = pmt(pv, ratePct, months);
    if (p === null) { return null; }
    if (r === 0) { return pv - p * atMonth; }
    var g = Math.pow(1 + r, atMonth);
    return pv * g - p * (g - 1) / r;
  }

  /* Gate and kill definitions, carried verbatim from the
     2026-11-04 E9 build, section 10 and section 11 (E13). */
  var GATES = [
    { id: "address_parcel", label: "Address / parcel gate: address and parcel confirmed from at least 2 public sources" },
    { id: "source", label: "Source gate: every loan fact, rent, value, and seller term carries a source name and date" },
    { id: "loan_facts", label: "Loan facts gate (HARD): balance, rate, payment, term, type, and due-on-sale status known from lender statement and note, or free-and-clear proven by title evidence" },
    { id: "no_hallucination", label: "No-hallucination gate: no invented loan balances, rates, payments, or due-on-sale clauses; unverifiable fields are Unknown or N/A" },
    { id: "authority", label: "Authority gate: underwriting opinion only; no offer without Jeramie; offer authorized is false" }
  ];

  var KILLS = [
    { id: "k_neg_cf", label: "Negative cash flow on every viable structure (auto-checked below when true)" },
    { id: "k_neg_equity", label: "Negative equity: ARV below loan balance plus cash to seller (auto-checked below when true)" },
    { id: "k_strike", label: "Lease-option strike price above ARV (auto-checked below when true)" },
    { id: "k_balloon", label: "Balloon balance exceeds projected equity at the balloon date (auto-checked below when true)" },
    { id: "k_ask_arv", label: "Seller asking price above ARV (auto-checked below when true)" },
    { id: "k_dos", label: "Due-on-sale clause present with no written mitigation plan" },
    { id: "k_title", label: "Title defect, lien, or heir issue with no cure cost" },
    { id: "k_servicer", label: "Wrap with no third-party servicer" },
    { id: "k_illegal", label: "Structure illegal or unpermitted in this jurisdiction per attorney or county review" },
    { id: "k_seller", label: "Seller cannot document authority to sell or to leave the loan in place" }
  ];

  function killLabel(id) {
    var found = null;
    KILLS.forEach(function (k) { if (k.id === id) { found = k.label; } });
    return found;
  }

  /* Full deal computation. Input is a plain object of numbers (or
     null), select strings, and booleans; see the test file for the
     exact shape. Returns every computed value plus statuses, gates,
     kills, flags, and the recommendation, mirroring the 2026-11-04
     E9 build calc() line for line, including its carried quirks,
     which are noted where they occur. */
  function compute(input) {
    var i = input || {};
    var arv = isNum(i.arv) ? i.arv : null;
    var rent = isNum(i.rent) ? i.rent : null;
    var tax = clampNum(i.tax, 0), ins = clampNum(i.ins, 0);
    var hoa = clampNum(i.hoa, 0), maint = clampNum(i.maint, 0);
    var other = tax + ins + hoa + maint;
    var resalePct = isNum(i.resalePct) ? i.resalePct : 8;
    var resaleCost = arv === null ? null : arv * resalePct / 100;
    var grade = i.grade || "";
    var gradeNote = grade === "D"
      ? "Grade D: seller claim only, a lease proxy, never proven income."
      : grade === ""
        ? "Enter a rent grade."
        : "Grade " + grade + ": rent is " + (grade === "A" ? "signed lease in hand." : grade === "B" ? "listed rent." : "market estimate.");

    /* Loan facts, the hard gate. Carried from section 02. */
    var loanKnown = i.loanKnown || "unknown";
    var bal = isNum(i.loanBalance) ? i.loanBalance : null;
    var rate = isNum(i.loanRate) ? i.loanRate : null;
    var pay = isNum(i.loanPayment) ? i.loanPayment : null;
    var termRem = isNum(i.loanTermRemain) ? i.loanTermRemain : null;
    var loanType = i.loanType || "";
    var dos = i.dueOnSale || "unknown";
    var freeClear = !!i.freeClear;
    var dosMitigation = !!i.dosMitigation;
    var loanFactsComplete = false;
    if (freeClear) { loanFactsComplete = true; }
    else if (loanKnown === "known" && bal !== null && rate !== null &&
      pay !== null && termRem !== null && loanType !== "" &&
      loanType !== "Unknown" && dos !== "unknown") {
      loanFactsComplete = true;
    }
    var dosRisk = "Unknown";
    if (freeClear) { dosRisk = "None, free and clear"; }
    else if (dos === "no") { dosRisk = "Low, no due-on-sale clause in the note"; }
    else if (dos === "yes") {
      dosRisk = "High, clause present" +
        (dosMitigation ? " (mitigation plan written)" : " (no mitigation plan)");
    }
    var equity = (arv !== null && bal !== null) ? arv - bal : null;
    if (freeClear && arv !== null) { equity = arv; }
    var hardHeld = !loanFactsComplete;

    var ask = isNum(i.ask) ? i.ask : null;
    var cashSeller = clampNum(i.cashToSeller, 0);
    var down = clampNum(i.down, 0);
    var sRate = isNum(i.sellerNoteRate) ? i.sellerNoteRate : null;
    var sTerm = isNum(i.sellerNoteTerm) ? i.sellerNoteTerm : null;
    var sBalloonMo = clampNum(i.sellerBalloonMo, 0);

    /* Structure A: subject-to. */
    var stCf = null, stExit = null, stEq = null;
    if (!hardHeld && !freeClear && pay !== null && rent !== null) {
      stCf = rent - pay - other;
      stExit = (arv !== null && bal !== null) ? arv - bal - resaleCost : null;
      stEq = (arv !== null && bal !== null) ? arv - bal - cashSeller : null;
    }
    var stStatus = hardHeld ? "HELD, loan facts unknown"
      : freeClear ? "N/A, free and clear, no loan to take over"
      : (stCf === null ? "N/A"
        : (stCf >= 0 ? "VIABLE, positive cash flow" : "NEGATIVE cash flow"));

    /* Structure B: seller finance. Note is asking price minus down.
       The payment and cash flow are computed even when the structure
       is HELD (the page shows HELD instead); only the exit uses the
       balloon balance when a balloon month is set. */
    var sfNote = null, sfPay = null, sfCf = null, sfBalloon = null, sfExit = null;
    if (ask !== null) { sfNote = ask - down; }
    if (sfNote !== null && sRate !== null && sTerm !== null) {
      sfPay = pmt(sfNote, sRate, sTerm);
    }
    if (sfPay !== null && rent !== null) { sfCf = rent - sfPay - other; }
    if (sfNote !== null && sBalloonMo > 0) {
      sfBalloon = balloonBal(sfNote, sRate, sTerm, sBalloonMo);
    }
    if (sfNote !== null && arv !== null) {
      var exitBal = (sBalloonMo > 0 && sfBalloon !== null) ? sfBalloon : sfNote;
      sfExit = arv - exitBal - resaleCost;
    }
    var sfHeld = hardHeld && !freeClear;
    var sfStatus = sfHeld ? "HELD, loan facts unknown"
      : (sfCf === null ? "N/A"
        : (sfCf >= 0 ? "VIABLE, positive cash flow" : "NEGATIVE cash flow"));

    /* Structure C: wrap. Spread is wrap payment minus underlying. */
    var wBal = isNum(i.wrapBalance) ? i.wrapBalance : null;
    var wRate = isNum(i.wrapRate) ? i.wrapRate : null;
    var wTerm = isNum(i.wrapTerm) ? i.wrapTerm : null;
    var wrPay = null, wrSpread = null, wrCf = null, wrExit = null;
    if (wBal !== null && wRate !== null && wTerm !== null) {
      wrPay = pmt(wBal, wRate, wTerm);
    }
    if (wrPay !== null && pay !== null) { wrSpread = wrPay - pay; }
    if (wrPay !== null && rent !== null) { wrCf = rent - wrPay - other; }
    if (wBal !== null && arv !== null) { wrExit = arv - wBal - resaleCost; }
    var wrHeld = hardHeld;
    var wrStatus = wrHeld ? "HELD, loan facts unknown"
      : (wrCf === null ? "N/A"
        : (wrCf >= 0 ? "VIABLE, positive cash flow" : "NEGATIVE cash flow"));

    /* Structure D: lease-option. Sublease rent blank means market
       rent. Carried quirk: the 2026-11-04 build recomputes the same
       cash flow in a second branch that never subtracts the
       underlying payment, even though the section label mentions
       "less underlying payment if buyer pays it". No input records
       whether the buyer pays it, so the module carries the code as
       written and the page documents the label wording in section 14. */
    var loRent = isNum(i.loRent) ? i.loRent : null;
    var loFee = clampNum(i.loOptionFee, 0);
    var loCredit = clampNum(i.loRentCredit, 0);
    var loTerm = isNum(i.loTermMo) ? i.loTermMo : null;
    var loStrike = isNum(i.loStrike) ? i.loStrike : null;
    var loSub = isNum(i.loSubleaseRent) ? i.loSubleaseRent : rent;
    var loCf = null, loCreditTotal = null, loEffective = null, loExit = null;
    if (loRent !== null && loSub !== null) {
      loCf = loSub - loRent - other;
    }
    if (loTerm !== null) { loCreditTotal = loCredit * loTerm; }
    if (loStrike !== null && loCreditTotal !== null) {
      loEffective = loStrike - loCreditTotal;
    }
    if (loEffective !== null && arv !== null) {
      loExit = arv - loEffective - resaleCost;
    }
    var loHeld = hardHeld && !freeClear;
    var loStatus = loHeld ? "HELD, loan facts unknown"
      : (loCf === null ? "N/A"
        : (loCf >= 0 ? "VIABLE, positive cash flow" : "NEGATIVE cash flow"));

    /* Structure E: hybrid, subject-to first loan plus seller second. */
    var hyAmt = isNum(i.hybSecondAmt) ? i.hybSecondAmt : null;
    var hyRate = isNum(i.hybSecondRate) ? i.hybSecondRate : null;
    var hyTerm = isNum(i.hybSecondTerm) ? i.hybSecondTerm : null;
    var hySecond = null, hyPay = null, hyCf = null, hyExit = null;
    if (hyAmt !== null && hyRate !== null && hyTerm !== null) {
      hySecond = pmt(hyAmt, hyRate, hyTerm);
    }
    if (hySecond !== null && pay !== null) { hyPay = pay + hySecond; }
    if (hyPay !== null && rent !== null) { hyCf = rent - hyPay - other; }
    if (hyCf !== null && arv !== null && bal !== null && hyAmt !== null) {
      hyExit = arv - bal - hyAmt - resaleCost;
    }
    var hyHeld = hardHeld || freeClear;
    var hyStatus = hyHeld
      ? (freeClear ? "N/A, free and clear" : "HELD, loan facts unknown")
      : (hyCf === null ? "N/A"
        : (hyCf >= 0 ? "VIABLE, positive cash flow" : "NEGATIVE cash flow"));

    /* Comparison table, carried from section 09. */
    var rows = [
      ["Subject-to", pay, stCf, cashSeller, stExit, stStatus],
      ["Seller finance", sfPay, sfCf, down, sfExit, sfStatus],
      ["Wrap", wrPay, wrCf, down, wrExit, wrStatus],
      ["Lease-option", loRent, loCf, loFee, loExit, loStatus],
      ["Hybrid", hyPay, hyCf, cashSeller, hyExit, hyStatus]
    ];
    var viable = rows.filter(function (r) {
      return r[2] !== null && r[2] >= 0 && r[5].indexOf("VIABLE") === 0;
    });
    var best = null, bestCf = null;
    viable.forEach(function (r) {
      if (bestCf === null || r[2] > bestCf) { bestCf = r[2]; best = r[0]; }
    });

    /* AUTO kills (E13). Carried quirk: the negative-cash-flow and
       negative-equity kills only run when loan facts are known and
       the property is not free and clear, so a free-and-clear deal
       with negative cash flow on every structure does not fire
       kill 1 in this module, exactly as in the 2026-11-04 build. */
    var autoKills = [], autoKillIds = [];
    var holdConds = [];
    if (hardHeld) {
      holdConds.push("Unknown loan facts, HARD GATE: subject-to, wrap, and seller finance on an encumbered property are HELD");
    }
    if (!hardHeld && !freeClear) {
      var cfs = [stCf, sfCf, wrCf, loCf, hyCf].filter(function (x) { return x !== null; });
      if (cfs.length > 0 && cfs.every(function (x) { return x < 0; })) {
        autoKills.push("Negative cash flow on every viable structure");
        autoKillIds.push("k_neg_cf");
      }
      if (equity !== null && equity < 0) {
        autoKills.push("Negative equity: ARV below loan balance");
        autoKillIds.push("k_neg_equity");
      }
    }
    if (loStrike !== null && arv !== null && loStrike > arv) {
      autoKills.push("Lease-option strike price above ARV");
      autoKillIds.push("k_strike");
    }
    if (sfBalloon !== null && equity !== null && sfBalloon > equity) {
      autoKills.push("Balloon balance exceeds projected equity at the balloon date");
      autoKillIds.push("k_balloon");
    }
    if (ask !== null && arv !== null && ask > arv) {
      autoKills.push("Seller asking price above ARV");
      autoKillIds.push("k_ask_arv");
    }

    /* Manual kills: checked kill boxes whose label is not already an
       AUTO kill. The caller passes the ids checked before this run;
       AUTO ids are excluded here, matching the 2026-11-04 build,
       which auto-checks the AUTO boxes before reading them. */
    var manualIds = Array.isArray(i.manualKillIds) ? i.manualKillIds : [];
    var manualKills = [];
    manualIds.forEach(function (id) {
      if (autoKillIds.indexOf(id) === -1) {
        var label = killLabel(id);
        if (label) { manualKills.push(label); }
      }
    });
    var killActive = autoKills.length > 0 || manualKills.length > 0;

    /* Risk flags, carried from section 11. */
    var riskFlags = [];
    if (dos === "yes" && !dosMitigation) {
      riskFlags.push("Due-on-sale clause present with no mitigation plan");
    }
    if (dos === "unknown" && !freeClear) {
      riskFlags.push("Due-on-sale status unknown");
    }
    if (grade === "D") {
      riskFlags.push("Rent is grade D, seller claim only, lease proxy");
    }
    if (manualIds.indexOf("k_servicer") !== -1 && !freeClear) {
      riskFlags.push("Wrap with no third-party servicer");
    }
    if (manualIds.indexOf("k_title") !== -1) {
      riskFlags.push("Title defect with no cure cost");
    }
    if (manualIds.indexOf("k_illegal") !== -1) {
      riskFlags.push("Structure legality flagged");
    }
    if (manualIds.indexOf("k_seller") !== -1) {
      riskFlags.push("Seller authority not documented");
    }
    if (manualIds.indexOf("k_dos") !== -1) {
      riskFlags.push("Due-on-sale kill checked manually");
    }

    /* Gates fail closed, carried from section 10. The loan-facts
       gate is forced from the computed loan facts, not the select. */
    var gateValues = i.gates || {};
    var gatesPassed = [], gatesFailed = [];
    GATES.forEach(function (g) {
      var v = gateValues[g.id] || "hold";
      if (g.id === "loan_facts") { v = loanFactsComplete ? "pass" : "fail"; }
      if (v === "pass") { gatesPassed.push(g.id); } else { gatesFailed.push(g.id); }
    });

    /* Recommendation, carried from section 11. PASS is a successful
       run, not a failed one. */
    var recommendation = "", recKind = "";
    if (killActive) {
      recommendation = "PASS";
      recKind = "pass";
    } else if (hardHeld || gatesFailed.length > 0) {
      recommendation = "HOLD";
      recKind = "hold";
    } else if (best !== null) {
      recommendation = "REVIEW, " + best;
      recKind = "review";
    } else {
      recommendation = "HOLD";
      recKind = "hold";
    }

    /* Completeness, carried from the sticky panel. */
    var sourcesCount = clampNum(i.sourcesCount, 0);
    var items = [
      ["Street address", !!(i.address && String(i.address).trim())],
      ["Parcel ID", !!(i.parcel && String(i.parcel).trim())],
      ["Value / ARV", arv !== null],
      ["Market rent", rent !== null],
      ["Loan facts known or free-and-clear proven", loanFactsComplete],
      ["Due-on-sale status known or free-and-clear", freeClear || dos !== "unknown"],
      ["Seller asking price", ask !== null],
      ["At least 2 public sources checked", sourcesCount >= 2]
    ];
    var done = items.filter(function (x) { return x[1]; }).length;
    var pct = Math.round(done / items.length * 100);
    var missing = items.filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; });

    return {
      other: other, resalePct: resalePct, resaleCost: resaleCost,
      gradeNote: gradeNote,
      loanFactsComplete: loanFactsComplete, dosRisk: dosRisk,
      equity: equity, hardHeld: hardHeld,
      st: { payment: pay, other: other, cashFlow: stCf, annual: stCf === null ? null : stCf * 12, entry: cashSeller, equity: stEq, exit: stExit, status: stStatus },
      sf: { note: sfNote, payment: sfPay, cashFlow: sfCf, annual: sfCf === null ? null : sfCf * 12, balloon: sfBalloon, exit: sfExit, status: sfStatus, held: sfHeld },
      wr: { payment: wrPay, underlying: pay, spread: wrSpread, cashFlow: wrCf, annual: wrCf === null ? null : wrCf * 12, exit: wrExit, status: wrStatus, held: wrHeld },
      lo: { cashFlow: loCf, creditTotal: loCreditTotal, effective: loEffective, feeRisk: loFee, exit: loExit, status: loStatus, held: loHeld },
      hy: { first: pay, second: hySecond, payment: hyPay, cashFlow: hyCf, annual: hyCf === null ? null : hyCf * 12, exit: hyExit, status: hyStatus, held: hyHeld },
      compare: rows, best: best, bestCf: bestCf,
      autoKills: autoKills, autoKillIds: autoKillIds,
      manualKills: manualKills, killActive: killActive,
      riskFlags: riskFlags, holdConds: holdConds,
      gatesPassed: gatesPassed, gatesFailed: gatesFailed,
      gatesOk: gatesFailed.length === 0,
      recommendation: recommendation, recKind: recKind,
      completeness: { pct: pct, done: done, total: items.length, missing: missing }
    };
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
      schema_version: "e9-creative-finance-receipt.v1.0",
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
    pmt: pmt,
    balloonBal: balloonBal,
    GATES: GATES,
    KILLS: KILLS,
    compute: compute,
    canonicalJSON: canonicalJSON,
    buildReceipt: buildReceipt,
    verifyChain: verifyChain
  };
});
