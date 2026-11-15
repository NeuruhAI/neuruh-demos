#!/usr/bin/env node
/* Neuruh On-Chain Anchor v2 — page jsdom test.
   Loads the built index.html + verify.js with the manifest injected via
   window.__MANIFEST__ (the same hook the page uses for testing), stubs
   fetch to simulate offline (the page must degrade gracefully), and checks:
   1. Roots recompute and match (full, estate, embedded estate).
   2. The chain badge reads CHAIN VALID (recomputed).
   3. The manifest table renders all leaves with HEURISTIC badges on the
      keyword-bank demos.
   4. Verify membership by URL (VERIFIED) and by a bogus hash (NOT FOUND).
   5. The tamper demo changes the root.
   6. Receipts are canonical v1.1, chain, and verify; a tampered receipt
      is rejected.
   7. The receipt-chain verifier UI accepts a JSONL chain and reports VALID.
   Usage: NODE_PATH=~/workspace/your_files/repo-tiers/node_modules node test-page.js
*/
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { webcrypto } = require("crypto");

const DIR = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "manifest-v2.json"), "utf8"));
let html = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const verifyJs = fs.readFileSync(path.join(DIR, "verify.js"), "utf8");
html = html.replace('<script src="verify.js"></script>',
  "<script>\n" + verifyJs.replace(/<\/script>/g, "<\\/script>") + "\n</script>");

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: detail || "" });
  console.log((ok ? "PASS  " : "FAIL  ") + name + (detail ? "  " + detail : ""));
}

(async () => {
  const dom = new JSDOM(html, {
    url: "https://neuruhai.github.io/neuruh-demos/onchain-anchor/",
    runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(window) {
      Object.defineProperty(window, "crypto", { value: webcrypto, configurable: true });
      window.__MANIFEST__ = manifest;
      // Offline: every fetch fails; the page must degrade gracefully.
      window.fetch = () => Promise.reject(new Error("offline (test stub)"));
      window.alert = () => {};
      window.print = () => {};
    },
  });
  const { window } = dom;
  const { document } = window;
  // Wait for init() to finish (it sets window.__ready).
  for (let i = 0; i < 200 && !window.__ready; i++) await new Promise((r) => setTimeout(r, 50));
  if (!window.__ready) { check("page init completes", false, "window.__ready never set"); process.exit(1); }
  check("page init completes", true);

  const AV = window.AnchorVerify;
  // 1. Roots recompute and match.
  const rootText = document.getElementById("rootOut").textContent.trim();
  check("full root shown == published root", rootText === manifest.merkle_root, rootText.slice(0, 16));
  const estateText = document.getElementById("estateRoot").textContent.trim();
  check("embedded estate root == published estate root", estateText === manifest.estate_root, estateText.slice(0, 16));
  const panelClass = document.getElementById("rootPanel").className;
  check("root panel marked good", /good/.test(panelClass), panelClass);
  // 2. Chain badge.
  const badge = document.getElementById("chainBadge").textContent;
  check("chain badge reads CHAIN VALID (recomputed)", badge === "CHAIN VALID (recomputed)", badge);
  // 3. Manifest table.
  const rows = document.querySelectorAll("#manifestBody tr").length;
  check("manifest table renders all leaves", rows === manifest.leaf_count, rows + " rows, " + manifest.leaf_count + " leaves");
  const heu = document.querySelectorAll("#manifestBody .badge.heuristic").length;
  check("HEURISTIC badges on the keyword-bank demos", heu === manifest.heuristic.length,
    heu + " badges, " + manifest.heuristic.length + " in the manifest: " + manifest.heuristic.join(", "));
  const counts = document.getElementById("fullLeafCount").textContent;
  check("leaf count line present", new RegExp(manifest.leaf_count + " leaves total").test(counts), counts);
  // 4. Verify membership by URL, then a bogus hash.
  const input = document.getElementById("verifyInput");
  input.value = "https://neuruhai.github.io/neuruh-demos/unified-chain/";
  await window.verifyInput();
  const out1 = document.getElementById("verifyOut").textContent;
  check("verify by URL: MEMBERSHIP VERIFIED", /MEMBERSHIP VERIFIED/.test(out1), out1.slice(0, 60));
  input.value = "0".repeat(64);
  await window.verifyInput();
  const out2 = document.getElementById("verifyOut").textContent;
  check("verify bogus hash: NOT FOUND", /NOT FOUND/.test(out2), out2.slice(0, 60));
  // 5. Tamper demo.
  await window.tamperDemo();
  const out3 = document.getElementById("tamperOut").textContent;
  check("tamper demo detects the flipped bit", /TAMPER DETECTED/.test(out3), out3.slice(0, 60));
  // 6. Receipts: canonical v1.1, chained, verify; tamper one.
  const receipts = window.RECEIPTS || [];
  check("receipts were issued", receipts.length >= 3, receipts.length + " receipts");
  const v = await AV.verifyReceiptChain(receipts);
  check("page receipt chain verifies (v1.1)", v.ok, v.error || (v.count + " receipts"));
  const allV11 = receipts.every((r) => r.receipt_version === "1.1" && r.receipt_id === r.receipt_hash && r.merkle_root === manifest.merkle_root);
  check("receipts carry v1.1, receipt_id == receipt_hash, merkle_root", allV11);
  const bad = JSON.parse(JSON.stringify(receipts));
  if (bad.length > 1) bad[1].payload = { kind: "tampered" };
  const vBad = await AV.verifyReceiptChain(bad);
  check("tampered receipt chain rejected", !vBad.ok, vBad.error || "");
  // 7. Receipt-chain verifier UI (paste a JSONL chain).
  document.getElementById("chainInput").value = receipts.map((r) => JSON.stringify(r)).join("\n");
  await window.verifyChainLog();
  const out7 = document.getElementById("chainOut").textContent;
  check("receipt-chain verifier UI reports CHAIN VALID", /CHAIN VALID/.test(out7), out7.slice(0, 60));
  document.getElementById("chainInput").value = receipts.map((r) => JSON.stringify(r)).join("\n").replace("VERIFIED", "FORGED");
  await window.verifyChainLog();
  const out8 = document.getElementById("chainOut").textContent;
  check("receipt-chain verifier UI reports CHAIN BROKEN on a forged chain", /CHAIN BROKEN/.test(out8), out8.slice(0, 60));

  const failed = results.filter((r) => !r.ok);
  console.log("\npage jsdom test: " + (results.length - failed.length) + "/" + results.length + " pass");
  if (failed.length) { console.log("FAILED: " + failed.map((f) => f.name).join("; ")); process.exit(1); }
  console.log("PAGE TEST PASS");
  process.exit(0);
})().catch((e) => { console.error("page test error:", e); process.exit(2); });
