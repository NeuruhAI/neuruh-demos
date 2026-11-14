/* PMLA Memory Loop Lab: Node tests.
 * Loads the SHIPPED pmla-loop.js directly and exercises its real functions.
 * Node crypto is the independent check on the browser Web Crypto path:
 * same canonical string, same SHA-256, three independent implementations
 * (pure-JS in the shipped file, Web Crypto in the browser, node crypto here)
 * must agree.
 *
 * Run: node test.js   (exit 0 = all pass)
 */
"use strict";
var crypto = require("crypto");
var PmlaLoop = require("./pmla-loop.js");

var passed = 0;
var failed = 0;
var failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log("PASS: " + name);
  } else {
    failed += 1;
    failures.push(name + (detail ? " -- " + detail : ""));
    console.log("FAIL: " + name + (detail ? " -- " + detail : ""));
  }
}

function approx(a, b, eps) {
  return Math.abs(a - b) <= (eps || 1e-9);
}

function nodeSha256Hex(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function goodGate(evidence, contradiction) {
  return {
    memoryClass: "Semantic",
    source: "PMLA Memory Loop Lab (test)",
    freshness: "Days",
    evidence: evidence,
    contradiction: contradiction || "none",
    relevanceHorizon: "7 days (lead preset)",
    kind: "Fact",
    mutability: "Editable current state"
  };
}

var LIB1 = PmlaLoop.libraryPrompt("L1").text;

/* ============ A. Receipt hashing (worked cases) ============ */

/* A1. NIST vector: sha256("abc"). */
check("A1 sha256 abc NIST vector",
  PmlaLoop.sha256("abc") === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "got " + PmlaLoop.sha256("abc"));

/* A2. NIST vector: sha256(""). */
check("A2 sha256 empty NIST vector",
  PmlaLoop.sha256("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "got " + PmlaLoop.sha256(""));

/* A3. Third vector, cross-checked against node crypto (not hard-coded). */
var third = "PMLA prompt-as-memory loop";
check("A3 sha256 long string agrees with node crypto",
  PmlaLoop.hashStr(third) === nodeSha256Hex(third),
  "shipped " + PmlaLoop.hashStr(third) + " node " + nodeSha256Hex(third));

/* A4. Canonical JSON sorts keys and keeps array order. */
check("A4 canonical sorts keys, keeps array order",
  PmlaLoop.canonical({ b: 1, a: [3, 2, 1] }) === '{"a":[3,2,1],"b":1}',
  "got " + PmlaLoop.canonical({ b: 1, a: [3, 2, 1] }));

/* A5. Receipt 1: prev GENESIS, hash matches node crypto recompute. */
var r1 = PmlaLoop.buildReceipt({
  type: "pmla-memory-loop", seq: 1,
  payload: { turn: 1, prompt: LIB1, gate_verdict: "WRITE", stored: true },
  prevHash: "GENESIS", timestamp_utc: "2026-11-14T03:00:00.000Z"
});
var r1copy = JSON.parse(JSON.stringify(r1));
delete r1copy.provenance.report_hash_sha256;
check("A5 receipt 1 prev is GENESIS and hash matches node crypto",
  r1.provenance.prev_receipt_hash === "GENESIS" &&
  r1.provenance.report_hash_sha256 === nodeSha256Hex(PmlaLoop.canonical(r1copy)),
  "hash " + r1.provenance.report_hash_sha256);

/* A6. Receipt 2 chains to receipt 1 and verifies. */
var r2 = PmlaLoop.buildReceipt({
  type: "pmla-memory-loop", seq: 2,
  payload: { turn: 2, prompt: "refined", gate_verdict: "WRITE", stored: true },
  prevHash: r1.provenance.report_hash_sha256, timestamp_utc: "2026-11-14T03:01:00.000Z"
});
check("A6 receipt 2 chains to receipt 1 and verifyChain passes",
  r2.provenance.prev_receipt_hash === r1.provenance.report_hash_sha256 &&
  PmlaLoop.verifyChain([r1, r2]).ok === true,
  JSON.stringify(PmlaLoop.verifyChain([r1, r2])));

/* A7. Tampered payload fails verification (hash, not link). */
var r1tampered = JSON.parse(JSON.stringify(r1));
r1tampered.payload.gate_verdict = "REJECT";
check("A7 tampered receipt fails verifyReceipt",
  PmlaLoop.verifyReceipt(r1tampered).ok === false,
  JSON.stringify(PmlaLoop.verifyReceipt(r1tampered)));

/* A8. Broken prev link fails chain verification. */
var r2broken = JSON.parse(JSON.stringify(r2));
r2broken.provenance.prev_receipt_hash = "GENESIS";
check("A8 broken prev link fails verifyChain",
  PmlaLoop.verifyChain([r1, r2broken]).ok === false,
  JSON.stringify(PmlaLoop.verifyChain([r1, r2broken])));

/* ============ B. Decay math (worked cases) ============ */

/* B1. F(0, h) = 1 at every preset. */
var b1ok = Object.keys(PmlaLoop.DECAY_PRESETS).every(function (k) {
  return PmlaLoop.decayWithPreset(0, k) === 1;
});
check("B1 F(0) = 1 at all five presets", b1ok);

/* B2. F(h) = 0.5 at every preset (t equals the half-life). */
var b2ok = Object.keys(PmlaLoop.DECAY_PRESETS).every(function (k) {
  var h = PmlaLoop.DECAY_PRESETS[k].halfLifeDays;
  return approx(PmlaLoop.decayWithPreset(h, k), 0.5, 1e-9);
});
check("B2 F(h) = 0.5 at all five presets", b2ok);

/* B3. Lead preset: t=7d gives 0.5, t=14d gives 0.25. */
check("B3 lead preset F(7)=0.5 and F(14)=0.25",
  approx(PmlaLoop.decayWithPreset(7, "lead"), 0.5, 1e-9) &&
  approx(PmlaLoop.decayWithPreset(14, "lead"), 0.25, 1e-9),
  "F(7)=" + PmlaLoop.decayWithPreset(7, "lead") + " F(14)=" + PmlaLoop.decayWithPreset(14, "lead"));

/* B4. Runtime preset: t=0.0167d gives 0.5 (minutes-scale half-life). */
check("B4 runtime preset F(0.0167)=0.5",
  approx(PmlaLoop.decayWithPreset(0.0167, "runtime"), 0.5, 1e-9),
  "got " + PmlaLoop.decayWithPreset(0.0167, "runtime"));

/* B5. Historical preset: t=365d gives 0.5, t=730d gives 0.25. */
check("B5 historical preset F(365)=0.5 and F(730)=0.25",
  approx(PmlaLoop.decayWithPreset(365, "historical"), 0.5, 1e-9) &&
  approx(PmlaLoop.decayWithPreset(730, "historical"), 0.25, 1e-9),
  "F(365)=" + PmlaLoop.decayWithPreset(365, "historical"));

/* B6. Strategy preset: t=30d gives 0.5; repo preset: t=1d gives 0.25. */
check("B6 strategy F(30)=0.5 and repo F(1)=0.25",
  approx(PmlaLoop.decayWithPreset(30, "strategy"), 0.5, 1e-9) &&
  approx(PmlaLoop.decayWithPreset(1, "repo"), 0.25, 1e-9),
  "strategy=" + PmlaLoop.decayWithPreset(30, "strategy") + " repo=" + PmlaLoop.decayWithPreset(1, "repo"));

/* B7. decaySteps breakdown: exponent and percent agree with decay(). */
var steps = PmlaLoop.decaySteps(7, "lead");
check("B7 decaySteps lead t=7: exponent -1, f 0.5, 50 percent, 5 table rows",
  approx(steps.exponent, -1, 1e-9) && approx(steps.f, 0.5, 1e-9) &&
  approx(steps.percent, 50, 1e-9) && steps.table.length === 5 &&
  approx(steps.table[2].f, 0.5, 1e-9),
  JSON.stringify(steps));

/* B8. Error cases: negative t, zero h, unknown preset all throw. */
var b8 = 0;
try { PmlaLoop.decay(-1, 7); } catch (e) { b8 += 1; }
try { PmlaLoop.decay(1, 0); } catch (e) { b8 += 1; }
try { PmlaLoop.decayWithPreset(1, "nope"); } catch (e) { b8 += 1; }
try { PmlaLoop.decaySteps(1, "nope"); } catch (e) { b8 += 1; }
check("B8 decay error cases all throw (negative t, zero h, unknown preset x2)", b8 === 4, "threw " + b8 + " of 4");

/* ============ C. Loop logic (worked cases) ============ */

/* C1. Evidence 7, no contradiction: WRITE, stored, store count 1. */
var s1 = PmlaLoop.createStore();
var t1 = PmlaLoop.runTurn(s1, { prompt: LIB1, gate: goodGate(7) });
check("C1 ev 7 writes and stores (count 1)",
  t1.gate.verdict === "WRITE" && t1.stored === true && t1.storeCount === 1 &&
  t1.receiptId === "pmla-20261114-0001",
  "verdict " + t1.gate.verdict + " stored " + t1.stored + " count " + t1.storeCount);

/* C2. Evidence 2: REJECT, not stored, count stays 0. */
var s2 = PmlaLoop.createStore();
var t2 = PmlaLoop.runTurn(s2, { prompt: LIB1, gate: goodGate(2) });
check("C2 ev 2 rejects and does not store",
  t2.gate.verdict === "REJECT" && t2.stored === false && t2.storeCount === 0,
  "verdict " + t2.gate.verdict + " count " + t2.storeCount);

/* C3. Evidence 4: QUARANTINE, not stored. */
var s3 = PmlaLoop.createStore();
var t3 = PmlaLoop.runTurn(s3, { prompt: LIB1, gate: goodGate(4) });
check("C3 ev 4 quarantines and does not store",
  t3.gate.verdict === "QUARANTINE" && t3.stored === false && t3.storeCount === 0,
  "verdict " + t3.gate.verdict);

/* C4. Evidence 9 with contradicts: QUARANTINE even at high evidence, not stored. */
var s4 = PmlaLoop.createStore();
var t4 = PmlaLoop.runTurn(s4, { prompt: LIB1, gate: goodGate(9, "contradicts") });
check("C4 ev 9 plus contradicts quarantines and does not store",
  t4.gate.verdict === "QUARANTINE" && t4.stored === false && t4.storeCount === 0,
  "verdict " + t4.gate.verdict);

/* C5. Invalid gate input (bad class) rejects. */
var s5 = PmlaLoop.createStore();
var badGate = goodGate(7);
badGate.memoryClass = "NotAClass";
var t5 = PmlaLoop.runTurn(s5, { prompt: LIB1, gate: badGate });
check("C5 invalid gate input rejects and does not store",
  t5.gate.verdict === "REJECT" && t5.stored === false && t5.storeCount === 0,
  "verdict " + t5.gate.verdict);

/* C6. Boundary: ev 3 writes the low side of quarantine (not reject); ev 6 writes. */
var s6 = PmlaLoop.createStore();
var t6a = PmlaLoop.runTurn(s6, { prompt: LIB1, gate: goodGate(3) });
var t6b = PmlaLoop.runTurn(s6, { prompt: LIB1, gate: goodGate(6) });
check("C6 boundaries: ev 3 quarantines, ev 6 writes",
  t6a.gate.verdict === "QUARANTINE" && t6b.gate.verdict === "WRITE",
  "ev3 " + t6a.gate.verdict + " ev6 " + t6b.gate.verdict);

/* C7. Recall: second turn recalls the first turn prompt; store holds both. */
var s7 = PmlaLoop.createStore();
var r7a = PmlaLoop.runTurn(s7, { prompt: LIB1, gate: goodGate(7) });
var refined = LIB1.replace("No prior turns stored in this session.", "Recalled turn 1 prompt and refined it.");
var r7b = PmlaLoop.runTurn(s7, { prompt: refined, gate: goodGate(8) });
check("C7 turn 2 recalls turn 1 prompt, both stored, chain verifies",
  r7b.recalledAtStart !== null && r7b.recalledAtStart.turn === 1 &&
  r7b.recalledAtStart.prompt === LIB1 && r7b.storeCount === 2 &&
  PmlaLoop.verifyChain(s7.receipts).ok === true,
  "recalled turn " + (r7b.recalledAtStart && r7b.recalledAtStart.turn) + " count " + r7b.storeCount);

/* C8. First turn recalls nothing; supersede stores and keeps history. */
var s8 = PmlaLoop.createStore();
var r8a = PmlaLoop.runTurn(s8, { prompt: LIB1, gate: goodGate(7) });
var supGate = goodGate(8, "supersedes");
var r8b = PmlaLoop.runTurn(s8, { prompt: refined, gate: supGate });
check("C8 first turn recalls nothing; supersede stores, history keeps 2 entries",
  r8a.recalledAtStart === null && r8b.gate.verdict === "WRITE" &&
  r8b.stored === true && s8.entries.length === 2 &&
  s8.entries[0].prompt === LIB1,
  "first recalled " + JSON.stringify(r8a.recalledAtStart) + " entries " + s8.entries.length);

/* C9. Receipt per turn: REJECT turn still seals a chained receipt. */
var s9 = PmlaLoop.createStore();
var r9a = PmlaLoop.runTurn(s9, { prompt: LIB1, gate: goodGate(2) });
var r9b = PmlaLoop.runTurn(s9, { prompt: LIB1, gate: goodGate(7) });
check("C9 reject turn seals a receipt; chain of 2 verifies with GENESIS first",
  s9.receipts.length === 2 &&
  s9.receipts[0].provenance.prev_receipt_hash === "GENESIS" &&
  s9.receipts[1].provenance.prev_receipt_hash === s9.receipts[0].provenance.report_hash_sha256 &&
  PmlaLoop.verifyChain(s9.receipts).ok === true &&
  r9a.receiptId === "pmla-20261114-0001" && r9b.receiptId === "pmla-20261114-0002",
  "receipts " + s9.receipts.length);

/* C10. 5-block parsing: library prompt parses to all five blocks; unstructured text reports missing. */
var parsed = PmlaLoop.parseBlocks(LIB1);
var plain = PmlaLoop.parseBlocks("just some words, no headings");
check("C10 library prompt parses to 5 blocks; unstructured text reports all missing",
  parsed.structured === true && parsed.found.length === 5 &&
  plain.hasHeadings === false && plain.missing.length === 5,
  "found " + parsed.found.length + " missing " + plain.missing.length);

/* C11. Library: all four entries build, each Context carries its cited bank fact verbatim. */
var libOk = ["L1", "L2", "L3", "L4"].every(function (id) {
  var lib = PmlaLoop.libraryPrompt(id);
  if (!lib) return false;
  var p = PmlaLoop.parseBlocks(lib.text);
  return p.blocks.Context === lib.fact && p.structured === true;
});
check("C11 all four library prompts build with verbatim cited facts in Context", libOk);

/* C12. Store reset: a fresh store is empty with turn 0. */
var s12 = PmlaLoop.createStore();
PmlaLoop.runTurn(s12, { prompt: LIB1, gate: goodGate(7) });
var s12fresh = PmlaLoop.createStore();
check("C12 fresh store is empty, turn 0, no receipts",
  s12fresh.turn === 0 && s12fresh.entries.length === 0 && s12fresh.receipts.length === 0 &&
  PmlaLoop.storeState(s12fresh) === "STORE: empty, 0 written",
  PmlaLoop.storeState(s12fresh));

/* ============ Summary ============ */
console.log("\n" + passed + " passed, " + failed + " failed.");
if (failed > 0) {
  console.log("Failures:\n" + failures.join("\n"));
  process.exit(1);
}
