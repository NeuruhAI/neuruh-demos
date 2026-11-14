/* Node test suite for E3 Rental / BRRRR Underwriting Engine v1.0.
   Run: node --test tests/test-e3.js  (from e3-rental-brrrr/)
   Covers calculator math with hand-computed expectations from the
   2026-11-04 E3 build samples (independently re-computed in node
   from the raw formulas, not from e3.js), receipt hashing and
   chaining, tamper detection, and the no-em-dash rule. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const E3 = require("../e3.js");

function close(a, b, tol, label) {
  assert.ok(Math.abs(a - b) <= tol, label + ": expected " + b + ", got " + a);
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/* Sample A (2026-11-04 E3 build): rent 1800, vacancy 5%, grade B,
   fixed 250 + 120 = 370, varPct 5 + 5 + 8 = 18%.
   EGI 1710.00, varExp 324.00, opEx 694.00, NOI 1016.00/mo, 12192.00/yr.
   Purchase 120000, ARV 200000, repBase 30000, closing 3000, holding
   2000, initial loan 90000. All-in 155000, cash invested 65000.
   Refi LTV 75%, rate 7%, term 30y, closing 4000.
   Refi loan 150000, net proceeds 56000, cash left 9000. */
const A = {
  rent: 1800, vacancy: 5, fixed: 370, varPct: 18,
  purchase: 120000, arv: 200000, repBase: 30000, closing: 3000,
  holding: 2000, initialLoan: 90000, ltv: 75, rate: 7, term: 30,
  refiClosing: 4000
};

/* Sample B (2026-11-04 E3 build): rent 1500, vacancy 8%, grade C,
   fixed 300 + 150 = 450, varPct 5 + 5 + 10 = 20%.
   EGI 1380.00, varExp 300.00, opEx 750.00, NOI 630.00/mo, 7560.00/yr.
   Purchase 140000, ARV 180000, repBase 20000, closing 2500, holding
   1500, initial loan 105000. All-in 164000, cash invested 59000.
   Refi LTV 70%, rate 7.5%, term 30y, closing 3500.
   Refi loan 126000, net proceeds 17500, cash left 41500. */
const B = {
  rent: 1500, vacancy: 8, fixed: 450, varPct: 20,
  purchase: 140000, arv: 180000, repBase: 20000, closing: 2500,
  holding: 1500, initialLoan: 105000, ltv: 70, rate: 7.5, term: 30,
  refiClosing: 3500
};

test("monthly payment: 150000 at 7 percent, 30 years, is 997.95", () => {
  close(E3.monthlyPayment(150000, 7, 30), 997.95, 0.01, "payment A");
  close(E3.monthlyPayment(126000, 7.5, 30), 881.01, 0.01, "payment B");
  close(E3.monthlyPayment(300000, 7, 30), 1995.91, 0.01, "payment 300k");
  assert.equal(E3.monthlyPayment(120000, 0, 10), 1000);
  assert.equal(E3.monthlyPayment(null, 7, 30), null);
  assert.equal(E3.monthlyPayment(150000, 7, 0), null);
  assert.equal(E3.monthlyPayment(-100, 7, 30), null);
});

test("scenario Sample A base: EGI 1710, opEx 694, NOI 1016, CF 18.05", () => {
  const refi = E3.refinance(A.arv, A.ltv, A.rate, A.term, A.refiClosing, A.initialLoan);
  const sc = E3.scenario(A.rent, A.vacancy, A.fixed, A.varPct, refi.payment);
  close(sc.egi, 1710, 0.01, "EGI");
  close(sc.varExp, 324, 0.01, "varExp");
  close(sc.opEx, 694, 0.01, "opEx");
  close(sc.noi, 1016, 0.01, "NOI");
  close(sc.cf, 18.05, 0.01, "cash flow");
  close(sc.cfYr, 216.60, 0.05, "annual cash flow");
  assert.equal(sc.steps.length, 5);
  assert.ok(sc.steps[0].indexOf("1,710.00") !== -1);
});

test("scenario Sample A optimistic and pessimistic", () => {
  const refi = E3.refinance(A.arv, A.ltv, A.rate, A.term, A.refiClosing, A.initialLoan);
  const ins = E3.scenarioInputs(A.rent, A.vacancy);
  assert.equal(ins.optimistic.rent, 1890);
  assert.equal(ins.optimistic.vacancyPct, 2.5);
  assert.equal(ins.pessimistic.rent, 1620);
  assert.equal(ins.pessimistic.vacancyPct, 15);
  const opt = E3.scenario(ins.optimistic.rent, ins.optimistic.vacancyPct, A.fixed, A.varPct, refi.payment);
  close(opt.egi, 1842.75, 0.01, "opt EGI");
  close(opt.varExp, 340.20, 0.01, "opt varExp");
  close(opt.opEx, 710.20, 0.01, "opt opEx");
  close(opt.noi, 1132.55, 0.01, "opt NOI");
  close(opt.cf, 134.60, 0.01, "opt CF");
  const pes = E3.scenario(ins.pessimistic.rent, ins.pessimistic.vacancyPct, A.fixed, A.varPct, refi.payment);
  close(pes.egi, 1377, 0.01, "pes EGI");
  close(pes.varExp, 291.60, 0.01, "pes varExp");
  close(pes.opEx, 661.60, 0.01, "pes opEx");
  close(pes.noi, 715.40, 0.01, "pes NOI");
  close(pes.cf, -282.55, 0.01, "pes CF");
});

test("scenario Sample B base: EGI 1380, opEx 750, NOI 630, CF -251.01", () => {
  const refi = E3.refinance(B.arv, B.ltv, B.rate, B.term, B.refiClosing, B.initialLoan);
  const sc = E3.scenario(B.rent, B.vacancy, B.fixed, B.varPct, refi.payment);
  close(sc.egi, 1380, 0.01, "EGI");
  close(sc.varExp, 300, 0.01, "varExp");
  close(sc.opEx, 750, 0.01, "opEx");
  close(sc.noi, 630, 0.01, "NOI");
  close(sc.cf, -251.01, 0.01, "cash flow");
  const ins = E3.scenarioInputs(B.rent, B.vacancy);
  assert.equal(ins.optimistic.vacancyPct, 4);
  assert.equal(ins.pessimistic.vacancyPct, 18);
  const opt = E3.scenario(ins.optimistic.rent, ins.optimistic.vacancyPct, B.fixed, B.varPct, refi.payment);
  close(opt.noi, 747, 0.01, "opt NOI");
  close(opt.cf, -134.01, 0.01, "opt CF");
  const pes = E3.scenario(ins.pessimistic.rent, ins.pessimistic.vacancyPct, B.fixed, B.varPct, refi.payment);
  close(pes.noi, 387, 0.01, "pes NOI");
  close(pes.cf, -494.01, 0.01, "pes CF");
});

test("scenario null handling: missing rent or vacancy stays null", () => {
  const sc = E3.scenario(null, 5, 370, 18, 997.95);
  assert.equal(sc.egi, null);
  assert.equal(sc.noi, null);
  assert.equal(sc.cf, null);
  const sc2 = E3.scenario(1800, 5, 370, 18, null);
  close(sc2.noi, 1016, 0.01, "NOI without payment");
  assert.equal(sc2.cf, null);
  assert.equal(E3.scenarioInputs(null, 5).base, null);
});

test("all-in cost and cash invested: A 155000 and 65000, B 164000 and 59000", () => {
  assert.equal(E3.allInCost(A.purchase, A.repBase, A.closing, A.holding), 155000);
  assert.equal(E3.cashInvested(A.purchase, A.initialLoan, A.repBase, A.closing, A.holding), 65000);
  assert.equal(E3.allInCost(B.purchase, B.repBase, B.closing, B.holding), 164000);
  assert.equal(E3.cashInvested(B.purchase, B.initialLoan, B.repBase, B.closing, B.holding), 59000);
  assert.equal(E3.allInCost(null, 30000, 3000, 2000), null);
  assert.equal(E3.allInCost(120000, null, 3000, 2000), null);
  assert.equal(E3.cashInvested(120000, 90000, null, 3000, 2000), null);
});

test("refinance: A loan 150000, net 56000, cash left 9000; B loan 126000, net 17500, cash left 41500", () => {
  const ra = E3.refinance(A.arv, A.ltv, A.rate, A.term, A.refiClosing, A.initialLoan);
  assert.equal(ra.loan, 150000);
  close(ra.payment, 997.95, 0.01, "payment A");
  assert.equal(ra.netProceeds, 56000);
  assert.equal(E3.cashLeft(65000, ra.netProceeds), 9000);
  const rb = E3.refinance(B.arv, B.ltv, B.rate, B.term, B.refiClosing, B.initialLoan);
  assert.equal(rb.loan, 126000);
  close(rb.payment, 881.01, 0.01, "payment B");
  assert.equal(rb.netProceeds, 17500);
  assert.equal(E3.cashLeft(59000, rb.netProceeds), 41500);
  const rc = E3.refinance(null, 75, 7, 30, 4000, 90000);
  assert.equal(rc.loan, null);
  assert.equal(rc.payment, null);
  assert.equal(rc.netProceeds, null);
  assert.equal(E3.cashLeft(null, 56000), null);
});

test("DSCR, break-even, cap rate, cash-on-cash, rent ratio: A and B", () => {
  const ra = E3.refinance(A.arv, A.ltv, A.rate, A.term, A.refiClosing, A.initialLoan);
  const scA = E3.scenario(A.rent, A.vacancy, A.fixed, A.varPct, ra.payment);
  close(E3.dscr(scA.noi * 12, ra.payment * 12), 1.018, 0.001, "DSCR A");
  close(E3.breakEvenOccupancy(scA.opEx * 12, ra.payment * 12, A.rent * 12), 94.00, 0.01, "BE A");
  close(E3.capRate(scA.noi * 12, 155000), 7.87, 0.01, "cap A");
  close(E3.cashOnCash(scA.cfYr, 9000), 0.0241, 0.0005, "CoC A");
  close(E3.rentRatio(A.rent, 155000), 1.16, 0.01, "rent ratio A");
  const rb = E3.refinance(B.arv, B.ltv, B.rate, B.term, B.refiClosing, B.initialLoan);
  const scB = E3.scenario(B.rent, B.vacancy, B.fixed, B.varPct, rb.payment);
  close(E3.dscr(scB.noi * 12, rb.payment * 12), 0.715, 0.001, "DSCR B");
  close(E3.breakEvenOccupancy(scB.opEx * 12, rb.payment * 12, B.rent * 12), 108.73, 0.01, "BE B");
  close(E3.capRate(scB.noi * 12, 164000), 4.61, 0.01, "cap B");
  close(E3.cashOnCash(scB.cfYr, 41500), -0.0726, 0.0005, "CoC B");
  assert.equal(E3.dscr(12192, 0), null);
  assert.equal(E3.breakEvenOccupancy(8328, 11975.40, 0), null);
  assert.equal(E3.cashOnCash(216.60, 0), null);
  assert.equal(E3.cashOnCash(216.60, -5000), null);
});

test("DSCR bands: below 1.00 kill, 1.00 to 1.25 thin, 1.25 and above comfortable", () => {
  assert.equal(E3.dscrBand(0.715), "kill");
  assert.equal(E3.dscrBand(1.018), "thin");
  assert.equal(E3.dscrBand(1.25), "comfortable");
  assert.equal(E3.dscrBand(1.60), "comfortable");
  assert.equal(E3.dscrBand(null), "unknown");
});

test("kill switch: Sample C fires all three contract kills, A and B fire none", () => {
  const kc = E3.evaluateKills({ arv: null, repBase: null, purchase: 110000 });
  assert.equal(kc.killActive, true);
  assert.equal(kc.fired.length, 2);
  assert.ok(kc.fired.indexOf("ARV is N/A") !== -1);
  assert.ok(kc.fired.indexOf("repair scope is N/A (repairs base is blank)") !== -1);
  const kc2 = E3.evaluateKills({ arv: null, repBase: null, purchase: null });
  assert.equal(kc2.fired.length, 3);
  const ka = E3.evaluateKills({ arv: A.arv, repBase: A.repBase, purchase: A.purchase });
  assert.equal(ka.killActive, false);
  assert.equal(ka.fired.length, 0);
  const kb = E3.evaluateKills({ arv: B.arv, repBase: B.repBase, purchase: B.purchase });
  assert.equal(kb.killActive, false);
  const km = E3.evaluateKills({ arv: A.arv, repBase: A.repBase, purchase: A.purchase, manualKills: ["Manual kill: title defect"] });
  assert.equal(km.killActive, true);
  assert.equal(km.fired[0], "Manual kill: title defect");
});

test("risk flags: A flags break-even above 90 and pessimistic negative; B flags DSCR, negative CF, break-even above 100", () => {
  const ra = E3.refinance(A.arv, A.ltv, A.rate, A.term, A.refiClosing, A.initialLoan);
  const scA = E3.scenario(A.rent, A.vacancy, A.fixed, A.varPct, ra.payment);
  const insA = E3.scenarioInputs(A.rent, A.vacancy);
  const pesA = E3.scenario(insA.pessimistic.rent, insA.pessimistic.vacancyPct, A.fixed, A.varPct, ra.payment);
  const flagsA = E3.riskFlags({
    dscr: E3.dscr(scA.noi * 12, ra.payment * 12), baseCf: scA.cf, pesCf: pesA.cf,
    breakEvenPct: E3.breakEvenOccupancy(scA.opEx * 12, ra.payment * 12, A.rent * 12),
    grade: "B", usableComps: 3, cashLeft: 9000, allIn: 155000
  });
  assert.ok(flagsA.some(function (f) { return f.indexOf("Break-even occupancy above 90%") === 0; }));
  assert.ok(flagsA.some(function (f) { return f.indexOf("Pessimistic cash flow negative") === 0; }));
  assert.ok(!flagsA.some(function (f) { return f.indexOf("DSCR below") === 0; }));
  const rb = E3.refinance(B.arv, B.ltv, B.rate, B.term, B.refiClosing, B.initialLoan);
  const scB = E3.scenario(B.rent, B.vacancy, B.fixed, B.varPct, rb.payment);
  const flagsB = E3.riskFlags({
    dscr: E3.dscr(scB.noi * 12, rb.payment * 12), baseCf: scB.cf, pesCf: -494.01,
    breakEvenPct: E3.breakEvenOccupancy(scB.opEx * 12, rb.payment * 12, B.rent * 12),
    grade: "C", usableComps: 3, cashLeft: 41500, allIn: 164000
  });
  assert.ok(flagsB.some(function (f) { return f.indexOf("DSCR below 1.00") === 0; }));
  assert.ok(flagsB.some(function (f) { return f.indexOf("Negative base cash flow") === 0; }));
  assert.ok(flagsB.some(function (f) { return f.indexOf("Break-even occupancy above 100%") === 0; }));
  const flagsD = E3.riskFlags({
    dscr: 1.5, baseCf: 100, pesCf: 50, breakEvenPct: 80,
    grade: "D", usableComps: 1, cashLeft: 90000, allIn: 155000
  });
  assert.ok(flagsD.indexOf("Rent grade D: seller claim only, lease proxy") !== -1);
  assert.ok(flagsD.some(function (f) { return f.indexOf("Fewer than 2 usable rent comps") === 0; }));
  assert.ok(flagsD.some(function (f) { return f.indexOf("Cash left in deal above 50%") === 0; }));
});

test("usable rent comps: complete rows count, incomplete rows do not", () => {
  const comps = [
    { address: "113 Solid BRRRR Ln", rent: 1800, grade: "B", source: "Sample listing", date: "2026-08-20" },
    { address: "109 Solid BRRRR Ln", rent: 1750, grade: "B", source: "Sample listing", date: "2026-07-18" },
    { address: "", rent: 1850, grade: "B", source: "Sample listing", date: "2026-06-25" },
    { address: "117 Solid BRRRR Ln", rent: 0, grade: "B", source: "Sample listing", date: "2026-06-25" },
    { address: "119 Solid BRRRR Ln", rent: 1850, grade: "", source: "Sample listing", date: "2026-06-25" }
  ];
  const r = E3.usableRentComps(comps);
  assert.equal(r.total, 5);
  assert.equal(r.usable, 2);
  assert.equal(E3.usableRentComps([]).usable, 0);
  assert.equal(E3.usableRentComps(null).usable, 0);
});

test("canonical JSON: keys sorted recursively, order independent", () => {
  const a = E3.canonicalJSON({ b: 1, a: { d: 4, c: 3 } });
  assert.equal(a, "{\"a\":{\"c\":3,\"d\":4},\"b\":1}");
  assert.equal(E3.canonicalJSON({ b: 1, a: { c: 3, d: 4 } }), a);
  assert.equal(E3.canonicalJSON([3, 1, 2]), "[3,1,2]");
  assert.equal(E3.canonicalJSON(null), "null");
  assert.equal(E3.canonicalJSON("x"), "\"x\"");
});

test("receipt chain: GENESIS first, second links to first, verify passes", () => {
  const fields1 = { engine: "E3", sample: "A", cashLeft: 9000, offer_authorized: false };
  const r1 = E3.buildReceipt(fields1, "GENESIS", 1);
  r1.hash = sha256Hex(E3.canonicalJSON(r1));
  const fields2 = { engine: "E3", sample: "B", cashLeft: 41500, offer_authorized: false };
  const r2 = E3.buildReceipt(fields2, r1.hash, 2);
  r2.hash = sha256Hex(E3.canonicalJSON(r2));
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r2.prev_hash, r1.hash);
  assert.equal(r1.schema_version, "e3-rental-brrrr-receipt.v1.0");
  const v = E3.verifyChain([r1, r2], sha256Hex);
  assert.equal(v.ok, true);
  assert.equal(v.results.length, 2);
  assert.equal(v.results[0].ok, true);
  assert.equal(v.results[1].ok, true);
  const empty = E3.verifyChain([], sha256Hex);
  assert.equal(empty.ok, true);
  assert.equal(empty.results.length, 0);
});

test("receipt chain: tampered field fails, tampered prev_hash fails", () => {
  const r1 = E3.buildReceipt({ cashLeft: 9000 }, "GENESIS", 1);
  r1.hash = sha256Hex(E3.canonicalJSON(r1));
  const r2 = E3.buildReceipt({ cashLeft: 41500 }, r1.hash, 2);
  r2.hash = sha256Hex(E3.canonicalJSON(r2));
  const bad = JSON.parse(JSON.stringify(r2));
  bad.fields.cashLeft = 99999;
  const v1 = E3.verifyChain([r1, bad], sha256Hex);
  assert.equal(v1.ok, false);
  assert.equal(v1.results[1].ok, false);
  assert.equal(v1.results[1].reason, "hash mismatch");
  const bad2 = JSON.parse(JSON.stringify(r2));
  bad2.prev_hash = "0000000000000000000000000000000000000000000000000000000000000000";
  const v2 = E3.verifyChain([r1, bad2], sha256Hex);
  assert.equal(v2.ok, false);
  assert.equal(v2.results[1].reason, "prev_hash does not match prior hash");
});

test("no em dash in any shipped file", () => {
  const dir = path.join(__dirname, "..");
  ["index.html", "e3.js", "tests/test-e3.js"].forEach(function (f) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.equal(text.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});

test("shipped files exist and index.html references e3.js, carries the labels and the Verify button", () => {
  const dir = path.join(__dirname, "..");
  assert.ok(fs.existsSync(path.join(dir, "index.html")));
  assert.ok(fs.existsSync(path.join(dir, "e3.js")));
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.indexOf("e3.js") !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE") !== -1);
  assert.ok(html.indexOf("NOT A VALUATION, NOT AN APPRAISAL") !== -1);
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("Verify chain") !== -1);
  assert.ok(html.indexOf("Issue receipt") !== -1);
  assert.ok(html.indexOf("NO offer") !== -1);
  assert.ok(html.indexOf("GENESIS") !== -1);
});
