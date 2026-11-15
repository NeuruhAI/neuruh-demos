#!/usr/bin/env node
/* Neuruh On-Chain Anchor v2 — Unified Chain regression suite
   (convergence spec item 6).

   Replays the documented click sequence for the flagship Unified Chain
   (https://neuruhai.github.io/neuruh-demos/unified-chain/) and records the
   resulting receipt. The documented sequence is the doubt-removal
   browser pass (2026-11-14, batch 3 and the re-check 1 retest): load the
   page, click the worked-example preset (OPP-2026-RE-0042), click
   "Run the chain and seal the receipt" (runs all 9 stages), verify the
   sealed receipt, tamper with it and confirm TAMPERED, record an outcome
   and confirm the chained outcome receipt verifies VALID.

   Runs in jsdom (the page uses a pure-JS SHA-256, no network, no
   crypto.subtle, no alert/prompt), so it is a real execution replay, not
   a static check. Fetches the LIVE page and scripts, so a changed live
   page is what gets tested. Writes unified-chain-regression.json next to
   this script. Exit 0 only when every step passes.
   Usage: NODE_PATH=~/workspace/your_files/repo-tiers/node_modules node unified-chain-regression.js
*/
const https = require("https");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const BASE = "https://neuruhai.github.io/neuruh-demos/unified-chain/";
const OUT = path.join(__dirname, "unified-chain-regression.json");

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Neuruh-Anchor-Regression/2.0" } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(url + " -> HTTP " + res.statusCode));
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    }).on("error", reject);
  });
}

function click(doc, id) {
  const el = doc.getElementById(id);
  if (!el) throw new Error("missing control #" + id);
  el.click();
  return el;
}

(async () => {
  const steps = [];
  const fail = (name, detail) => { steps.push({ name, pass: false, detail }); };
  const pass = (name, detail) => { steps.push({ name, pass: true, detail }); };

  const html = await fetch(BASE);
  const ucJs = await fetch(BASE + "unified-chain.js");
  const appJs = await fetch(BASE + "app.js");
  // Inline the scripts (the live page loads them as separate files).
  const combined = html
    .replace('<script src="unified-chain.js">', '<script>\n' + ucJs.replace(/<\/script>/g, "<\\/script>") + "\n</script>")
    .replace('<script src="app.js">', '<script>\n' + appJs.replace(/<\/script>/g, "<\\/script>") + "\n</script>");
  const dom = new JSDOM(combined, {
    url: BASE, runScripts: "dangerously", pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document } = window;
  await new Promise((r) => {
    if (document.readyState === "complete") r();
    else window.addEventListener("load", r);
    setTimeout(r, 5000);
  });

  // 1. Page loaded and the chain entry point exists.
  if (document.getElementById("runChainBtn")) pass("page loads, run button present");
  else fail("page loads, run button present", "runChainBtn missing");

  // 2. Worked-example preset (OPP-2026-RE-0042), then run the chain.
  click(document, "presetWorked");
  const claimId = document.getElementById("claimIdOut").value;
  if (claimId.indexOf("OPP-2026-RE-0042") >= 0) pass("worked-example preset loads OPP-2026-RE-0042", claimId);
  else fail("worked-example preset loads OPP-2026-RE-0042", "claimIdOut=" + claimId);

  click(document, "runChainBtn");
  const receiptText = document.getElementById("receiptOut").textContent;
  const hashMatch = receiptText.match(/Hash:\s*([0-9a-f]{64})/);
  const seqMatch = receiptText.match(/Receipt seq (\d+) sealed/);
  let receipt = null;
  const pre = document.querySelector("#receiptOut pre");
  if (pre) { try { receipt = JSON.parse(pre.textContent); } catch (e) { /* fall through */ } }
  if (hashMatch && seqMatch && receipt) {
    pass("run seals a receipt", "seq " + seqMatch[1] + " hash " + hashMatch[1].slice(0, 12) + "...");
  } else {
    fail("run seals a receipt", "receiptOut did not contain a seq + 64-hex hash + JSON");
  }

  // 3. Verify the sealed receipt through the page's own verify flow.
  let verifyResult = null;
  if (receipt) {
    document.getElementById("verifyInput").value = JSON.stringify(receipt, null, 2);
    click(document, "verifyBtn");
    verifyResult = document.getElementById("verifyOut").textContent;
    if (/VALID/.test(verifyResult) && !/TAMPERED/.test(verifyResult)) pass("sealed receipt verifies VALID", verifyResult.trim().slice(0, 80));
    else fail("sealed receipt verifies VALID", verifyResult.trim().slice(0, 120));
  } else fail("sealed receipt verifies VALID", "no receipt to verify");

  // 4. Tamper path: the page's tamper button must report TAMPERED.
  let tamperResult = null;
  click(document, "tamperBtn");
  tamperResult = document.getElementById("verifyOut").textContent;
  if (/TAMPERED/.test(tamperResult)) pass("tamper path reports TAMPERED", tamperResult.trim().slice(0, 80));
  else fail("tamper path reports TAMPERED", tamperResult.trim().slice(0, 120));

  // 5. Record an outcome: seals its own chained receipt, chain VALID.
  let outcomeResult = null;
  document.getElementById("outcomeResult").value = "won";
  document.getElementById("outcomeNotes").value = "regression run";
  click(document, "recordOutcomeBtn");
  outcomeResult = document.getElementById("missionOut").textContent;
  if (/Chain verifies: VALID/.test(outcomeResult)) pass("outcome receipt chained, chain VALID", outcomeResult.trim().slice(0, 100));
  else fail("outcome receipt chained, chain VALID", outcomeResult.trim().slice(0, 120));

  const record = {
    suite: "unified-chain-regression",
    version: "1.0",
    page: BASE,
    run_at: new Date().toISOString(),
    claim: claimId || null,
    receipt_seq: seqMatch ? parseInt(seqMatch[1], 10) : null,
    receipt_hash: hashMatch ? hashMatch[1] : null,
    receipt: receipt || null,
    verify_result: verifyResult ? verifyResult.trim() : null,
    tamper_result: tamperResult ? tamperResult.trim() : null,
    outcome_result: outcomeResult ? outcomeResult.trim() : null,
    steps,
    pass: steps.every((s) => s.pass),
  };
  fs.writeFileSync(OUT, JSON.stringify(record, null, 2) + "\n");
  console.log("unified-chain regression: " + steps.filter((s) => s.pass).length + "/" + steps.length + " steps pass");
  steps.forEach((s) => console.log((s.pass ? "PASS  " : "FAIL  ") + s.name + (s.detail ? "  " + s.detail : "")));
  console.log("record written to " + OUT);
  console.log(record.pass ? "REGRESSION PASS" : "REGRESSION FAIL");
  process.exit(record.pass ? 0 : 1);
})().catch((e) => { console.error("regression error:", e.message); process.exit(2); });
