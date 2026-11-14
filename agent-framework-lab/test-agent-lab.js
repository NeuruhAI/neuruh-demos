/* Node tests for the A.G.E.N.T. Framework Lab.
   Run: node test-agent-lab.js
   No em dashes anywhere in this file. */
var crypto = require("crypto");
var lab = require("./app.js");

var passed = 0;
var failed = 0;
function check(name, cond, extra) {
  if (cond) { passed += 1; console.log("PASS: " + name); }
  else { failed += 1; console.log("FAIL: " + name + (extra ? " (" + extra + ")" : "")); }
}
function approx(a, b) { return Math.abs(a - b) < 1e-9; }

function sha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/* --- Stated data shape --- */
check("five letters", lab.LETTERS.length === 5);
check("letter A is Auto-bundled", lab.LETTERS[0].letter === "A" && lab.LETTERS[0].name === "Auto-bundled");
check("letter N alt is Niche-Tuned", lab.LETTERS[3].alt === "Niche-Tuned");
check("letter T alt is Tools-for-growth", lab.LETTERS[4].alt === "Tools-for-growth");
check("seven stack components", lab.COMPONENTS.length === 7);
check("six sample verticals", lab.VERTICALS.length === 6);
check("verticals include HVAC and Defense", lab.VERTICALS.indexOf("HVAC") !== -1 && lab.VERTICALS.indexOf("Defense") !== -1);
check("five AaaS parts", lab.AAAS_PARTS.length === 5);

/* --- Worked case 1: full stack, HVAC --- */
var all = lab.COMPONENTS.map(function (c) { return c.id; });
var c1 = lab.letterChecks(all, "HVAC");
check("case 1: all five letters PASS", c1.every(function (x) { return x.status === "PASS"; }));
check("case 1: A is 1", approx(c1[0].score, 1));
check("case 1: G is 1", approx(c1[1].score, 1));
check("case 1: E is 1", approx(c1[2].score, 1));
check("case 1: N is 1", approx(c1[3].score, 1));
check("case 1: T is 1", approx(c1[4].score, 1));
var r1 = lab.bundleScore(c1);
check("case 1: 100 percent", approx(r1.percent, 100));
check("case 1: verdict Complete stack", r1.verdict === "Complete stack");

/* --- Worked case 2: minimal, Real Estate, GPT + memory only --- */
var c2 = lab.letterChecks(["gpt", "memory"], "Real Estate");
check("case 2: A is 2/7", approx(c2[0].score, 2 / 7));
check("case 2: G is 1", approx(c2[1].score, 1));
check("case 2: E is 0", approx(c2[2].score, 0));
check("case 2: N is 1", approx(c2[3].score, 1));
check("case 2: T is 0", approx(c2[4].score, 0));
check("case 2: A FAIL, G PASS, E FAIL", c2[0].status === "FAIL" && c2[1].status === "PASS" && c2[2].status === "FAIL");
var r2 = lab.bundleScore(c2);
check("case 2: 45.7 percent", approx(r2.percent, 45.7), "got " + r2.percent);
check("case 2: verdict Not execution-ready", r2.verdict === "Not execution-ready");

/* --- Worked case 3: partial, HVAC, gpt + memory + crm + email --- */
var c3 = lab.letterChecks(["gpt", "memory", "crm", "email"], "HVAC");
check("case 3: A is 4/7", approx(c3[0].score, 4 / 7));
check("case 3: G is 1", approx(c3[1].score, 1));
check("case 3: E is 1/3", approx(c3[2].score, 1 / 3));
check("case 3: N is 1", approx(c3[3].score, 1));
check("case 3: T is 2/3", approx(c3[4].score, 2 / 3));
check("case 3: A PARTIAL, E FAIL, T PARTIAL", c3[0].status === "PARTIAL" && c3[2].status === "FAIL" && c3[4].status === "PARTIAL");
var r3 = lab.bundleScore(c3);
check("case 3: 71.4 percent", approx(r3.percent, 71.4), "got " + r3.percent);
check("case 3: verdict Shippable with gaps", r3.verdict === "Shippable with gaps");

/* --- Worked case 4: full stack but no vertical picked --- */
var c4 = lab.letterChecks(all, null);
check("case 4: N is 0 without a vertical", approx(c4[3].score, 0));
check("case 4: N FAIL", c4[3].status === "FAIL");
var r4 = lab.bundleScore(c4);
check("case 4: 80 percent", approx(r4.percent, 80));
check("case 4: verdict Shippable with gaps", r4.verdict === "Shippable with gaps");

/* --- Worked case 5: empty selection, no vertical --- */
var c5 = lab.letterChecks([], null);
check("case 5: all letters 0", c5.every(function (x) { return x.score === 0; }));
var r5 = lab.bundleScore(c5);
check("case 5: 0 percent", approx(r5.percent, 0));
check("case 5: verdict Not execution-ready", r5.verdict === "Not execution-ready");

/* --- Worked case 6: G half credit, one generative part --- */
var c6 = lab.letterChecks(["gpt"], "Creative");
check("case 6: G is 0.5 with one generative part", approx(c6[1].score, 0.5));
check("case 6: G PARTIAL", c6[1].status === "PARTIAL");

/* --- Edge cases --- */
var rEmpty = lab.bundleScore([]);
check("empty checks returns error", !!rEmpty.error);
var cUnknown = lab.letterChecks(all, "Not A Vertical");
check("unknown vertical scores N 0", approx(cUnknown[3].score, 0));

/* --- Canonical JSON --- */
var canon = lab.canonicalStringify({ b: 1, a: { d: 4, c: 3 }, e: [3, 2, 1] });
check("canonical JSON sorts keys", canon === '{"a":{"c":3,"d":4},"b":1,"e":[3,2,1]}', canon);
check("canonical JSON keeps array order", lab.canonicalStringify([3, 2, 1]) === "[3,2,1]");

/* --- SHA-256 known vector --- */
check("sha256 empty string vector", sha256Hex("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

/* --- Receipt hashing and chaining --- */
var receipt1 = lab.buildReceiptObject("agent-receipt-1", "HVAC", all, c1, r1, "GENESIS", "2026-11-14T00:00:00.000Z");
check("receipt 1 prev is GENESIS", receipt1.prev_hash === "GENESIS");
check("receipt 1 format is receipt-v1.0", receipt1.format === "receipt-v1.0");
check("receipt 1 flagged simulation", receipt1.simulation === true);
check("receipt 1 tier states UNKNOWN", receipt1.framework_tier.indexOf("UNKNOWN") === 0);
receipt1.hash = sha256Hex(lab.canonicalStringify(lab.stripHash(receipt1)));
check("receipt 1 hash is 64 hex", /^[0-9a-f]{64}$/.test(receipt1.hash));
var recompute1 = sha256Hex(lab.canonicalStringify(lab.stripHash(receipt1)));
check("receipt 1 recompute matches stored hash", recompute1 === receipt1.hash);

var receipt2 = lab.buildReceiptObject("agent-receipt-2", "Real Estate", ["gpt", "memory"], c2, r2, receipt1.hash, "2026-11-14T00:01:00.000Z");
check("receipt 2 chains to receipt 1 hash", receipt2.prev_hash === receipt1.hash);
receipt2.hash = sha256Hex(lab.canonicalStringify(lab.stripHash(receipt2)));
check("receipt 2 hash differs from receipt 1", receipt2.hash !== receipt1.hash);
check("receipt 2 recompute matches", sha256Hex(lab.canonicalStringify(lab.stripHash(receipt2))) === receipt2.hash);

/* --- Tamper detection --- */
var tampered = JSON.parse(JSON.stringify(receipt1));
tampered.result.percent = 0;
var tamperedHash = sha256Hex(lab.canonicalStringify(lab.stripHash(tampered)));
check("tampered receipt hash differs (tamper detected)", tamperedHash !== receipt1.hash);
var tampered2 = JSON.parse(JSON.stringify(receipt2));
tampered2.input.vertical = "Defense";
check("tampered input hash differs", sha256Hex(lab.canonicalStringify(lab.stripHash(tampered2))) !== receipt2.hash);
check("stripHash removes hash field", lab.stripHash(receipt1).hash === undefined);
check("stripHash keeps other fields", lab.stripHash(receipt1).id === "agent-receipt-1");

console.log("\n" + passed + " passed, " + failed + " failed.");
process.exit(failed === 0 ? 0 : 1);
