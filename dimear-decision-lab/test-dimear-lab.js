/* Node test for the DIMEA 2.0 Decision Lab (app.js pure logic).
   Run: node test-dimear-lab.js
   Verifies scoring, ranking, canonical JSON, and receipt hashing
   against Node crypto (the browser uses Web Crypto for the same SHA-256). */
const crypto = require("crypto");
const L = require("./app.js");

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log("PASS: " + name); }
  else { failed++; console.log("FAIL: " + name + (extra ? " -- " + extra : "")); }
}
function approx(a, b) { return Math.abs(a - b) < 1e-9; }

// Worked case 1: equal weights, DeedSonar-style scores.
// sell [6,5,7,6,6] = 30/5 = 6.0 ; keep [8,9,8,7,7] = 39/5 = 7.8
const w1 = { desire: 1, identity: 1, mission: 1, expression: 1, alignment: 1 };
const r1a = L.scoreOption({ desire: 6, identity: 5, mission: 7, expression: 6, alignment: 6 }, w1);
const r1b = L.scoreOption({ desire: 8, identity: 9, mission: 8, expression: 7, alignment: 7 }, w1);
check("case1 sell score 6.0", approx(r1a.score, 6.0), "got " + r1a.score);
check("case1 keep score 7.8", approx(r1b.score, 7.8), "got " + r1b.score);
check("case1 numerator/denominator", r1b.numerator === 39 && r1b.denominator === 5);
const rank1 = L.rankOptions([{ option: "sell", score: r1a.score }, { option: "keep", score: r1b.score }]);
check("case1 ranking keep first", rank1[0].option === "keep" && rank1[1].option === "sell");
check("case1 no tie", rank1[0].tie === false && rank1[1].tie === false);

// Worked case 2: weighted. weights [2,1,1,1,1], scores [10,0,0,0,0] => 20/6 = 3.333...
const w2 = { desire: 2, identity: 1, mission: 1, expression: 1, alignment: 1 };
const r2 = L.scoreOption({ desire: 10, identity: 0, mission: 0, expression: 0, alignment: 0 }, w2);
check("case2 weighted score 20/6", approx(r2.score, 20 / 6), "got " + r2.score);
check("case2 terms", r2.terms[0].product === 20 && r2.terms[1].product === 0);

// Worked case 3: tie. Both options 5.0; both flagged tie, input order kept.
const r3a = L.scoreOption({ desire: 5, identity: 5, mission: 5, expression: 5, alignment: 5 }, w1);
const r3b = L.scoreOption({ desire: 4, identity: 6, mission: 5, expression: 5, alignment: 5 }, w1);
const rank3 = L.rankOptions([{ option: "a", score: r3a.score }, { option: "b", score: r3b.score }]);
check("case3 both 5.0", approx(r3a.score, 5.0) && approx(r3b.score, 5.0));
check("case3 tie flagged on both", rank3[0].tie === true && rank3[1].tie === true);
check("case3 stable order", rank3[0].option === "a");

// Worked case 4: all weights zero is refused.
const r4 = L.scoreOption({ desire: 5, identity: 5, mission: 5, expression: 5, alignment: 5 },
  { desire: 0, identity: 0, mission: 0, expression: 0, alignment: 0 });
check("case4 all-zero weights returns error", !!r4.error);

// Worked case 5: out-of-range score throws.
let threw = false;
try { L.scoreOption({ desire: 11, identity: 5, mission: 5, expression: 5, alignment: 5 }, w1); } catch (e) { threw = true; }
check("case5 score 11 throws", threw);

// Canonical JSON: keys sorted, nested, arrays in order.
const canon = L.canonicalStringify({ b: 1, a: { d: 4, c: 3 }, e: [3, 2, 1] });
check("canonical JSON sorted", canon === '{"a":{"c":3,"d":4},"b":1,"e":[3,2,1]}', "got " + canon);

// Receipt hashing: build a receipt, hash canonical JSON minus hash field
// with Node crypto, verify stripHash removes only the hash field, and
// verify the chain (second receipt prev_hash equals first receipt hash).
function sha256(str) { return crypto.createHash("sha256").update(str, "utf8").digest("hex"); }
const receipt1 = L.buildReceiptObject("dimear-20261114-0001", "deedsonar-sale",
  { sell: { desire: 6, identity: 5, mission: 7, expression: 6, alignment: 6 } },
  w1, { sell: { weighted_score: 6 } },
  [{ rank: 1, option: "sell", score: 6, tie: false }], "GENESIS", "2026-11-14T00:00:00.000Z");
receipt1.hash = sha256(L.canonicalStringify(L.stripHash(receipt1)));
check("receipt1 prev GENESIS", receipt1.prev_hash === "GENESIS");
check("receipt1 hash is 64 hex", /^[0-9a-f]{64}$/.test(receipt1.hash));
check("receipt1 recompute matches", sha256(L.canonicalStringify(L.stripHash(receipt1))) === receipt1.hash);
check("stripHash keeps other fields", L.stripHash(receipt1).id === "dimear-20261114-0001" && !("hash" in L.stripHash(receipt1)));
const receipt2 = L.buildReceiptObject("dimear-20261114-0002", "llc-filing", {}, w1, {}, [], receipt1.hash, "2026-11-14T00:01:00.000Z");
receipt2.hash = sha256(L.canonicalStringify(L.stripHash(receipt2)));
check("receipt2 chains to receipt1", receipt2.prev_hash === receipt1.hash);
check("receipt2 recompute matches", sha256(L.canonicalStringify(L.stripHash(receipt2))) === receipt2.hash);
check("receipt hashes differ", receipt1.hash !== receipt2.hash);

// Known SHA-256 sanity vector via the same canonical path.
check("sha256 empty string vector", sha256("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

console.log("\n" + passed + " passed, " + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
