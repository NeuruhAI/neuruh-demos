/* Tests for the E10 Short-Term / Mid-Term Rental Underwriting Engine.
   Run from ~/workspace/e10-short-term-rental with:
   node --test tests/test-e10.js
   Every sample expectation below was hand-computed from the
   2026-11-04 E10 build inputs and re-proved with an independent
   Python calculation before being written here. Sample A and B values
   also match the 2026-11-04 build's own sample notes (A: annual STR
   gross $42,100.00, blended ADR $198.58, stabilized monthly cash flow
   $611.53, break-even occupancy 43.77 percent, STR wins. B: annual STR
   gross $19,937.50, STR monthly cash flow -$1,125.52, MTR monthly
   $340.00, LTR monthly $140.00, MTR wins). */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const E10 = require("../e10.js");

function r2(x) {
  if (x === null || x === undefined) { return null; }
  return Math.round(x * 100) / 100;
}

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function allPassGates() {
  return {
    address_parcel: "pass", source: "pass", legality: "pass",
    no_hallucination: "pass", furnishing: "pass", authority: "pass"
  };
}

/* Sample A inputs, carried from the 2026-11-04 E10 build loadSample("a"). */
function sampleA() {
  return {
    address: "123 STR Way, Benton Harbor, MI 49022",
    parcelId: "SAMPLE-E10-A",
    zoning: "R-1 Residential",
    ordinanceCite: "City STR ordinance Sec. 12.4, source: city ordinance text, accessed 2026-11-04",
    strLegal: "legal_with_permit", hoaStatus: "no_hoa",
    singlePlatform: "no",
    adr1: 195, adr2: 202, occ1: 58, occ2: 59, avgStay: 3,
    peakDays: 90, peakOcc: 80, peakAdr: 250,
    shoulderDays: 150, shoulderOcc: 60, shoulderAdr: 190,
    offDays: 125, offOcc: 40, offAdr: 140,
    downPayment: 44000, closingCosts: 5000,
    furnFurniture: 6000, furnAppliances: 2500, furnLinens: 800,
    furnDecor: 1200, furnTech: 700, furnSupplies: 500, furnPhoto: 300,
    furnOther: 0,
    costPiti: 1100, costHoa: 0, costUtilities: 180, costInternet: 70,
    costInsurance: 120, costSupplies: 60, costMaint: 100, costStrTax: 40,
    platformPct: 15, mgmtPct: 0, cleanPerTurn: 85, mtrCleanMonthly: 50,
    ltrRent: 1450, ltrVacancy: 5, ltrInsurance: 80,
    mtrRent: 2100, mtrOcc: 90,
    gates: allPassGates(),
    manualKillIds: [], riskIds: ["r_seasonality"]
  };
}

/* Sample B inputs, carried from the 2026-11-04 E10 build loadSample("b"). */
function sampleB() {
  const i = sampleA();
  Object.assign(i, {
    address: "456 MTR Ave, Benton Harbor, MI 49022",
    parcelId: "SAMPLE-E10-B",
    adr1: 145, adr2: 148, occ1: 37, occ2: 38, avgStay: 4,
    peakDays: 90, peakOcc: 50, peakAdr: 180,
    shoulderDays: 150, shoulderOcc: 40, shoulderAdr: 140,
    offDays: 125, offOcc: 25, offAdr: 110,
    downPayment: 48000, closingCosts: 6000,
    furnFurniture: 4500, furnAppliances: 1800, furnLinens: 600,
    furnDecor: 900, furnTech: 500, furnSupplies: 400, furnPhoto: 300,
    furnOther: 0,
    costPiti: 1200, costHoa: 0, costUtilities: 200, costInternet: 70,
    costInsurance: 130, costSupplies: 60, costMaint: 100, costStrTax: 40,
    platformPct: 15, mgmtPct: 20, cleanPerTurn: 90, mtrCleanMonthly: 50,
    ltrRent: 1600, ltrVacancy: 5, ltrInsurance: 80,
    mtrRent: 2600, mtrOcc: 90,
    riskIds: ["r_pending", "r_seasonality"]
  });
  return i;
}

/* Sample C inputs, carried from the 2026-11-04 E10 build loadSample("c"). */
function sampleC() {
  const i = sampleA();
  Object.assign(i, {
    address: "789 Pass Rd, Benton Harbor, MI 49022",
    parcelId: "SAMPLE-E10-C",
    strLegal: "illegal",
    singlePlatform: "yes",
    adr1: 160, adr2: null, occ1: 48, occ2: null, avgStay: 3,
    peakDays: 90, peakOcc: 70, peakAdr: 200,
    shoulderDays: 150, shoulderOcc: 50, shoulderAdr: 150,
    offDays: 125, offOcc: 30, offAdr: 100,
    downPayment: 40000, closingCosts: 5000,
    furnFurniture: 5000, furnAppliances: 2000, furnLinens: 700,
    furnDecor: 1000, furnTech: 600, furnSupplies: 400, furnPhoto: 300,
    furnOther: 0,
    costPiti: 1000, costHoa: 0, costUtilities: 150, costInternet: 60,
    costInsurance: 100, costSupplies: 50, costMaint: 80, costStrTax: 30,
    platformPct: 15, mgmtPct: 10, cleanPerTurn: 75, mtrCleanMonthly: 50,
    ltrRent: 1400, ltrVacancy: 5, ltrInsurance: 70,
    mtrRent: 2000, mtrOcc: 85,
    gates: {
      address_parcel: "pass", source: "fail", legality: "fail",
      no_hallucination: "pass", furnishing: "pass", authority: "pass"
    },
    manualKillIds: ["k_str_illegal", "k_adr_single"],
    riskIds: ["r_pending", "r_single_platform", "r_enforcement"]
  });
  return i;
}

test("Sample A: primary ADR, occupancy, and seasonal gross", () => {
  const r = E10.compute(sampleA());
  assert.equal(r2(r.primaryAdr), 198.5);
  assert.equal(r2(r.primaryOcc), 58.5);
  assert.equal(r.adrCount, 2);
  assert.equal(r2(r.primaryGross), 42384.71);
  assert.equal(r2(r.peak.nights), 72);
  assert.equal(r2(r.peak.revenue), 18000);
  assert.equal(r2(r.shoulder.nights), 90);
  assert.equal(r2(r.shoulder.revenue), 17100);
  assert.equal(r2(r.off.nights), 50);
  assert.equal(r2(r.off.revenue), 7000);
  assert.equal(r2(r.totalNights), 212);
  assert.equal(r2(r.seasonGross), 42100);
  assert.equal(r2(r.blendedAdr), 198.58);
  assert.equal(r2(r.blendedOcc * 100), 58.08);
  assert.equal(r.seasonDays, 365);
  assert.equal(r.seasonComplete, true);
  assert.equal(r.grossMethod, "Seasonal");
  assert.equal(r2(r.annualGross), 42100);
  assert.equal(r.seasonWarning, false);
});

test("Sample A: furnishing, fixed costs, and variable costs", () => {
  const r = E10.compute(sampleA());
  assert.equal(r2(r.furnTotal), 12000);
  assert.equal(r2(r.furnAmort), 200);
  assert.equal(r2(r.cashInvested), 61000);
  assert.equal(r2(r.fixedEx), 1670);
  assert.equal(r2(r.fixedMonthly), 1870);
  assert.equal(r2(r.turnovers), 70.67);
  assert.equal(r2(r.cleanAnnual), 6006.67);
  assert.equal(r2(r.platformAnnual), 6315);
  assert.equal(r2(r.mgmtAnnual), 0);
});

test("Sample A: break-even", () => {
  const r = E10.compute(sampleA());
  assert.equal(r2(r.varRate), 0.15);
  assert.equal(r.cleanFactor.toFixed(5), "0.14268");
  assert.equal(r2(r.beRevenue), 2643.77);
  assert.equal(r2(r.beOcc * 100), 43.77);
  assert.equal(r2(r.beNights), 13.31);
  assert.equal(r2(r.beMargin * 100), 14.31);
});

test("Sample A: STR cash flow, stabilized and Year 1", () => {
  const r = E10.compute(sampleA());
  assert.equal(r2(r.strCostsStab), 34761.67);
  assert.equal(r2(r.strCfStab), 7338.33);
  assert.equal(r2(r.strCfMonthly), 611.53);
  assert.equal(r2(r.strCocStab), 0.12);
  assert.equal(r2(r.strCfY1), -2261.67);
  assert.equal(r2(r.strCfY1Monthly), -188.47);
  assert.equal(r2(r.strCocY1), -0.04);
});

test("Sample A: LTR and MTR fallback, choice, recommendation", () => {
  const r = E10.compute(sampleA());
  assert.equal(r2(r.ltrGross), 16530);
  assert.equal(r2(r.ltrCostsAnnual), 15360);
  assert.equal(r2(r.ltrCf), 1170);
  assert.equal(r2(r.ltrCfMonthly), 97.5);
  assert.equal(r2(r.mtrGross), 22680);
  assert.equal(r2(r.mtrCostsAnnual), 23040);
  assert.equal(r2(r.mtrCf), -360);
  assert.equal(r2(r.mtrCfMonthly), -30);
  assert.equal(r.riskCount, 1);
  assert.equal(r.winner, "STR");
  assert.equal(r.killActive, false);
  assert.equal(r.gatesOk, true);
  assert.equal(r.recommendation, "READY FOR REVIEW - STR");
  assert.equal(r.completeness.pct, 100);
  assert.equal(r.completeness.done, 12);
  assert.deepEqual(r.completeness.missing, []);
  assert.ok(r.reason.indexOf("STR wins on stabilized monthly cash flow") === 0);
});

test("Sample B: seasonal gross, blended ADR, STR cash flow", () => {
  const r = E10.compute(sampleB());
  assert.equal(r2(r.primaryAdr), 146.5);
  assert.equal(r2(r.primaryOcc), 37.5);
  assert.equal(r2(r.primaryGross), 20052.19);
  assert.equal(r2(r.totalNights), 136.25);
  assert.equal(r2(r.seasonGross), 19937.5);
  assert.equal(r2(r.blendedAdr), 146.33);
  assert.equal(r2(r.blendedOcc * 100), 37.33);
  assert.equal(r2(r.furnTotal), 9000);
  assert.equal(r2(r.furnAmort), 150);
  assert.equal(r2(r.cashInvested), 63000);
  assert.equal(r2(r.fixedMonthly), 1950);
  assert.equal(r2(r.turnovers), 34.06);
  assert.equal(r2(r.cleanAnnual), 3065.63);
  assert.equal(r2(r.platformAnnual), 2990.63);
  assert.equal(r2(r.mgmtAnnual), 3987.5);
  assert.equal(r2(r.strCostsStab), 33443.75);
  assert.equal(r2(r.strCfStab), -13506.25);
  assert.equal(r2(r.strCfMonthly), -1125.52);
  assert.equal(r2(r.strCocStab), -0.21);
  assert.equal(r2(r.strCfY1), -20706.25);
  assert.equal(r2(r.strCfY1Monthly), -1725.52);
});

test("Sample B: break-even, LTR, MTR, MTR wins", () => {
  const r = E10.compute(sampleB());
  assert.equal(r.cleanFactor.toFixed(5), "0.15376");
  assert.equal(r2(r.beRevenue), 3929.56);
  assert.equal(r2(r.beOcc * 100), 88.29);
  assert.equal(r2(r.beNights), 26.85);
  assert.equal(r2(r.beMargin * 100), -50.96);
  assert.equal(r2(r.ltrCf), 1680);
  assert.equal(r2(r.ltrCfMonthly), 140);
  assert.equal(r2(r.mtrCf), 4080);
  assert.equal(r2(r.mtrCfMonthly), 340);
  assert.equal(r.riskCount, 2);
  assert.equal(r.winner, "MTR");
  assert.equal(r.killActive, false);
  assert.equal(r.recommendation, "READY FOR REVIEW - MTR");
  assert.equal(r.completeness.pct, 100);
});

test("Sample C: two kills fire, recommendation PASS", () => {
  const r = E10.compute(sampleC());
  assert.equal(r2(r.primaryAdr), 160);
  assert.equal(r2(r.primaryGross), 28032);
  assert.equal(r2(r.totalNights), 175.5);
  assert.equal(r2(r.seasonGross), 27600);
  assert.equal(r2(r.blendedAdr), 157.26);
  assert.equal(r2(r.blendedOcc * 100), 48.08);
  assert.equal(r2(r.furnTotal), 10000);
  assert.equal(r2(r.fixedMonthly), 1636.67);
  assert.equal(r2(r.strCfMonthly), -277.29);
  assert.equal(r2(r.beRevenue), 2769.16);
  assert.equal(r2(r.beOcc * 100), 57.89);
  assert.equal(r2(r.beNights), 17.61);
  assert.equal(r2(r.beMargin * 100), -9.81);
  assert.equal(r2(r.ltrCfMonthly), 180);
  assert.equal(r2(r.mtrCfMonthly), 13.33);
  assert.deepEqual(r.autoKills, [
    "STR illegal in the jurisdiction",
    "ADR from a single platform estimate"
  ]);
  assert.deepEqual(r.manualKills, []);
  assert.equal(r.killActive, true);
  assert.equal(r.winner, "PASS - do not proceed as STR");
  assert.equal(r.recommendation, "PASS");
  assert.deepEqual(r.gatesFailed, ["source", "legality"]);
  assert.equal(r.completeness.pct, 92);
  assert.deepEqual(r.completeness.missing, ["ADR source 2"]);
  assert.equal(r.legalWarning.indexOf("STR is illegal") === 0, true);
});

test("Season days not 365: seasonal gross not used, warning set", () => {
  const i = sampleA();
  i.offDays = 124;
  const r = E10.compute(i);
  assert.equal(r.seasonDays, 364);
  assert.equal(r.seasonComplete, true);
  assert.equal(r.seasonWarning, true);
  assert.equal(r2(r.seasonGross), 42044);
  assert.equal(r.grossMethod, "Primary (ADR x occupancy x 365)");
  assert.equal(r2(r.annualGross), 42384.71);
});

test("Incomplete season: falls back to primary method", () => {
  const i = sampleA();
  i.offAdr = null;
  const r = E10.compute(i);
  assert.equal(r.seasonComplete, false);
  assert.equal(r.seasonWarning, false);
  assert.equal(r.grossMethod, "Primary (ADR x occupancy x 365)");
  assert.equal(r2(r.annualGross), 42384.71);
  assert.equal(r.totalNights, null);
  assert.equal(r.blendedAdr, null);
});

test("Empty input holds everything and invents nothing", () => {
  const r = E10.compute({});
  assert.equal(r.primaryAdr, null);
  assert.equal(r.annualGross, null);
  assert.equal(r.strCfMonthly, null);
  assert.equal(r.furnTotal, 0);
  assert.equal(r.winner, "N/A - incomplete");
  assert.equal(r.recommendation, "HOLD");
  assert.equal(r.killActive, false);
  assert.equal(r.completeness.pct, 0);
  assert.equal(r.completeness.missing.length, 12);
  assert.equal(r.gatesOk, false);
});

test("HOA prohibits STR is an auto kill", () => {
  const i = sampleA();
  i.hoaStatus = "prohibits";
  const r = E10.compute(i);
  assert.deepEqual(r.autoKills, ["HOA / condo prohibits STR"]);
  assert.equal(r.killActive, true);
  assert.equal(r.recommendation, "PASS");
  assert.equal(r.legalWarning.indexOf("HOA prohibits STR") === 0, true);
});

test("Permit kill: manual checkbox fires on the AUTO path, never double-counted", () => {
  const i = sampleA();
  i.manualKillIds = ["k_permit_unavailable"];
  const r = E10.compute(i);
  assert.deepEqual(r.autoKills, ["Permit / registration unavailable or denied"]);
  assert.deepEqual(r.manualKills, []);
  assert.equal(r.killActive, true);
  assert.equal(r.recommendation, "PASS");
});

test("ADR kill edge: one source fires regardless of select; zero sources never fires", () => {
  const one = sampleA();
  one.adr2 = null;
  one.singlePlatform = "no";
  const r1 = E10.compute(one);
  assert.deepEqual(r1.autoKills, ["ADR from a single platform estimate"]);
  const none = sampleA();
  none.adr1 = null;
  none.adr2 = null;
  none.singlePlatform = "yes";
  const r2v = E10.compute(none);
  assert.deepEqual(r2v.autoKills, []);
  assert.equal(r2v.adrCount, 0);
  assert.equal(r2v.primaryAdr, null);
});

test("Manual break-even kill fires and forces PASS", () => {
  const i = sampleA();
  i.manualKillIds = ["k_be_high"];
  const r = E10.compute(i);
  assert.deepEqual(r.manualKills, ["Break-even occupancy above 85 percent"]);
  assert.equal(r.killActive, true);
  assert.equal(r.recommendation, "PASS");
});

test("STR win with 3 or more risk flags names the high-risk label, carried verbatim", () => {
  const i = sampleA();
  i.riskIds = ["r_pending", "r_seasonality", "r_enforcement"];
  const r = E10.compute(i);
  assert.equal(r.riskCount, 3);
  assert.equal(r.winner, "MTR / LTR - STR win flagged high risk");
  assert.equal(r.recommendation, "READY FOR REVIEW - MTR / LTR - STR win flagged high risk");
  assert.ok(r.reason.indexOf("flagged as high risk") !== -1);
});

test("LTR costs null quirk: no PITI, LTR insurance, or maintenance entered", () => {
  const i = sampleA();
  i.costPiti = null;
  i.ltrInsurance = null;
  i.costMaint = null;
  const r = E10.compute(i);
  assert.equal(r.ltrCostsAnnual, null);
  assert.equal(r.ltrCf, null);
  assert.equal(r.ltrCfMonthly, null);
  assert.notEqual(r.mtrCostsAnnual, null);
  assert.equal(r2(r.mtrCostsAnnual), 8640);
});

test("Gates fail closed: one held gate blocks REVIEW", () => {
  const i = sampleA();
  i.gates = allPassGates();
  i.gates.source = "hold";
  const r = E10.compute(i);
  assert.equal(r.gatesOk, false);
  assert.deepEqual(r.gatesFailed, ["source"]);
  assert.equal(r.recommendation, "HOLD");
});

test("Canonical JSON: key order sorted recursively, order independent", () => {
  const a = E10.canonicalJSON({ b: 1, a: { d: 4, c: 3 } });
  const b = E10.canonicalJSON({ a: { c: 3, d: 4 }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(E10.canonicalJSON([3, 1, 2]), "[3,1,2]");
});

test("Receipt chain: GENESIS first, second links to first, verify passes", () => {
  const fields1 = { run: "a", gross: 42100 };
  const fields2 = { run: "b", gross: 19937.5 };
  const r1 = E10.buildReceipt(fields1, "GENESIS", 1);
  r1.hash = sha256Hex(E10.canonicalJSON(r1));
  assert.equal(r1.schema_version, "e10-short-term-rental-receipt.v1.0");
  assert.equal(r1.prev_hash, "GENESIS");
  const r2v = E10.buildReceipt(fields2, r1.hash, 2);
  r2v.hash = sha256Hex(E10.canonicalJSON(r2v));
  const out = E10.verifyChain([r1, r2v], sha256Hex);
  assert.equal(out.ok, true);
  assert.equal(out.results.length, 2);
  assert.equal(out.results[0].ok, true);
  assert.equal(out.results[1].ok, true);
});

test("Receipt chain: tampered field fails, tampered prev_hash fails, empty chain verifies", () => {
  const r1 = E10.buildReceipt({ run: "a" }, "GENESIS", 1);
  r1.hash = sha256Hex(E10.canonicalJSON(r1));
  const r2v = E10.buildReceipt({ run: "b" }, r1.hash, 2);
  r2v.hash = sha256Hex(E10.canonicalJSON(r2v));
  const badField = JSON.parse(JSON.stringify(r2v));
  badField.fields.run = "tampered";
  assert.equal(E10.verifyChain([r1, badField], sha256Hex).ok, false);
  const badPrev = JSON.parse(JSON.stringify(r2v));
  badPrev.prev_hash = "GENESIS";
  assert.equal(E10.verifyChain([r1, badPrev], sha256Hex).ok, false);
  assert.equal(E10.verifyChain([], sha256Hex).ok, true);
});

test("No em dash in any shipped file", () => {
  const dir = path.join(__dirname, "..");
  ["index.html", "e10.js", "tests/test-e10.js"].forEach((f) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.equal(text.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});

test("Shipped page carries the pattern: module, labels, chain, gap, source", () => {
  const dir = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.indexOf('<script src="e10.js"></script>') !== -1);
  assert.ok(html.indexOf("SIMULATION") !== -1);
  assert.ok(html.indexOf("MODELED ESTIMATE, NOT A VALUATION, NOT AN APPRAISAL") !== -1);
  assert.ok(html.indexOf("NO offer and NO recommendation to buy or sell") !== -1);
  assert.ok(html.indexOf("btnIssueReceipt") !== -1);
  assert.ok(html.indexOf("btnVerifyChain") !== -1);
  assert.ok(html.indexOf("e10-short-term-rental-receipt.v1.0") !== -1);
  assert.ok(html.indexOf("Grounding gap") !== -1);
  assert.ok(html.indexOf("https://e10-short-term-rental.pages.dev/") !== -1);
  assert.ok(html.indexOf("No E10 specification document was found in the vault") !== -1);
});

test("All 2026-11-04 source element IDs are present in the new page", () => {
  const dir = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const srcPath = "/home/hatch/workspace/e10-short-term-rental-site/index.html";
  const srcHtml = fs.readFileSync(srcPath, "utf8");
  const ids = new Set();
  const re = /id="([^"]+)"/g;
  let m;
  while ((m = re.exec(srcHtml)) !== null) { ids.add(m[1]); }
  const missing = [];
  ids.forEach((id) => {
    if (html.indexOf('id="' + id + '"') === -1) { missing.push(id); }
  });
  assert.deepEqual(missing, []);
});

test("System prompt and sample loaders are carried verbatim from the source", () => {
  const dir = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const srcHtml = fs.readFileSync(
    "/home/hatch/workspace/e10-short-term-rental-site/index.html", "utf8");
  const prompt = srcHtml.match(
    /<script type="text\/plain" id="systemPromptText">[\s\S]*?<\/script>/)[0];
  assert.ok(html.indexOf(prompt) !== -1);
  const loader = srcHtml.match(/function loadSample\(kind\)\{[\s\S]*?\n\}\n/)[0];
  assert.ok(html.indexOf(loader) !== -1);
});
