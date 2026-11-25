"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const F = require("./fuzzer.js");

test("2025 and 2026 EITC cliffs isolate exact $1 discontinuity", () => {
  const c25 = F.huntEitcCliff(2025);
  assert.equal(c25.incomeBefore, 11950);
  assert.equal(c25.deltaTax, 8046);
  const c26 = F.huntEitcCliff(2026);
  assert.equal(c26.incomeBefore, 12200);
  assert.equal(c26.deltaTax, 8231);
});

test("SALT arbitrage detects $15,000 MFS spread under drafting bug model", () => {
  const res = F.solveSaltArbitrage(300000, 300000, 2025, true);
  assert.equal(res.mfjCap, 10000);
  assert.equal(res.mfsTotalCap, 25000);
  assert.equal(res.deductionArbitrage, 15000);
  assert.equal(res.winner, "MFS_ARBITRAGE");
});

test("Differential fuzzer detects IRS $50 Tax Table midpoint drift", () => {
  const res = F.runDifferentialFuzz(50000, 60000, 7);
  assert.ok(res.drifted > 0);
  assert.ok(res.maxPosDrift > 4 && res.maxPosDrift <= 6);
  assert.ok(res.maxNegDrift < -4 && res.maxNegDrift >= -6);
});

test("OpaqueAxiom linter quarantines natural-language discretion", () => {
  const sample = "Allow ordinary and necessary expenses. Cap is $40,000. Require reasonable cause and good faith.";
  const res = F.lintOpaqueAxioms(sample);
  assert.equal(res.totalSentences, 3);
  assert.equal(res.opaqueSentences, 2);
  assert.ok(res.discretionPct > 60);
});

test("No em dashes in shipped files", () => {
  ["fuzzer.js", "index.html", "test.js"].forEach(f => {
    const txt = fs.readFileSync(path.join(__dirname, f), "utf8");
    assert.equal(txt.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});
