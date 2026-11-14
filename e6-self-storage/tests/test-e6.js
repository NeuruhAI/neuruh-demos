/* Tests for E6 Self-Storage Underwriting Engine v1.0.
   Run: node --test tests/test-e6.js from ~/workspace/e6-self-storage/
   Every money expectation below was hand-computed from the 2026-11-04
   E6 build samples (~/workspace/e6-self-storage-site/index.html) and
   re-proved independently here. All figures are MODELED ESTIMATES,
   NOT A VALUATION, NOT AN APPRAISAL. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const E6 = require("../e6.js");

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function approx(actual, expected, tol) {
  assert.ok(
    actual !== null && Math.abs(actual - expected) <= (tol === undefined ? 0.01 : tol),
    "expected " + expected + " +/- " + (tol === undefined ? 0.01 : tol) + ", got " + actual
  );
}

/* Sample A units, carried from the 2026-11-04 E6 build.
   Monthly PGI: 40x65=2600, 60x95=5700, 50x145=7250, 30x225=6750,
   20x295=5900. Sum 28200 monthly, 338400 annual.
   Occupied: 36+54+45+27+18=180 of 200 units.
   Rentable SF: 40x25=1000, 60x50=3000, 50x100=5000, 30x200=6000,
   20x300=6000. Sum 21000 SF. */
const SAMPLE_A_UNITS = [
  { type: "5x5", size: 25, count: 40, occupied: 36, rate: 65 },
  { type: "5x10", size: 50, count: 60, occupied: 54, rate: 95 },
  { type: "10x10", size: 100, count: 50, occupied: 45, rate: 145 },
  { type: "10x20", size: 200, count: 30, occupied: 27, rate: 225 },
  { type: "10x30", size: 300, count: 20, occupied: 18, rate: 295 }
];

const SAMPLE_A_RATES = [
  { facility: "Rival Storage North", size: "10x10", rate: 140, source: "SpareFoot", date: "2026-10-01", ref: "sparefoot.example/rival-north-10x10" },
  { facility: "Rival Storage South", size: "10x10", rate: 150, source: "StorageCafe", date: "2026-10-02", ref: "storagecafe.example/rival-south-10x10" },
  { facility: "Rival Storage East", size: "10x20", rate: 230, source: "Facility website survey", date: "2026-10-03", ref: "facility-website.example/rival-east-10x20" }
];

/* Sample A opex: 18000+9000+12000+8000+24000+6000+5000+4000 = 86000.
   Stabilized GPR = 338400 x 90% = 304560. EGI = 304560 + 6000 = 310560.
   Stabilized NOI = 310560 - 86000 = 224560. Value = 224560 / 7% = 3208000.
   Break-even = (86000 - 6000) / 338400 = 23.64%.
   Opex ratio = 86000 / 310560 = 27.69%.
   Actual rent monthly: 36x65=2340, 54x95=5130, 45x145=6525, 27x225=6075,
   18x295=5310. Sum 25380 monthly, 304560 annual.
   Actual EGI = 304560 + 6000 = 310560. Actual NOI = 310560 - 86000 = 224560.
   NOI per unit = 224560 / 200 = 1122.80. NOI per SF = 224560 / 21000 = 10.69.
   Break-even rent = (86000 - 6000) / 12 / 180 = 37.04. */
const SAMPLE_A_OPEX = [18000, 9000, 12000, 8000, 24000, 6000, 5000, 4000];

/* Sample B units, carried from the 2026-11-04 E6 build.
   Monthly PGI: 50x60=3000, 70x90=6300, 60x135=8100, 40x210=8400.
   Sum 25800 monthly, 309600 annual.
   Occupied: 38+52+45+30=165 of 220 units, 75%.
   Rentable SF: 50x25=1250, 70x50=3500, 60x100=6000, 40x200=8000.
   Sum 18750 SF.
   Actual rent monthly: 38x60=2280, 52x90=4680, 45x135=6075, 30x210=6300.
   Sum 19335 monthly, 232020 annual. Actual EGI = 232020 + 4800 = 236820.
   Opex: 15000+8000+11000+9000+30000+9000+4000+3500 = 89500.
   Actual NOI = 236820 - 89500 = 147320.
   Stabilized GPR = 309600 x 90% = 278640. EGI = 278640 + 4800 = 283440.
   Stabilized NOI = 283440 - 89500 = 193940. Value = 193940 / 7.5% = 2585866.67.
   Break-even = (89500 - 4800) / 309600 = 27.36%.
   Opex ratio = 89500 / 283440 = 31.58%.
   NOI per unit = 193940 / 220 = 881.55. NOI per SF = 193940 / 18750 = 10.34.
   Break-even rent = (89500 - 4800) / 12 / 165 = 42.78. */
const SAMPLE_B_UNITS = [
  { type: "5x5", size: 25, count: 50, occupied: 38, rate: 60 },
  { type: "5x10", size: 50, count: 70, occupied: 52, rate: 90 },
  { type: "10x10", size: 100, count: 60, occupied: 45, rate: 135 },
  { type: "10x20", size: 200, count: 40, occupied: 30, rate: 210 }
];
const SAMPLE_B_OPEX = [15000, 8000, 11000, 9000, 30000, 9000, 4000, 3500];

/* Sample C units, carried from the 2026-11-04 E6 build.
   Monthly PGI: 30x70=2100, 40x100=4000, 30x150=4500. Sum 10600 monthly,
   127200 annual. Occupied 24+30+21=75 of 100 units, 75%.
   Actual rent monthly: 24x70=1680, 30x100=3000, 21x150=3150. Sum 7830
   monthly, 93960 annual. Actual EGI = 93960 + 2400 = 96360.
   Opex: 9000+5000+7000+5000+18000+4000+3000+2000 = 53000.
   Actual NOI = 96360 - 53000 = 43360.
   Stabilized GPR = 127200 x 85% = 108120. EGI = 108120 + 2400 = 110520.
   Stabilized NOI = 110520 - 53000 = 57520. Value = 57520 / 7% = 821714.29.
   Break-even = (53000 - 2400) / 127200 = 39.78%. */
const SAMPLE_C_UNITS = [
  { type: "5x5", size: 25, count: 30, occupied: 24, rate: 70 },
  { type: "5x10", size: 50, count: 40, occupied: 30, rate: 100 },
  { type: "10x10", size: 100, count: 30, occupied: 21, rate: 150 }
];
const SAMPLE_C_OPEX = [9000, 5000, 7000, 5000, 18000, 4000, 3000, 2000];

test("Sample A unit mix totals", function () {
  const t = E6.unitTotals(SAMPLE_A_UNITS);
  assert.equal(t.hasUnits, true);
  assert.equal(t.totalUnits, 200);
  assert.equal(t.totalOccupied, 180);
  assert.equal(t.totalSf, 21000);
  approx(t.occupancy, 0.9);
  assert.equal(t.pgiMonthly, 28200);
  assert.equal(t.pgiAnnual, 338400);
  assert.equal(t.actualMonthly, 25380);
  assert.equal(t.actualAnnual, 304560);
  assert.equal(t.vacancyLoss, 33840);
  assert.equal(t.unitError, false);
  assert.equal(t.validRows.length, 5);
  assert.equal(t.rows[0].pgiMonthly, 2600);
  assert.equal(t.rows[0].actualMonthly, 2340);
});

test("Sample A stabilized NOI, value, break-even", function () {
  const t = E6.unitTotals(SAMPLE_A_UNITS);
  const opex = E6.opexTotal(SAMPLE_A_OPEX);
  assert.equal(opex, 86000);
  const s = E6.stabilized({
    pgiAnnual: t.pgiAnnual, actualAnnual: t.actualAnnual,
    totalUnits: t.totalUnits, totalOccupied: t.totalOccupied, totalSf: t.totalSf,
    stabOccPct: 90, otherIncome: 6000, capPct: 7, opex: opex
  });
  assert.equal(s.stabGPR, 304560);
  assert.equal(s.stabEGI, 310560);
  assert.equal(s.actualEGI, 310560);
  assert.equal(s.actualNOI, 224560);
  assert.equal(s.stabNOI, 224560);
  approx(s.opexRatio, 86000 / 310560);
  approx(s.value, 3208000);
  approx(s.beOcc, 80000 / 338400);
  approx(s.beRent, 80000 / 12 / 180);
  approx(s.noiPerUnit, 1122.8);
  approx(s.noiPerSF, 224560 / 21000);
});

test("Sample A expansion and remote", function () {
  const exp = E6.expansion({ expUnits: 40, expRate: 145, expCost: 400000, expOpexPct: 25, stabOccPct: 90 });
  assert.equal(exp.expRent, 62640);
  assert.equal(exp.expOpex, 15660);
  assert.equal(exp.expNOI, 46980);
  approx(exp.expYield, 46980 / 400000);
  assert.equal(exp.costPerUnit, 10000);
  const rem = E6.remote({ remoteCount: 5, onsiteCost: 36000, remoteCost: 12000 });
  assert.equal(rem.count, 5);
  approx(rem.score, 5 / 6);
  assert.equal(rem.saving, 24000);
  assert.ok(rem.verdict.indexOf("Strong remote candidate") === 0);
});

test("Sample A rate comps", function () {
  const t = E6.unitTotals(SAMPLE_A_UNITS);
  const rt = E6.rateTotals(SAMPLE_A_RATES, t.validRows);
  assert.equal(rt.usableCount, 3);
  assert.equal(rt.distinctSources, 3);
  assert.deepEqual(rt.sourceNames, ["SpareFoot", "StorageCafe", "Facility website survey"]);
  assert.deepEqual(rt.rateRange, { low: 140, high: 230 });
  assert.deepEqual(rt.subjectRateRange, { low: 65, high: 295 });
});

test("Sample B full run", function () {
  const t = E6.unitTotals(SAMPLE_B_UNITS);
  assert.equal(t.totalUnits, 220);
  assert.equal(t.totalOccupied, 165);
  assert.equal(t.totalSf, 18750);
  approx(t.occupancy, 0.75);
  assert.equal(t.pgiAnnual, 309600);
  assert.equal(t.actualAnnual, 232020);
  assert.equal(t.vacancyLoss, 77580);
  const opex = E6.opexTotal(SAMPLE_B_OPEX);
  assert.equal(opex, 89500);
  const s = E6.stabilized({
    pgiAnnual: t.pgiAnnual, actualAnnual: t.actualAnnual,
    totalUnits: t.totalUnits, totalOccupied: t.totalOccupied, totalSf: t.totalSf,
    stabOccPct: 90, otherIncome: 4800, capPct: 7.5, opex: opex
  });
  assert.equal(s.stabGPR, 278640);
  assert.equal(s.stabEGI, 283440);
  assert.equal(s.actualEGI, 236820);
  assert.equal(s.actualNOI, 147320);
  assert.equal(s.stabNOI, 193940);
  approx(s.opexRatio, 89500 / 283440);
  approx(s.value, 193940 / 0.075, 0.01);
  approx(s.beOcc, 84700 / 309600);
  approx(s.beRent, 84700 / 12 / 165);
  approx(s.noiPerUnit, 193940 / 220);
  approx(s.noiPerSF, 193940 / 18750);
  const exp = E6.expansion({ expUnits: 60, expRate: 95, expCost: 360000, expOpexPct: 30, stabOccPct: 90 });
  assert.equal(exp.expRent, 61560);
  assert.equal(exp.expOpex, 18468);
  assert.equal(exp.expNOI, 43092);
  approx(exp.expYield, 43092 / 360000);
  assert.equal(exp.costPerUnit, 6000);
  const rem = E6.remote({ remoteCount: 3, onsiteCost: 36000, remoteCost: 15000 });
  assert.equal(rem.saving, 21000);
  approx(rem.score, 0.5);
  assert.ok(rem.verdict.indexOf("Partially remote-ready") === 0);
});

test("Sample C kills fire, math still computes", function () {
  const t = E6.unitTotals(SAMPLE_C_UNITS);
  assert.equal(t.totalUnits, 100);
  assert.equal(t.totalOccupied, 75);
  assert.equal(t.pgiAnnual, 127200);
  assert.equal(t.actualAnnual, 93960);
  const opex = E6.opexTotal(SAMPLE_C_OPEX);
  assert.equal(opex, 53000);
  const s = E6.stabilized({
    pgiAnnual: t.pgiAnnual, actualAnnual: t.actualAnnual,
    totalUnits: t.totalUnits, totalOccupied: t.totalOccupied, totalSf: t.totalSf,
    stabOccPct: 85, otherIncome: 2400, capPct: 7, opex: opex
  });
  assert.equal(s.stabGPR, 108120);
  assert.equal(s.stabEGI, 110520);
  assert.equal(s.actualNOI, 43360);
  assert.equal(s.stabNOI, 57520);
  approx(s.value, 57520 / 0.07, 0.01);
  approx(s.beOcc, 50600 / 127200);
  const exp = E6.expansion({ expUnits: 20, expRate: 120, expCost: 200000, expOpexPct: 25, stabOccPct: 85 });
  assert.equal(exp.expRent, 24480);
  assert.equal(exp.expOpex, 6120);
  assert.equal(exp.expNOI, 18360);
  approx(exp.expYield, 18360 / 200000);
  const kills = E6.evaluateKills({
    occVerify: "unverified",
    usableCount: 2, distinctSources: 1,
    manualKills: []
  });
  assert.equal(kills.killActive, true);
  assert.deepEqual(kills.fired, ["Occupancy unverifiable", "Street rates from a single source"]);
  const rec = E6.recommendation({ killActive: true, gatesOk: true, hasUnits: true, usableCount: 2 });
  assert.equal(rec, "PASS - do not proceed");
});

test("Unit row validity and error detection", function () {
  assert.equal(E6.validUnit({ size: 100, count: 10, occupied: 9, rate: 100 }), true);
  assert.equal(E6.validUnit({ size: 100, count: 10, occupied: 11, rate: 100 }), false);
  assert.equal(E6.validUnit({ size: 100, count: 10, occupied: 9, rate: 0 }), false);
  assert.equal(E6.validUnit({ size: null, count: 10, occupied: 9, rate: 100 }), false);
  assert.equal(E6.validUnit({ size: 100, count: 10, occupied: null, rate: 100 }), false);
  const t = E6.unitTotals([
    { type: "10x10", size: 100, count: 10, occupied: 12, rate: 100 },
    { type: "5x5", size: 25, count: 5, occupied: 5, rate: 60 }
  ]);
  assert.equal(t.unitError, true);
  assert.equal(t.hasUnits, true);
  assert.equal(t.totalUnits, 5);
  assert.equal(t.pgiAnnual, 3600);
  const t2 = E6.unitTotals([{ type: "10x10", size: 100, count: 10, occupied: null, rate: 100 }]);
  assert.equal(t2.unitError, true);
  assert.equal(t2.hasUnits, false);
  assert.equal(t2.pgiAnnual, null);
  const t3 = E6.unitTotals([]);
  assert.equal(t3.hasUnits, false);
  assert.equal(t3.pgiAnnual, null);
  assert.equal(t3.unitError, false);
});

test("Rate comp usability and distinct sources", function () {
  const rates = [
    { facility: "A", size: "10x10", rate: 140, source: "SpareFoot", date: "2026-10-01", ref: "x" },
    { facility: "B", size: "10x10", rate: 150, source: "sparefoot", date: "2026-10-02", ref: "y" },
    { facility: "", size: "10x10", rate: 150, source: "Other", date: "2026-10-02", ref: "z" },
    { facility: "C", size: "10x10", rate: 0, source: "Other", date: "2026-10-02", ref: "z" },
    { facility: "D", size: "10x10", rate: 160, source: "StorageCafe", date: "", ref: "z" }
  ];
  const rt = E6.rateTotals(rates, []);
  assert.equal(rt.usableCount, 2);
  assert.equal(rt.distinctSources, 1);
  assert.deepEqual(rt.rateRange, { low: 140, high: 150 });
  const rt2 = E6.rateTotals([], []);
  assert.equal(rt2.usableCount, 0);
  assert.equal(rt2.distinctSources, 0);
  assert.equal(rt2.rateRange, null);
});

test("Kill switch edge cases", function () {
  const none = E6.evaluateKills({ occVerify: "rent_roll", usableCount: 3, distinctSources: 3, manualKills: [] });
  assert.equal(none.killActive, false);
  assert.deepEqual(none.fired, []);
  const empty = E6.evaluateKills({ occVerify: "", usableCount: 0, distinctSources: 0, manualKills: [] });
  assert.equal(empty.killActive, false);
  const single = E6.evaluateKills({ occVerify: "rent_roll", usableCount: 1, distinctSources: 1, manualKills: [] });
  assert.equal(single.killActive, true);
  assert.deepEqual(single.fired, ["Street rates from a single source"]);
  const manual = E6.evaluateKills({ occVerify: "rent_roll", usableCount: 3, distinctSources: 2, manualKills: ["Title defect with no cure cost"] });
  assert.equal(manual.killActive, true);
  assert.deepEqual(manual.fired, ["Title defect with no cure cost"]);
});

test("Risk flags fire on their own triggers", function () {
  const base = {
    occVerify: "rent_roll", occTrend: "Stable", delinquencyPct: 0,
    usableCount: 3, expPermit: "Permitted by right", opexRatio: 0.3,
    stabNOI: 100000, remoteScore: 0.83, unitError: false
  };
  assert.deepEqual(E6.riskFlags(base), []);
  assert.ok(E6.riskFlags(Object.assign({}, base, { occVerify: "owner_statement" })).indexOf("Occupancy from owner statement only, not a rent roll") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { occVerify: "site_count" })).indexOf("Occupancy from site count only, not a rent roll") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { occTrend: "Falling" })).indexOf("Occupancy falling over 12 months") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { delinquencyPct: 6 })).indexOf("Delinquency above 5 percent") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { delinquencyPct: 5 })).length === 0);
  assert.ok(E6.riskFlags(Object.assign({}, base, { usableCount: 2 })).indexOf("Fewer than 3 usable rate comps") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { usableCount: 0 })).length === 0);
  assert.ok(E6.riskFlags(Object.assign({}, base, { expPermit: "Not permitted / unknown" })).indexOf("Expansion not permitted or unknown") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { opexRatio: 0.55 })).indexOf("Operating expense ratio above 50 percent") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { stabNOI: -100 })).indexOf("Stabilized NOI is negative") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { remoteScore: 0.17 })).indexOf("Remote readiness below 50 percent") !== -1);
  assert.ok(E6.riskFlags(Object.assign({}, base, { unitError: true })).indexOf("Unit mix row incomplete or occupied above count") !== -1);
});

test("Recommendation logic", function () {
  assert.equal(E6.recommendation({ killActive: false, gatesOk: true, hasUnits: true, usableCount: 3 }), "READY FOR HUMAN REVIEW - no offer without Jeramie");
  assert.equal(E6.recommendation({ killActive: false, gatesOk: false, hasUnits: true, usableCount: 3 }), "HOLD");
  assert.equal(E6.recommendation({ killActive: false, gatesOk: true, hasUnits: false, usableCount: 0 }), "HOLD - evidence incomplete");
  assert.equal(E6.recommendation({ killActive: false, gatesOk: true, hasUnits: true, usableCount: 2 }), "HOLD - evidence incomplete");
  assert.equal(E6.recommendation({ killActive: true, gatesOk: true, hasUnits: true, usableCount: 3 }), "PASS - do not proceed");
});

test("Null handling: missing inputs stay null, never invented", function () {
  const s = E6.stabilized({
    pgiAnnual: null, actualAnnual: null, totalUnits: null,
    totalOccupied: null, totalSf: null, stabOccPct: null,
    otherIncome: null, capPct: null, opex: null
  });
  assert.equal(s.stabGPR, null);
  assert.equal(s.stabEGI, null);
  assert.equal(s.actualEGI, null);
  assert.equal(s.actualNOI, null);
  assert.equal(s.stabNOI, null);
  assert.equal(s.opexRatio, null);
  assert.equal(s.value, null);
  assert.equal(s.beOcc, null);
  assert.equal(s.beRent, null);
  assert.equal(s.noiPerUnit, null);
  assert.equal(s.noiPerSF, null);
  assert.equal(E6.opexTotal([]), null);
  assert.equal(E6.opexTotal([null, null]), null);
  assert.equal(E6.opexTotal([100, null, 50]), 150);
  const s2 = E6.stabilized({
    pgiAnnual: 338400, actualAnnual: 304560, totalUnits: 200,
    totalOccupied: 180, totalSf: 21000, stabOccPct: 90,
    otherIncome: 6000, capPct: null, opex: 86000
  });
  assert.equal(s2.stabNOI, 224560);
  assert.equal(s2.value, null);
  const s3 = E6.stabilized({
    pgiAnnual: 338400, actualAnnual: 304560, totalUnits: 200,
    totalOccupied: 180, totalSf: 21000, stabOccPct: 90,
    otherIncome: 6000, capPct: 0, opex: 86000
  });
  assert.equal(s3.value, null);
  const exp = E6.expansion({ expUnits: null, expRate: null, expCost: null, expOpexPct: null, stabOccPct: null });
  assert.equal(exp.expRent, null);
  assert.equal(exp.expNOI, null);
  assert.equal(exp.expYield, null);
  assert.equal(exp.costPerUnit, null);
  const exp2 = E6.expansion({ expUnits: 40, expRate: 145, expCost: 0, expOpexPct: 25, stabOccPct: 90 });
  assert.equal(exp2.expNOI, 46980);
  assert.equal(exp2.expYield, null);
  const rem = E6.remote({ remoteCount: 0, onsiteCost: null, remoteCost: null });
  assert.equal(rem.score, 0);
  assert.equal(rem.saving, null);
  assert.ok(rem.verdict.indexOf("Onsite management likely required") === 0);
});

test("Canonical JSON: key order sorted recursively, order independent", function () {
  const a = E6.canonicalJSON({ b: 2, a: { d: 4, c: 3 } });
  const b = E6.canonicalJSON({ a: { c: 3, d: 4 }, b: 2 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":4},"b":2}');
  assert.equal(E6.canonicalJSON([3, 1, 2]), "[3,1,2]");
  assert.equal(E6.canonicalJSON(null), "null");
});

test("Receipt chain: GENESIS first, verify passes, tamper detected", function () {
  const r1 = E6.buildReceipt({ stabilized_noi: 224560 }, "GENESIS", 1);
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r1.schema_version, "e6-self-storage-receipt.v1.0");
  r1.hash = sha256Hex(E6.canonicalJSON(r1));
  const r2 = E6.buildReceipt({ stabilized_noi: 193940 }, r1.hash, 2);
  r2.hash = sha256Hex(E6.canonicalJSON(r2));
  const ok = E6.verifyChain([r1, r2], sha256Hex);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.results.map(function (x) { return x.ok; }), [true, true]);
  const tampered = JSON.parse(JSON.stringify(r2));
  tampered.fields.stabilized_noi = 1;
  const bad = E6.verifyChain([r1, tampered], sha256Hex);
  assert.equal(bad.ok, false);
  assert.equal(bad.results[1].ok, false);
  assert.equal(bad.results[1].reason, "hash mismatch");
  const badPrev = JSON.parse(JSON.stringify(r2));
  badPrev.prev_hash = "WRONG";
  const bad2 = E6.verifyChain([r1, badPrev], sha256Hex);
  assert.equal(bad2.ok, false);
  assert.equal(bad2.results[1].reason, "prev_hash does not match prior hash");
  const empty = E6.verifyChain([], sha256Hex);
  assert.equal(empty.ok, true);
  assert.deepEqual(empty.results, []);
});

test("Receipt chain verify works with an async hash function", async function () {
  const r1 = E6.buildReceipt({ stabilized_noi: 224560 }, "GENESIS", 1);
  r1.hash = sha256Hex(E6.canonicalJSON(r1));
  const asyncHash = function (str) { return Promise.resolve(sha256Hex(str)); };
  const v = await E6.verifyChain([r1], asyncHash);
  assert.equal(v.ok, true);
  assert.equal(v.results[0].reason, "hash matches");
});

test("Shipped files exist, reference the module, and carry the labels", function () {
  const dir = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(dir, "e6.js"), "utf8");
  const tests = fs.readFileSync(path.join(dir, "tests", "test-e6.js"), "utf8");
  assert.ok(html.indexOf('<script src="e6.js"></script>') !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE") !== -1);
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("Verify chain") !== -1);
  assert.ok(html.indexOf("Issue receipt") !== -1);
  assert.ok(html.indexOf("e6-self-storage-receipt.v1.0") !== -1);
  assert.ok(html.indexOf("Sample A loaded") !== -1);
  assert.ok(js.indexOf("MODELED ESTIMATE") !== -1);
  assert.ok(tests.indexOf("Sample A") !== -1);
});

test("Page labeling strings are present in the shipped index.html", function () {
  const dir = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.indexOf("MODELED ESTIMATE, NOT A VALUATION, NOT AN APPRAISAL") !== -1);
  assert.ok(html.indexOf("NOT A VALUATION") !== -1);
  assert.ok(html.indexOf("NOT AN APPRAISAL") !== -1);
});

test("No em dash in any shipped file", function () {
  const dir = path.resolve(__dirname, "..");
  ["index.html", "e6.js", path.join("tests", "test-e6.js")].forEach(function (rel) {
    const content = fs.readFileSync(path.join(dir, rel), "utf8");
    const count = content.split("\u2014").length - 1;
    assert.equal(count, 0, rel + " contains " + count + " em dashes");
  });
});
