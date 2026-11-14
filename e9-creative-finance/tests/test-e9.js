/* Tests for the E9 Creative Finance Underwriting Engine.
   Run from ~/workspace/e9-creative-finance with:
   node --test tests/test-e9.js
   Every sample expectation below was hand-computed from the
   2026-11-04 E9 build inputs and re-proved with the closed-form
   amortizing payment and balloon formulas before being written
   here. Sample A values also match the 2026-11-04 build's own
   sample note (subject-to $280.00, seller finance $1,319.01,
   wrap $1,596.73, best structure subject-to). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const E9 = require("../e9.js");

function r2(x) {
  if (x === null || x === undefined) { return null; }
  return Math.round(x * 100) / 100;
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/* Sample A inputs, carried from the 2026-11-04 E9 build loadSample("a"). */
function sampleA() {
  return {
    address: "123 Creative Ln, Benton Harbor, MI 49022",
    parcel: "SAMPLE-PARCEL-E9A",
    arv: 250000, rent: 1900, tax: 250, ins: 120, hoa: 0, maint: 150,
    resalePct: 8, grade: "B", sourcesCount: 2,
    loanKnown: "known", loanBalance: 180000, loanRate: 4.5,
    loanPayment: 1100, loanTermRemain: 300, loanType: "Conventional",
    dueOnSale: "yes", freeClear: false, dosMitigation: true,
    ask: 240000, cashToSeller: 5000, down: 20000,
    sellerNoteRate: 6, sellerNoteTerm: 360, sellerBalloonMo: 0,
    wrapBalance: 240000, wrapRate: 7, wrapTerm: 360,
    loRent: 1900, loOptionFee: 5000, loRentCredit: 200, loTermMo: 24,
    loStrike: 250000, loSubleaseRent: null,
    hybSecondAmt: 20000, hybSecondRate: 8, hybSecondTerm: 60,
    gates: {
      address_parcel: "pass", source: "pass", loan_facts: "pass",
      no_hallucination: "pass", authority: "pass"
    },
    manualKillIds: []
  };
}

/* Sample B inputs, carried from the 2026-11-04 E9 build loadSample("b"). */
function sampleB() {
  const i = sampleA();
  Object.assign(i, {
    address: "456 Pass Rd, Benton Harbor, MI 49022",
    parcel: "SAMPLE-PARCEL-E9B",
    arv: 200000, rent: 1200, tax: 200, ins: 100, hoa: 0, maint: 100,
    grade: "C",
    loanBalance: 210000, loanRate: 6, loanPayment: 1400,
    loanTermRemain: 300,
    ask: 210000, cashToSeller: 0, down: 10000,
    sellerNoteRate: 7, sellerNoteTerm: 360,
    wrapBalance: 210000, wrapRate: 8, wrapTerm: 360,
    loRent: 1200, loOptionFee: 2000, loRentCredit: 100, loTermMo: 24,
    loStrike: 220000, loSubleaseRent: null,
    hybSecondAmt: 10000, hybSecondRate: 8, hybSecondTerm: 60,
    dosMitigation: false
  });
  return i;
}

/* Sample C inputs, carried from the 2026-11-04 E9 build loadSample("c"). */
function sampleC() {
  const i = sampleA();
  Object.assign(i, {
    address: "789 Unknown Ln, Benton Harbor, MI 49022",
    parcel: "SAMPLE-PARCEL-E9C",
    arv: 240000, rent: 1800, tax: 220, ins: 110, hoa: 0, maint: 120,
    grade: "D",
    loanKnown: "unknown", loanBalance: null, loanRate: null,
    loanPayment: null, loanTermRemain: null, loanType: "",
    dueOnSale: "unknown",
    ask: 230000, cashToSeller: 10000, down: 15000,
    sellerNoteRate: 6, sellerNoteTerm: 360,
    wrapBalance: 230000, wrapRate: 7, wrapTerm: 360,
    loRent: 1800, loOptionFee: 3000, loRentCredit: 150, loTermMo: 24,
    loStrike: 240000, loSubleaseRent: null,
    hybSecondAmt: 15000, hybSecondRate: 8, hybSecondTerm: 60,
    dosMitigation: false,
    gates: {
      address_parcel: "pass", source: "pass", loan_facts: "hold",
      no_hallucination: "pass", authority: "pass"
    }
  });
  return i;
}

test("pmt: known values, zero rate, null handling", () => {
  assert.equal(r2(E9.pmt(220000, 6, 360)), 1319.01);
  assert.equal(r2(E9.pmt(240000, 7, 360)), 1596.73);
  assert.equal(r2(E9.pmt(200000, 7, 360)), 1330.6);
  assert.equal(r2(E9.pmt(210000, 8, 360)), 1540.91);
  assert.equal(r2(E9.pmt(100000, 12, 12)), 8884.88);
  assert.equal(r2(E9.pmt(12000, 0, 12)), 1000);
  assert.equal(r2(E9.pmt(20000, 8, 60)), 405.53);
  assert.equal(E9.pmt(null, 6, 360), null);
  assert.equal(E9.pmt(220000, 6, 0), null);
  assert.equal(E9.pmt(220000, 6, null), null);
});

test("balloonBal: known values, zero rate, null handling", () => {
  assert.equal(r2(E9.balloonBal(220000, 6, 360, 60)), 204719.59);
  assert.equal(r2(E9.balloonBal(220000, 6, 360, 120)), 184108.59);
  assert.equal(r2(E9.balloonBal(200000, 7, 360, 24)), 195789.89);
  assert.equal(r2(E9.balloonBal(12000, 0, 12, 6)), 6000);
  assert.equal(E9.balloonBal(220000, 6, 360, 0), null);
  assert.equal(E9.balloonBal(null, 6, 360, 60), null);
  /* Null rate is treated as a zero rate, exactly as in the 2026-11-04
     build: 220000 - (220000 / 360) x 60 = 183333.33. */
  assert.equal(r2(E9.balloonBal(220000, null, 360, 60)), 183333.33);
});

test("Sample A: loan gate, equity, other costs", () => {
  const r = E9.compute(sampleA());
  assert.equal(r.other, 520);
  assert.equal(r.resaleCost, 20000);
  assert.equal(r.loanFactsComplete, true);
  assert.equal(r.hardHeld, false);
  assert.equal(r.equity, 70000);
  assert.equal(r.dosRisk, "High, clause present (mitigation plan written)");
  assert.equal(r.gradeNote, "Grade B: rent is listed rent.");
});

test("Sample A: subject-to", () => {
  const r = E9.compute(sampleA());
  assert.equal(r2(r.st.cashFlow), 280);
  assert.equal(r2(r.st.annual), 3360);
  assert.equal(r2(r.st.equity), 65000);
  assert.equal(r2(r.st.exit), 50000);
  assert.equal(r.st.status, "VIABLE, positive cash flow");
});

test("Sample A: seller finance", () => {
  const r = E9.compute(sampleA());
  assert.equal(r2(r.sf.note), 220000);
  assert.equal(r2(r.sf.payment), 1319.01);
  assert.equal(r2(r.sf.cashFlow), 60.99);
  /* Annuals derive from the unrounded monthly cash flow, not the
     rounded display value: 60.9888 x 12 = 731.87. */
  assert.equal(r2(r.sf.annual), 731.87);
  assert.equal(r.sf.balloon, null);
  assert.equal(r2(r.sf.exit), 10000);
  assert.equal(r.sf.status, "VIABLE, positive cash flow");
});

test("Sample A: wrap", () => {
  const r = E9.compute(sampleA());
  assert.equal(r2(r.wr.payment), 1596.73);
  assert.equal(r2(r.wr.spread), 496.73);
  assert.equal(r2(r.wr.cashFlow), -216.73);
  assert.equal(r2(r.wr.annual), -2600.71);
  assert.equal(r2(r.wr.exit), -10000);
  assert.equal(r.wr.status, "NEGATIVE cash flow");
});

test("Sample A: lease-option", () => {
  const r = E9.compute(sampleA());
  assert.equal(r2(r.lo.cashFlow), -520);
  assert.equal(r2(r.lo.creditTotal), 4800);
  assert.equal(r2(r.lo.effective), 245200);
  assert.equal(r2(r.lo.feeRisk), 5000);
  assert.equal(r2(r.lo.exit), -15200);
  assert.equal(r.lo.status, "NEGATIVE cash flow");
});

test("Sample A: hybrid", () => {
  const r = E9.compute(sampleA());
  assert.equal(r2(r.hy.second), 405.53);
  assert.equal(r2(r.hy.payment), 1505.53);
  assert.equal(r2(r.hy.cashFlow), -125.53);
  assert.equal(r2(r.hy.annual), -1506.33);
  assert.equal(r2(r.hy.exit), 30000);
  assert.equal(r.hy.status, "NEGATIVE cash flow");
});

test("Sample A: best structure, kills, flags, recommendation", () => {
  const r = E9.compute(sampleA());
  assert.equal(r.best, "Subject-to");
  assert.equal(r2(r.bestCf), 280);
  assert.deepEqual(r.autoKills, []);
  assert.deepEqual(r.riskFlags, []);
  assert.equal(r.gatesOk, true);
  assert.deepEqual(r.gatesFailed, []);
  assert.equal(r.recommendation, "REVIEW, Subject-to");
  assert.equal(r.completeness.pct, 100);
  assert.deepEqual(r.completeness.missing, []);
});

test("Sample B: all structures negative, exits, best null", () => {
  const r = E9.compute(sampleB());
  assert.equal(r.other, 400);
  assert.equal(r.resaleCost, 16000);
  assert.equal(r.equity, -10000);
  assert.equal(r2(r.st.cashFlow), -600);
  assert.equal(r2(r.st.exit), -26000);
  assert.equal(r2(r.st.equity), -10000);
  assert.equal(r2(r.sf.payment), 1330.6);
  assert.equal(r2(r.sf.cashFlow), -530.6);
  assert.equal(r2(r.sf.exit), -16000);
  assert.equal(r2(r.wr.payment), 1540.91);
  assert.equal(r2(r.wr.spread), 140.91);
  assert.equal(r2(r.wr.cashFlow), -740.91);
  assert.equal(r2(r.wr.exit), -26000);
  assert.equal(r2(r.lo.cashFlow), -400);
  assert.equal(r2(r.lo.creditTotal), 2400);
  assert.equal(r2(r.lo.effective), 217600);
  assert.equal(r2(r.lo.exit), -33600);
  assert.equal(r2(r.hy.second), 202.76);
  assert.equal(r2(r.hy.payment), 1602.76);
  assert.equal(r2(r.hy.cashFlow), -802.76);
  assert.equal(r2(r.hy.exit), -36000);
  assert.equal(r.best, null);
  assert.equal(r.bestCf, null);
});

test("Sample B: four AUTO kills fire, recommendation PASS", () => {
  const r = E9.compute(sampleB());
  assert.deepEqual(r.autoKillIds, ["k_neg_cf", "k_neg_equity", "k_strike", "k_ask_arv"]);
  assert.equal(r.autoKills.length, 4);
  assert.equal(r.killActive, true);
  assert.equal(r.recommendation, "PASS");
  assert.deepEqual(r.riskFlags, ["Due-on-sale clause present with no mitigation plan"]);
});

test("Sample C: hard gate holds every structure, recommendation HOLD", () => {
  const r = E9.compute(sampleC());
  assert.equal(r.hardHeld, true);
  assert.equal(r.loanFactsComplete, false);
  assert.equal(r.equity, null);
  assert.equal(r.dosRisk, "Unknown");
  assert.equal(r.st.status, "HELD, loan facts unknown");
  assert.equal(r.sf.held, true);
  assert.equal(r.sf.status, "HELD, loan facts unknown");
  assert.equal(r.wr.held, true);
  assert.equal(r.lo.held, true);
  assert.equal(r.hy.held, true);
  assert.equal(r.best, null);
  assert.deepEqual(r.autoKills, []);
  assert.equal(r.holdConds.length, 1);
  assert.ok(r.holdConds[0].indexOf("Unknown loan facts") === 0);
  assert.ok(r.gatesFailed.indexOf("loan_facts") !== -1);
  assert.equal(r.recommendation, "HOLD");
  assert.equal(r.completeness.pct, 75);
});

test("Sample C: math still computes under the hold (page shows HELD)", () => {
  const r = E9.compute(sampleC());
  assert.equal(r2(r.sf.note), 215000);
  assert.equal(r2(r.sf.payment), 1289.03);
  assert.equal(r2(r.sf.cashFlow), 60.97);
  assert.equal(r2(r.sf.exit), 5800);
  assert.equal(r2(r.wr.payment), 1530.2);
  assert.equal(r2(r.lo.cashFlow), -450);
  assert.equal(r2(r.lo.creditTotal), 3600);
  assert.equal(r2(r.lo.effective), 236400);
  assert.equal(r2(r.lo.exit), -15600);
  assert.equal(r2(r.hy.second), 304.15);
  assert.equal(r.hy.payment, null);
  assert.equal(r.hy.cashFlow, null);
});

test("Free and clear: gate passes, subject-to and hybrid N/A, seller finance live", () => {
  const i = sampleA();
  i.freeClear = true;
  i.loanKnown = "unknown";
  i.loanBalance = null; i.loanRate = null; i.loanPayment = null;
  i.loanTermRemain = null; i.loanType = ""; i.dueOnSale = "unknown";
  const r = E9.compute(i);
  assert.equal(r.loanFactsComplete, true);
  assert.equal(r.hardHeld, false);
  assert.equal(r.equity, 250000);
  assert.equal(r.dosRisk, "None, free and clear");
  assert.equal(r.st.status, "N/A, free and clear, no loan to take over");
  assert.equal(r.sf.held, false);
  assert.equal(r2(r.sf.cashFlow), 60.99);
  assert.equal(r.hy.held, true);
  assert.equal(r.hy.status, "N/A, free and clear");
});

test("Free-and-clear carried quirk: all-negative cash flow does not fire kill 1", () => {
  const i = sampleA();
  i.freeClear = true;
  i.loanKnown = "unknown";
  i.loanBalance = null; i.loanRate = null; i.loanPayment = null;
  i.loanTermRemain = null; i.loanType = ""; i.dueOnSale = "unknown";
  i.rent = 500;
  const r = E9.compute(i);
  assert.ok(r2(r.sf.cashFlow) < 0);
  assert.ok(r2(r.lo.cashFlow) < 0);
  assert.equal(r.autoKillIds.indexOf("k_neg_cf"), -1);
  assert.deepEqual(r.autoKills, []);
});

test("Balloon kill: balloon balance above equity fires k_balloon, PASS", () => {
  const i = sampleA();
  i.sellerBalloonMo = 60;
  const r = E9.compute(i);
  assert.equal(r2(r.sf.balloon), 204719.59);
  /* Exit from the unrounded balloon: 250000 - 204719.5850 - 20000 = 25280.41. */
  assert.equal(r2(r.sf.exit), 25280.41);
  assert.deepEqual(r.autoKillIds, ["k_balloon"]);
  assert.equal(r.recommendation, "PASS");
});

test("Manual kills append and force PASS; risk flags follow checkboxes", () => {
  const i = sampleA();
  i.manualKillIds = ["k_title", "k_servicer", "k_dos"];
  const r = E9.compute(i);
  assert.equal(r.manualKills.length, 3);
  assert.equal(r.killActive, true);
  assert.equal(r.recommendation, "PASS");
  assert.ok(r.riskFlags.indexOf("Title defect with no cure cost") !== -1);
  assert.ok(r.riskFlags.indexOf("Wrap with no third-party servicer") !== -1);
  assert.ok(r.riskFlags.indexOf("Due-on-sale kill checked manually") !== -1);
});

test("Risk flags: unknown due-on-sale, grade D rent, no mitigation", () => {
  const i = sampleC();
  const r = E9.compute(i);
  assert.ok(r.riskFlags.indexOf("Due-on-sale status unknown") !== -1);
  assert.ok(r.riskFlags.indexOf("Rent is grade D, seller claim only, lease proxy") !== -1);
  assert.equal(r.gradeNote, "Grade D: seller claim only, a lease proxy, never proven income.");
  const j = sampleB();
  const rj = E9.compute(j);
  assert.ok(rj.riskFlags.indexOf("Due-on-sale clause present with no mitigation plan") !== -1);
});

test("Gates fail closed: one held gate blocks REVIEW even with a viable structure", () => {
  const i = sampleA();
  i.gates = {
    address_parcel: "pass", source: "hold", loan_facts: "pass",
    no_hallucination: "pass", authority: "pass"
  };
  const r = E9.compute(i);
  assert.equal(r.best, "Subject-to");
  assert.equal(r.gatesOk, false);
  assert.deepEqual(r.gatesFailed, ["source"]);
  assert.equal(r.recommendation, "HOLD");
});

test("Null handling: empty input holds everything and invents nothing", () => {
  const r = E9.compute({});
  assert.equal(r.hardHeld, true);
  assert.equal(r.loanFactsComplete, false);
  assert.equal(r.equity, null);
  assert.equal(r.other, 0);
  assert.equal(r.resalePct, 8);
  assert.equal(r.resaleCost, null);
  assert.equal(r.st.cashFlow, null);
  assert.equal(r.sf.note, null);
  assert.equal(r.wr.payment, null);
  assert.equal(r.lo.cashFlow, null);
  assert.equal(r.hy.payment, null);
  assert.equal(r.best, null);
  assert.equal(r.recommendation, "HOLD");
  assert.equal(r.completeness.pct, 0);
  assert.equal(r.completeness.missing.length, 8);
});

test("Resale cost percent defaults to 8 when blank", () => {
  const i = sampleA();
  i.resalePct = null;
  const r = E9.compute(i);
  assert.equal(r.resalePct, 8);
  assert.equal(r.resaleCost, 20000);
  const j = sampleA();
  j.resalePct = 10;
  assert.equal(r2(E9.compute(j).resaleCost), 25000);
});

test("Lease-option sublease blank defaults to market rent", () => {
  const i = sampleA();
  i.loSubleaseRent = null;
  assert.equal(r2(E9.compute(i).lo.cashFlow), -520);
  i.loSubleaseRent = 2100;
  assert.equal(r2(E9.compute(i).lo.cashFlow), -320);
});

test("Canonical JSON: sorted keys, order independent", () => {
  const a = E9.canonicalJSON({ b: 1, a: { d: 2, c: 3 } });
  assert.equal(a, '{"a":{"c":3,"d":2},"b":1}');
  const x = E9.canonicalJSON({ z: 1, a: 2 });
  const y = E9.canonicalJSON({ a: 2, z: 1 });
  assert.equal(x, y);
  assert.equal(E9.canonicalJSON([3, 1, 2]), "[3,1,2]");
});

test("Receipt chain: GENESIS first, second links, verify passes", () => {
  const fields1 = { run_id: "E9-TEST-1", best_structure: "Subject-to", best_monthly_cash_flow: 280 };
  const fields2 = { run_id: "E9-TEST-2", best_structure: null, best_monthly_cash_flow: null };
  const r1 = E9.buildReceipt(fields1, "GENESIS", 1);
  r1.hash = sha256Hex(E9.canonicalJSON(r1));
  const r2b = E9.buildReceipt(fields2, r1.hash, 2);
  r2b.hash = sha256Hex(E9.canonicalJSON(r2b));
  assert.equal(r1.schema_version, "e9-creative-finance-receipt.v1.0");
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r2b.prev_hash, r1.hash);
  const v = E9.verifyChain([r1, r2b], sha256Hex);
  assert.equal(v.ok, true);
  assert.deepEqual(v.results.map((x) => x.ok), [true, true]);
});

test("Receipt chain: tampered field fails, tampered prev_hash fails, empty chain verifies", () => {
  const r1 = E9.buildReceipt({ run_id: "E9-TEST-1", best_monthly_cash_flow: 280 }, "GENESIS", 1);
  r1.hash = sha256Hex(E9.canonicalJSON(r1));
  const r2b = E9.buildReceipt({ run_id: "E9-TEST-2" }, r1.hash, 2);
  r2b.hash = sha256Hex(E9.canonicalJSON(r2b));
  const tampered = JSON.parse(JSON.stringify(r2b));
  tampered.fields.run_id = "E9-FORGED";
  assert.equal(E9.verifyChain([r1, tampered], sha256Hex).ok, false);
  const badLink = JSON.parse(JSON.stringify(r2b));
  badLink.prev_hash = "GENESIS";
  const v2 = E9.verifyChain([r1, badLink], sha256Hex);
  assert.equal(v2.ok, false);
  assert.equal(v2.results[1].ok, false);
  assert.equal(E9.verifyChain([], sha256Hex).ok, true);
});

test("No em dash in any shipped file", () => {
  const dir = path.join(__dirname, "..");
  ["index.html", "e9.js", path.join("tests", "test-e9.js")].forEach((f) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.equal(text.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});

test("Shipped files exist and index.html carries the required markers", () => {
  const dir = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(fs.existsSync(path.join(dir, "e9.js")));
  assert.ok(html.indexOf('src="e9.js"') !== -1, "index.html must load e9.js");
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE") !== -1);
  assert.ok(html.indexOf("Verify chain") !== -1);
  assert.ok(html.indexOf("Issue receipt") !== -1);
  assert.ok(html.indexOf("e9-creative-finance-receipt.v1.0") !== -1);
  assert.ok(html.indexOf("e9-creative-finance.pages.dev") !== -1, "must cite the Nov 4 Cloudflare source URL");
  assert.ok(html.indexOf("No E9 specification document was found in the vault") !== -1, "must state the vault gap");
  assert.ok(html.indexOf("No offer without Jeramie") !== -1);
});
