/* Node test for the NCP Lab (app.js pure logic).
   Run: node test-ncp-lab.js
   Verifies routing, heat thresholds, conditional shortcuts, the bypass
   calculator, canonical JSON, and receipt hashing and chaining against
   Node crypto (the browser uses Web Crypto for the same SHA-256). */
const crypto = require("crypto");
const L = require("./app.js");

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log("PASS: " + name); }
  else { failed++; console.log("FAIL: " + name + (extra ? " -- " + extra : "")); }
}
function approx(a, b) { return Math.abs(a - b) < 1e-9; }
function sha256Hex(str) { return crypto.createHash("sha256").update(str, "utf8").digest("hex"); }

/* --- Stated constants --- */
check("stated AtomicNode count 1890", L.SOURCE_ATOMIC_NODE_COUNT === 1890);
check("stated bypass claim 98", L.SOURCE_BYPASS_PCT === 98);
check("pin threshold 3.0", approx(L.PIN_THRESHOLD, 3.0));
check("organ threshold 6.0", approx(L.ORGAN_THRESHOLD, 6.0));
check("model has 24 nodes", L.makeNodeModel().length === 24);
check("Phase 2 has 4 modules", L.PHASE2_MODULES.length === 4);
check("Phase 2 modules named", L.PHASE2_MODULES.map(function (m) { return m.name; }).join(",") === "PHALANX,SYMBIOTE,UIR,Firecracker Micro-VMs");
check("Phase 2 all specced not compiled", L.PHASE2_MODULES.every(function (m) { return m.state === "SPECCED, not compiled"; }));

/* --- FNV-1a worked cases (values computed by this same code, recorded here) --- */
check("fnv empty string is offset basis", L.fnv1a("") === 2166136261);
check("fnv score this parcel", L.fnv1a("score this parcel") === 425963832);
check("fnv score this parcel mod 24 is 0", L.fnv1a("score this parcel") % 24 === 0);
check("fnv price_delta task", L.fnv1a("price_delta over 40% resale signal") === 887503338);
check("fnv standing cash task", L.fnv1a("standing cash buyer valuation") === 1915006164);
check("normalize collapses case and spaces", L.normalizeTask("  Score   THIS Parcel ") === "score this parcel");

/* --- Routing: first route of a new task --- */
var s1 = L.makeSession();
var r1 = L.routeTask(s1, "score this parcel");
check("route has no error", !r1.error);
check("route node is N-001", r1.node_id === "N-001");
check("route node role SIGNAL", r1.node_role === "SIGNAL");
check("first route SEL miss", r1.sel_hit === false);
check("first route no shortcut", r1.shortcut_fired === null);
check("first route not bypassed", r1.bypassed === false);
check("first route heat 0 to 1", approx(r1.heat_before, 0) && approx(r1.heat_after, 1));
check("first route not pinned", r1.pinned === false);
check("first route 8 steps", r1.steps.length === 8);
check("session routed 1", s1.routed === 1 && s1.bypassed === 0);

/* --- Routing: repeat of the same task hits the Shortcut Edge Layer --- */
var r2 = L.routeTask(s1, "score this parcel");
check("repeat route SEL hit", r2.sel_hit === true);
check("repeat route bypassed", r2.bypassed === true);
check("repeat route same node", r2.node_id === "N-001");
check("repeat route heat 1 to 2", approx(r2.heat_before, 1) && approx(r2.heat_after, 2));
check("session bypassed 1 of 2", s1.routed === 2 && s1.bypassed === 1);

/* --- Empty task refused --- */
var rEmpty = L.routeTask(L.makeSession(), "   ");
check("empty task returns error", !!rEmpty.error);

/* --- Conditional shortcuts (stated phrases) --- */
var s2 = L.makeSession();
var rc1 = L.routeTask(s2, "price_delta over 40% resale signal");
check("price_delta shortcut fires", rc1.shortcut_fired === "Resale: SIGNAL to CLOSE");
check("price_delta route bypassed", rc1.bypassed === true);
check("price_delta node N-019", rc1.node_id === "N-019");
var rc2 = L.routeTask(s2, "Standing Cash buyer valuation");
check("standing cash shortcut fires", rc2.shortcut_fired === "Real estate: VALUATION to CLOSE");
check("standing cash route bypassed", rc2.bypassed === true);
check("standing cash node N-013", rc2.node_id === "N-013");
check("no shortcut on plain task", L.findConditionalShortcut("score this parcel") === null);
check("shortcut match is case-insensitive", L.findConditionalShortcut("PRICE_DELTA OVER 40%") !== null);

/* --- Heat: pin at 3.0, organ at 6.0 with breadth, breadth bar blocks repeat-only --- */
var s3 = L.makeSession();
var pinAt = null, organAt = null;
for (var i = 0; i < 3; i++) {
  var rr = L.routeTask(s3, "score this parcel");
  if (rr.pinned_now) { pinAt = i + 1; }
}
check("pin fires on 3rd route of same node", pinAt === 3);
check("node pinned after 3 routes", s3.nodes[0].pinned === true);
check("no organ yet after 3 routes", s3.nodes[0].organ_candidate === false);
for (var j = 0; j < 3; j++) {
  var rr2 = L.routeTask(s3, "score this parcel");
  if (rr2.organ_now) { organAt = j + 1; }
}
check("same task 6 times does NOT bloom (breadth bar)", organAt === null);
check("heat 6.0 with 1 distinct task, still no organ", approx(s3.nodes[0].heat, 6.0) && s3.nodes[0].distinct_tasks.length === 1 && s3.nodes[0].organ_candidate === false);

/* A second distinct task on the same node (probe task 15 also hashes to index 0) */
var s4 = L.makeSession();
for (var k = 0; k < 3; k++) { L.routeTask(s4, "score this parcel"); }
for (var m = 0; m < 3; m++) { L.routeTask(s4, "probe task 15"); }
check("two distinct tasks on one node bloom at heat 6", s4.nodes[0].organ_candidate === true);
check("two distinct tasks recorded", s4.nodes[0].distinct_tasks.length === 2);

/* --- Bypass calculator worked cases --- */
var b1 = L.bypassCalc(10000, 98);
check("bypass 10000 at 98: 9800 avoided", b1.calls_avoided === 9800);
check("bypass 10000 at 98: 200 to LLM", b1.calls_to_llm === 200);
check("bypass 10000 at 98: 3 steps", b1.steps.length === 3);
var b2 = L.bypassCalc(1000, 50);
check("bypass 1000 at 50: 500 and 500", b2.calls_avoided === 500 && b2.calls_to_llm === 500);
var b3 = L.bypassCalc(0, 98);
check("bypass 0 calls: 0 and 0", b3.calls_avoided === 0 && b3.calls_to_llm === 0);
var b4 = L.bypassCalc(100, 100);
check("bypass 100 at 100: all avoided", b4.calls_avoided === 100 && b4.calls_to_llm === 0);
check("bypass pct 101 refused", !!L.bypassCalc(100, 101).error);
check("bypass negative calls refused", !!L.bypassCalc(-5, 98).error);
check("bypass fractional calls refused", !!L.bypassCalc(10.5, 98).error);

/* --- Canonical JSON --- */
check("canonical sorts keys", L.canonicalStringify({ b: 1, a: { d: 4, c: 3 }, e: [3, 2, 1] }) === '{"a":{"c":3,"d":4},"b":1,"e":[3,2,1]}');
check("canonical keeps array order", L.canonicalStringify({ z: [2, 1] }) === '{"z":[2,1]}');
check("stripHash removes hash only", JSON.stringify(L.stripHash({ a: 1, hash: "x" })) === '{"a":1}');

/* --- Receipt hashing, chaining, tamper detection --- */
check("SHA-256 empty vector", sha256Hex("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
var rec1 = L.buildReceiptObject("NCP-LAB-R-001", "route", "Route test", { task: "score this parcel" }, { node_id: "N-001", bypassed: false }, "GENESIS", "2026-11-14T00:00:00Z");
check("receipt 1 prev is GENESIS", rec1.prev_hash === "GENESIS");
check("receipt format v1.0", rec1.format === "receipt-v1.0");
rec1.hash = sha256Hex(L.canonicalStringify(L.stripHash(rec1)));
check("receipt 1 hash is 64 hex", /^[0-9a-f]{64}$/.test(rec1.hash));
check("receipt 1 recompute matches", sha256Hex(L.canonicalStringify(L.stripHash(rec1))) === rec1.hash);
var rec2 = L.buildReceiptObject("NCP-LAB-R-002", "bypass-calc", "Calc test", { monthly_calls: 10000, bypass_pct: 98 }, { calls_avoided: 9800, calls_to_llm: 200 }, rec1.hash, "2026-11-14T00:01:00Z");
rec2.hash = sha256Hex(L.canonicalStringify(L.stripHash(rec2)));
check("receipt 2 chains to receipt 1", rec2.prev_hash === rec1.hash);
check("receipt 2 hash differs from receipt 1", rec2.hash !== rec1.hash);
check("receipt 2 recompute matches", sha256Hex(L.canonicalStringify(L.stripHash(rec2))) === rec2.hash);
var tampered = JSON.parse(JSON.stringify(rec1));
tampered.results.bypassed = true;
check("tamper changes the hash", sha256Hex(L.canonicalStringify(L.stripHash(tampered))) !== rec1.hash);
var tampered2 = JSON.parse(JSON.stringify(rec2));
tampered2.prev_hash = "GENESIS";
check("broken chain link detected by prev mismatch", tampered2.prev_hash !== rec1.hash);

console.log("\n" + passed + " passed, " + failed + " failed.");
process.exit(failed ? 1 : 0);
