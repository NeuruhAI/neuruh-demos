/* E5 Commercial Underwriting Engine, Node test suite, 2026-11-14.
   Every expected value below is hand-computed from the 2026-11-04
   E5 build samples (~/workspace/e5-commercial-site/index.html).
   Run: node --test tests/test-e5.js */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const E5 = require("../e5.js");

function approx(actual, expected, tol, label) {
  tol = tol === undefined ? 0.01 : tol;
  assert.ok(actual !== null && actual !== undefined, label + ": expected a number, got " + actual);
  assert.ok(Math.abs(actual - expected) <= tol, label + ": expected " + expected + ", got " + actual);
}

/* Sample A: multi-tenant retail, from the 2026-11-04 E5 build.
   Tenants: Anchor Grocery 4000 SF $72,000 4.5 yr esc 3% Verified;
   Coffee Shop 3000 SF $48,000 3 yr esc 2.5% Verified;
   Salon 2000 SF $30,000 5 yr esc 3% Verified;
   Nail Bar 1000 SF $12,000 2 yr esc 2% Verified.
   Other income $6,000, vacancy 5%.
   OpEx: taxes 18000, insurance 6000, maintenance 9000,
   management 8000, other 4000.
   Stabilized vacancy 5%, stabilized OpEx $44,000, cap rate 7.5%,
   owner-user comps $145/SF, rentable SF 12,000.
   Lease-up: TI 15, LC 5, free 3 mo, market rent 1.25/SF/mo,
   commission 5%. Buy 70%, buffer $15,000. */
const sampleA = [
  { name: "Anchor Grocery", sf: 4000, rent: 72000, yrs: 4.5, esc: 3, renew: "Yes", ver: "Verified" },
  { name: "Coffee Shop", sf: 3000, rent: 48000, yrs: 3, esc: 2.5, renew: "Yes", ver: "Verified" },
  { name: "Salon", sf: 2000, rent: 30000, yrs: 5, esc: 3, renew: "Yes", ver: "Verified" },
  { name: "Nail Bar", sf: 1000, rent: 12000, yrs: 2, esc: 2, renew: "Yes", ver: "Verified" }
];

/* Sample B: anchor tenant office.
   Anchor Law Firm 8000 SF $120,000 6 yr esc 2% Verified;
   Suite B Tenant 2000 SF $30,000 1.5 yr esc 3% Verified.
   Other income $0, vacancy 10%.
   OpEx: 15000 + 5000 + 8000 + 6750 + 2250 = 37,000.
   Stabilized vacancy 5%, stabilized OpEx $36,000, cap rate 8%,
   owner-user comps $120/SF, rentable SF 10,000.
   Lease-up inputs present but vacant SF is 0. Buy 65%. */
const sampleB = [
  { name: "Anchor Law Firm", sf: 8000, rent: 120000, yrs: 6, esc: 2, renew: "Yes", ver: "Verified" },
  { name: "Suite B Tenant", sf: 2000, rent: 30000, yrs: 1.5, esc: 3, renew: "No", ver: "Verified" }
];

/* Sample C: PASS sample, single tenant.
   Sole Tenant LLC 9000 SF $108,000 1.2 yr esc 0% Unverified;
   Kiosk 1000 SF $12,000 0.8 yr esc 0% Unverified.
   Other income $0, vacancy 5%.
   OpEx: 12000 + 4000 + 6000 + 5000 + 3000 = 30,000.
   Stabilized vacancy 8%, stabilized OpEx $30,000, cap rate 9%,
   owner-user comps $95/SF, rentable SF 10,000. Buy 70%. */
const sampleC = [
  { name: "Sole Tenant LLC", sf: 9000, rent: 108000, yrs: 1.2, esc: 0, renew: "No", ver: "Unverified" },
  { name: "Kiosk", sf: 1000, rent: 12000, yrs: 0.8, esc: 0, renew: "No", ver: "Unverified" }
];

test("Sample A lease table: GPR, leased SF, occupancy, top tenant, WALT, escalation", function () {
  // GPR = 72000 + 48000 + 30000 + 12000 = 162000
  approx(E5.grossPotentialRent(sampleA), 162000, 0.01, "A GPR");
  // Leased SF = 4000 + 3000 + 2000 + 1000 = 10000
  assert.equal(E5.leasedSf(sampleA), 10000);
  // Occupancy = 10000 / 12000 x 100 = 83.3333%
  approx(E5.occupancyPct(10000, 12000), 83.3333, 0.01, "A occupancy");
  var top = E5.topTenant(sampleA);
  assert.equal(top.name, "Anchor Grocery");
  // Top % = 72000 / 162000 x 100 = 44.4444%
  approx(E5.tenantPct(top, 162000), 44.4444, 0.01, "A top pct");
  // Second % = 48000 / 162000 x 100 = 29.6296%
  approx(E5.secondTenantPct(sampleA, 162000), 29.6296, 0.01, "A second pct");
  // WALT = (72000x4.5 + 48000x3 + 30000x5 + 12000x2) / 162000
  //      = 642000 / 162000 = 3.96296 years
  approx(E5.walt(sampleA), 3.96296, 0.001, "A WALT");
  // Weighted esc = (72000x3 + 48000x2.5 + 30000x3 + 12000x2) / 162000
  //              = 450000 / 162000 = 2.77778% per year
  approx(E5.weightedEscalation(sampleA), 2.77778, 0.001, "A weighted esc");
  assert.equal(E5.verifiedCount(sampleA), 4);
  assert.equal(E5.completeRowCount(sampleA), 4);
});

test("Sample A income: vacancy loss, EGI, OpEx, NOI, NOI per SF, OpEx ratio", function () {
  var gpr = E5.grossPotentialRent(sampleA);
  // Vacancy loss = 162000 x 5% = 8100
  approx(E5.vacancyLoss(gpr, 5), 8100, 0.01, "A vacancy loss");
  // EGI = 162000 x 0.95 + 6000 = 159900
  approx(E5.egi(gpr, 5, 6000), 159900, 0.01, "A EGI");
  // OpEx = 18000 + 6000 + 9000 + 8000 + 4000 = 45000
  var opex = E5.opexTotal([18000, 6000, 9000, 8000, 4000]);
  assert.equal(opex, 45000);
  // NOI = 159900 - 45000 = 114900
  approx(E5.noi(159900, 45000), 114900, 0.01, "A NOI");
  // NOI per SF = 114900 / 12000 = 9.575
  approx(E5.perSf(114900, 12000), 9.575, 0.001, "A NOI per SF");
  // OpEx ratio = 45000 / 159900 x 100 = 28.1426%
  approx(E5.opexRatio(45000, 159900), 28.1426, 0.01, "A OpEx ratio");
});

test("Sample A stabilized value, owner-user value, value gap", function () {
  // Stabilized EGI = 162000 x 0.95 + 6000 = 159900
  approx(E5.egi(162000, 5, 6000), 159900, 0.01, "A stab EGI");
  // Stabilized NOI = 159900 - 44000 = 115900
  approx(E5.noi(159900, 44000), 115900, 0.01, "A stab NOI");
  // Stabilized NOI per SF = 115900 / 12000 = 9.65833
  approx(E5.perSf(115900, 12000), 9.65833, 0.001, "A stab NOI per SF");
  // Stabilized value = 115900 / 0.075 = 1545333.3333
  approx(E5.stabilizedValue(115900, 7.5), 1545333.3333, 0.01, "A stab value");
  // Owner-user value = 145 x 12000 = 1740000
  assert.equal(E5.ownerUserValue(145, 12000), 1740000);
  // Value gap = 1545333.33 - 1740000 = -194666.67
  approx(1545333.3333 - 1740000, -194666.6667, 0.01, "A value gap");
  // Stabilized value per SF = 1545333.33 / 12000 = 128.7778
  approx(E5.perSf(1545333.3333, 12000), 128.7778, 0.01, "A stab value per SF");
});

test("Sample A lease-up cost and MAO", function () {
  // Vacant SF = 12000 - 10000 = 2000
  assert.equal(E5.vacantSfUsed(null, 12000, 10000), 2000);
  var lu = E5.leaseUpCost(2000, 15, 5, 3, 1.25, 5);
  // TI + LC = 2000 x (15 + 5) = 40000
  assert.equal(lu.tiLc, 40000);
  // Free rent = 2000 x 1.25 x 3 = 7500
  assert.equal(lu.freeCost, 7500);
  // Commission = 5% x (2000 x 1.25 x 12) = 5% x 30000 = 1500
  assert.equal(lu.commCost, 1500);
  // Total = 40000 + 7500 + 1500 = 49000
  assert.equal(lu.total, 49000);
  // Per SF = 49000 / 2000 = 24.50
  assert.equal(lu.perSf, 24.5);
  // Investment MAO = 1545333.3333 x 70% - 49000 - 15000 = 1017733.3333
  approx(E5.mao(1545333.3333, 70, 49000, 15000), 1017733.3333, 0.01, "A investment MAO");
  // Owner-user MAO = 1740000 x 70% - 49000 - 15000 = 1154000
  assert.equal(E5.mao(1740000, 70, 49000, 15000), 1154000);
});

test("Sample A 5-year rent schedule at weighted escalation 2.77778%", function () {
  var s = E5.rentSchedule(162000, 2.7777777777777777);
  assert.equal(s.length, 5);
  // Year 1 = 162000. Year 2 = 162000 x 1.02777778 = 166500.
  // Year 3 = 166500 x 1.02777778 = 171125.
  // Year 4 = 171125 x 1.02777778 = 175878.4722.
  // Year 5 = 175878.4722 x 1.02777778 = 180763.9853.
  approx(s[0].rent, 162000, 0.01, "A year 1");
  approx(s[1].rent, 166500, 0.01, "A year 2");
  approx(s[2].rent, 171125, 0.01, "A year 3");
  approx(s[3].rent, 175878.4722, 0.01, "A year 4");
  approx(s[4].rent, 180763.9853, 0.01, "A year 5");
});

test("Sample A kills fire none; risk flags are occupancy and value gap", function () {
  var top = E5.topTenant(sampleA);
  var kills = E5.evaluateKills({
    tenants: sampleA, top: top,
    topPct: E5.tenantPct(top, 162000), manualKills: []
  });
  assert.equal(kills.killActive, false);
  assert.deepEqual(kills.fired, []);
  var flags = E5.riskFlags({
    tenants: sampleA, topPct: 44.4444, killConc: false, walt: 3.96296,
    occupancy: 83.3333, vacancyPct: 5, capSource: "3 comparable sales, broker survey 2026-10",
    stabValue: 1545333.3333, ouValue: 1740000, secondPct: 29.6296, manualRisks: []
  });
  assert.deepEqual(flags, [
    "Occupancy under 85% (83.33%)",
    "Stabilized value below owner-user value"
  ]);
});

test("Sample B: NOI, stabilized value, MAO, WALT, schedule", function () {
  // GPR = 120000 + 30000 = 150000
  approx(E5.grossPotentialRent(sampleB), 150000, 0.01, "B GPR");
  // EGI = 150000 x 0.90 + 0 = 135000
  approx(E5.egi(150000, 10, 0), 135000, 0.01, "B EGI");
  // OpEx = 15000 + 5000 + 8000 + 6750 + 2250 = 37000
  assert.equal(E5.opexTotal([15000, 5000, 8000, 6750, 2250]), 37000);
  // NOI = 135000 - 37000 = 98000
  approx(E5.noi(135000, 37000), 98000, 0.01, "B NOI");
  // NOI per SF = 98000 / 10000 = 9.80
  approx(E5.perSf(98000, 10000), 9.8, 0.001, "B NOI per SF");
  // OpEx ratio = 37000 / 135000 x 100 = 27.4074%
  approx(E5.opexRatio(37000, 135000), 27.4074, 0.01, "B OpEx ratio");
  // Top tenant = 120000 / 150000 = 80%. Second = 20%.
  approx(E5.tenantPct(E5.topTenant(sampleB), 150000), 80, 0.01, "B top pct");
  approx(E5.secondTenantPct(sampleB, 150000), 20, 0.01, "B second pct");
  // WALT = (120000x6 + 30000x1.5) / 150000 = 765000 / 150000 = 5.10
  approx(E5.walt(sampleB), 5.1, 0.001, "B WALT");
  // Weighted esc = (120000x2 + 30000x3) / 150000 = 330000 / 150000 = 2.20%
  approx(E5.weightedEscalation(sampleB), 2.2, 0.001, "B weighted esc");
  // Stabilized EGI = 150000 x 0.95 = 142500; stab NOI = 142500 - 36000 = 106500
  approx(E5.egi(150000, 5, 0), 142500, 0.01, "B stab EGI");
  approx(E5.noi(142500, 36000), 106500, 0.01, "B stab NOI");
  // Stabilized value = 106500 / 0.08 = 1331250
  assert.equal(E5.stabilizedValue(106500, 8), 1331250);
  // Owner-user value = 120 x 10000 = 1200000
  assert.equal(E5.ownerUserValue(120, 10000), 1200000);
  // Lease-up: vacant SF 0, total 0, per SF null
  assert.equal(E5.vacantSfUsed(null, 10000, 10000), 0);
  var lu = E5.leaseUpCost(0, 10, 5, 2, 1.5, 6);
  assert.equal(lu.total, 0);
  assert.equal(lu.perSf, null);
  // Investment MAO = 1331250 x 65% - 0 - 15000 = 850312.50
  assert.equal(E5.mao(1331250, 65, 0, 15000), 850312.5);
  // Owner-user MAO = 1200000 x 65% - 15000 = 765000
  assert.equal(E5.mao(1200000, 65, 0, 15000), 765000);
  // Schedule at 2.2%: Y2 153300, Y3 156672.60, Y4 160119.3972, Y5 163642.0239
  var s = E5.rentSchedule(150000, 2.2);
  approx(s[1].rent, 153300, 0.01, "B year 2");
  approx(s[2].rent, 156672.6, 0.01, "B year 3");
  approx(s[3].rent, 160119.3972, 0.01, "B year 4");
  approx(s[4].rent, 163642.0239, 0.01, "B year 5");
});

test("Sample B kills fire none; only flag is top tenant over 50%", function () {
  var top = E5.topTenant(sampleB);
  var kills = E5.evaluateKills({
    tenants: sampleB, top: top,
    topPct: E5.tenantPct(top, 150000), manualKills: []
  });
  assert.equal(kills.killActive, false);
  // Top tenant is 80% but has 6 years remaining with renewal evidence,
  // so it is a risk flag, not a kill.
  var flags = E5.riskFlags({
    tenants: sampleB, topPct: 80, killConc: false, walt: 5.1,
    occupancy: 100, vacancyPct: 10, capSource: "3 comparable sales, broker survey 2026-10",
    stabValue: 1331250, ouValue: 1200000, secondPct: 20, manualRisks: []
  });
  assert.deepEqual(flags, ["Top tenant over 50% of income, but term or renewal keeps it from a kill"]);
});

test("Sample C: NOI, stabilized value, MAO, and both AUTO kills fire", function () {
  // GPR = 108000 + 12000 = 120000
  approx(E5.grossPotentialRent(sampleC), 120000, 0.01, "C GPR");
  // EGI = 120000 x 0.95 = 114000; OpEx = 30000; NOI = 84000
  approx(E5.egi(120000, 5, 0), 114000, 0.01, "C EGI");
  assert.equal(E5.opexTotal([12000, 4000, 6000, 5000, 3000]), 30000);
  approx(E5.noi(114000, 30000), 84000, 0.01, "C NOI");
  // Top tenant = 108000 / 120000 = 90%
  approx(E5.tenantPct(E5.topTenant(sampleC), 120000), 90, 0.01, "C top pct");
  // WALT = (108000x1.2 + 12000x0.8) / 120000 = 139200 / 120000 = 1.16
  approx(E5.walt(sampleC), 1.16, 0.001, "C WALT");
  // Weighted esc = 0
  assert.equal(E5.weightedEscalation(sampleC), 0);
  // Stabilized EGI = 120000 x 0.92 = 110400; stab NOI = 110400 - 30000 = 80400
  approx(E5.egi(120000, 8, 0), 110400, 0.01, "C stab EGI");
  approx(E5.noi(110400, 30000), 80400, 0.01, "C stab NOI");
  // Stabilized value = 80400 / 0.09 = 893333.3333
  approx(E5.stabilizedValue(80400, 9), 893333.3333, 0.01, "C stab value");
  // Owner-user value = 95 x 10000 = 950000
  assert.equal(E5.ownerUserValue(95, 10000), 950000);
  // Investment MAO = 893333.3333 x 70% - 0 - 15000 = 610333.3333 (held number only)
  approx(E5.mao(893333.3333, 70, 0, 15000), 610333.3333, 0.01, "C investment MAO");
  // Owner-user MAO = 950000 x 70% - 15000 = 650000 (held number only)
  assert.equal(E5.mao(950000, 70, 0, 15000), 650000);
  // Kills: concentration (90% > 50%, 1.2 yr < 2, renewal No) plus
  // lease terms unverified (0 of 2 rent rows verified).
  var top = E5.topTenant(sampleC);
  var kills = E5.evaluateKills({
    tenants: sampleC, top: top,
    topPct: E5.tenantPct(top, 120000), manualKills: []
  });
  assert.equal(kills.killActive, true);
  assert.equal(kills.fired.length, 2);
  assert.ok(kills.fired[0].indexOf("Single tenant over 50%") === 0);
  assert.ok(kills.fired[1].indexOf("Lease terms unverified (0 of 2 rent rows verified)") === 0);
  // Flags: WALT under 3 years, stabilized below owner-user. The top
  // tenant flag does not fire because the concentration kill fired.
  var flags = E5.riskFlags({
    tenants: sampleC, topPct: 90, killConc: true, walt: 1.16,
    occupancy: 100, vacancyPct: 5, capSource: "Broker survey 2026-10",
    stabValue: 893333.3333, ouValue: 950000, secondPct: 10, manualRisks: []
  });
  assert.deepEqual(flags, [
    "WALT under 3 years (1.16)",
    "Stabilized value below owner-user value"
  ]);
});

test("Null handling: missing inputs stay null, never invented", function () {
  assert.equal(E5.grossPotentialRent([]), null);
  assert.equal(E5.grossPotentialRent([{ name: "Empty", sf: 1000, rent: null, yrs: 5, esc: 2, ver: "Verified" }]), null);
  assert.equal(E5.leasedSf([]), null);
  assert.equal(E5.occupancyPct(null, 12000), null);
  assert.equal(E5.occupancyPct(10000, null), null);
  assert.equal(E5.occupancyPct(10000, 0), null);
  assert.equal(E5.walt([{ name: "X", rent: 10000, yrs: null, esc: 2 }]), null);
  assert.equal(E5.weightedEscalation([{ name: "X", rent: 10000, yrs: 5, esc: null }]), null);
  assert.equal(E5.egi(null, 5, 0), null);
  assert.equal(E5.egi(100000, null, 0), null);
  assert.equal(E5.opexTotal([null, null, null, null, null]), null);
  assert.equal(E5.opexTotal([]), null);
  assert.equal(E5.noi(null, 10000), null);
  assert.equal(E5.noi(100000, null), null);
  assert.equal(E5.stabilizedValue(100000, null), null);
  assert.equal(E5.stabilizedValue(100000, 0), null);
  assert.equal(E5.stabilizedValue(null, 7), null);
  assert.equal(E5.ownerUserValue(null, 10000), null);
  assert.equal(E5.ownerUserValue(100, null), null);
  assert.equal(E5.mao(null, 70, 1000, 15000), null);
  assert.equal(E5.mao(1000000, null, 1000, 15000), null);
  assert.equal(E5.mao(1000000, 70, null, 15000), null);
  var s = E5.rentSchedule(null, 2);
  assert.equal(s[0].rent, null);
  assert.equal(s[4].rent, null);
  var lu = E5.leaseUpCost(null, 10, 5, 2, 1.5, 6);
  assert.equal(lu.total, null);
});

test("Lease-up: typed vacant SF wins over computed; disagreement is visible", function () {
  // Typed 2500 beats computed 2000.
  assert.equal(E5.vacantSfUsed(2500, 12000, 10000), 2500);
  // Blank typed falls back to rentable minus leased.
  assert.equal(E5.vacantSfUsed(null, 12000, 10000), 2000);
  // Computed never goes below zero.
  assert.equal(E5.vacantSfUsed(null, 10000, 12000), 0);
  // No SF known at all: null.
  assert.equal(E5.vacantSfUsed(null, null, null), null);
  // Typed value drives the cost: 2500 x (15 + 5) = 50000 TI+LC.
  var lu = E5.leaseUpCost(2500, 15, 5, 3, 1.25, 5);
  assert.equal(lu.tiLc, 50000);
  assert.equal(lu.freeCost, 9375);
  assert.equal(lu.commCost, 1875);
  assert.equal(lu.total, 61250);
  assert.equal(lu.perSf, 24.5);
});

test("Rent per SF is computed, and rows without rent do not count", function () {
  var rows = [
    { name: "A", sf: 4000, rent: 72000, yrs: 4, esc: 3, ver: "Verified" },
    { name: "B", sf: 1000, rent: null, yrs: 2, esc: 2, ver: "Verified" },
    { name: "C", sf: 500, rent: 0, yrs: 1, esc: 1, ver: "Verified" }
  ];
  // Only row A counts: GPR 72000, leased SF 4000.
  assert.equal(E5.rentRows(rows).length, 1);
  assert.equal(E5.grossPotentialRent(rows), 72000);
  assert.equal(E5.leasedSf(rows), 4000);
  // Rent per SF for row A = 72000 / 4000 = 18.00 (module-level check
  // via perSf, the page computes the same value per row).
  assert.equal(E5.perSf(72000, 4000), 18);
  assert.equal(E5.perSf(72000, 0), null);
});

test("Manual kills and manual risk flags append to the computed ones", function () {
  var kills = E5.evaluateKills({
    tenants: sampleA, top: E5.topTenant(sampleA),
    topPct: 44.4444, manualKills: ["Title defect with no cure cost"]
  });
  assert.equal(kills.killActive, true);
  assert.deepEqual(kills.fired, ["Title defect with no cure cost"]);
  var flags = E5.riskFlags({
    tenants: sampleA, topPct: 44.4444, killConc: false, walt: 3.96,
    occupancy: 83.33, vacancyPct: 5, capSource: "source",
    stabValue: 1545333.33, ouValue: 1740000, secondPct: 29.63,
    manualRisks: ["Second tenant over 30% of income"]
  });
  assert.ok(flags.indexOf("Second tenant over 30% of income") >= 0);
});

test("Risk flags: every flag in the 2026-11-04 build fires on its own trigger", function () {
  var base = {
    tenants: [], topPct: null, killConc: false, walt: null,
    occupancy: null, vacancyPct: null, capSource: "source",
    stabValue: null, ouValue: null, secondPct: null, manualRisks: []
  };
  var f = E5.riskFlags(Object.assign({}, base, { vacancyPct: 12 }));
  assert.deepEqual(f, ["Actual vacancy over 10% (12.00%)"]);
  f = E5.riskFlags(Object.assign({}, base, { capSource: "" }));
  assert.deepEqual(f, ["Cap rate source missing"]);
  f = E5.riskFlags(Object.assign({}, base, { secondPct: 31 }));
  assert.deepEqual(f, ["Second tenant over 30% of income"]);
  f = E5.riskFlags(Object.assign({}, base, {
    tenants: [{ name: "X", rent: 1000, yrs: 5, esc: 2, renew: "Unknown", ver: "Verified" }]
  }));
  assert.deepEqual(f, ["At least one renewal option unknown"]);
  f = E5.riskFlags(Object.assign({}, base, { walt: 2.5, occupancy: 80 }));
  assert.deepEqual(f, ["WALT under 3 years (2.50)", "Occupancy under 85% (80.00%)"]);
});

test("Canonical JSON: key order sorted recursively, order independent", function () {
  var a = E5.canonicalJSON({ b: 2, a: { d: 4, c: 3 } });
  var b = E5.canonicalJSON({ a: { c: 3, d: 4 }, b: 2 });
  assert.equal(a, '{"a":{"c":3,"d":4},"b":2}');
  assert.equal(a, b);
  assert.equal(E5.canonicalJSON([3, 1, 2]), "[3,1,2]");
  assert.equal(E5.canonicalJSON(null), "null");
  assert.equal(E5.canonicalJSON("x"), '"x"');
});

test("Receipt chain: GENESIS first, second links to first, verify passes", function () {
  function sha(str) {
    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  }
  var r1 = E5.buildReceipt({ address: "123 Main St", noi: 114900 }, "GENESIS", 1);
  r1.hash = sha(E5.canonicalJSON(r1));
  var r2 = E5.buildReceipt({ address: "88 Office Park Dr", noi: 98000 }, r1.hash, 2);
  r2.hash = sha(E5.canonicalJSON(r2));
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r2.prev_hash, r1.hash);
  assert.equal(r1.schema_version, "e5-commercial-receipt.v1.0");
  var v = E5.verifyChain([r1, r2], sha);
  assert.equal(v.ok, true);
  assert.deepEqual(v.results.map(function (x) { return x.ok; }), [true, true]);
});

test("Receipt chain: tampered field fails, tampered prev_hash fails, empty chain verifies", function () {
  function sha(str) {
    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  }
  var r1 = E5.buildReceipt({ noi: 114900 }, "GENESIS", 1);
  r1.hash = sha(E5.canonicalJSON(r1));
  var tampered = JSON.parse(JSON.stringify(r1));
  tampered.fields.noi = 999999;
  var v = E5.verifyChain([tampered], sha);
  assert.equal(v.ok, false);
  assert.equal(v.results[0].ok, false);
  assert.equal(v.results[0].reason, "hash mismatch");
  var badLink = JSON.parse(JSON.stringify(r1));
  badLink.prev_hash = "WRONG";
  var v2 = E5.verifyChain([badLink], sha);
  assert.equal(v2.ok, false);
  assert.equal(v2.results[0].reason, "prev_hash does not match prior hash");
  var v3 = E5.verifyChain([], sha);
  assert.equal(v3.ok, true);
  assert.deepEqual(v3.results, []);
});

test("Receipt chain: async hash function (browser Web Crypto shape) verifies", async function () {
  async function shaAsync(str) {
    return crypto.createHash("sha256").update(str, "utf8").digest("hex");
  }
  var r1 = E5.buildReceipt({ noi: 114900 }, "GENESIS", 1);
  r1.hash = await shaAsync(E5.canonicalJSON(r1));
  var v = await E5.verifyChain([r1], shaAsync);
  assert.equal(v.ok, true);
  assert.equal(v.results[0].ok, true);
});

test("No em dash in any shipped file", function () {
  var files = [
    path.join(__dirname, "..", "index.html"),
    path.join(__dirname, "..", "e5.js"),
    path.join(__dirname, "test-e5.js")
  ];
  files.forEach(function (f) {
    var text = fs.readFileSync(f, "utf8");
    assert.equal(text.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});

test("Shipped files exist and index.html references e5.js with required labels", function () {
  var dir = path.join(__dirname, "..");
  assert.ok(fs.existsSync(path.join(dir, "index.html")));
  assert.ok(fs.existsSync(path.join(dir, "e5.js")));
  assert.ok(fs.existsSync(path.join(dir, "tests", "test-e5.js")));
  var html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.indexOf('src="e5.js"') >= 0, "index.html must load e5.js");
  assert.ok(html.indexOf("MODELED ESTIMATE") >= 0, "MODELED ESTIMATE label missing");
  assert.ok(html.indexOf("SIMULATION") >= 0, "SIMULATION label missing");
  assert.ok(html.indexOf("Verify chain") >= 0, "Verify chain button missing");
  assert.ok(html.indexOf("Issue receipt") >= 0, "Issue receipt button missing");
  assert.ok(html.indexOf("NOT A VALUATION, NOT AN APPRAISAL") >= 0, "valuation disclaimer missing");
  assert.ok(html.indexOf("NO offer") >= 0, "no-offer statement missing");
});
