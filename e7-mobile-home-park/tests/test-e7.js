/* E7 Mobile Home Park Underwriting Engine, Node test suite.
   Hand-computed expectations are re-proved here from the 2026-11-04
   E7 build samples (~/workspace/e7-mobile-home-park-site/index.html).
   Run: node --test tests/test-e7.js */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const E7 = require("../e7.js");

function close(a, b, eps) {
  assert.ok(Math.abs(a - b) < (eps || 0.005),
    "expected " + b + ", got " + a);
}

/* Sample A: 40 pads, 32 occupied, 6 POH, lot rent $350, market $400.
   Hand proof: vacant 40-32=8, fillable 8-0=8, TOH 32-6=26,
   occupancy 32/40=80%, POH share 6/32=18.75%. */
const A_PADS = { total: 40, occupied: 32, unusable: 0, poh: 6 };
const A_INC = {
  occupied: 32, lotRent: 350, poh: 6, homeRent: 450,
  otherIncome: 2400, lossPct: 5, opex: 48000, total: 40
};
const A_INF = {
  fillable: 8, marketRent: 400, addedOpexPerPad: 600,
  infillCostPerPad: 8000, noi: 112740, capRatePct: 8
};
const A_VAL = {
  noi: 112740, capRatePct: 8, asking: 1200000, total: 40,
  occupied: 32, stabValue: 1829250, liability: 25000,
  infillCostTotal: 64000, buffer: 15000
};

test("Sample A pads, hand-computed", function () {
  const p = E7.padMath(A_PADS);
  assert.equal(p.vacant, 8);
  assert.equal(p.fillable, 8);
  assert.equal(p.toh, 26);
  assert.equal(p.occupancyPct, 80);
  assert.equal(p.pohSharePct, 18.75);
});

test("Sample A income and NOI, hand-computed", function () {
  /* Lot income 32 x 350 x 12 = 134400. Home income 6 x 450 x 12 = 32400.
     Gross 134400 + 32400 + 2400 = 169200. Loss 5% = 8460.
     EGI 169200 - 8460 = 160740. NOI 160740 - 48000 = 112740. */
  const i = E7.income(A_INC);
  assert.equal(i.lotIncome, 134400);
  assert.equal(i.homeIncome, 32400);
  assert.equal(i.gross, 169200);
  assert.equal(i.loss, 8460);
  assert.equal(i.egi, 160740);
  assert.equal(i.noi, 112740);
  assert.equal(i.opexPerPad, 1200);
  close(i.noiPerPad, 3523.125);
});

test("Sample A infill and stabilized value, hand-computed", function () {
  /* Added income 8 x 400 x 12 = 38400. Added opex 8 x 600 = 4800.
     Net 38400 - 4800 = 33600. Infill cost 8 x 8000 = 64000.
     Stabilized NOI 112740 + 33600 = 146340.
     Stabilized value 146340 / 0.08 = 1829250. */
  const f = E7.infill(A_INF);
  assert.equal(f.infillIncome, 38400);
  assert.equal(f.infillOpex, 4800);
  assert.equal(f.infillNet, 33600);
  assert.equal(f.infillCostTotal, 64000);
  assert.equal(f.stabNoi, 146340);
  assert.equal(f.stabValue, 1829250);
});

test("Sample A valuation and MAO, hand-computed", function () {
  /* Value 112740 / 0.08 = 1409250. Value per pad 1409250 / 40 = 35231.25.
     Value per occupied pad 1409250 / 32 = 44039.0625.
     Price per pad 1200000 / 40 = 30000. Price per occupied 37500.
     Asking minus value 1200000 - 1409250 = -209250.
     Liability per pad 25000 / 40 = 625.
     MAO 1829250 - 25000 - 64000 - 15000 = 1725250. */
  const v = E7.valuation(A_VAL);
  assert.equal(v.value, 1409250);
  assert.equal(v.valuePerPad, 35231.25);
  close(v.valuePerOcc, 44039.0625);
  assert.equal(v.pricePerPad, 30000);
  assert.equal(v.pricePerOcc, 37500);
  assert.equal(v.askVsValue, -209250);
  assert.equal(v.liabilityPerPad, 625);
  assert.equal(v.mao, 1725250);
  assert.equal(v.buffer, 15000);
});

test("Sample A kills, flags, recommendation", function () {
  const k = E7.evaluateKills({
    privateUtil: false, inspectionStatus: "inspected",
    rentVerification: "verified_deposits", liabilityPriced: true,
    noi: 112740, manualKills: []
  });
  assert.equal(k.killActive, false);
  assert.deepEqual(k.fired, []);
  const flags = E7.riskFlags({
    pohSharePct: 18.75, occupancyPct: 80, privateUtil: false,
    roadsCondition: "Fair", pohCondition: "Fair", rollUsable: 4,
    fillable: 8, monthsToFill: 12, liability: 25000, value: 1409250,
    pricePerPad: 30000, valuePerPad: 35231.25, poh: 6, homeRent: 450,
    lotRent: 350, vacant: 8, unusable: 0
  });
  assert.deepEqual(flags, []);
  const g = E7.evaluateGates({
    address_parcel: "pass", source: "pass", rent_verification: "pass",
    infrastructure: "pass", no_hallucination: "pass", authority: "pass"
  });
  assert.equal(g.ok, true);
  assert.equal(E7.recommendation({
    killActive: false, gatesOk: true, noi: 112740, value: 1409250
  }), "READY FOR HUMAN REVIEW - no offer without Jeramie");
});

/* Sample B: 25 pads, 24 occupied, all TOH, lot rent $425, market $450.
   Hand proof: vacant 1, fillable 1, TOH 24, occupancy 96%, POH share 0%. */
test("Sample B pads, income, NOI, hand-computed", function () {
  const p = E7.padMath({ total: 25, occupied: 24, unusable: 0, poh: 0 });
  assert.equal(p.vacant, 1);
  assert.equal(p.fillable, 1);
  assert.equal(p.toh, 24);
  assert.equal(p.occupancyPct, 96);
  assert.equal(p.pohSharePct, 0);
  /* Lot income 24 x 425 x 12 = 122400. Home income 0. Gross 122400.
     Loss 3% = 3672. EGI 118728. NOI 118728 - 30000 = 88728. */
  const i = E7.income({
    occupied: 24, lotRent: 425, poh: 0, homeRent: null,
    otherIncome: 0, lossPct: 3, opex: 30000, total: 25
  });
  assert.equal(i.lotIncome, 122400);
  assert.equal(i.homeIncome, 0);
  assert.equal(i.gross, 122400);
  assert.equal(i.loss, 3672);
  assert.equal(i.egi, 118728);
  assert.equal(i.noi, 88728);
  assert.equal(i.opexPerPad, 1200);
  assert.equal(i.noiPerPad, 3697);
});

test("Sample B infill, value, MAO, hand-computed", function () {
  /* Added income 1 x 450 x 12 = 5400. Added opex 400. Net 5000.
     Infill cost 5000. Stabilized NOI 88728 + 5000 = 93728.
     Stabilized value 93728 / 0.075 = 1249706.6667.
     Value 88728 / 0.075 = 1183040. Value per pad 47321.6.
     Value per occupied 1183040 / 24 = 49293.3333.
     Price per pad 900000 / 25 = 36000. Price per occupied 37500.
     Asking minus value 900000 - 1183040 = -283040.
     MAO 1249706.6667 - 0 - 5000 - 15000 = 1229706.6667. */
  const f = E7.infill({
    fillable: 1, marketRent: 450, addedOpexPerPad: 400,
    infillCostPerPad: 5000, noi: 88728, capRatePct: 7.5
  });
  assert.equal(f.infillIncome, 5400);
  assert.equal(f.infillOpex, 400);
  assert.equal(f.infillNet, 5000);
  assert.equal(f.infillCostTotal, 5000);
  assert.equal(f.stabNoi, 93728);
  close(f.stabValue, 1249706.6667);
  const v = E7.valuation({
    noi: 88728, capRatePct: 7.5, asking: 900000, total: 25,
    occupied: 24, stabValue: f.stabValue, liability: 0,
    infillCostTotal: 5000, buffer: 15000
  });
  assert.equal(v.value, 1183040);
  assert.equal(v.valuePerPad, 47321.6);
  close(v.valuePerOcc, 49293.3333);
  assert.equal(v.pricePerPad, 36000);
  assert.equal(v.pricePerOcc, 37500);
  assert.equal(v.askVsValue, -283040);
  assert.equal(v.liabilityPerPad, 0);
  close(v.mao, 1229706.6667);
  const k = E7.evaluateKills({
    privateUtil: false, inspectionStatus: "inspected",
    rentVerification: "verified_roll", liabilityPriced: true,
    noi: 88728, manualKills: []
  });
  assert.equal(k.killActive, false);
  const flags = E7.riskFlags({
    pohSharePct: 0, occupancyPct: 96, privateUtil: false,
    roadsCondition: "Good", pohCondition: "No POH", rollUsable: 4,
    fillable: 1, monthsToFill: 6, liability: 0, value: 1183040,
    pricePerPad: 36000, valuePerPad: 47321.6, poh: 0, homeRent: null,
    lotRent: 425, vacant: 1, unusable: 0
  });
  assert.deepEqual(flags, []);
});

/* Sample C: 30 pads, 18 occupied, 12 POH, lot rent $300, market $350.
   Hand proof: vacant 12, fillable 10, TOH 6, occupancy 60%,
   POH share 12/18 = 66.6667%. */
test("Sample C pads, income, NOI, hand-computed", function () {
  const p = E7.padMath({ total: 30, occupied: 18, unusable: 2, poh: 12 });
  assert.equal(p.vacant, 12);
  assert.equal(p.fillable, 10);
  assert.equal(p.toh, 6);
  assert.equal(p.occupancyPct, 60);
  close(p.pohSharePct, 66.6667);
  /* Lot income 18 x 300 x 12 = 64800. Home income 12 x 500 x 12 = 72000.
     Gross 136800. Loss 5% = 6840. EGI 129960. NOI 89960. */
  const i = E7.income({
    occupied: 18, lotRent: 300, poh: 12, homeRent: 500,
    otherIncome: 0, lossPct: 5, opex: 40000, total: 30
  });
  assert.equal(i.lotIncome, 64800);
  assert.equal(i.homeIncome, 72000);
  assert.equal(i.gross, 136800);
  assert.equal(i.loss, 6840);
  assert.equal(i.egi, 129960);
  assert.equal(i.noi, 89960);
  close(i.opexPerPad, 1333.3333);
  close(i.noiPerPad, 4997.7778);
});

test("Sample C infill, value, MAO null, hand-computed", function () {
  /* Added income 10 x 350 x 12 = 42000. Added opex 6000. Net 36000.
     Infill cost 10 x 10000 = 100000. Stabilized NOI 125960.
     Stabilized value 125960 / 0.08 = 1574500.
     Value 89960 / 0.08 = 1124500. Value per pad 37483.3333.
     Price per pad 750000 / 30 = 25000. Price per occupied 41666.6667.
     Asking minus value -374500. MAO null: liability unpriced. */
  const f = E7.infill({
    fillable: 10, marketRent: 350, addedOpexPerPad: 600,
    infillCostPerPad: 10000, noi: 89960, capRatePct: 8
  });
  assert.equal(f.infillIncome, 42000);
  assert.equal(f.infillOpex, 6000);
  assert.equal(f.infillNet, 36000);
  assert.equal(f.infillCostTotal, 100000);
  assert.equal(f.stabNoi, 125960);
  assert.equal(f.stabValue, 1574500);
  const v = E7.valuation({
    noi: 89960, capRatePct: 8, asking: 750000, total: 30,
    occupied: 18, stabValue: 1574500, liability: null,
    infillCostTotal: 100000, buffer: 15000
  });
  assert.equal(v.value, 1124500);
  close(v.valuePerPad, 37483.3333);
  close(v.valuePerOcc, 62472.2222);
  assert.equal(v.pricePerPad, 25000);
  close(v.pricePerOcc, 41666.6667);
  assert.equal(v.askVsValue, -374500);
  assert.equal(v.liabilityPerPad, null);
  assert.equal(v.mao, null);
});

test("Sample C all three AUTO kills fire, recommendation PASS", function () {
  const k = E7.evaluateKills({
    privateUtil: true, inspectionStatus: "not_inspected",
    rentVerification: "unverified", liabilityPriced: false,
    noi: 89960, manualKills: []
  });
  assert.equal(k.killActive, true);
  assert.deepEqual(k.fired, [
    "Private utilities with no inspection",
    "Lot rent unverifiable",
    "Infrastructure liability unpriced"
  ]);
  const flags = E7.riskFlags({
    pohSharePct: 66.6667, occupancyPct: 60, privateUtil: true,
    roadsCondition: "Poor", pohCondition: "Poor", rollUsable: 4,
    fillable: 10, monthsToFill: null, liability: null, value: 1124500,
    pricePerPad: 25000, valuePerPad: 37483.3333, poh: 12, homeRent: 500,
    lotRent: 300, vacant: 12, unusable: 2
  });
  assert.deepEqual(flags, [
    "POH share above 50 percent of occupied pads: this is a home business, not a lot rent business",
    "Occupancy below 80 percent",
    "Private utilities in use",
    "Roads in Poor condition",
    "POH condition Poor",
    "Infill timeline not stated",
    "Infrastructure liability not priced"
  ]);
  assert.equal(E7.recommendation({
    killActive: true, gatesOk: true, noi: 89960, value: 1124500
  }), "PASS - do not proceed");
});

test("Kill 3 empty-run quirk: no NOI, no fire", function () {
  /* Carried from the 2026-11-04 build: kill 3 needs NOI to exist. */
  const k = E7.evaluateKills({
    privateUtil: false, inspectionStatus: "inspected",
    rentVerification: "verified_roll", liabilityPriced: false,
    noi: null, manualKills: []
  });
  assert.equal(k.killActive, false);
});

test("Manual kills append, gates fail closed", function () {
  const k = E7.evaluateKills({
    privateUtil: false, inspectionStatus: "inspected",
    rentVerification: "verified_roll", liabilityPriced: true,
    noi: 100000, manualKills: ["Title defect with no cure cost"]
  });
  assert.equal(k.killActive, true);
  assert.deepEqual(k.fired, ["Title defect with no cure cost"]);
  const g = E7.evaluateGates({
    address_parcel: "pass", source: "hold", rent_verification: "pass",
    infrastructure: "pass", no_hallucination: "pass", authority: "pass"
  });
  assert.equal(g.ok, false);
  assert.deepEqual(g.failed, ["source"]);
  assert.equal(E7.recommendation({
    killActive: false, gatesOk: false, noi: 100000, value: 1000000
  }), "HOLD");
  assert.equal(E7.recommendation({
    killActive: false, gatesOk: true, noi: null, value: null
  }), "HOLD - NOI or value is N/A");
});

test("Null handling: missing inputs stay null, never invented", function () {
  const p = E7.padMath({ total: null, occupied: null, unusable: 0, poh: null });
  assert.equal(p.vacant, null);
  assert.equal(p.fillable, null);
  assert.equal(p.toh, null);
  assert.equal(p.occupancyPct, null);
  assert.equal(p.pohSharePct, null);
  const i = E7.income({
    occupied: null, lotRent: null, poh: null, homeRent: null,
    otherIncome: null, lossPct: null, opex: null, total: null
  });
  assert.equal(i.lotIncome, null);
  assert.equal(i.homeIncome, 0);
  assert.equal(i.gross, null);
  assert.equal(i.noi, null);
  /* POH above zero with blank home rent: income is null, not zero. */
  const i2 = E7.income({
    occupied: 10, lotRent: 300, poh: 4, homeRent: null,
    otherIncome: 0, lossPct: 5, opex: 10000, total: 20
  });
  assert.equal(i2.homeIncome, null);
  assert.equal(i2.gross, null);
  assert.equal(i2.noi, null);
  const v = E7.valuation({
    noi: null, capRatePct: null, asking: null, total: null,
    occupied: null, stabValue: null, liability: null,
    infillCostTotal: null, buffer: null
  });
  assert.equal(v.value, null);
  assert.equal(v.mao, null);
  /* Cap rate zero or missing: value stays null. */
  assert.equal(E7.valuation({
    noi: 100000, capRatePct: 0, asking: 500000, total: 10,
    occupied: 10, stabValue: 1000000, liability: 0,
    infillCostTotal: 0, buffer: 15000
  }).value, null);
  /* Buffer defaults to 15000 when blank. */
  assert.equal(E7.valuation({
    noi: 100000, capRatePct: 10, asking: 500000, total: 10,
    occupied: 10, stabValue: 1000000, liability: 0,
    infillCostTotal: 0, buffer: null
  }).buffer, 15000);
});

test("Pad count errors: occupied over total, POH over occupied", function () {
  const p1 = E7.padMath({ total: 10, occupied: 12, unusable: 0, poh: 2 });
  assert.equal(p1.vacant, null);
  assert.equal(p1.fillable, null);
  const p2 = E7.padMath({ total: 10, occupied: 8, unusable: 0, poh: 9 });
  assert.equal(p2.toh, null);
  /* Unusable pads above vacant: fillable floors at 0. */
  const p3 = E7.padMath({ total: 10, occupied: 8, unusable: 5, poh: 0 });
  assert.equal(p3.vacant, 2);
  assert.equal(p3.fillable, 0);
});

test("Private utilities detection", function () {
  assert.equal(E7.isPrivateUtil({
    utilities: "public", waterSystem: "public", sewerSystem: "public"
  }), false);
  assert.equal(E7.isPrivateUtil({
    utilities: "public", waterSystem: "well", sewerSystem: "public"
  }), true);
  assert.equal(E7.isPrivateUtil({
    utilities: "public_water_private_sewer", waterSystem: "public", sewerSystem: "public"
  }), true);
  assert.equal(E7.isPrivateUtil({
    utilities: "well_septic", waterSystem: "", sewerSystem: ""
  }), true);
});

test("Rent roll usable rows", function () {
  assert.equal(E7.rollUsableCount([
    { pad: "Pad 1", rent: 350, source: "Rent roll 2026-10-01" },
    { pad: "Pad 2", rent: 350, source: "Rent roll 2026-10-01" },
    { pad: "", rent: 350, source: "Rent roll 2026-10-01" },
    { pad: "Pad 4", rent: 0, source: "Rent roll 2026-10-01" },
    { pad: "Pad 5", rent: 350, source: "" },
    { pad: "Pad 6", rent: null, source: "Rent roll 2026-10-01" }
  ]), 2);
  assert.equal(E7.rollUsableCount([]), 0);
  assert.equal(E7.rollUsableCount(null), 0);
});

test("Risk flags: each carried flag fires on its own trigger", function () {
  const base = {
    pohSharePct: 10, occupancyPct: 90, privateUtil: false,
    roadsCondition: "Good", pohCondition: "Good", rollUsable: 4,
    fillable: 0, monthsToFill: 12, liability: 1000, value: 1000000,
    pricePerPad: 10000, valuePerPad: 20000, poh: 0, homeRent: null,
    lotRent: 300, vacant: 0, unusable: 0
  };
  assert.deepEqual(E7.riskFlags(base), []);
  assert.ok(E7.riskFlags(Object.assign({}, base, { liability: 200000 }))
    .includes("Infrastructure liability exceeds 10 percent of value"));
  assert.ok(E7.riskFlags(Object.assign({}, base, { pricePerPad: 30000 }))
    .includes("Asking price per pad exceeds value per pad"));
  assert.ok(E7.riskFlags(Object.assign({}, base, { poh: 3, homeRent: null }))
    .includes("POH home rent not entered while POH count is above zero"));
  assert.ok(E7.riskFlags(Object.assign({}, base, { lotRent: null }))
    .includes("Lot rent not entered"));
  assert.ok(E7.riskFlags(Object.assign({}, base, { rollUsable: 1 }))
    .includes("Fewer than 3 usable rent roll rows"));
  assert.ok(E7.riskFlags(Object.assign({}, base, { occupancyPct: 55 }))
    .includes("Occupancy below 60 percent"));
  assert.ok(E7.riskFlags(Object.assign({}, base, { vacant: 2, unusable: 5, fillable: 0 }))
    .includes("Unusable pads exceed vacant pads"));
});

test("Canonical JSON: key order sorted recursively, order independent", function () {
  const a = E7.canonicalJSON({ b: 1, a: { d: 4, c: 3 } });
  const b = E7.canonicalJSON({ a: { c: 3, d: 4 }, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(E7.canonicalJSON([3, 1, 2]), "[3,1,2]");
});

function sha256Sync(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}
function sha256Async(str) {
  return Promise.resolve(sha256Sync(str));
}

test("Receipt chain: GENESIS first, verify passes, tamper detected", async function () {
  const r1 = E7.buildReceipt({ noi: 112740, mao: 1725250 }, "GENESIS", 1);
  r1.hash = sha256Sync(E7.canonicalJSON(r1));
  const r2 = E7.buildReceipt({ noi: 88728, mao: 1229706.67 }, r1.hash, 2);
  r2.hash = sha256Sync(E7.canonicalJSON(r2));
  const ok = await E7.verifyChain([r1, r2], sha256Async);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.results.map(function (r) { return r.ok; }), [true, true]);
  /* Tampered field fails. */
  const bad = JSON.parse(JSON.stringify(r1));
  bad.fields.noi = 999999;
  const t1 = await E7.verifyChain([bad, r2], sha256Async);
  assert.equal(t1.ok, false);
  assert.equal(t1.results[0].ok, false);
  /* Tampered prev_hash fails. */
  const bad2 = JSON.parse(JSON.stringify(r2));
  bad2.prev_hash = "WRONG";
  const t2 = await E7.verifyChain([r1, bad2], sha256Async);
  assert.equal(t2.ok, false);
  assert.equal(t2.results[1].ok, false);
  /* Empty chain verifies. */
  const empty = await E7.verifyChain([], sha256Async);
  assert.equal(empty.ok, true);
  /* Sync hash function also works. */
  const sync = E7.verifyChain([r1, r2], sha256Sync);
  assert.equal(sync.ok, true);
});

test("No em dash in any shipped file", function () {
  const dir = path.join(__dirname, "..");
  ["index.html", "e7.js", "tests/test-e7.js"].forEach(function (f) {
    const t = fs.readFileSync(path.join(dir, f), "utf8");
    assert.equal(t.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});

test("Shipped files exist and index.html wires the module and labels", function () {
  const dir = path.join(__dirname, "..");
  assert.ok(fs.existsSync(path.join(dir, "index.html")));
  assert.ok(fs.existsSync(path.join(dir, "e7.js")));
  assert.ok(fs.existsSync(path.join(dir, "tests", "test-e7.js")));
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.includes('<script src="e7.js"></script>'));
  assert.ok(html.includes("SIMULATION"));
  assert.ok(html.includes("MODELED ESTIMATE, NOT A VALUATION, NOT AN APPRAISAL"));
  assert.ok(html.includes('id="btnIssueReceipt"'));
  assert.ok(html.includes('id="btnVerifyChain"'));
  assert.ok(html.includes("e7-mobile-home-park-receipt.v1.0"));
  assert.ok(html.includes("No E7 specification document was found in the vault"));
  assert.ok(html.includes("https://e7-mobile-home-park.pages.dev/"));
});
