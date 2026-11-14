/* Node test suite for E2 Small Multifamily Underwriting Engine v1.0.
   Run: node --test tests/test-e2.js  (from e2-small-multifamily/)
   Covers calculator math with hand-computed expectations, receipt
   hashing and chaining, tamper detection, and the no-em-dash rule. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const E2 = require("../e2.js");

function close(a, b, tol, label) {
  assert.ok(Math.abs(a - b) <= tol, label + ": expected " + b + ", got " + a);
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

const EXP_A = { taxes: 4800, insurance: 2400, maintenance: 3600, utilities: 2400, reserves: 2000, otherExpense: 0, mgmtPct: 8 };
const UNITS_A = [
  { rent: 950, market: 1000, status: "Occupied", grade: "A", deferred: 500 },
  { rent: 1000, market: 1050, status: "Occupied", grade: "A", deferred: 0 },
  { rent: 1050, market: 1100, status: "Occupied", grade: "B", deferred: 1200 },
  { rent: 1100, market: 1150, status: "Occupied", grade: "A", deferred: 0 }
];
const EXP_B = { taxes: 4500, insurance: 2400, maintenance: 3600, utilities: 3000, reserves: 2000, otherExpense: 0, mgmtPct: 8 };
const UNITS_B = [
  { rent: 700, market: 850, status: "Occupied", grade: "A", deferred: 800 },
  { rent: 700, market: 850, status: "Occupied", grade: "B", deferred: 0 },
  { rent: 700, market: 850, status: "Occupied", grade: "C", deferred: 1500 },
  { rent: 0, market: 850, status: "Vacant", grade: "C", deferred: 2500 }
];
const EXP_C = { taxes: 6000, insurance: 3600, maintenance: 5400, utilities: 4800, reserves: 3000, otherExpense: 0, mgmtPct: 8 };
const UNITS_C = [
  { rent: 800, market: 900, status: "Occupied", grade: "D", deferred: 2000 },
  { rent: 800, market: 900, status: "Occupied", grade: "D", deferred: 0 },
  { rent: 0, market: 900, status: "Vacant", grade: "D", deferred: 4000 },
  { rent: 0, market: 900, status: "Vacant", grade: "D", deferred: 4000 }
];

test("rent roll Sample A: 4 occupied, gross actual 4100/mo, stabilized 4300/mo", () => {
  const rr = E2.computeRentRoll(UNITS_A);
  assert.equal(rr.count, 4);
  assert.equal(rr.occupied, 4);
  assert.equal(rr.vacant, 0);
  assert.equal(rr.vacancyRate, 0);
  assert.equal(rr.grossActualMo, 4100);
  assert.equal(rr.grossStabMo, 4300);
  assert.equal(rr.gradeD, 0);
  assert.equal(rr.deferredRoll, 1700);
});

test("rent roll Sample B: 3 occupied, 1 vacant, 25 percent vacancy", () => {
  const rr = E2.computeRentRoll(UNITS_B);
  assert.equal(rr.count, 4);
  assert.equal(rr.occupied, 3);
  assert.equal(rr.vacant, 1);
  assert.equal(rr.vacancyRate, 0.25);
  assert.equal(rr.grossActualMo, 2100);
  assert.equal(rr.grossStabMo, 3400);
  assert.equal(rr.deferredRoll, 4800);
});

test("rent roll Sample C: 2 occupied, 2 vacant, 50 percent vacancy, 4 grade D", () => {
  const rr = E2.computeRentRoll(UNITS_C);
  assert.equal(rr.vacancyRate, 0.5);
  assert.equal(rr.gradeD, 4);
  assert.equal(rr.grossActualMo, 1600);
  assert.equal(rr.grossStabMo, 3600);
});

test("NOI Sample A, hand-computed: actual 28904.80, stabilized 31002.40", () => {
  const noiA = E2.computeNOI(Object.assign({ grossAnnual: 4100 * 12, vacancyPct: 5, otherIncome: 1200 }, EXP_A));
  const noiS = E2.computeNOI(Object.assign({ grossAnnual: 4300 * 12, vacancyPct: 5, otherIncome: 1200 }, EXP_A));
  close(noiA.noi, 28904.80, 0.01, "NOI actual A");
  close(noiS.noi, 31002.40, 0.01, "NOI stabilized A");
  close(noiA.egi, 47940, 0.01, "EGI actual A");
  close(noiS.egi, 50220, 0.01, "EGI stabilized A");
  close(noiA.totalExpenses, 19035.20, 0.01, "expenses actual A");
  close(noiS.totalExpenses, 19217.60, 0.01, "expenses stabilized A");
  close(noiA.mgmtFee, 3835.20, 0.01, "mgmt actual A");
  close(noiS.mgmtFee, 4017.60, 0.01, "mgmt stabilized A");
  assert.equal(noiA.steps.length, 5);
  assert.ok(noiA.steps[4].indexOf("28,904.80") !== -1);
});

test("NOI Sample B: actual 5917.60, stabilized 19386.40", () => {
  const noiA = E2.computeNOI(Object.assign({ grossAnnual: 2100 * 12, vacancyPct: 10, otherIncome: 600 }, EXP_B));
  const noiS = E2.computeNOI(Object.assign({ grossAnnual: 3400 * 12, vacancyPct: 10, otherIncome: 1200 }, EXP_B));
  close(noiA.noi, 5917.60, 0.01, "NOI actual B");
  close(noiS.noi, 19386.40, 0.01, "NOI stabilized B");
});

test("NOI Sample C: actual -6902.40 (negative), stabilized 12969.60", () => {
  const noiA = E2.computeNOI(Object.assign({ grossAnnual: 1600 * 12, vacancyPct: 10, otherIncome: 0 }, EXP_C));
  const noiS = E2.computeNOI(Object.assign({ grossAnnual: 3600 * 12, vacancyPct: 10, otherIncome: 0 }, EXP_C));
  close(noiA.noi, -6902.40, 0.01, "NOI actual C");
  close(noiS.noi, 12969.60, 0.01, "NOI stabilized C");
});

test("cap-rate value Sample A: 442891.43, per unit 110722.86, range 413365.33 to 476960.00", () => {
  const v = E2.stabilizedValue(31002.40, 7);
  close(v, 442891.43, 0.01, "stabilized value A");
  close(v / 4, 110722.86, 0.01, "value per unit A");
  const r = E2.valueRange(31002.40, 7, 0.5);
  close(r.low, 413365.33, 0.01, "range low A");
  close(r.mid, 442891.43, 0.01, "range mid A");
  close(r.high, 476960.00, 0.01, "range high A");
  assert.equal(r.lowCap, 7.5);
  assert.equal(r.highCap, 6.5);
});

test("cap-rate value Sample B: 298252.31 at 6.5 percent", () => {
  close(E2.stabilizedValue(19386.40, 6.5), 298252.31, 0.01, "stabilized value B");
});

test("monthly payment: 300000 at 7 percent 30yr is 1995.91; zero rate is principal over n", () => {
  const pmt = E2.monthlyPayment(300000, 7, 30);
  close(pmt, 1995.91, 0.01, "payment A");
  close(pmt * 12, 23950.89, 0.02, "annual debt service A");
  assert.equal(E2.monthlyPayment(120000, 0, 10), 1000);
  assert.equal(E2.monthlyPayment(null, 7, 30), null);
  assert.equal(E2.monthlyPayment(300000, 7, 0), null);
});

test("DSCR Sample A: stabilized 1.294, actual 1.207; Sample B stabilized 1.060 thin", () => {
  const adsA = E2.monthlyPayment(300000, 7, 30) * 12;
  close(E2.dscr(31002.40, adsA), 1.294, 0.001, "DSCR stab A");
  close(E2.dscr(28904.80, adsA), 1.207, 0.001, "DSCR actual A");
  const adsB = E2.monthlyPayment(206250, 7.5, 25) * 12;
  close(E2.dscr(19386.40, adsB), 1.060, 0.001, "DSCR stab B");
  assert.equal(E2.dscrBand(1.294), "comfortable");
  assert.equal(E2.dscrBand(1.060), "thin");
  assert.equal(E2.dscrBand(0.583), "kill");
  assert.equal(E2.dscrBand(null), "unknown");
  assert.equal(E2.dscr(10000, 0), null);
});

test("cash flow Sample A: stabilized 7051.51, cash-on-cash 7.05 percent on 100000 down", () => {
  const adsA = E2.monthlyPayment(300000, 7, 30) * 12;
  close(E2.cashFlow(31002.40, adsA), 7051.51, 0.02, "cash flow stab A");
  close(E2.cashOnCash(E2.cashFlow(31002.40, adsA), 100000) * 100, 7.05, 0.01, "CoC A");
  close(E2.cashFlow(19386.40, E2.monthlyPayment(206250, 7.5, 25) * 12), 1096.37, 0.02, "cash flow stab B");
  assert.equal(E2.cashOnCash(1000, 0), null);
});

test("break-even occupancy Sample A is 83.66 percent; Sample B is 90.25 percent", () => {
  const adsA = E2.monthlyPayment(300000, 7, 30) * 12;
  close(E2.breakEvenOccupancy(19217.60, adsA, 51600), 83.66, 0.01, "break-even A");
  const adsB = E2.monthlyPayment(206250, 7.5, 25) * 12;
  const noiSB = E2.computeNOI(Object.assign({ grossAnnual: 3400 * 12, vacancyPct: 10, otherIncome: 1200 }, EXP_B));
  close(E2.breakEvenOccupancy(noiSB.totalExpenses, adsB, 40800), 90.25, 0.01, "break-even B");
  assert.equal(E2.breakEvenOccupancy(1000, 1000, 0), null);
});

test("kill switch: Sample C fires all three contract kills; Sample A fires none", () => {
  const adsC = E2.monthlyPayment(240000, 8, 25) * 12;
  const dscrC = E2.dscr(12969.60, adsC);
  close(dscrC, 0.583, 0.001, "DSCR stab C");
  const killsC = E2.evaluateKills({ rentVerifiable: "no", vacancyRate: 0.5, leaseUpPlan: "", dscrStab: dscrC, manualKills: [] });
  assert.equal(killsC.killActive, true);
  assert.deepEqual(killsC.fired, [
    "Rent roll unverifiable",
    "Vacancy over 30 percent with no lease-up plan",
    "DSCR below 1.0 on stabilized NOI"
  ]);
  const adsA = E2.monthlyPayment(300000, 7, 30) * 12;
  const killsA = E2.evaluateKills({ rentVerifiable: "yes", vacancyRate: 0, leaseUpPlan: "", dscrStab: E2.dscr(31002.40, adsA), manualKills: [] });
  assert.equal(killsA.killActive, false);
  assert.deepEqual(killsA.fired, []);
  const withPlan = E2.evaluateKills({ rentVerifiable: "yes", vacancyRate: 0.5, leaseUpPlan: "lease in 90 days", dscrStab: 1.5, manualKills: [] });
  assert.equal(withPlan.killActive, false);
  const manual = E2.evaluateKills({ rentVerifiable: "yes", vacancyRate: 0, leaseUpPlan: "", dscrStab: 1.5, manualKills: ["Title defect with no cure cost"] });
  assert.equal(manual.killActive, true);
});

test("null handling: missing inputs stay null, never invented", () => {
  assert.equal(E2.stabilizedValue(10000, 0), null);
  assert.equal(E2.stabilizedValue(null, 7), null);
  assert.equal(E2.dscr(null, 1000), null);
  const noi = E2.computeNOI({ grossAnnual: null, vacancyPct: 5, otherIncome: 0 });
  assert.equal(noi.noi, null);
  assert.equal(noi.egi, null);
  const rr = E2.computeRentRoll([]);
  assert.equal(rr.grossActualMo, null);
  assert.equal(rr.vacancyRate, null);
  const vr = E2.valueRange(10000, 0.4, 0.5);
  assert.equal(vr.highCap, 0.1);
});

test("canonical JSON sorts keys recursively and is order independent", () => {
  const a = E2.canonicalJSON({ b: 1, a: { d: 4, c: 3 } });
  const b = E2.canonicalJSON({ a: { c: 3, d: 4 }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(E2.canonicalJSON([3, 1, 2]), "[3,1,2]");
  assert.equal(E2.canonicalJSON(null), "null");
});

test("receipt chain: GENESIS first, hashes verify, second links to first", () => {
  const fields1 = { run_id: "E2-TEST-1", noi_stabilized: 31002.40, value: 442891.43 };
  const fields2 = { run_id: "E2-TEST-2", noi_stabilized: 19386.40, value: 298252.31 };
  const r1 = E2.buildReceipt(fields1, "GENESIS", 1);
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r1.seq, 1);
  assert.equal(r1.schema_version, "e2-small-multifamily-receipt.v1.0");
  r1.hash = sha256Hex(E2.canonicalJSON(r1));
  const r2 = E2.buildReceipt(fields2, r1.hash, 2);
  assert.equal(r2.prev_hash, r1.hash);
  r2.hash = sha256Hex(E2.canonicalJSON(r2));
  const result = E2.verifyChain([r1, r2], sha256Hex);
  assert.equal(result.ok, true);
  assert.deepEqual(result.results.map((x) => x.ok), [true, true]);
});

test("receipt chain tamper detection: changed field fails, changed prev_hash fails", () => {
  const r1 = E2.buildReceipt({ run_id: "E2-T1", noi: 100 }, "GENESIS", 1);
  r1.hash = sha256Hex(E2.canonicalJSON(r1));
  const r2 = E2.buildReceipt({ run_id: "E2-T2", noi: 200 }, r1.hash, 2);
  r2.hash = sha256Hex(E2.canonicalJSON(r2));
  const tampered = JSON.parse(JSON.stringify(r2));
  tampered.fields.noi = 999;
  const bad1 = E2.verifyChain([r1, tampered], sha256Hex);
  assert.equal(bad1.ok, false);
  assert.equal(bad1.results[1].ok, false);
  const tamperedPrev = JSON.parse(JSON.stringify(r2));
  tamperedPrev.prev_hash = "GENESIS";
  const bad2 = E2.verifyChain([r1, tamperedPrev], sha256Hex);
  assert.equal(bad2.ok, false);
  const empty = E2.verifyChain([], sha256Hex);
  assert.equal(empty.ok, true);
});

test("no em dash in shipped files", () => {
  ["../index.html", "../e2.js", "test-e2.js"].forEach((rel) => {
    const p = path.join(__dirname, rel);
    const text = fs.readFileSync(p, "utf8");
    assert.equal(text.indexOf("\u2014"), -1, rel + " contains an em dash");
  });
});

test("shipped files exist and index references e2.js", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  assert.ok(html.indexOf('<script src="e2.js"></script>') !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE, NOT A VALUATION, NOT AN APPRAISAL") !== -1);
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("NO recommendation to buy or sell") !== -1 || html.indexOf("no recommendation to buy or sell") !== -1);
  assert.ok(html.indexOf("Verify chain") !== -1);
  assert.ok(html.indexOf("GENESIS") !== -1);
  assert.ok(fs.existsSync(path.join(__dirname, "../e2.js")));
});
