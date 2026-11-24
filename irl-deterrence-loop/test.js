"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const D = require("./deterrence.js");

test("CRUCIBLE passes on eta >= 70 and 0 uncited, flags on uncited > 0", () => {
  const pass = D.evaluateCrucible({ iq: 88, ir: 90, iv: 85, eWasted: 1, cViolations: 0, uncitedCount: 0 });
  assert.equal(pass.verdict, "PASS");
  assert.equal(pass.eta, 100);
  const flag = D.evaluateCrucible({ iq: 88, ir: 90, iv: 85, eWasted: 1, cViolations: 0, uncitedCount: 1 });
  assert.equal(flag.verdict, "FLAG");
});

test("Authority gate fails closed on missing human approval or unlawful channel", () => {
  const base = {
    authorizer: "Jeramie Hicks",
    scope: "CASE-1",
    expiry: "2027-01-01T00:00:00Z",
    channel: "licensed_pi",
    humanApproved: true,
    crucibleVerdict: "PASS",
    attributionProb: 0.85,
    currentThreshold: 0.75
  };
  assert.equal(D.evaluateAuthorityGate(base, "2026-11-24T00:00:00Z").decision, "ALLOW");
  assert.equal(D.evaluateAuthorityGate(Object.assign({}, base, { humanApproved: false }), "2026-11-24T00:00:00Z").decision, "DENY");
  assert.equal(D.evaluateAuthorityGate(Object.assign({}, base, { channel: "vigilante" }), "2026-11-24T00:00:00Z").decision, "DENY");
  assert.equal(D.evaluateAuthorityGate(Object.assign({}, base, { attributionProb: 0.60 }), "2026-11-24T00:00:00Z").decision, "DENY");
});

test("Recursive loop tightens threshold on false positive and computes Brier score", () => {
  const s0 = { threshold: 0.75, resolvedCount: 0, meanBrier: null, history: [] };
  const s1 = D.updateRecursiveState(s0, { caseId: "C1", predictedProb: 0.80, identityConfirmed: false, damagesHalted: false });
  assert.equal(s1.threshold, 0.80);
  assert.equal(s1.meanBrier, 0.64);
  const s2 = D.updateRecursiveState(s1, { caseId: "C2", predictedProb: 0.90, identityConfirmed: true, damagesHalted: true });
  assert.equal(s2.threshold, 0.79);
  assert.equal(s2.resolvedCount, 2);
});

test("No em dashes in shipped files", () => {
  ["deterrence.js", "index.html", "test.js"].forEach(f => {
    const txt = fs.readFileSync(path.join(__dirname, f), "utf8");
    assert.equal(txt.indexOf("\u2014"), -1, f + " contains an em dash");
  });
});
