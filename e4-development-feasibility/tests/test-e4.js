/* Node test suite for E4 Development Feasibility Underwriting Engine v1.0.
   Run: node --test tests/test-e4.js  (from e4-development-feasibility/)
   Covers calculator math with hand-computed expectations re-proved
   from the 2026-11-04 E4 build samples, receipt hashing and chaining,
   tamper detection, and the no-em-dash rule. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const E4 = require("../e4.js");

function close(a, b, tol, label) {
  assert.ok(Math.abs(a - b) <= tol, label + ": expected " + b + ", got " + a);
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/* Sample A, from the 2026-11-04 E4 build, hand-computed here.
   10 units x $325,000 = $3,250,000 revenue.
   Hard: 10 x 185,000 + 120,000 = 1,970,000 subtotal; 5% = 98,500;
   Base 2,068,500; Low 1,861,650; High 2,275,350.
   Soft: 35,000 + 48,000 + 62,000 + 95,000 + 65,000 + 40,000 = 345,000.
   Required profit: 15% x 3,250,000 = 487,500.
   Residual Base: 3,250,000 - 2,068,500 - 345,000 - 487,500 = 349,000.
   Residual Low: 555,850. Residual High: 142,150.
   Margin before land: 836,500 / 3,250,000 = 25.74%.
   Profit after land at $300,000 asking: 536,500. Margin after: 16.51%.
   Density: 10 / 2.0 = 5.00. Timeline: 6 + 12 + 6 = 24 months.
   Monthly carrying: 95,000 / 24 = 3,958.33. */
const SAMPLE_A = {
  proposed: 10, maxAllowed: 12, acres: 2.0, siteSf: 87120, unbuildableSf: 0,
  avgSalePrice: 325000, hardPerUnit: 185000, siteWork: 120000, contingencyPct: 5,
  soft: { entitlementLegal: 35000, architectureEngineering: 48000, permitsFees: 62000, financingCarrying: 95000, marketingSales: 65000, developerOverhead: 40000 },
  targetMarginPct: 15, landAsking: 300000,
  entMonths: 6, conMonths: 12, sellMonths: 6
};

/* Sample B, from the 2026-11-04 E4 build, hand-computed here.
   6 units x $280,000 = $1,680,000 revenue.
   Hard: 6 x 175,000 + 80,000 = 1,130,000 subtotal; 5% = 56,500;
   Base 1,186,500; Low 1,067,850; High 1,305,150.
   Soft: 25,000 + 30,000 + 40,000 + 60,000 + 33,600 + 25,000 = 213,600.
   Required profit: 15% x 1,680,000 = 252,000.
   Residual Base: 1,680,000 - 1,186,500 - 213,600 - 252,000 = 27,900.
   Residual Low: 146,550. Residual High: -90,750.
   Margin before land: 279,900 / 1,680,000 = 16.66%.
   Profit after land at $25,000 asking: 254,900. Margin after: 15.17%.
   Density: 6 / 1.2 = 5.00. Timeline: 4 + 10 + 4 = 18 months.
   Monthly carrying: 60,000 / 18 = 3,333.33. */
const SAMPLE_B = {
  proposed: 6, maxAllowed: 8, acres: 1.2, siteSf: 52272, unbuildableSf: 2000,
  avgSalePrice: 280000, hardPerUnit: 175000, siteWork: 80000, contingencyPct: 5,
  soft: { entitlementLegal: 25000, architectureEngineering: 30000, permitsFees: 40000, financingCarrying: 60000, marketingSales: 33600, developerOverhead: 25000 },
  targetMarginPct: 15, landAsking: 25000,
  entMonths: 4, conMonths: 10, sellMonths: 4
};

/* Sample C, from the 2026-11-04 E4 build, hand-computed here.
   8 units x $260,000 = $2,080,000 revenue.
   Hard: 8 x 190,000 + 150,000 = 1,670,000 subtotal; 5% = 83,500;
   Base 1,753,500; Low 1,578,150; High 1,928,850.
   Soft: 40,000 + 45,000 + 55,000 + 85,000 + 41,600 + 35,000 = 301,600.
   Required profit: 15% x 2,080,000 = 312,000.
   Residual Base: 2,080,000 - 1,753,500 - 301,600 - 312,000 = -287,100.
   Residual Low: -111,750. Residual High: -462,450.
   Margin before land: 24,900 / 2,080,000 = 1.20%.
   Profit after land at $150,000 asking: -125,100. Margin after: -6.01%.
   Density: 8 / 1.5 = 5.33. Timeline: 9 + 12 + 8 = 29 months.
   Monthly carrying: 85,000 / 29 = 2,931.03. */
const SAMPLE_C = {
  proposed: 8, maxAllowed: 10, acres: 1.5, siteSf: 65340, unbuildableSf: 5000,
  avgSalePrice: 260000, hardPerUnit: 190000, siteWork: 150000, contingencyPct: 5,
  soft: { entitlementLegal: 40000, architectureEngineering: 45000, permitsFees: 55000, financingCarrying: 85000, marketingSales: 41600, developerOverhead: 35000 },
  targetMarginPct: 15, landAsking: 150000,
  entMonths: 9, conMonths: 12, sellMonths: 8
};

function fullRun(s) {
  const buildable = E4.buildableUnits(s.proposed, s.maxAllowed);
  const hard = E4.computeHardCosts({ buildable: buildable, hardPerUnit: s.hardPerUnit, siteWork: s.siteWork, contingencyPct: s.contingencyPct });
  const soft = E4.computeSoftTotal(s.soft);
  const revenue = E4.computeRevenue(buildable, s.avgSalePrice);
  const reqProfit = E4.requiredProfit(revenue, s.targetMarginPct);
  const totalCost = E4.totalCostBeforeLand(hard.totalBase, soft);
  const residualBase = E4.computeResidual(revenue, hard.totalBase, soft, reqProfit);
  const residualLow = E4.computeResidual(revenue, hard.totalLow, soft, reqProfit);
  const residualHigh = E4.computeResidual(revenue, hard.totalHigh, soft, reqProfit);
  const marginBefore = E4.marginBeforeLand(revenue, hard.totalBase, soft);
  const profitAfter = E4.profitAfterLand(revenue, totalCost, s.landAsking);
  const marginAfter = E4.marginAfterLand(revenue, profitAfter);
  const timeline = E4.computeTimeline(s.entMonths, s.conMonths, s.sellMonths);
  return {
    buildable: buildable,
    density: E4.density(buildable, s.acres),
    buildableSf: E4.buildableSf(s.siteSf, s.unbuildableSf),
    hard: hard, soft: soft, revenue: revenue, reqProfit: reqProfit,
    totalCost: totalCost, residualBase: residualBase, residualLow: residualLow,
    residualHigh: residualHigh, marginBefore: marginBefore,
    profitAfter: profitAfter, marginAfter: marginAfter,
    totalMonths: timeline.totalMonths,
    monthlyCarrying: E4.monthlyCarrying(s.soft.financingCarrying, timeline.totalMonths)
  };
}

test("buildable units: zoning cap cuts the proposal; proposed alone stands; neither is null", () => {
  assert.equal(E4.buildableUnits(10, 12), 10);
  assert.equal(E4.buildableUnits(14, 12), 12);
  assert.equal(E4.buildableUnits(10, null), 10);
  assert.equal(E4.buildableUnits(null, 12), null);
  assert.equal(E4.buildableUnits(null, null), null);
  close(E4.density(10, 2.0), 5.00, 0.001, "density A");
  close(E4.density(8, 1.5), 5.3333, 0.001, "density C");
  assert.equal(E4.density(10, 0), null);
  assert.equal(E4.density(null, 2), null);
  assert.equal(E4.buildableSf(87120, 0), 87120);
  assert.equal(E4.buildableSf(52272, 2000), 50272);
  assert.equal(E4.buildableSf(null, 0), null);
});

test("Sample A, hand-computed: revenue 3250000, hard base 2068500, residual base 349000", () => {
  const r = fullRun(SAMPLE_A);
  assert.equal(r.buildable, 10);
  close(r.density, 5.00, 0.001, "density A");
  assert.equal(r.buildableSf, 87120);
  assert.equal(r.revenue, 3250000);
  assert.equal(r.hard.subtotal, 1970000);
  assert.equal(r.hard.contingency, 98500);
  assert.equal(r.hard.totalBase, 2068500);
  assert.equal(r.hard.totalLow, 1861650);
  assert.equal(r.hard.totalHigh, 2275350);
  assert.equal(r.soft, 345000);
  assert.equal(r.reqProfit, 487500);
  assert.equal(r.totalCost, 2413500);
  assert.equal(r.residualBase, 349000);
  assert.equal(r.residualLow, 555850);
  assert.equal(r.residualHigh, 142150);
  close(r.marginBefore, 0.257385, 0.00001, "margin before A");
  assert.equal(r.profitAfter, 536500);
  close(r.marginAfter, 0.165077, 0.00001, "margin after A");
  assert.equal(r.totalMonths, 24);
  close(r.monthlyCarrying, 3958.33, 0.01, "monthly carrying A");
  assert.equal(r.hard.steps.length, 5);
  assert.ok(r.hard.steps[2].indexOf("2,068,500.00") !== -1);
});

test("Sample B, hand-computed: revenue 1680000, hard base 1186500, residual base 27900", () => {
  const r = fullRun(SAMPLE_B);
  assert.equal(r.buildable, 6);
  close(r.density, 5.00, 0.001, "density B");
  assert.equal(r.buildableSf, 50272);
  assert.equal(r.revenue, 1680000);
  assert.equal(r.hard.subtotal, 1130000);
  assert.equal(r.hard.contingency, 56500);
  assert.equal(r.hard.totalBase, 1186500);
  assert.equal(r.hard.totalLow, 1067850);
  assert.equal(r.hard.totalHigh, 1305150);
  assert.equal(r.soft, 213600);
  assert.equal(r.reqProfit, 252000);
  assert.equal(r.totalCost, 1400100);
  assert.equal(r.residualBase, 27900);
  assert.equal(r.residualLow, 146550);
  assert.equal(r.residualHigh, -90750);
  close(r.marginBefore, 0.166607, 0.00001, "margin before B");
  assert.equal(r.profitAfter, 254900);
  close(r.marginAfter, 0.151726, 0.00001, "margin after B");
  assert.equal(r.totalMonths, 18);
  close(r.monthlyCarrying, 3333.33, 0.01, "monthly carrying B");
});

test("Sample C, hand-computed: revenue 2080000, hard base 1753500, residual base -287100", () => {
  const r = fullRun(SAMPLE_C);
  assert.equal(r.buildable, 8);
  close(r.density, 5.3333, 0.001, "density C");
  assert.equal(r.buildableSf, 60340);
  assert.equal(r.revenue, 2080000);
  assert.equal(r.hard.subtotal, 1670000);
  assert.equal(r.hard.contingency, 83500);
  assert.equal(r.hard.totalBase, 1753500);
  assert.equal(r.hard.totalLow, 1578150);
  assert.equal(r.hard.totalHigh, 1928850);
  assert.equal(r.soft, 301600);
  assert.equal(r.reqProfit, 312000);
  assert.equal(r.totalCost, 2055100);
  assert.equal(r.residualBase, -287100);
  assert.equal(r.residualLow, -111750);
  assert.equal(r.residualHigh, -462450);
  close(r.marginBefore, 0.011971, 0.00001, "margin before C");
  assert.equal(r.profitAfter, -125100);
  close(r.marginAfter, -0.060144, 0.00001, "margin after C");
  assert.equal(r.totalMonths, 29);
  close(r.monthlyCarrying, 2931.03, 0.01, "monthly carrying C");
});

test("soft total: six lines sum; no lines entered stays null", () => {
  assert.equal(E4.computeSoftTotal(SAMPLE_A.soft), 345000);
  assert.equal(E4.computeSoftTotal({}), null);
  assert.equal(E4.computeSoftTotal({ permitsFees: 40000 }), 40000);
  assert.equal(E4.requiredProfit(3250000, 15), 487500);
  assert.equal(E4.requiredProfit(null, 15), null);
  assert.equal(E4.computeRevenue(10, 325000), 3250000);
  assert.equal(E4.computeRevenue(null, 325000), null);
  assert.equal(E4.totalCostBeforeLand(2068500, 345000), 2413500);
  assert.equal(E4.totalCostBeforeLand(null, 345000), null);
  assert.equal(E4.computeResidual(3250000, 2068500, 345000, 487500), 349000);
  assert.equal(E4.computeResidual(3250000, null, 345000, 487500), null);
  assert.equal(E4.monthlyCarrying(95000, 0), null);
  assert.equal(E4.monthlyCarrying(null, 24), null);
});

test("builder comps: usable needs address, price, date, and source URL", () => {
  const comps = [
    { address: "118 Feasible Ln", sale_price: 328000, sale_date: "2026-08-18", source_url: "assessor.example/record/comp-118" },
    { address: "105 Feasible Ln", sale_price: 322000, sale_date: "2026-07-25", source_url: "assessor.example/record/comp-105" },
    { address: "No price", sale_price: null, sale_date: "2026-08-01", source_url: "assessor.example/x" },
    { address: "", sale_price: 300000, sale_date: "2026-08-01", source_url: "assessor.example/x" },
    { address: "No date", sale_price: 300000, sale_date: "", source_url: "assessor.example/x" },
    { address: "No URL", sale_price: 300000, sale_date: "2026-08-01", source_url: "" }
  ];
  assert.equal(E4.usableBuilderComps(comps).length, 2);
  assert.equal(E4.usableBuilderComps([]).length, 0);
  assert.equal(E4.usableBuilderComps(null).length, 0);
});

test("kill switch: Sample C fires the negative-residual kill; A and B fire none", () => {
  const killsC = E4.evaluateKills({ residualBase: -287100, entitlementKnown: "known", revenue: 2080000, usableCompCount: 2, manualKills: [] });
  assert.equal(killsC.killActive, true);
  assert.deepEqual(killsC.fired, ["Residual land value negative on Base costs (-287,100.00)"]);
  const killsA = E4.evaluateKills({ residualBase: 349000, entitlementKnown: "known", revenue: 3250000, usableCompCount: 2, manualKills: [] });
  assert.equal(killsA.killActive, false);
  assert.deepEqual(killsA.fired, []);
  const killsB = E4.evaluateKills({ residualBase: 27900, entitlementKnown: "known", revenue: 1680000, usableCompCount: 1, manualKills: [] });
  assert.equal(killsB.killActive, false);
  const unknownEnt = E4.evaluateKills({ residualBase: 349000, entitlementKnown: "unknown", revenue: 3250000, usableCompCount: 2, manualKills: [] });
  assert.equal(unknownEnt.killActive, true);
  assert.deepEqual(unknownEnt.fired, ["Entitlement timeline unknowable"]);
  const noComp = E4.evaluateKills({ residualBase: 349000, entitlementKnown: "known", revenue: 3250000, usableCompCount: 0, manualKills: [] });
  assert.equal(noComp.killActive, true);
  assert.deepEqual(noComp.fired, ["No builder comp"]);
  const noRevenueNoComp = E4.evaluateKills({ residualBase: null, entitlementKnown: "known", revenue: null, usableCompCount: 0, manualKills: [] });
  assert.equal(noRevenueNoComp.killActive, false);
  const manual = E4.evaluateKills({ residualBase: 349000, entitlementKnown: "known", revenue: 3250000, usableCompCount: 2, manualKills: ["Floodplain delineation outstanding"] });
  assert.equal(manual.killActive, true);
});

test("risk flags: Sample B flags thin residual, High-negative, single comp; Sample A flags none", () => {
  const flagsA = E4.riskFlags({ residualBase: 349000, residualHigh: 142150, marginBefore: 0.257385, targetMarginPct: 15, usableCompCount: 2, totalMonths: 24, contingencyPct: 5, softTotal: 345000, hardBase: 2068500, proposed: 10, maxAllowed: 12, entitlementRisks: [], access: "Public road frontage" });
  assert.deepEqual(flagsA, []);
  const flagsB = E4.riskFlags({ residualBase: 27900, residualHigh: -90750, marginBefore: 0.166607, targetMarginPct: 15, usableCompCount: 1, totalMonths: 18, contingencyPct: 5, softTotal: 213600, hardBase: 1186500, proposed: 6, maxAllowed: 8, entitlementRisks: [], access: "Public road frontage" });
  assert.deepEqual(flagsB, [
    "Thin residual: 27,900.00 on Base costs, under $50,000",
    "Residual turns negative on High hard costs (-90,750.00)",
    "Single builder comp only"
  ]);
  const flagsC = E4.riskFlags({ residualBase: -287100, residualHigh: -462450, marginBefore: 0.011971, targetMarginPct: 15, usableCompCount: 2, totalMonths: 29, contingencyPct: 5, softTotal: 301600, hardBase: 1753500, proposed: 8, maxAllowed: 10, entitlementRisks: ["Rezoning required"], access: "No legal access" });
  assert.ok(flagsC.indexOf("Residual turns negative on High hard costs (-462,450.00)") !== -1);
  assert.ok(flagsC.indexOf("Margin before land 1.20% is below target margin 15.00%") !== -1);
  assert.ok(flagsC.indexOf("Entitlement risk: Rezoning required") !== -1);
  assert.ok(flagsC.indexOf("No legal access recorded") !== -1);
  const thin = E4.riskFlags({ residualBase: 100, residualHigh: 100, marginBefore: 0.5, targetMarginPct: 15, usableCompCount: 2, totalMonths: 40, contingencyPct: 3, softTotal: 500000, hardBase: 1000000, proposed: 14, maxAllowed: 12, entitlementRisks: [], access: "Public road frontage" });
  assert.ok(thin.indexOf("Total timeline 40 months exceeds 36 months") !== -1);
  assert.ok(thin.indexOf("Contingency 3.00% is below 5%") !== -1);
  assert.ok(thin.indexOf("Soft costs exceed 20% of hard costs") !== -1);
  assert.ok(thin.indexOf("Zoning caps units below proposal (14 proposed, 12 allowed)") !== -1);
});

test("null handling: missing inputs stay null, never invented", () => {
  const hard = E4.computeHardCosts({ buildable: null, hardPerUnit: 185000, siteWork: 120000, contingencyPct: 5 });
  assert.equal(hard.totalBase, null);
  assert.equal(hard.subtotal, null);
  assert.equal(E4.computeSoftTotal({}), null);
  assert.equal(E4.computeRevenue(null, 325000), null);
  assert.equal(E4.marginBeforeLand(0, 100, 100), null);
  assert.equal(E4.marginBeforeLand(3250000, null, 345000), null);
  assert.equal(E4.profitAfterLand(3250000, 2413500, null), null);
});

test("canonical JSON sorts keys recursively and is order independent", () => {
  const a = E4.canonicalJSON({ b: 1, a: { d: 4, c: 3 } });
  const b = E4.canonicalJSON({ a: { c: 3, d: 4 }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(E4.canonicalJSON([3, 1, 2]), "[3,1,2]");
  assert.equal(E4.canonicalJSON(null), "null");
});

test("receipt chain: GENESIS first, hashes verify, second links to first", () => {
  const fields1 = { run_id: "E4-TEST-1", residual_base: 349000, gross_revenue: 3250000 };
  const fields2 = { run_id: "E4-TEST-2", residual_base: 27900, gross_revenue: 1680000 };
  const r1 = E4.buildReceipt(fields1, "GENESIS", 1);
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r1.seq, 1);
  assert.equal(r1.schema_version, "e4-development-feasibility-receipt.v1.0");
  r1.hash = sha256Hex(E4.canonicalJSON(r1));
  const r2 = E4.buildReceipt(fields2, r1.hash, 2);
  assert.equal(r2.prev_hash, r1.hash);
  r2.hash = sha256Hex(E4.canonicalJSON(r2));
  const result = E4.verifyChain([r1, r2], sha256Hex);
  assert.equal(result.ok, true);
  assert.deepEqual(result.results.map((x) => x.ok), [true, true]);
});

test("receipt chain tamper detection: changed field fails, changed prev_hash fails", () => {
  const r1 = E4.buildReceipt({ run_id: "E4-T1", residual: 100 }, "GENESIS", 1);
  r1.hash = sha256Hex(E4.canonicalJSON(r1));
  const r2 = E4.buildReceipt({ run_id: "E4-T2", residual: 200 }, r1.hash, 2);
  r2.hash = sha256Hex(E4.canonicalJSON(r2));
  const tampered = JSON.parse(JSON.stringify(r2));
  tampered.fields.residual = 999;
  const bad1 = E4.verifyChain([r1, tampered], sha256Hex);
  assert.equal(bad1.ok, false);
  assert.equal(bad1.results[1].ok, false);
  const tamperedPrev = JSON.parse(JSON.stringify(r2));
  tamperedPrev.prev_hash = "GENESIS";
  const bad2 = E4.verifyChain([r1, tamperedPrev], sha256Hex);
  assert.equal(bad2.ok, false);
  const empty = E4.verifyChain([], sha256Hex);
  assert.equal(empty.ok, true);
});

test("no em dash in shipped files", () => {
  ["../index.html", "../e4.js", "test-e4.js"].forEach((rel) => {
    const p = path.join(__dirname, rel);
    const text = fs.readFileSync(p, "utf8");
    assert.equal(text.indexOf("\u2014"), -1, rel + " contains an em dash");
  });
});

test("shipped files exist and index references e4.js", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  assert.ok(html.indexOf('<script src="e4.js"></script>') !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE, NOT A VALUATION, NOT AN APPRAISAL") !== -1);
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("NO recommendation to buy or sell") !== -1 || html.indexOf("no recommendation to buy or sell") !== -1);
  assert.ok(html.indexOf("Verify chain") !== -1);
  assert.ok(html.indexOf("GENESIS") !== -1);
  assert.ok(html.indexOf("Residual land value") !== -1);
  assert.ok(fs.existsSync(path.join(__dirname, "../e4.js")));
});
