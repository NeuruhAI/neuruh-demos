/* Node test suite for E11 Agricultural / Timber / Recreation.
   Hand-computed expectations re-proved independently from the
   2026-11-04 E11 build samples. Run: node --test tests/test-e11.js */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const E11 = require("../e11.js");

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function approx(actual, expected, msg) {
  assert.ok(actual !== null && Math.abs(actual - expected) < 0.005,
    (msg || "approx") + ": got " + actual + ", expected " + expected);
}

/* Sample inputs, carried from the 2026-11-04 E11 build loadSample. */
const SAMPLE_A = {
  total: 120, ask: 700000, till: 90, timber: 20, pasture: 0, wet: 5, waste: 5,
  cashRent: 250, cruiseQty: 40, cruisePrice: 400, recAcres: 30, recLease: 25,
  recCap: 5, tillVal: 8000, nonTillVal: 2000
};
const SAMPLE_B = {
  total: 80, ask: 320000, till: 20, timber: 50, pasture: 10, wet: 0, waste: 0,
  cashRent: 200, cruiseQty: 60, cruisePrice: 350, recAcres: 60, recLease: 35,
  recCap: 5, tillVal: 6500, nonTillVal: 2500
};
const SAMPLE_C = {
  total: 160, ask: 950000, till: 100, timber: 40, pasture: 0, wet: 10, waste: 10,
  cashRent: 225, cruiseQty: 80, cruisePrice: 300, recAcres: 50, recLease: 20,
  recCap: 5, tillVal: 7500, nonTillVal: 2200
};
const COMPS_A = [
  { address: "124 Farm Ln", sale_price: 715000, sale_date: "2026-08-15", productive_acres: 100, source_url: "assessor.example/record/comp-124-farm-ln" },
  { address: "118 Farm Ln", sale_price: 630000, sale_date: "2026-07-22", productive_acres: 95, source_url: "assessor.example/record/comp-118-farm-ln" },
  { address: "201 Farm Ave", sale_price: 800000, sale_date: "2026-06-30", productive_acres: 110, source_url: "assessor.example/record/comp-201-farm-ave" }
];
const COMPS_B = [
  { address: "800 Timber Ridge", sale_price: 300000, sale_date: "2026-08-12", productive_acres: 75, source_url: "assessor.example/record/comp-800-timber-ridge" },
  { address: "750 Timber Ridge", sale_price: 330000, sale_date: "2026-07-20", productive_acres: 82, source_url: "assessor.example/record/comp-750-timber-ridge" },
  { address: "820 Timber Ridge", sale_price: 290000, sale_date: "2026-06-28", productive_acres: 70, source_url: "assessor.example/record/comp-820-timber-ridge" }
];
const COMPS_C = [
  { address: "460 Unknown Rights Rd", sale_price: 900000, sale_date: "2026-08-10", productive_acres: 150, source_url: "assessor.example/record/comp-460-unknown-rights" },
  { address: "450 Unknown Rights Rd", sale_price: 880000, sale_date: "2026-07-15", productive_acres: 145, source_url: "assessor.example/record/comp-450-unknown-rights" },
  { address: "470 Unknown Rights Rd", sale_price: 920000, sale_date: "2026-06-20", productive_acres: 155, source_url: "assessor.example/record/comp-470-unknown-rights" }
];

function fullRun(s) {
  const acr = E11.acreage({ till: s.till, timber: s.timber, pasture: s.pasture, wet: s.wet, waste: s.waste, total: s.total });
  const rm = E11.rentMath({ till: s.till, cashRent: s.cashRent, ask: s.ask });
  const cruiseVal = E11.cruiseValue({ qty: s.cruiseQty, price: s.cruisePrice });
  const rec = E11.recreation({ acres: s.recAcres, lease: s.recLease, capPct: s.recCap });
  const cv = E11.componentValue({ till: s.till, tillVal: s.tillVal, timber: s.timber, pasture: s.pasture, nonTillVal: s.nonTillVal, cruiseVal: cruiseVal, recVal: rec.value });
  const pa = E11.pricePerAcre({ ask: s.ask, prod: acr.prod, total: s.total, component: cv.component });
  return { acr: acr, rm: rm, cruiseVal: cruiseVal, rec: rec, cv: cv, pa: pa };
}

test("Sample A acreage: productive 110.00, breakdown 120.00 reconciles", () => {
  const r = fullRun(SAMPLE_A);
  assert.equal(r.acr.prod, 110);
  assert.equal(r.acr.breakdownSum, 120);
  assert.equal(r.acr.reconciles, true);
});

test("Sample A rent: gross 22,500.00, yield 3.21 percent", () => {
  const r = fullRun(SAMPLE_A);
  assert.equal(r.rm.grossRent, 22500);
  approx(r.rm.rentYield, 0.032142857, "yield");
  assert.equal((r.rm.rentYield * 100).toFixed(2), "3.21");
});

test("Sample A timber and recreation: cruise 16,000.00, rec income 750.00, rec value 15,000.00", () => {
  const r = fullRun(SAMPLE_A);
  assert.equal(r.cruiseVal, 16000);
  assert.equal(r.rec.income, 750);
  assert.equal(r.rec.value, 15000);
});

test("Sample A component: tillable 720,000.00, non-tillable 40,000.00, component 791,000.00", () => {
  const r = fullRun(SAMPLE_A);
  assert.equal(r.cv.tillValue, 720000);
  assert.equal(r.cv.nonTillAcres, 20);
  assert.equal(r.cv.nonTillValue, 40000);
  assert.equal(r.cv.component, 791000);
});

test("Sample A price per acre: productive 6,363.64, total 5,833.33, minus asking 91,000.00", () => {
  const r = fullRun(SAMPLE_A);
  approx(r.pa.ppa, 6363.636363, "ppa");
  assert.equal(E11.round2(r.pa.ppa), 6363.64);
});

test("Sample A price per total acre and component minus asking", () => {
  const r = fullRun(SAMPLE_A);
  approx(r.pa.ppta, 5833.333333, "ppta");
  assert.equal(E11.round2(r.pa.ppta), 5833.33);
  assert.equal(r.pa.compVsAsk, 91000);
});

test("Sample A comps: per-acre 7,150.00 / 6,631.58 / 7,272.73, 3 usable", () => {
  assert.equal(E11.round2(E11.compPpa(COMPS_A[0])), 7150);
  assert.equal(E11.round2(E11.compPpa(COMPS_A[1])), 6631.58);
  assert.equal(E11.round2(E11.compPpa(COMPS_A[2])), 7272.73);
  assert.equal(E11.compsUsable(COMPS_A).length, 3);
});

test("Sample B full run: component 343,000.00, ppa 4,000.00, gross rent 4,000.00", () => {
  const r = fullRun(SAMPLE_B);
  assert.equal(r.acr.prod, 80);
  assert.equal(r.acr.reconciles, true);
  assert.equal(r.rm.grossRent, 4000);
  approx(r.rm.rentYield, 0.0125, "yield B");
  assert.equal(r.cruiseVal, 21000);
  assert.equal(r.rec.income, 2100);
  assert.equal(r.rec.value, 42000);
  assert.equal(r.cv.tillValue, 130000);
  assert.equal(r.cv.nonTillAcres, 60);
  assert.equal(r.cv.nonTillValue, 150000);
  assert.equal(r.cv.component, 343000);
  assert.equal(r.pa.ppa, 4000);
  assert.equal(r.pa.ppta, 4000);
  assert.equal(r.pa.compVsAsk, 23000);
});

test("Sample B comps: per-acre 4,000.00 / 4,024.39 / 4,142.86, 3 usable", () => {
  assert.equal(E11.round2(E11.compPpa(COMPS_B[0])), 4000);
  assert.equal(E11.round2(E11.compPpa(COMPS_B[1])), 4024.39);
  assert.equal(E11.round2(E11.compPpa(COMPS_B[2])), 4142.86);
  assert.equal(E11.compsUsable(COMPS_B).length, 3);
});

test("Sample C full run: component 882,000.00, ppa 6,785.71, gross rent 22,500.00", () => {
  const r = fullRun(SAMPLE_C);
  assert.equal(r.acr.prod, 140);
  assert.equal(r.acr.reconciles, true);
  assert.equal(r.rm.grossRent, 22500);
  approx(r.rm.rentYield, 0.023684210, "yield C");
  assert.equal((r.rm.rentYield * 100).toFixed(2), "2.37");
  assert.equal(r.cruiseVal, 24000);
  assert.equal(r.rec.income, 1000);
  assert.equal(r.rec.value, 20000);
  assert.equal(r.cv.tillValue, 750000);
  assert.equal(r.cv.nonTillAcres, 40);
  assert.equal(r.cv.nonTillValue, 88000);
  assert.equal(r.cv.component, 882000);
  approx(r.pa.ppa, 6785.714285, "ppa C");
  assert.equal(E11.round2(r.pa.ppa), 6785.71);
  approx(r.pa.ppta, 5937.5, "ppta C");
  assert.equal(r.pa.compVsAsk, -68000);
});

test("Sample C comps: per-acre 6,000.00 / 6,068.97 / 5,935.48, 3 usable", () => {
  assert.equal(E11.round2(E11.compPpa(COMPS_C[0])), 6000);
  assert.equal(E11.round2(E11.compPpa(COMPS_C[1])), 6068.97);
  assert.equal(E11.round2(E11.compPpa(COMPS_C[2])), 5935.48);
  assert.equal(E11.compsUsable(COMPS_C).length, 3);
});

test("Sample C kills: three fire, including the auto-derived water kill", () => {
  const k = E11.evaluateKills({
    manualKills: [E11.KILLS[0], E11.KILLS[1]],
    access: "public", priced: "yes", mineral: "unknown", water: "unknown"
  });
  assert.equal(k.killActive, true);
  assert.equal(k.fired.length, 3);
  assert.ok(k.fired.indexOf(E11.KILLS[0]) !== -1);
  assert.ok(k.fired.indexOf(E11.KILLS[1]) !== -1);
  assert.ok(k.fired.some((x) => x.indexOf("Water rights unknown") === 0));
  const rec = E11.recommendation({ killActive: true, gatesOk: true, compShort: false, valueNa: false });
  assert.equal(rec.status, "KILL");
  assert.equal(rec.text, "PASS");
});

test("Auto kills: no legal access, mineral unknown when priced, none when not priced", () => {
  const a = E11.evaluateKills({ manualKills: [], access: "none", priced: "no", mineral: "included", water: "included" });
  assert.equal(a.fired.length, 1);
  assert.ok(a.fired[0].indexOf("No legal access") === 0);
  const b = E11.evaluateKills({ manualKills: [], access: "public", priced: "yes", mineral: "unknown", water: "included" });
  assert.equal(b.fired.length, 1);
  assert.ok(b.fired[0].indexOf("Mineral rights unknown") === 0);
  const c = E11.evaluateKills({ manualKills: [], access: "public", priced: "no", mineral: "unknown", water: "unknown" });
  assert.equal(c.fired.length, 0);
  const d = E11.evaluateKills({ manualKills: [E11.KILLS[3]], access: "none", priced: "no", mineral: "included", water: "included" });
  assert.equal(d.fired.length, 1, "checked kill is not duplicated by the auto rule");
});

test("Gates fail closed: one failed gate blocks READY FOR REVIEW", () => {
  const all = {};
  E11.GATE_IDS.forEach((id) => { all[id] = "pass"; });
  assert.equal(E11.evaluateGates(all).ok, true);
  const one = Object.assign({}, all, { timber: "fail" });
  const g = E11.evaluateGates(one);
  assert.equal(g.ok, false);
  assert.deepEqual(g.failed, ["timber"]);
  const rec = E11.recommendation({ killActive: false, gatesOk: false, compShort: false, valueNa: false });
  assert.equal(rec.status, "HOLD");
});

test("Recommendation: HOLD on fewer than 3 comps or N/A value, READY otherwise", () => {
  assert.equal(E11.recommendation({ killActive: false, gatesOk: true, compShort: true, valueNa: false }).status, "HOLD");
  assert.equal(E11.recommendation({ killActive: false, gatesOk: true, compShort: false, valueNa: true }).status, "HOLD");
  assert.equal(E11.recommendation({ killActive: false, gatesOk: true, compShort: false, valueNa: false }).status, "READY FOR REVIEW");
});

test("Component value is N/A when any of the four parts is missing", () => {
  const base = { till: 90, tillVal: 8000, timber: 20, pasture: 0, nonTillVal: 2000, cruiseVal: 16000, recVal: 15000 };
  assert.equal(E11.componentValue(base).component, 791000);
  assert.equal(E11.componentValue(Object.assign({}, base, { cruiseVal: null })).component, null);
  assert.equal(E11.componentValue(Object.assign({}, base, { recVal: null })).component, null);
  assert.equal(E11.componentValue(Object.assign({}, base, { tillVal: null })).component, null);
  assert.equal(E11.componentValue(Object.assign({}, base, { nonTillVal: null })).component, null);
});

test("Component value with zero timber and zero recreation entered as 0 still computes", () => {
  const r = E11.componentValue({ till: 90, tillVal: 8000, timber: 0, pasture: 0, nonTillVal: 2000, cruiseVal: 0, recVal: 0 });
  assert.equal(r.nonTillAcres, 0);
  assert.equal(r.nonTillValue, 0);
  assert.equal(r.component, 720000);
});

test("Acreage: null parts stay null, mismatch does not reconcile, only wet/waste gives null productive acres", () => {
  const a = E11.acreage({ till: null, timber: null, pasture: null, wet: 5, waste: 5, total: 10 });
  assert.equal(a.prod, null);
  assert.equal(a.breakdownSum, 10);
  assert.equal(a.reconciles, true);
  const b = E11.acreage({ till: 90, timber: 20, pasture: 0, wet: 5, waste: 5, total: 100 });
  assert.equal(b.breakdownSum, 120);
  assert.equal(b.reconciles, false);
  const c = E11.acreage({ till: null, timber: null, pasture: null, wet: null, waste: null, total: null });
  assert.equal(c.prod, null);
  assert.equal(c.breakdownSum, null);
  assert.equal(c.reconciles, false);
});

test("Rent math: null inputs give null, zero asking price gives null yield", () => {
  assert.equal(E11.rentMath({ till: null, cashRent: 250, ask: 700000 }).grossRent, null);
  assert.equal(E11.rentMath({ till: 90, cashRent: null, ask: 700000 }).grossRent, null);
  const r = E11.rentMath({ till: 90, cashRent: 250, ask: 0 });
  assert.equal(r.grossRent, 22500);
  assert.equal(r.rentYield, null);
});

test("Cruise and recreation: nulls stay null, zero cap rate gives null capitalized value", () => {
  assert.equal(E11.cruiseValue({ qty: null, price: 400 }), null);
  assert.equal(E11.cruiseValue({ qty: 40, price: null }), null);
  assert.equal(E11.cruiseValue({ qty: 40, price: 400 }), 16000);
  const r = E11.recreation({ acres: 30, lease: 25, capPct: 0 });
  assert.equal(r.income, 750);
  assert.equal(r.value, null);
  assert.equal(E11.recreation({ acres: null, lease: 25, capPct: 5 }).income, null);
});

test("Comps: unusable rows are rejected, zero productive acres give null per-acre", () => {
  const rows = [
    { address: "A", sale_price: 100000, sale_date: "2026-01-01", productive_acres: 10, source_url: "x" },
    { address: "", sale_price: 100000, sale_date: "2026-01-01", productive_acres: 10, source_url: "x" },
    { address: "C", sale_price: 100000, sale_date: "2026-01-01", productive_acres: 10, source_url: "" },
    { address: "D", sale_price: null, sale_date: "2026-01-01", productive_acres: 10, source_url: "x" }
  ];
  assert.equal(E11.compsUsable(rows).length, 1);
  assert.equal(E11.compPpa({ sale_price: 100000, productive_acres: 0 }), null);
  assert.equal(E11.compPpa({ sale_price: 100000, productive_acres: null }), null);
  assert.equal(E11.rentCompsUsable([
    { county: "Berrien County", acres: 90, rent_per_acre: 250, source_url: "x" },
    { county: "Berrien County", acres: 90, rent_per_acre: null, source_url: "x" }
  ]).length, 1);
});

test("HBU quirk carried verbatim: later Pass with earlier Fail still reports fail", () => {
  const h = E11.hbuStatus(["fail", "pass", "pass", "pass"]);
  assert.equal(h.fail, true);
  assert.equal(h.done, true);
  assert.equal(E11.hbuStatus(["pass", "pass", "pass", "pass"]).fail, false);
  assert.equal(E11.hbuStatus(["pass", "", "", ""]).done, false);
  assert.equal(E11.hbuStatus(["pass", "", "", ""]).partial, true);
  assert.equal(E11.hbuStatus(["", "", "", ""]).partial, false);
});

test("Grade D rent quirk carried verbatim: gross rent still computes", () => {
  const r = E11.rentMath({ till: 100, cashRent: 225, ask: 950000 });
  assert.equal(r.grossRent, 22500);
  assert.equal((r.rentYield * 100).toFixed(2), "2.37");
});

test("Completeness: empty run 0 percent with 8 missing, full run 100 percent", () => {
  const empty = E11.completeness([
    { label: "Street address or legal description", done: false },
    { label: "Parcel ID", done: false },
    { label: "Total acres", done: false },
    { label: "Acreage breakdown reconciles", done: false },
    { label: "At least 3 usable comps", done: false },
    { label: "Cash rent entered", done: false },
    { label: "Component value computed", done: false },
    { label: "HBU stated", done: false }
  ]);
  assert.equal(empty.pct, 0);
  assert.equal(empty.missing.length, 8);
  const full = E11.completeness([
    { label: "a", done: true }, { label: "b", done: true },
    { label: "c", done: true }, { label: "d", done: true },
    { label: "e", done: true }, { label: "f", done: true },
    { label: "g", done: true }, { label: "h", done: true }
  ]);
  assert.equal(full.pct, 100);
  assert.equal(full.missing.length, 0);
});

test("Canonical JSON: key order sorted recursively, order independent", () => {
  const a = E11.canonicalJSON({ b: 2, a: { d: 4, c: 3 } });
  assert.equal(a, '{"a":{"c":3,"d":4},"b":2}');
  assert.equal(E11.canonicalJSON({ b: 2, a: 1 }), E11.canonicalJSON({ a: 1, b: 2 }));
  assert.equal(E11.canonicalJSON([3, 2, 1]), "[3,2,1]");
});

test("Receipt chain: GENESIS first, second links to first, verify passes", () => {
  const f1 = { component_value: 791000, status: "READY FOR REVIEW" };
  const r1 = E11.buildReceipt(f1, "GENESIS", 1);
  r1.hash = sha256Hex(E11.canonicalJSON(r1));
  const r2 = E11.buildReceipt({ component_value: 343000, status: "READY FOR REVIEW" }, r1.hash, 2);
  r2.hash = sha256Hex(E11.canonicalJSON(r2));
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r2.prev_hash, r1.hash);
  assert.equal(r1.schema_version, "e11-agricultural-timber-receipt.v1.0");
  const v = E11.verifyChain([r1, r2], sha256Hex);
  assert.equal(v.ok, true);
  assert.deepEqual(v.results.map((x) => x.ok), [true, true]);
});

test("Receipt chain tamper detection: tampered field fails, tampered prev_hash fails, empty chain verifies", () => {
  const r1 = E11.buildReceipt({ component_value: 791000 }, "GENESIS", 1);
  r1.hash = sha256Hex(E11.canonicalJSON(r1));
  const bad = JSON.parse(JSON.stringify(r1));
  bad.fields.component_value = 1;
  assert.equal(E11.verifyChain([bad], sha256Hex).ok, false);
  const bad2 = JSON.parse(JSON.stringify(r1));
  bad2.prev_hash = "WRONG";
  assert.equal(E11.verifyChain([bad2], sha256Hex).ok, false);
  assert.equal(E11.verifyChain([], sha256Hex).ok, true);
});

test("Shipped files: no em dash in any file, index references e11.js and carries required labels", () => {
  const dir = path.join(__dirname, "..");
  const files = ["index.html", "e11.js", "tests/test-e11.js"];
  for (const f of files) {
    const p = path.join(dir, f);
    assert.ok(fs.existsSync(p), f + " exists");
    const text = fs.readFileSync(p, "utf8");
    assert.equal(text.indexOf("\u2014"), -1, f + " has no em dash");
  }
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.indexOf('src="e11.js"') !== -1, "index loads e11.js");
  assert.ok(html.indexOf("MODELED ESTIMATE") !== -1, "MODELED ESTIMATE label present");
  assert.ok(html.indexOf("SIMULATION") !== -1, "SIMULATION label present");
  assert.ok(html.indexOf("Verify chain") !== -1, "Verify chain button present");
  assert.ok(html.indexOf("Issue receipt") !== -1, "Issue receipt button present");
  const js = fs.readFileSync(path.join(dir, "e11.js"), "utf8");
  assert.ok(js.indexOf("e11-agricultural-timber-receipt.v1.0") !== -1, "receipt schema present in e11.js");
  assert.ok(html.indexOf("No E11 specification document was found in the vault") !== -1, "vault gap stated");
  assert.ok(html.indexOf("https://e11-agricultural-timber.pages.dev/") !== -1, "Cloudflare source URL present");
  assert.ok(html.indexOf("offer_authorized:false") !== -1 || html.indexOf("offer_authorized: false") !== -1, "offer authorized false present");
  assert.ok(html.indexOf("Sample A loaded") !== -1, "Sample A loader present");
  assert.ok(html.indexOf("Sample B loaded") !== -1, "Sample B loader present");
  assert.ok(html.indexOf("Sample C loaded") !== -1, "Sample C loader present");
});
