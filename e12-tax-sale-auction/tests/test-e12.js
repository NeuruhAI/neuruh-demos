/* Node test suite for E12 Tax Sale / Auction Bid Engine.
   Run: node --test tests/test-e12.js
   Sample expectations are hand-computed from the 2026-11-04 E12
   build samples (~/workspace/e12-tax-sale-auction-site/index.html)
   and re-proved here independently, step by step.
   Sample A: resale 120000, repairs 15000, monthly hold 400,
   hold months 9, hold total 3600, title total 1000, profit 24000,
   max bid 76400, headroom 58400, planned 40000, interest 2400,
   net if redeemed -1000, net if kept 60400, EV 45050.
   Sample B: resale 95000, repairs 20000, monthly hold 25,
   hold months 18, hold total 450, title total 5900, profit 19000,
   max bid 49650, headroom 41650, planned 12000, interest 2160,
   net if redeemed 960, net if kept 56650, EV 17667.
   Sample C: redemption unknown, title uninsurable with no
   quiet-title budget, rules kill checked: max bid N/A, PASS. */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const E12 = require("../e12.js");

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

const SAMPLE_A = {
  resale: 120000, repairs: 15000, minBid: 18000, senior: 0,
  profitPct: 20, plannedBid: 40000,
  redemptionMonths: 6, rate: 12, depositPct: 10, premiumPct: 0, prob: 25,
  tax: 150, insurance: 120, maint: 80, interest: 0, other: 50, postMonths: 3,
  search: 350, quiet: 0, recording: 150, closing: 500,
  titleStatus: "insurable"
};

const SAMPLE_B = {
  resale: 95000, repairs: 20000, minBid: 8000, senior: 0,
  profitPct: 20, plannedBid: 12000,
  redemptionMonths: 12, rate: 18, depositPct: 10, premiumPct: 0, prob: 70,
  tax: 0, insurance: 0, maint: 0, interest: 0, other: 25, postMonths: 6,
  search: 250, quiet: 5000, recording: 150, closing: 500,
  titleStatus: "quiet_title"
};

function runSample(s) {
  const hold = E12.holding({
    tax: s.tax, insurance: s.insurance, maint: s.maint,
    interest: s.interest, other: s.other,
    redemptionMonths: s.redemptionMonths, postMonths: s.postMonths
  });
  const title = E12.titleCosts({
    search: s.search, quiet: s.quiet,
    recording: s.recording, closing: s.closing
  });
  const mb = E12.maxBidCalc({
    resale: s.resale, repairs: s.repairs, holdTotal: hold.holdTotal,
    titleTotal: title.titleTotal, profitPct: s.profitPct,
    senior: s.senior, minBid: s.minBid, plannedBid: s.plannedBid
  });
  const red = E12.redemption({
    plannedBid: mb.plannedBid, premiumPct: s.premiumPct,
    depositPct: s.depositPct, rate: s.rate, months: s.redemptionMonths,
    prob: s.prob, holdRedemption: hold.holdRedemption,
    costsAtPurchase: title.costsAtPurchase, resale: s.resale,
    repairs: s.repairs, holdTotal: hold.holdTotal,
    titleTotal: title.titleTotal
  });
  return { hold, title, mb, red };
}

test("Sample A holding and title, hand-computed", () => {
  const { hold, title } = runSample(SAMPLE_A);
  assert.equal(hold.monthlyHold, 400);
  assert.equal(hold.holdMonths, 9);
  assert.equal(hold.holdTotal, 3600);
  assert.equal(hold.holdRedemption, 2400);
  assert.equal(title.titleTotal, 1000);
  assert.equal(title.costsAtPurchase, 1000);
});

test("Sample A max bid and headroom, hand-computed", () => {
  const { mb } = runSample(SAMPLE_A);
  assert.equal(mb.profit, 24000);
  assert.equal(mb.maxBid, 76400);
  assert.equal(mb.headroom, 58400);
  assert.equal(mb.plannedBid, 40000);
});

test("Sample A redemption, net if kept, net if redeemed, EV, hand-computed", () => {
  const { red } = runSample(SAMPLE_A);
  assert.equal(red.premium, 0);
  assert.equal(red.deposit, 4000);
  assert.equal(red.interest, 2400);
  assert.equal(red.payoff, 42400);
  assert.equal(red.netRedeemed, -1000);
  assert.equal(red.netKept, 60400);
  assert.equal(red.expectedValue, 45050);
});

test("Sample B holding and title, hand-computed", () => {
  const { hold, title } = runSample(SAMPLE_B);
  assert.equal(hold.monthlyHold, 25);
  assert.equal(hold.holdMonths, 18);
  assert.equal(hold.holdTotal, 450);
  assert.equal(hold.holdRedemption, 300);
  assert.equal(title.titleTotal, 5900);
  assert.equal(title.costsAtPurchase, 900);
});

test("Sample B max bid and headroom, hand-computed", () => {
  const { mb } = runSample(SAMPLE_B);
  assert.equal(mb.profit, 19000);
  assert.equal(mb.maxBid, 49650);
  assert.equal(mb.headroom, 41650);
  assert.equal(mb.plannedBid, 12000);
});

test("Sample B redemption, net if kept, net if redeemed, EV, hand-computed", () => {
  const { red } = runSample(SAMPLE_B);
  assert.equal(red.premium, 0);
  assert.equal(red.deposit, 1200);
  assert.equal(red.interest, 2160);
  assert.equal(red.payoff, 14160);
  assert.equal(red.netRedeemed, 960);
  assert.equal(red.netKept, 56650);
  assert.equal(E12.round2(red.expectedValue), 17667);
});

test("Sample C: redemption unknown makes holding and max bid N/A", () => {
  const hold = E12.holding({
    tax: 200, insurance: 150, maint: 100, interest: 100, other: 50,
    redemptionMonths: null, postMonths: 3
  });
  assert.equal(hold.monthlyHold, 600);
  assert.equal(hold.holdMonths, null);
  assert.equal(hold.holdTotal, null);
  assert.equal(hold.holdRedemption, null);
  const title = E12.titleCosts({
    search: 400, quiet: 0, recording: 200, closing: 600
  });
  assert.equal(title.titleTotal, 1200);
  const mb = E12.maxBidCalc({
    resale: 150000, repairs: 25000, holdTotal: hold.holdTotal,
    titleTotal: title.titleTotal, profitPct: 20, senior: 0,
    minBid: 30000, plannedBid: 35000
  });
  assert.equal(mb.profit, 30000);
  assert.equal(mb.maxBid, null);
  assert.equal(mb.headroom, null);
  assert.equal(mb.plannedBid, 35000);
});

test("Sample C: both contract kills plus the checked rules kill, PASS", () => {
  assert.equal(E12.titleKill({ titleStatus: "uninsurable", quiet: 0 }), true);
  const kills = E12.evaluateKills({
    manualKills: ["Auction rules unverified, no county or statute source"],
    redemptionUnknown: true,
    titleKill: true,
    maxBidKill: false
  });
  assert.equal(kills.killActive, true);
  assert.equal(kills.fired.length, 3);
  assert.ok(kills.fired.indexOf("Redemption period unknown (contract kill)") !== -1);
  assert.ok(kills.fired.indexOf("Title uninsurable with no quiet-title budget (contract kill)") !== -1);
  assert.ok(kills.fired.indexOf("Auction rules unverified, no county or statute source") !== -1);
  const rec = E12.recommendation({
    killActive: true, gatesOk: false, incomplete: true
  });
  assert.equal(rec.status, "KILL");
  assert.equal(rec.text, "PASS - do not bid");
});

test("Title kill: blank quiet-title budget counts as no budget", () => {
  assert.equal(E12.titleKill({ titleStatus: "uninsurable", quiet: null }), true);
  assert.equal(E12.titleKill({ titleStatus: "uninsurable", quiet: 5000 }), false);
  assert.equal(E12.titleKill({ titleStatus: "insurable", quiet: 0 }), false);
  assert.equal(E12.titleKill({ titleStatus: "quiet_title", quiet: 5000 }), false);
});

test("Max-bid kill: fires only when max bid is below minimum bid", () => {
  assert.equal(E12.maxBidKill({ maxBid: 76400, minBid: 18000 }), false);
  assert.equal(E12.maxBidKill({ maxBid: 17000, minBid: 18000 }), true);
  assert.equal(E12.maxBidKill({ maxBid: null, minBid: 18000 }), false);
  assert.equal(E12.maxBidKill({ maxBid: 18000, minBid: 18000 }), false);
});

test("Kill dedup: a manual check does not duplicate an auto kill", () => {
  const kills = E12.evaluateKills({
    manualKills: ["Redemption period unknown (contract kill)"],
    redemptionUnknown: true,
    titleKill: false,
    maxBidKill: false
  });
  assert.equal(kills.fired.length, 1);
});

test("No kills: empty kill evaluation", () => {
  const kills = E12.evaluateKills({
    manualKills: [], redemptionUnknown: false,
    titleKill: false, maxBidKill: false
  });
  assert.equal(kills.killActive, false);
  assert.deepEqual(kills.fired, []);
});

test("Gates fail closed: one failed gate blocks READY", () => {
  const all = {};
  E12.GATE_IDS.forEach((id) => { all[id] = "pass"; });
  assert.equal(E12.evaluateGates(all).ok, true);
  const oneFail = Object.assign({}, all, { title: "fail" });
  const ev = E12.evaluateGates(oneFail);
  assert.equal(ev.ok, false);
  assert.deepEqual(ev.failed, ["title"]);
  assert.equal(E12.evaluateGates({}).ok, false);
  assert.equal(E12.evaluateGates(null).ok, false);
});

test("Recommendation: HOLD on failed gates or incomplete math, READY otherwise", () => {
  assert.equal(E12.recommendation({ killActive: false, gatesOk: false, incomplete: false }).text, "HOLD");
  assert.equal(E12.recommendation({ killActive: false, gatesOk: true, incomplete: true }).text, "HOLD");
  const ready = E12.recommendation({ killActive: false, gatesOk: true, incomplete: false });
  assert.equal(ready.status, "READY FOR REVIEW");
  assert.equal(ready.text, "READY FOR HUMAN REVIEW - no bid without Jeramie");
});

test("Risk flags: high redemption probability, title, occupancy, senior liens, EV", () => {
  const flags = E12.riskFlags({
    prob: 70, titleStatus: "quiet_title", occupancy: "owner_occupied",
    senior: 5000, monthlyHold: 400, holdTotal: 12000,
    redemptionMonths: 12, redemptionUnknown: false,
    plannedInput: 80000, maxBid: 76400, expectedValue: -500
  });
  assert.ok(flags.indexOf("redemption probability 70 percent, high") !== -1);
  assert.ok(flags.indexOf("title needs quiet title") !== -1);
  assert.ok(flags.indexOf("occupied at auction: owner_occupied") !== -1);
  assert.ok(flags.indexOf("holding total over $10,000") !== -1);
  assert.ok(flags.indexOf("senior liens $5,000") !== -1);
  assert.ok(flags.indexOf("redemption period 12 months or more") !== -1);
  assert.ok(flags.indexOf("planned bid above max bid") !== -1);
  assert.ok(flags.indexOf("expected value negative") !== -1);
  assert.deepEqual(E12.riskFlags({
    prob: 25, titleStatus: "insurable", occupancy: "vacant",
    senior: 0, monthlyHold: 400, holdTotal: 3600,
    redemptionMonths: 6, redemptionUnknown: false,
    plannedInput: 40000, maxBid: 76400, expectedValue: 45050
  }), []);
});

test("Null handling: title total N/A only when all four parts blank", () => {
  assert.equal(E12.titleCosts({ search: null, quiet: null, recording: null, closing: null }).titleTotal, null);
  assert.equal(E12.titleCosts({ search: null, quiet: null, recording: null, closing: null }).costsAtPurchase, null);
  assert.equal(E12.titleCosts({ search: 350, quiet: null, recording: null, closing: null }).titleTotal, 350);
  assert.equal(E12.titleCosts({ search: 350, quiet: null, recording: null, closing: null }).costsAtPurchase, 350);
  assert.equal(E12.titleCosts({ search: null, quiet: 5000, recording: null, closing: null }).titleTotal, 5000);
  assert.equal(E12.titleCosts({ search: null, quiet: 5000, recording: null, closing: null }).costsAtPurchase, null);
});

test("Null handling: blank repairs or blank profit percent makes max bid N/A", () => {
  const base = {
    resale: 120000, holdTotal: 3600, titleTotal: 1000,
    senior: 0, minBid: 18000, plannedBid: null
  };
  assert.equal(E12.maxBidCalc(Object.assign({}, base, { repairs: null, profitPct: 20 })).maxBid, null);
  assert.equal(E12.maxBidCalc(Object.assign({}, base, { repairs: 15000, profitPct: null })).maxBid, null);
  assert.equal(E12.maxBidCalc(Object.assign({}, base, { repairs: 15000, profitPct: 20 })).maxBid, 76400);
});

test("Null handling: planned bid defaults to max bid when blank", () => {
  const mb = E12.maxBidCalc({
    resale: 120000, repairs: 15000, holdTotal: 3600, titleTotal: 1000,
    profitPct: 20, senior: 0, minBid: 18000, plannedBid: null
  });
  assert.equal(mb.plannedBid, 76400);
});

test("Null handling: redemption math is N/A without probability, rate, or months", () => {
  const red = E12.redemption({
    plannedBid: 40000, premiumPct: 0, depositPct: 10,
    rate: null, months: 6, prob: null, holdRedemption: 2400,
    costsAtPurchase: 1000, resale: 120000, repairs: 15000,
    holdTotal: 3600, titleTotal: 1000
  });
  assert.equal(red.interest, null);
  assert.equal(red.payoff, null);
  assert.equal(red.netRedeemed, null);
  assert.equal(red.netKept, 60400);
  assert.equal(red.expectedValue, null);
});

test("Quirk carried verbatim: monthly holding is always a number, even $0.00 on an empty form", () => {
  const hold = E12.holding({
    tax: null, insurance: null, maint: null, interest: null, other: null,
    redemptionMonths: 6, postMonths: 3
  });
  assert.equal(hold.monthlyHold, 0);
  assert.equal(hold.holdMonths, 9);
  assert.equal(hold.holdTotal, 0);
});

test("Buyer premium and deposit scale with planned bid", () => {
  const red = E12.redemption({
    plannedBid: 40000, premiumPct: 5, depositPct: 10,
    rate: 12, months: 6, prob: 25, holdRedemption: 2400,
    costsAtPurchase: 1000, resale: 120000, repairs: 15000,
    holdTotal: 3600, titleTotal: 1000
  });
  assert.equal(red.premium, 2000);
  assert.equal(red.deposit, 4000);
  assert.equal(red.netKept, 58400);
  assert.equal(red.netRedeemed, -3000);
  assert.equal(red.expectedValue, 43050);
});

test("Completeness: empty run 0 percent with 8 missing, full run 100 percent", () => {
  const labels = ["Parcel ID", "County, State", "Auction date", "Auction type",
    "Resale value", "Minimum bid", "Redemption period", "Title status"];
  const empty = E12.completeness(labels.map((l) => ({ label: l, done: false })));
  assert.equal(empty.pct, 0);
  assert.equal(empty.done, 0);
  assert.equal(empty.missing.length, 8);
  const full = E12.completeness(labels.map((l) => ({ label: l, done: true })));
  assert.equal(full.pct, 100);
  assert.equal(full.missing.length, 0);
  const half = E12.completeness(labels.map((l, i) => ({ label: l, done: i < 4 })));
  assert.equal(half.pct, 50);
});

test("Money formatting: negative values, N/A, two decimals", () => {
  assert.equal(E12.money(-1000), "-$1,000.00");
  assert.equal(E12.money(76400), "$76,400.00");
  assert.equal(E12.money(null), "N/A");
  assert.equal(E12.money(undefined), "N/A");
  assert.equal(E12.round2(123.456), 123.46);
  assert.equal(E12.round2(123.454), 123.45);
  assert.equal(E12.round2(null), null);
});

test("Canonical JSON: key order sorted recursively, order independent", () => {
  const a = E12.canonicalJSON({ b: 2, a: { d: 4, c: 3 } });
  const b = E12.canonicalJSON({ a: { c: 3, d: 4 }, b: 2 });
  assert.equal(a, b);
  assert.equal(a, '{"a":{"c":3,"d":4},"b":2}');
  assert.equal(E12.canonicalJSON([3, 1, 2]), "[3,1,2]");
});

test("Receipt chain: GENESIS first, second links to first, verify passes", () => {
  const r1 = E12.buildReceipt({ max_bid: 76400 }, "GENESIS", 1);
  r1.hash = sha256Hex(E12.canonicalJSON(r1));
  const r2 = E12.buildReceipt({ max_bid: 49650 }, r1.hash, 2);
  r2.hash = sha256Hex(E12.canonicalJSON(r2));
  assert.equal(r1.prev_hash, "GENESIS");
  assert.equal(r2.prev_hash, r1.hash);
  assert.equal(r1.schema_version, "e12-tax-sale-auction-receipt.v1.0");
  const v = E12.verifyChain([r1, r2], sha256Hex);
  assert.equal(v.ok, true);
  assert.equal(v.results.length, 2);
  assert.ok(v.results.every((r) => r.ok));
});

test("Receipt chain: tampered field fails, tampered prev_hash fails, empty chain verifies", () => {
  const r1 = E12.buildReceipt({ max_bid: 76400 }, "GENESIS", 1);
  r1.hash = sha256Hex(E12.canonicalJSON(r1));
  const tampered = JSON.parse(JSON.stringify(r1));
  tampered.fields.max_bid = 99999;
  assert.equal(E12.verifyChain([tampered], sha256Hex).ok, false);
  const badLink = E12.buildReceipt({ max_bid: 49650 }, "WRONG", 2);
  badLink.hash = sha256Hex(E12.canonicalJSON(badLink));
  assert.equal(E12.verifyChain([r1, badLink], sha256Hex).ok, false);
  assert.equal(E12.verifyChain([], sha256Hex).ok, true);
});

test("No em dash in any shipped file", () => {
  const dir = path.join(__dirname, "..");
  ["index.html", "e12.js", "tests/test-e12.js"].forEach((f) => {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.equal(text.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});

test("Shipped files exist and index.html carries the pattern markers", () => {
  const dir = path.join(__dirname, "..");
  assert.ok(fs.existsSync(path.join(dir, "index.html")));
  assert.ok(fs.existsSync(path.join(dir, "e12.js")));
  assert.ok(fs.existsSync(path.join(dir, "tests/test-e12.js")));
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  assert.ok(html.indexOf("e12.js") !== -1, "index references e12.js");
  assert.ok(html.indexOf("MODELED ESTIMATE") !== -1, "MODELED ESTIMATE label");
  assert.ok(html.indexOf("SIMULATION") !== -1, "SIMULATION label");
  assert.ok(html.indexOf("Verify chain") !== -1, "Verify chain button");
  assert.ok(html.indexOf("Issue receipt") !== -1, "Issue receipt button");
  assert.ok(html.indexOf("e12-tax-sale-auction.pages.dev") !== -1, "Cloudflare source URL");
  assert.ok(html.indexOf("No E12 specification document was found in the vault") !== -1, "vault-gap statement");
  assert.ok(html.indexOf("NOT A VALUATION, NOT AN APPRAISAL") !== -1, "not a valuation label");
  assert.ok(html.indexOf("No offer without Jeramie") !== -1, "authority line");
  const js = fs.readFileSync(path.join(dir, "e12.js"), "utf8");
  assert.ok(js.indexOf("e12-tax-sale-auction-receipt.v1.0") !== -1, "chain schema");
});
