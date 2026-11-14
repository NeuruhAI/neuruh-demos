/* E8 Distressed Title Underwriting Engine, Node test suite.
   Hand-computed expectations are re-proved here from the 2026-11-04
   E8 build samples (~/workspace/e8-distressed-title-site/index.html).
   Run: node --test tests/test-e8.js */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const E8 = require("../e8.js");

function close(a, b, eps) {
  assert.ok(Math.abs(a - b) < (eps || 0.005),
    "expected " + b + ", got " + a);
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/* Sample A: clean title. Value 180000.
   Liens: taxes 3800 (pri 1), 1st mortgage 92000 (pri 2), HOA 1200 (pri 3).
   Hand proof: total 3800 + 92000 + 1200 = 97000. Senior 3800 + 92000
   = 95800. Junior 1200. Gross equity 180000 - 97000 = 83000.
   Cure 750 + 250 = 1000. Net 83000 - 1000 - 15000 - 10000 = 57000.
   Cure ratio 1000 / 83000 = 0.012048 (1.20%). Score 100. */
const A_LIENS = [
  { priority: 1, type: "Property taxes", holder: "Berrien County Treasurer", amount: 3800, source: "County treasurer payoff 2026-11-01", verified: true, notes: "", hasData: true },
  { priority: 2, type: "1st mortgage", holder: "Sample Mortgage Servicer", amount: 92000, source: "Mortgage servicer payoff letter", verified: true, notes: "", hasData: true },
  { priority: 3, type: "HOA lien", holder: "Sample HOA", amount: 1200, source: "HOA ledger", verified: true, notes: "", hasData: true }
];
const A_CURES = [
  { item: "Payoff processing fees", amount: 750, source: "Servicer payoff letter" },
  { item: "Recording fees", amount: 250, source: "County recorder fee schedule" },
  { item: "Probate filing fees", amount: null, source: "N/A" },
  { item: "Quiet title action", amount: null, source: "N/A" }
];

/* Sample B: probate, double close. Value 150000.
   Liens: taxes 6500 (pri 1), 1st mortgage 68000 (pri 2), judgment 4000 (pri 3).
   Hand proof: total 78500. Senior 74500. Junior 4000.
   Gross 150000 - 78500 = 71500. Cure 3500 + 5000 + 2500 + 600 = 11600.
   Net 71500 - 11600 - 20000 - 10000 = 29900.
   Cure ratio 11600 / 71500 = 0.162238 (16.22%).
   Deductions: probate 15 + tax 10 + cure ratio over 10% 5 + 1 flag 5 = 35.
   Score 100 - 35 = 65. */
const B_LIENS = [
  { priority: 1, type: "Property taxes", holder: "Berrien County Treasurer", amount: 6500, source: "County treasurer payoff 2026-11-01", verified: true, notes: "", hasData: true },
  { priority: 2, type: "1st mortgage", holder: "Sample Mortgage Servicer", amount: 68000, source: "Mortgage servicer payoff letter", verified: true, notes: "", hasData: true },
  { priority: 3, type: "Judgment lien", holder: "Sample Creditor LLC", amount: 4000, source: "County recorder search", verified: true, notes: "", hasData: true }
];
const B_CURES = [
  { item: "Probate filing fees", amount: 3500, source: "Probate court fee schedule" },
  { item: "Probate attorney", amount: 5000, source: "Attorney estimate" },
  { item: "Quiet title action", amount: 2500, source: "Attorney estimate" },
  { item: "Payoff processing fees", amount: 600, source: "Servicer payoff letter" }
];

/* Sample C: PASS. Value 120000.
   Liens: taxes 9000 (pri 1), 1st mortgage 85000 (pri 2), IRS 18000 (pri 3,
   unverified), judgment 12000 (pri 4, no source), HOA 3500 (pri 5).
   Hand proof: total 9000 + 85000 + 18000 + 12000 + 3500 = 127500.
   Senior 94000. Junior 33500. Gross 120000 - 127500 = -7500.
   Cure 6000 + 5000 + 2000 + 1000 = 14000. Net -7500 - 14000 - 25000
   - 10000 = -56500. Cure ratio null (gross equity not positive).
   Deductions: stack incomplete 40 + unverified 8 + probate 35 + tax 20
   + gross equity zero or negative 30 + 3 flags 15 = 148, clamped to 0. */
const C_LIENS = [
  { priority: 1, type: "Property taxes", holder: "Berrien County Treasurer", amount: 9000, source: "County treasurer payoff 2026-11-01", verified: true, notes: "", hasData: true },
  { priority: 2, type: "1st mortgage", holder: "Sample Mortgage Servicer", amount: 85000, source: "Mortgage servicer payoff letter", verified: true, notes: "", hasData: true },
  { priority: 3, type: "IRS federal tax lien", holder: "IRS", amount: 18000, source: "County recorder search", verified: false, notes: "Amount unverified, payoff not requested", hasData: true },
  { priority: 4, type: "Judgment lien", holder: "Sample Creditor LLC", amount: 12000, source: "", verified: true, notes: "No source recorded", hasData: true },
  { priority: 5, type: "HOA lien", holder: "Sample HOA", amount: 3500, source: "HOA ledger", verified: true, notes: "", hasData: true }
];
const C_CURES = [
  { item: "Quiet title action", amount: 6000, source: "Attorney estimate" },
  { item: "Probate attorney", amount: 5000, source: "Attorney estimate" },
  { item: "Payoff and recording fees", amount: 2000, source: "Servicer payoff letter" },
  { item: "Tax redemption", amount: 1000, source: "County treasurer" }
];

test("Sample A lien stack, hand-computed", function () {
  const s = E8.lienStack(A_LIENS, true);
  assert.equal(s.total, 97000);
  assert.equal(s.senior, 95800);
  assert.equal(s.junior, 1200);
  assert.equal(s.hasLiens, true);
  assert.equal(s.withAmountCount, 3);
  assert.equal(s.unverified, 0);
  assert.equal(s.incompleteRows, 0);
  assert.equal(s.stackIncomplete, false);
});

test("Sample A cure cost and equity, hand-computed", function () {
  const e = E8.cureEquity({ value: 180000, totalLiens: 97000, hasLiens: true, cures: A_CURES, repairs: 15000, buffer: 10000 });
  assert.equal(e.cureTotal, 1000);
  assert.equal(e.hasCure, true);
  assert.equal(e.grossEquity, 83000);
  assert.equal(e.netEquity, 57000);
  close(e.cureRatio, 1000 / 83000);
  assert.equal(e.cureKill, false);
  assert.equal(e.buffer, 10000);
});

test("Sample A score, structure, recommendation, hand-computed", function () {
  const sc = E8.dealabilityScore({ stackIncomplete: false, hasLiens: true, unverified: 0, probateLabel: "No probate needed, living owner(s)", probateDeduction: 0, taxLabel: "Current, paid", taxDeduction: 0, grossEquity: 83000, hasCure: true, cureRatio: 1000 / 83000, flagCount: 0, repairsKnown: "yes" });
  assert.deepEqual(sc.deductions, [{ label: "Probate risk: No probate needed, living owner(s)", points: 0 }, { label: "Tax risk: Current, paid", points: 0 }]);
  assert.equal(sc.totalDeductions, 0);
  assert.equal(sc.score, 100);
  assert.equal(sc.band, "70-100 Dealable");
  const st = E8.closingStructure({ killActive: false, score: 100, probateKey: "none", probateLabel: "No probate needed, living owner(s)", hasCure: true, cureTotal: 1000, netEquity: 57000, titleCompanyRequires: "no", feeDisclosureRisk: "no" });
  assert.equal(st.structure, "Assignment");
  assert.equal(st.reasons.length, 4);
  const rec = E8.recommendation({ killActive: false, gatesFailedCount: 0, value: 180000, hasLiens: true, stackComplete: true, probateKey: "none", taxKey: "current", hasCure: true, repairs: 15000 });
  assert.equal(rec, "READY FOR REVIEW");
  const comp = E8.completeness([["a", true], ["b", true], ["c", true], ["d", true], ["e", true], ["f", true], ["g", true], ["h", true]]);
  assert.equal(comp.pct, 100);
});

test("Sample B lien stack, equity, cure ratio, hand-computed", function () {
  const s = E8.lienStack(B_LIENS, true);
  assert.equal(s.total, 78500);
  assert.equal(s.senior, 74500);
  assert.equal(s.junior, 4000);
  assert.equal(s.stackIncomplete, false);
  const e = E8.cureEquity({ value: 150000, totalLiens: 78500, hasLiens: true, cures: B_CURES, repairs: 20000, buffer: 10000 });
  assert.equal(e.cureTotal, 11600);
  assert.equal(e.grossEquity, 71500);
  assert.equal(e.netEquity, 29900);
  close(e.cureRatio, 11600 / 71500);
  assert.equal(e.cureKill, false);
});

test("Sample B probate, tax, score, structure, hand-computed", function () {
  const p = E8.probateRisk("not_opened_counsel", 3, 1);
  assert.equal(p.level, "Moderate");
  assert.equal(p.deduction, 15);
  assert.equal(p.counselPath, true);
  assert.equal(p.counselOut, "Yes, counsel engaged");
  assert.equal(p.heirConsentOut, "1 of 3 heirs consented");
  assert.equal(p.heirKill, false);
  const t = E8.taxRisk("delinq_1", 6500);
  assert.equal(t.level, "Moderate");
  assert.equal(t.deduction, 10);
  assert.equal(t.warning, "");
  const sc = E8.dealabilityScore({ stackIncomplete: false, hasLiens: true, unverified: 0, probateLabel: p.label, probateDeduction: p.deduction, taxLabel: t.label, taxDeduction: t.deduction, grossEquity: 71500, hasCure: true, cureRatio: 11600 / 71500, flagCount: 1, repairsKnown: "yes" });
  assert.equal(sc.totalDeductions, 35);
  assert.equal(sc.score, 65);
  assert.equal(sc.band, "40-69 Conditional");
  assert.deepEqual(sc.deductions.map(function (d) { return d.points; }), [15, 10, 5, 5]);
  const st = E8.closingStructure({ killActive: false, score: 65, probateKey: "not_opened_counsel", probateLabel: p.label, hasCure: true, cureTotal: 11600, netEquity: 29900, titleCompanyRequires: "unknown", feeDisclosureRisk: "no" });
  assert.equal(st.structure, "Double close");
  assert.ok(st.reasons.join(" ").indexOf("Score 65 is below 70.") !== -1);
  assert.ok(st.reasons.join(" ").indexOf("Cure cost $11,600.00 is above $5,000.") !== -1);
  assert.ok(st.reasons.join(" ").indexOf("Double close lets the title company clear title on the first leg.") !== -1);
  const flags = E8.riskFlags({ checkedFlags: ["Quiet title action needed"], probateLevel: "Moderate", taxLevel: "Moderate", cureRatio: 11600 / 71500, grossEquity: 71500 });
  assert.deepEqual(flags, ["Quiet title action needed", "Probate risk: Moderate", "Tax risk: Moderate"]);
  const rec = E8.recommendation({ killActive: false, gatesFailedCount: 0, value: 150000, hasLiens: true, stackComplete: true, probateKey: "not_opened_counsel", taxKey: "delinq_1", hasCure: true, repairs: 20000 });
  assert.equal(rec, "READY FOR REVIEW");
});

test("Sample C lien stack, equity, kills, hand-computed", function () {
  const s = E8.lienStack(C_LIENS, false);
  assert.equal(s.total, 127500);
  assert.equal(s.senior, 94000);
  assert.equal(s.junior, 33500);
  assert.equal(s.unverified, 1);
  assert.equal(s.incompleteRows, 1);
  assert.equal(s.stackIncomplete, true);
  const e = E8.cureEquity({ value: 120000, totalLiens: 127500, hasLiens: true, cures: C_CURES, repairs: 25000, buffer: 10000 });
  assert.equal(e.cureTotal, 14000);
  assert.equal(e.grossEquity, -7500);
  assert.equal(e.netEquity, -56500);
  assert.equal(e.cureRatio, null);
  assert.equal(e.cureKill, true);
  const p = E8.probateRisk("dispute_no_counsel", 5, 1);
  assert.equal(p.level, "High");
  assert.equal(p.deduction, 35);
  assert.equal(p.counselPath, false);
  assert.equal(p.counselOut, "No counsel path");
  assert.equal(p.heirKill, true);
  const t = E8.taxRisk("delinq_2", 9000);
  assert.equal(t.level, "High");
  assert.equal(t.deduction, 20);
  assert.ok(t.warning.length > 0);
  const kills = E8.evaluateKills({ manualKills: [], autoKills: ["Lien stack incomplete", "Heir complexity with no probate counsel path", "Cure cost greater than equity"] });
  assert.equal(kills.killActive, true);
  assert.deepEqual(kills.all, ["Lien stack incomplete", "Heir complexity with no probate counsel path", "Cure cost greater than equity"]);
  const rec = E8.recommendation({ killActive: true, gatesFailedCount: 1, value: 120000, hasLiens: true, stackComplete: false, probateKey: "dispute_no_counsel", taxKey: "delinq_2", hasCure: true, repairs: 25000 });
  assert.equal(rec, "PASS");
});

test("Sample C score clamps to 0 and structure is PASS", function () {
  const sc = E8.dealabilityScore({ stackIncomplete: true, hasLiens: true, unverified: 1, probateLabel: "Heir dispute or unknown heirs, no probate counsel", probateDeduction: 35, taxLabel: "Delinquent, 2 or more years / tax sale pending", taxDeduction: 20, grossEquity: -7500, hasCure: true, cureRatio: null, flagCount: 3, repairsKnown: "yes" });
  assert.equal(sc.totalDeductions, 148);
  assert.equal(sc.score, 0);
  assert.equal(sc.band, "0-39 Not dealable");
  assert.deepEqual(sc.deductions.map(function (d) { return d.points; }), [40, 8, 35, 20, 30, 15]);
  const st = E8.closingStructure({ killActive: true, score: 0, probateKey: "dispute_no_counsel", probateLabel: "Heir dispute or unknown heirs, no probate counsel", hasCure: true, cureTotal: 14000, netEquity: -56500, titleCompanyRequires: "unknown", feeDisclosureRisk: "no" });
  assert.equal(st.structure, "PASS - no structure");
  const flags = E8.riskFlags({ checkedFlags: ["Quiet title action needed", "Lis pendens or pending litigation", "Federal tax lien (IRS) in the stack"], probateLevel: "High", taxLevel: "High", cureRatio: null, grossEquity: -7500 });
  assert.equal(flags.length, 6);
  assert.ok(flags.indexOf("Negative gross equity") !== -1);
  const comp = E8.completeness([["Street address", true], ["Parcel ID", true], ["Estimated value", true], ["Lien stack complete with at least 1 lien", false], ["Probate status", true], ["Tax status", true], ["Cure cost entered", true], ["Repairs entered", true]]);
  assert.equal(comp.pct, 88);
  assert.deepEqual(comp.missing, ["Lien stack complete with at least 1 lien"]);
});

test("Probate table: all six statuses", function () {
  const cases = [
    ["none", 0, "Low"], ["open_pr", 8, "Low"],
    ["not_opened_counsel", 15, "Moderate"],
    ["not_opened_no_counsel", 25, "High"],
    ["dispute_counsel", 25, "High"], ["dispute_no_counsel", 35, "High"]
  ];
  cases.forEach(function (c) {
    const p = E8.probateRisk(c[0], null, null);
    assert.equal(p.deduction, c[1], c[0]);
    assert.equal(p.level, c[2], c[0]);
  });
  assert.equal(E8.probateRisk("none", null, null).counselOut, "Not needed");
  assert.equal(E8.probateRisk("", null, null).counselOut, "N/A");
  assert.equal(E8.probateRisk("open_pr", null, null).counselPath, true);
  assert.equal(E8.probateRisk("none", null, null).heirConsentOut, "N/A");
  assert.equal(E8.probateRisk("none", 2, null).heirConsentOut, "2 known heirs, consent count N/A");
});

test("Heir kill conditions", function () {
  assert.equal(E8.probateRisk("not_opened_no_counsel", 1, 0).heirKill, false);
  assert.equal(E8.probateRisk("not_opened_no_counsel", 2, 0).heirKill, true);
  assert.equal(E8.probateRisk("not_opened_no_counsel", null, null).heirKill, false);
  assert.equal(E8.probateRisk("dispute_no_counsel", 1, 1).heirKill, true);
  assert.equal(E8.probateRisk("dispute_counsel", 5, 0).heirKill, false);
  assert.equal(E8.probateRisk("not_opened_counsel", 3, 1).heirKill, false);
});

test("Tax table: all four statuses", function () {
  assert.deepEqual([E8.taxRisk("current").deduction, E8.taxRisk("current").level], [0, "Low"]);
  assert.deepEqual([E8.taxRisk("delinq_1").deduction, E8.taxRisk("delinq_1").level], [10, "Moderate"]);
  assert.deepEqual([E8.taxRisk("delinq_2").deduction, E8.taxRisk("delinq_2").level], [20, "High"]);
  assert.deepEqual([E8.taxRisk("unknown").deduction, E8.taxRisk("unknown").level], [15, "Unknown"]);
  assert.equal(E8.taxRisk("current").warning, "");
  assert.equal(E8.taxRisk("delinq_1").warning, "");
  assert.ok(E8.taxRisk("delinq_2").warning.length > 0);
  assert.ok(E8.taxRisk("unknown").warning.length > 0);
  assert.equal(E8.taxRisk("").level, null);
});

test("Lien stack sorting and edge rows", function () {
  const rows = [
    { priority: null, amount: 500, verified: true, source: "s", hasData: true },
    { priority: 3, amount: 0, verified: true, source: "s", hasData: true },
    { priority: 1, amount: 100, verified: true, source: "s", hasData: true },
    { priority: 2, amount: null, verified: false, source: "", hasData: true },
    { priority: 1, amount: 50, verified: true, source: "s", hasData: true }
  ];
  const s = E8.lienStack(rows, true);
  assert.equal(s.total, 650);
  assert.equal(s.senior, 150);
  assert.equal(s.junior, 500);
  assert.equal(s.withAmountCount, 3);
  assert.equal(s.incompleteRows, 1);
  assert.equal(s.stackIncomplete, true);
  assert.deepEqual(s.liens.map(function (l) { return l.priority; }), [1, 1, 2, 3, null]);
  const empty = E8.lienStack([], false);
  assert.equal(empty.total, 0);
  assert.equal(empty.hasLiens, false);
  assert.equal(empty.stackIncomplete, true);
});

test("Cure ratio bands and deduction caps", function () {
  function sc(ratio, unverified, flags) {
    return E8.dealabilityScore({ stackIncomplete: false, hasLiens: true, unverified: unverified || 0, probateLabel: null, probateDeduction: 0, taxLabel: null, taxDeduction: 0, grossEquity: 100000, hasCure: true, cureRatio: ratio, flagCount: flags || 0, repairsKnown: "yes" });
  }
  assert.equal(sc(0.6).totalDeductions, 20);
  assert.equal(sc(0.3).totalDeductions, 10);
  assert.equal(sc(0.15).totalDeductions, 5);
  assert.equal(sc(0.05).totalDeductions, 0);
  assert.equal(sc(0.5).totalDeductions, 10);
  assert.equal(sc(0.25).totalDeductions, 5);
  assert.equal(sc(0.1).totalDeductions, 0);
  assert.equal(sc(0.2, 5, 0).totalDeductions, 5 + 24);
  assert.equal(sc(0.2, 0, 4).totalDeductions, 5 + 15);
  const noCure = E8.dealabilityScore({ stackIncomplete: false, hasLiens: true, unverified: 0, probateLabel: null, probateDeduction: 0, taxLabel: null, taxDeduction: 0, grossEquity: -5000, hasCure: false, cureRatio: null, flagCount: 0, repairsKnown: "no" });
  assert.deepEqual(noCure.deductions.map(function (d) { return d.points; }), [5]);
});

test("Null handling: equity stays null, never invented", function () {
  const noValue = E8.cureEquity({ value: null, totalLiens: 97000, hasLiens: true, cures: A_CURES, repairs: 15000, buffer: 10000 });
  assert.equal(noValue.grossEquity, null);
  assert.equal(noValue.netEquity, null);
  assert.equal(noValue.cureRatio, null);
  assert.equal(noValue.cureKill, false);
  const noLiens = E8.cureEquity({ value: 180000, totalLiens: 0, hasLiens: false, cures: A_CURES, repairs: 15000, buffer: 10000 });
  assert.equal(noLiens.grossEquity, null);
  const noCure = E8.cureEquity({ value: 180000, totalLiens: 97000, hasLiens: true, cures: [{ item: "x", amount: null, source: "" }], repairs: 15000, buffer: 10000 });
  assert.equal(noCure.hasCure, false);
  assert.equal(noCure.netEquity, null);
  const noRepairs = E8.cureEquity({ value: 180000, totalLiens: 97000, hasLiens: true, cures: A_CURES, repairs: null, buffer: 10000 });
  assert.equal(noRepairs.netEquity, null);
  const blankBuffer = E8.cureEquity({ value: 180000, totalLiens: 97000, hasLiens: true, cures: A_CURES, repairs: 15000, buffer: null });
  assert.equal(blankBuffer.buffer, 10000);
  assert.equal(blankBuffer.netEquity, 57000);
  const emptyScore = E8.dealabilityScore({ stackIncomplete: false, hasLiens: false, unverified: 0, probateLabel: null, probateDeduction: 0, taxLabel: null, taxDeduction: 0, grossEquity: null, hasCure: false, cureRatio: null, flagCount: 0, repairsKnown: "" });
  assert.equal(emptyScore.score, 100);
});

test("Gates fail closed", function () {
  const all = { address_parcel: "pass", source: "pass", no_hallucination: "pass", authority: "pass", title: "pass", probate: "pass" };
  assert.equal(E8.evaluateGates(all).ok, true);
  const oneHold = Object.assign({}, all, { title: "hold" });
  const g = E8.evaluateGates(oneHold);
  assert.equal(g.ok, false);
  assert.deepEqual(g.failed, ["title"]);
  assert.equal(E8.evaluateGates({}).ok, false);
  assert.equal(E8.evaluateGates(null).failed.length, 6);
});

test("Kill dedup fix: a kill fired both ways appears once", function () {
  const k = E8.evaluateKills({
    manualKills: ["Lien stack incomplete (E8 kill condition 1)"],
    autoKills: ["Lien stack incomplete", "Cure cost greater than equity"]
  });
  assert.equal(k.all.length, 2);
  assert.deepEqual(k.all, ["Lien stack incomplete (E8 kill condition 1)", "Cure cost greater than equity"]);
  assert.equal(k.killActive, true);
  const none = E8.evaluateKills({ manualKills: [], autoKills: [] });
  assert.equal(none.killActive, false);
  const manualOnly = E8.evaluateKills({ manualKills: ["Title uninsurable with no quiet-title budget"], autoKills: [] });
  assert.deepEqual(manualOnly.all, ["Title uninsurable with no quiet-title budget"]);
});

test("Closing structure: each assignment condition blocks alone", function () {
  const base = { killActive: false, score: 100, probateKey: "none", probateLabel: "No probate needed, living owner(s)", hasCure: true, cureTotal: 1000, netEquity: 57000, titleCompanyRequires: "no", feeDisclosureRisk: "no" };
  assert.equal(E8.closingStructure(base).structure, "Assignment");
  const cases = [
    [Object.assign({}, base, { score: 69 }), "Score 69 is below 70."],
    [Object.assign({}, base, { probateKey: "not_opened_counsel", probateLabel: "Not opened, known heirs, probate counsel engaged" }), "Probate is not clear"],
    [Object.assign({}, base, { cureTotal: 5001 }), "Cure cost $5,001.00 is above $5,000."],
    [Object.assign({}, base, { netEquity: 0 }), "Net equity is not positive."],
    [Object.assign({}, base, { netEquity: null }), "Net equity is not positive."],
    [Object.assign({}, base, { titleCompanyRequires: "yes" }), "Title company requires a double close."],
    [Object.assign({}, base, { feeDisclosureRisk: "yes" }), "Assignment fee disclosure risk flagged."]
  ];
  cases.forEach(function (c) {
    const st = E8.closingStructure(c[0]);
    assert.equal(st.structure, "Double close");
    assert.ok(st.reasons.join(" ").indexOf(c[1]) !== -1, c[1]);
  });
  assert.equal(E8.closingStructure(Object.assign({}, base, { cureTotal: 5000 })).structure, "Assignment");
  assert.equal(E8.closingStructure(Object.assign({}, base, { score: 70 })).structure, "Assignment");
  assert.equal(E8.closingStructure(Object.assign({}, base, { probateKey: "open_pr", probateLabel: "Probate open, personal representative appointed" })).structure, "Assignment");
  assert.equal(E8.closingStructure(Object.assign({}, base, { hasCure: false, cureTotal: 0, netEquity: 57000 })).structure, "Assignment");
});

test("Recommendation HOLD paths", function () {
  const base = { killActive: false, gatesFailedCount: 0, value: 180000, hasLiens: true, stackComplete: true, probateKey: "none", taxKey: "current", hasCure: true, repairs: 15000 };
  assert.equal(E8.recommendation(base), "READY FOR REVIEW");
  assert.equal(E8.recommendation(Object.assign({}, base, { gatesFailedCount: 1 })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { value: null })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { hasLiens: false })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { stackComplete: false })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { probateKey: "" })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { taxKey: "" })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { hasCure: false })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { repairs: null })), "HOLD");
  assert.equal(E8.recommendation(Object.assign({}, base, { killActive: true })), "PASS");
});

test("Risk flags: full set", function () {
  const flags = E8.riskFlags({ checkedFlags: ["Cloud on title", "Lis pendens or pending litigation", "Code violations or municipal fines", "Quiet title action needed", "Federal tax lien (IRS) in the stack", "Owner in bankruptcy, or bankruptcy in the chain"], probateLevel: "High", taxLevel: "Unknown", cureRatio: 0.4, grossEquity: -100 });
  assert.equal(flags.length, 10);
  assert.ok(flags.indexOf("Tax status unknown") !== -1);
  assert.ok(flags.indexOf("Cure ratio above 25%") !== -1);
  assert.ok(flags.indexOf("Negative gross equity") !== -1);
  assert.deepEqual(E8.riskFlags({ checkedFlags: [], probateLevel: "Low", taxLevel: "Low", cureRatio: 0.1, grossEquity: 100 }), []);
});

test("Canonical JSON: key order sorted recursively, order independent", function () {
  const a = E8.canonicalJSON({ b: 1, a: { d: 4, c: 3 } });
  const b = E8.canonicalJSON({ a: { c: 3, d: 4 }, b: 1 });
  assert.equal(a, '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(a, b);
  assert.equal(E8.canonicalJSON([3, 1, 2]), "[3,1,2]");
  assert.equal(E8.canonicalJSON(null), "null");
});

test("Receipt chain: GENESIS first, links, verify passes", function () {
  const r1 = E8.buildReceipt({ dealability_score: 100 }, "GENESIS", 1);
  r1.hash = sha256Hex(E8.canonicalJSON(r1));
  const r2 = E8.buildReceipt({ dealability_score: 65 }, r1.hash, 2);
  r2.hash = sha256Hex(E8.canonicalJSON(r2));
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r2.prev_hash, r1.hash);
  const v = E8.verifyChain([r1, r2], sha256Hex);
  assert.equal(v.ok, true);
  assert.deepEqual(v.results.map(function (r) { return r.ok; }), [true, true]);
});

test("Receipt chain: tampered field fails, tampered prev_hash fails", function () {
  const r1 = E8.buildReceipt({ dealability_score: 100 }, "GENESIS", 1);
  r1.hash = sha256Hex(E8.canonicalJSON(r1));
  const badField = JSON.parse(JSON.stringify(r1));
  badField.fields.dealability_score = 0;
  badField.hash = r1.hash;
  const v1 = E8.verifyChain([badField], sha256Hex);
  assert.equal(v1.ok, false);
  assert.equal(v1.results[0].ok, false);
  const r2 = E8.buildReceipt({ dealability_score: 65 }, r1.hash, 2);
  r2.hash = sha256Hex(E8.canonicalJSON(r2));
  const badLink = JSON.parse(JSON.stringify(r2));
  badLink.prev_hash = "GENESIS";
  const v2 = E8.verifyChain([r1, badLink], sha256Hex);
  assert.equal(v2.ok, false);
  assert.equal(v2.results[1].reason, "prev_hash does not match prior hash");
  assert.equal(E8.verifyChain([], sha256Hex).ok, true);
});

test("Receipt chain: async hash function (browser path) verifies", async function () {
  const asyncHash = async function (s) { return sha256Hex(s); };
  const r1 = E8.buildReceipt({ dealability_score: 100 }, "GENESIS", 1);
  r1.hash = sha256Hex(E8.canonicalJSON(r1));
  const v = await E8.verifyChain([r1], asyncHash);
  assert.equal(v.ok, true);
  assert.equal(v.results[0].reason, "hash matches");
});

test("No em dash in any shipped file", function () {
  const dir = path.join(__dirname, "..");
  ["index.html", "e8.js", path.join("tests", "test-e8.js")].forEach(function (f) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.equal(text.split("\u2014").length - 1, 0, f + " contains an em dash");
  });
});

test("Shipped files exist and index references the module and labels", function () {
  const dir = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(fs.existsSync(path.join(dir, "e8.js")));
  assert.ok(html.indexOf('src="e8.js"') !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE") !== -1);
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("Verify chain") !== -1);
  assert.ok(html.indexOf("Issue receipt") !== -1);
  assert.ok(html.indexOf("e8-distressed-title-receipt.v1.0") !== -1);
  assert.ok(html.indexOf("No E8 specification document was found in the vault") !== -1);
  assert.ok(html.indexOf("e8-distressed-title.pages.dev") !== -1);
  assert.ok(html.indexOf("No offer without Jeramie") !== -1);
});
