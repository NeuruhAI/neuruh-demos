"use strict";
/* SAL Content Pipeline demo v1.0, 2026-11-14.
   Static page, no backend, no fetch, no upload. No data leaves the browser.
   SAL source facts: vault 01-Core-Architecture/SAL.md (CORE-002), Ecosystem Codex
   Volume VI, Framework Atlas frameworks.json (sal entry). The pipeline STAGES below
   are MY DESIGN DECISION (no source defines SAL stages or a SAL content pipeline).
   Receipt format v1.0 follows the live receipt-chain-explorer: canonical JSON
   (keys sorted, arrays in order), provenance.report_hash_sha256 stripped before
   hashing, SHA-256 only, first receipt prev hash GENESIS. Hashing uses Web Crypto. */

var SAL = (function () {

  /* ---------- input corpus: content-bank.md, 30 items, verbatim ---------- */
  var BANK = [
    { n: 1, fact: "SWARM page: full factual rebuild IN PROGRESS from the recovered SREIC architecture. 7 legions, 5,150 as a historical logical-agent design target (never live sessions), honest DESIGNED state labels. Do NOT present as shipped until deployed and verified at swarm.neuruh.com. The earlier scaffold at https://swarm-38g.pages.dev is not the final build.", proof: "local source ~/workspace/swarm", angles: ["rebuild status", "5,150 lineage honesty", "DESIGNED labels"] },
    { n: 2, fact: "neuruh.com/proof page BUILT 2026-09-26 on neuruh-web but NOT YET DEPLOYED (Mac-side deploy pending; GA4/legal decision unresolved). Do not claim it is live or link it as shipped until the deploy lands.", proof: "neuruh-web branch feat/proof-receipts-20260926", angles: ["ledger concept", "deploy pending", "no premature links"] },
    { n: 3, fact: "2021 Dutchmen Kodiak Ultra-Lite 332BHSL listed at $22,000 (repriced 2026-09-26 from $25,000; $21,000 floor), Benton Harbor MI. 38ft bunkhouse, sleeps 11, free-and-clear title.", proof: "https://www.facebook.com/marketplace/item/27944663891896736", angles: ["listing", "specs", "why selling"] },
    { n: 4, fact: "Submitted the camper to Kunes RV buy program 2026-09-26. Confirmation received, no fee.", proof: "dealer-call-sheet.md", angles: ["sold my camper playbook", "Kunes route"] },
    { n: 5, fact: "4 YouTube Shorts published 2026-09-25/26 on the vintage-buying channel (POV, The Barn Find, Three Mistakes, The Recipe). VERIFIED LIVE 2026-09-26 11:15 EDT with matching titles.", proof: "https://youtube.com/shorts/1rupFkBkvIE https://youtube.com/shorts/PnzWhcA1C9Q https://youtube.com/shorts/tNDIl99O1Fk https://youtube.com/shorts/8_cVKXE3MDg", angles: ["shorts as receipts", "verification done"] },
    { n: 6, fact: "Property Opportunity Scan $100 (changed from $350 on 2026-10-01 by Jeramie). Property Intelligence Dossier $1,500. Confirmed list prices 2026-10-01.", proof: "neuruh.com/pricing", angles: ["scan", "dossier", "price honesty"] },
    { n: 7, fact: "Free 10-minute qualifier call is the primary CTA. Book at cal.com/neuruh. Contact jeramie@neuruh.com.", proof: "neuruh.com", angles: ["CTA", "no-pressure consult"] },
    { n: 8, fact: "Teach-first reply posted in Moda AI Club (8,000-member AI builder group) 2026-09-26. Value first, no pitch.", proof: "https://www.facebook.com/groups/modaai/posts/1119781627243218/?comment_id=1119838433904204", angles: ["teach-first outbound", "the reply itself"] },
    { n: 9, fact: "Recipe system: 30 canonical recipe families (R1-R30), 36 rows in live Supabase registry, 4 active hunt recipes.", proof: "estate inventory 2026-09-22", angles: ["recipes over leads", "R1-R30", "hunt recipes"] },
    { n: 10, fact: "LANDOS hunt 6071b7ad: 153 leads scored, 153 updated, 153 IDs synced, zero new minted.", proof: "hunt receipt 2026-09-25", angles: ["signal engine", "153 leads"] },
    { n: 11, fact: "DeedSonar: flagship all-in-one real-estate CRM/lead app, solely Jeramie Hicks (Bryan Franklin never signed; per 2026-10-22 correction).", proof: "deedsonar.com", angles: ["flagship", "sole ownership"] },
    { n: 12, fact: "lead-recipe-os: the core lead engine. Most important work in the stack.", proof: "NeuruhAI/lead-recipe-os", angles: ["engine", "place-agnostic"] },
    { n: 13, fact: "SREIC is not a standalone app. It is a Real Estate World inside Neuruh.", proof: "integration blueprint 2026-09-08", angles: ["world architecture", "integration ruling"] },
    { n: 14, fact: "First Pick: free open-source (CC0) sell-sheet connecting SW Michigan growers to Chicago buyers. No commission.", proof: "firstpick-biz.pages.dev", angles: ["open source", "farm economics"] },
    { n: 15, fact: "Fallow: idle-parcel yield intelligence engine. LaPorte County pilot staged.", proof: "estate docs", angles: ["idle land", "pilot"] },
    { n: 16, fact: "Parcel Reality Bench (prbench): benchmark grading models on county parcel records.", proof: "NeuruhAI/prbench", angles: ["benchmark", "parcel reality"] },
    { n: 17, fact: "CRUCIBLE: hash-chained receipt system as publication gate.", proof: "estate docs", angles: ["receipts", "proof of work"] },
    { n: 18, fact: "NRH Registry: canonical IP inventory across ~140-215 repos.", proof: "registry", angles: ["IP sovereignty", "inventory"] },
    { n: 19, fact: "31 named frameworks in the agent catalog: PMLA, SAL, DIMEA 2.0, Master Command Protocol, etc.", proof: "catalog", angles: ["PMLA", "framework catalog"] },
    { n: 20, fact: "Atomic agent model: Protons (core logic), Neutrons (data stability), Electrons (tool execution).", proof: "swarm architecture blueprint", angles: ["atomic model", "PMLA loop"] },
    { n: 21, fact: "Master Command Protocol + Context MUX + Semantic Parity Checker.", proof: "swarm blueprint", angles: ["MCP", "parity checking"] },
    { n: 22, fact: "Canonical RE execution loop: LANDOS ingest, engine, signals, recipe, DeedSonar, acquisition, underwriting, outreach, outcome, learning.", proof: "estate docs", angles: ["the loop", "each stage"] },
    { n: 23, fact: "DNC scrubbing is optional, never an automatic gate. Unchecked phones callable with visible warning.", proof: "founder spec", angles: ["founder spec", "compliance honesty"] },
    { n: 24, fact: "Estate-identity layer: distinguishes estate, human, deceased-owner, documented case states.", proof: "estate docs", angles: ["identity layer", "not every anomaly is a lead"] },
    { n: 25, fact: "25+ years physical arbitrage: estate cleanouts, salvage, thrift, trading cards, motorcycles, equipment.", proof: "bio", angles: ["background", "arbitrage eye"] },
    { n: 26, fact: "MIDDEN: small-town estate/thrift retail pilot in Michiana. Cash-flow plus lead feed.", proof: "plans", angles: ["concept", "why retail feeds RE"] },
    { n: 27, fact: "re.neuruh.com: real-estate sales front door. guide.neuruh.com: field guide.", proof: "live sites", angles: ["surfaces", "guide"] },
    { n: 28, fact: "No paid spend until revenue exists. All marketing organic. Budget $0 rule.", proof: "directive 2026-09-26", angles: ["constraint", "organic only"] },
    { n: 29, fact: "No dollar valuation claimed before recurring revenue.", proof: "valuation honesty rule", angles: ["honesty rule"] },
    { n: 30, fact: "Convergence over proliferation: repair existing infrastructure, never parallel prototypes.", proof: "directive", angles: ["doctrine", "examples"] }
  ];

  /* ---------- platform formats, verbatim from content-bank.md ---------- */
  var PLATFORMS = {
    x: { label: "X (@NeuruhAI)", limit: 280, rule: "under 280 chars, blunt, one link max, no hashtags spam" },
    threads: { label: "Threads", limit: 500, rule: "1-2 short paragraphs, conversational" },
    ig: { label: "Instagram", limit: 2200, rule: "caption + hook first line" },
    fb: { label: "Facebook groups", limit: 2000, rule: "teach-first, value only, soft offer only where rules allow, pure teaching where banned" }
  };

  /* ---------- stage list: MY DESIGN DECISION, not a paper claim ----------
     No source defines SAL stages or a SAL content pipeline. SAL as sourced is
     "agent composition layer for stacking and orchestrating multi-agent
     pipelines" (Notion AI-FW-032) and "prompt engineering framework"
     (Codex Volume VI). These six stages apply that stacking idea to the
     content bank and the repurpose engine. */
  var STAGES = [
    { id: "ingest", name: "1. INGEST", desc: "Take one bank item by index. Nothing is invented; the fact, proof, and angles come from the bank verbatim." },
    { id: "stack", name: "2. STACK", desc: "Layer three agents in order: fact layer (verbatim fact), voice layer (blunt, no fluff), format layer (platform rule). Each layer only sees the output of the layer below it." },
    { id: "transform", name: "3. TRANSFORM", desc: "Apply the platform format rule to the stacked brief and produce one draft." },
    { id: "verify", name: "4. VERIFY", desc: "Run real checks on the draft: length within the platform limit, content words trace to the fact, at most one link on X, no live claim when the fact says NOT YET DEPLOYED, no dollar figure the fact does not contain." },
    { id: "queue", name: "5. QUEUE", desc: "Map the draft to the repurpose queue: queue file item<N>.md covers bank item N+1, cursor 0-based. Drafts only, never publishes." },
    { id: "receipt", name: "6. RECEIPT", desc: "Emit a receipt format v1.0 record: SHA-256 over canonical JSON with the hash field stripped, chained to the previous receipt hash, GENESIS first." }
  ];

  /* ---------- pure helpers ---------- */
  function canonical(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
    return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + canonical(v[k]); }).join(",") + "}";
  }

  function sha256Hex(str) {
    var subtle = (typeof crypto !== "undefined" && crypto.subtle) ? crypto.subtle : null;
    if (!subtle) return Promise.reject(new Error("Web Crypto (crypto.subtle) is not available in this context."));
    var data = new TextEncoder().encode(str);
    return subtle.digest("SHA-256", data).then(function (buf) {
      var bytes = new Uint8Array(buf), out = "";
      for (var i = 0; i < bytes.length; i++) out += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
      return out;
    });
  }

  function sentences(text) {
    return text.split(/(?<=[.!?])\s+/).filter(function (s) { return s.length > 0; });
  }

  function firstUrl(text) {
    var m = text.match(/https?:\/\/[^\s]+/);
    return m ? m[0] : "";
  }

  function contentWords(text) {
    return text.toLowerCase().replace(/[^a-z0-9$ ]/g, " ").split(/\s+/)
      .filter(function (w) { return w.length > 3; });
  }

  function moneyFigures(text) {
    var m = text.match(/\$\s?[\d,]+(\.\d+)?/g);
    return m ? m : [];
  }

  /* ---------- stage 3: draft builders (deterministic, real transforms) ---------- */
  function buildDraft(platform, item) {
    var fact = item.fact;
    var s = sentences(fact);
    if (platform === "x") {
      var body = s[0];
      var link = firstUrl(item.proof);
      var out = body;
      if (link && (out.length + 1 + link.length) <= 277) out += " " + link;
      if (out.length > 280) out = out.slice(0, 277) + "...";
      return out;
    }
    if (platform === "threads") {
      var p1 = s[0];
      var p2 = s[1] || ("Angle: " + item.angles[0] + ".");
      var t = p1 + "\n\n" + p2;
      if (t.length > 500) t = t.slice(0, 497) + "...";
      return t;
    }
    if (platform === "ig") {
      var hook = fact.split(/\s+/).slice(0, 8).join(" ") + "...";
      var cap = hook + "\n\n" + fact;
      if (cap.length > 2200) cap = cap.slice(0, 2197) + "...";
      return cap;
    }
    /* fb */
    var fb = "What this shows: " + fact;
    if (fb.length > 2000) fb = fb.slice(0, 1997) + "...";
    return fb;
  }

  /* ---------- stage 4: real checks ---------- */
  function runChecks(platform, item, draft) {
    var limit = PLATFORMS[platform].limit;
    var checks = [];
    checks.push({ name: "length within platform limit (" + limit + " chars)", pass: draft.length <= limit, detail: draft.length + " chars" });
    var words = contentWords(item.fact).slice(0, 5);
    var dl = draft.toLowerCase();
    var hits = words.filter(function (w) { return dl.indexOf(w) !== -1; }).length;
    checks.push({ name: "draft words trace to the fact (at least 2 of first 5 content words)", pass: hits >= 2, detail: hits + " of 5 found: " + words.join(", ") });
    var links = (draft.match(/https?:\/\//g) || []).length;
    checks.push({ name: "at most one link", pass: links <= 1, detail: links + " link(s)" });
    var notDeployed = /NOT YET DEPLOYED/i.test(item.fact);
    /* A live claim is a sentence asserting liveness without a negation.
       Quoting the restriction itself ("Do not claim it is live") is not a claim. */
    var liveClaim = sentences(draft).some(function (s) {
      return /\blive\b/i.test(s) && !/\b(not|no|never|do not|don't|don't|cannot|can't)\b/i.test(s);
    });
    checks.push({ name: "no live claim when fact says NOT YET DEPLOYED", pass: !(notDeployed && liveClaim), detail: notDeployed ? "fact says NOT YET DEPLOYED" : "fact carries no deploy restriction" });
    var draftMoney = moneyFigures(draft);
    var factMoney = moneyFigures(item.fact);
    var invented = draftMoney.filter(function (m) { return factMoney.indexOf(m) === -1; });
    checks.push({ name: "no dollar figure the fact does not contain", pass: invented.length === 0, detail: invented.length ? "invented: " + invented.join(", ") : "all figures trace to the fact" });
    return checks;
  }

  /* ---------- stage 5: queue mapping (0-based cursor, per repurpose notes) ---------- */
  function queueFileFor(cursor) {
    return { file: "item" + cursor + ".md", bankItem: cursor + 1 };
  }
  function nextCursor(cursor) {
    return (cursor + 1) % BANK.length;
  }

  /* ---------- stage 6: receipt v1.0 ---------- */
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function buildReceipt(o) {
    return {
      receipt_version: "1.0",
      receipt_id: o.receiptId,
      run_id: "sal-pipeline-run-20261114",
      signal_id: "bank-item-" + pad2(o.bankItem),
      content_ref: "sal-piece-20261114-bank-" + pad2(o.bankItem),
      channel: o.channel,
      queued_at: o.queuedAt,
      sent_at: null,
      sender: "jeramie",
      cta: "free 10-min call, cal.com/neuruh",
      outcome: "queued, awaiting per-draft approval",
      outcome_at: null,
      provenance: {
        report_hash_sha256: "",
        verdict: "QUEUED-NOT-SENT",
        verdict_note: "Draft only. No touch sent. Nothing published. X stop order holds.",
        timestamp_utc: o.timestampUtc,
        prev_receipt_hash: o.prevHash,
        sources: [
          "content-bank.md bank item " + o.bankItem,
          "vault 01-Core-Architecture/SAL.md (CORE-002)",
          "framework-atlas frameworks.json sal entry"
        ]
      }
    };
  }

  function signReceipt(receipt) {
    var copy = JSON.parse(JSON.stringify(receipt));
    delete copy.provenance.report_hash_sha256;
    return sha256Hex(canonical(copy)).then(function (h) {
      receipt.provenance.report_hash_sha256 = h;
      return receipt;
    });
  }

  function verifyReceipt(receipt, expectedPrev) {
    var copy = JSON.parse(JSON.stringify(receipt));
    var stored = copy.provenance.report_hash_sha256;
    delete copy.provenance.report_hash_sha256;
    return sha256Hex(canonical(copy)).then(function (recomputed) {
      var hashOk = recomputed === stored;
      var linkOk = receipt.provenance.prev_receipt_hash === expectedPrev;
      var genesisOk = true;
      if (expectedPrev === "GENESIS") genesisOk = receipt.provenance.prev_receipt_hash === "GENESIS";
      return { hashOk: hashOk, linkOk: linkOk, genesisOk: genesisOk, ok: hashOk && linkOk && genesisOk, recomputed: recomputed, stored: stored };
    });
  }

  var api = {
    BANK: BANK, PLATFORMS: PLATFORMS, STAGES: STAGES,
    canonical: canonical, sha256Hex: sha256Hex,
    sentences: sentences, firstUrl: firstUrl, contentWords: contentWords, moneyFigures: moneyFigures,
    buildDraft: buildDraft, runChecks: runChecks,
    queueFileFor: queueFileFor, nextCursor: nextCursor,
    buildReceipt: buildReceipt, signReceipt: signReceipt, verifyReceipt: verifyReceipt
  };
  return api;
})();

if (typeof globalThis !== "undefined") { globalThis.SAL = SAL; }

/* ================= browser UI (skipped under Node) ================= */
if (typeof document !== "undefined" && document.getElementById) {
  (function () {
    var cursor = 8; /* bank file on disk: cursor_index 8, updated 2026-11-13 21:55 */
    var receipts = [];
    var runCount = 0;
    var lastDraft = null;

    function $(id) { return document.getElementById(id); }
    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + "..." : s; }
    function isoNow() { return new Date().toISOString(); }
    function hhmm(d) {
      function p(n) { return (n < 10 ? "0" : "") + n; }
      return p(d.getHours()) + p(d.getMinutes());
    }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ----- queue table ----- */
    function renderQueue() {
      var html = "<table><thead><tr><th>Cursor idx</th><th>Bank item</th><th>Fact (head)</th><th>Queue file</th><th>State</th></tr></thead><tbody>";
      SAL.BANK.forEach(function (item, i) {
        var q = SAL.queueFileFor(i);
        var state = (i === cursor) ? "NEXT (cursor)" : (i < cursor ? "passed this cycle" : "pending");
        html += "<tr" + (i === cursor ? " class=\"cursor-row\"" : "") + "><td class=\"mono\">" + i + "</td><td class=\"mono\">" + item.n + "</td><td>" + esc(trunc(item.fact, 72)) + "</td><td class=\"mono\">" + q.file + "</td><td>" + state + "</td></tr>";
      });
      html += "</tbody></table>";
      $("queueTable").innerHTML = html;
      var q = SAL.queueFileFor(cursor);
      $("cursorReadout").innerHTML = "Cursor index <b>" + cursor + "</b> (0-based). Next queue file <b class=\"mono\">2026-11-14-" + hhmm(new Date()) + "-" + q.file + "</b> covers bank item <b>" + q.bankItem + "</b>. File item&lt;N&gt;.md always covers bank item N+1.";
    }

    /* ----- pipeline run ----- */
    function stageCard(id) { return $("stage-" + id); }
    function setStage(id, input, transform, output, status) {
      var el = stageCard(id);
      el.querySelector(".st-input").textContent = input;
      el.querySelector(".st-transform").textContent = transform;
      el.querySelector(".st-output").textContent = output;
      el.querySelector(".st-status").textContent = status;
      el.classList.add("done");
    }
    function clearStages() {
      SAL.STAGES.forEach(function (s) {
        var el = stageCard(s.id);
        el.querySelector(".st-input").textContent = "";
        el.querySelector(".st-transform").textContent = "";
        el.querySelector(".st-output").textContent = "";
        el.querySelector(".st-status").textContent = "waiting";
        el.classList.remove("done");
      });
    }

    async function runPipeline() {
      var idx = parseInt($("bankIndex").value, 10);
      if (isNaN(idx) || idx < 1 || idx > 30) { $("runNote").textContent = "Pick a bank item 1 to 30."; return; }
      var platform = $("platform").value;
      var item = SAL.BANK[idx - 1];
      var plat = SAL.PLATFORMS[platform];
      $("runBtn").disabled = true;
      $("runNote").textContent = "Running...";
      clearStages();
      lastDraft = null;

      /* stage 1: ingest */
      setStage("ingest",
        "content-bank.md, item " + item.n + " of 30",
        "Parse the bank line into fact, proof, angles. No new content is created.",
        "fact: " + item.fact + "\nproof: " + item.proof + "\nangles: " + item.angles.join(" | "),
        "done");
      await sleep(250);

      /* stage 2: stack */
      var brief = "L0 fact layer: " + item.fact + "\nL1 voice layer: blunt, no fluff, no hashtags spam\nL2 format layer: " + plat.label + " - " + plat.rule;
      setStage("stack",
        "fact + proof + angles from stage 1",
        "Stack three agents in order. Each layer only sees the output of the layer below it.",
        brief,
        "done");
      await sleep(250);

      /* stage 3: transform */
      var draft = SAL.buildDraft(platform, item);
      setStage("transform",
        "stacked brief (fact + voice + format rules)",
        "Apply the " + plat.label + " format rule: " + plat.rule + ". Limit " + plat.limit + " chars.",
        draft,
        "done");
      await sleep(250);

      /* stage 4: verify */
      var checks = SAL.runChecks(platform, item, draft);
      var allPass = checks.every(function (c) { return c.pass; });
      var checkText = checks.map(function (c) { return (c.pass ? "PASS" : "FAIL") + " - " + c.name + " (" + c.detail + ")"; }).join("\n");
      setStage("verify",
        "draft (" + draft.length + " chars)",
        "Run the five checks. A failed check blocks the draft from the queue.",
        checkText + "\nVerdict: " + (allPass ? "ALL CHECKS PASS" : "CHECKS FAILED - draft held, not queued"),
        allPass ? "done" : "done");
      await sleep(250);
      if (!allPass) {
        $("runNote").textContent = "Run stopped at VERIFY: a check failed. Draft held, no queue entry, no receipt.";
        $("runBtn").disabled = false;
        return;
      }
      lastDraft = draft;

      /* stage 5: queue */
      var q = SAL.queueFileFor(cursor);
      var now = new Date();
      var qfile = "2026-11-14-" + hhmm(now) + "-" + q.file;
      setStage("queue",
        "verified draft for bank item " + item.n,
        "Map to the repurpose queue. Cursor is 0-based; file item<N>.md covers bank item N+1.",
        "queue file: " + qfile + " (covers bank item " + q.bankItem + ")\ncursor before: " + cursor + " - draft only, never publishes",
        "done");
      await sleep(250);

      /* stage 6: receipt */
      runCount += 1;
      var receiptId = "sal-20261114-" + ("000" + runCount).slice(-4);
      var prevHash = receipts.length ? receipts[receipts.length - 1].provenance.report_hash_sha256 : "GENESIS";
      var receipt = SAL.buildReceipt({
        receiptId: receiptId,
        bankItem: item.n,
        channel: platform,
        queuedAt: isoNow(),
        timestampUtc: isoNow(),
        prevHash: prevHash
      });
      try {
        await SAL.signReceipt(receipt);
      } catch (e) {
        setStage("receipt", "queue entry " + qfile, "Hash with Web Crypto SHA-256 over canonical JSON, hash field stripped.", "ERROR: " + e.message, "done");
        $("runNote").textContent = "Receipt hashing failed: " + e.message;
        $("runBtn").disabled = false;
        return;
      }
      receipts.push(receipt);
      setStage("receipt",
        "queue entry " + qfile,
        "Canonical JSON (keys sorted), strip provenance.report_hash_sha256, SHA-256 via Web Crypto, chain prev hash (" + (prevHash === "GENESIS" ? "GENESIS" : prevHash.slice(0, 12) + "...") + ").",
        "receipt_id: " + receipt.receipt_id + "\nhash: " + receipt.provenance.report_hash_sha256 + "\nprev: " + receipt.provenance.prev_receipt_hash,
        "done");
      renderReceipts();
      $("runNote").textContent = "Run complete. Receipt " + receipt.receipt_id + " emitted and chained. Draft queued in simulation only; nothing was published.";
      $("runBtn").disabled = false;
    }

    /* ----- receipts ----- */
    function renderReceipts() {
      var box = $("receiptList");
      if (!receipts.length) { box.innerHTML = "<p class=\"muted\">No receipts yet this session. Run the pipeline to emit one.</p>"; $("chainBanner").textContent = "Chain: empty. First receipt in a session chains from GENESIS."; return; }
      var html = "";
      receipts.forEach(function (r, i) {
        html += "<div class=\"receipt-card\"><div class=\"rc-head\"><b>" + esc(r.receipt_id) + "</b> <span class=\"mono\">" + esc(r.channel) + " / bank item " + esc(r.signal_id.replace("bank-item-", "")) + "</span></div>"
          + "<div class=\"mono small\">hash: " + esc(r.provenance.report_hash_sha256) + "</div>"
          + "<div class=\"mono small\">prev: " + esc(r.provenance.prev_receipt_hash) + "</div>"
          + "<div class=\"small\">verdict: " + esc(r.provenance.verdict) + " - " + esc(r.provenance.verdict_note) + "</div>"
          + "<p><button class=\"verify-btn\" data-i=\"" + i + "\">Verify this receipt</button> <span class=\"verify-result\" id=\"vr-" + i + "\">Not verified yet.</span></p>"
          + "<details><summary>Full receipt JSON</summary><pre class=\"mono small\">" + esc(JSON.stringify(r, null, 2)) + "</pre></details></div>";
      });
      box.innerHTML = html;
      var last = receipts[receipts.length - 1];
      $("chainBanner").textContent = "Chain: " + receipts.length + " receipt(s) this session. Head hash " + last.provenance.report_hash_sha256.slice(0, 16) + "... First receipt prev is GENESIS.";
      Array.prototype.forEach.call(box.querySelectorAll(".verify-btn"), function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(btn.getAttribute("data-i"), 10);
          var expectedPrev = i === 0 ? "GENESIS" : receipts[i - 1].provenance.report_hash_sha256;
          var out = $("vr-" + i);
          out.textContent = "Verifying...";
          SAL.verifyReceipt(receipts[i], expectedPrev).then(function (v) {
            out.textContent = v.ok ? "PASS - hash recomputes and prev link matches." : "FAIL - hash ok: " + v.hashOk + ", link ok: " + v.linkOk + ", genesis ok: " + v.genesisOk + ".";
            out.className = "verify-result " + (v.ok ? "pass" : "fail");
          }).catch(function (e) { out.textContent = "ERROR: " + e.message; out.className = "verify-result fail"; });
        });
      });
    }

    function exportJsonl() {
      if (!receipts.length) return;
      var text = receipts.map(function (r) { return JSON.stringify(r); }).join("\n") + "\n";
      var blob = new Blob([text], { type: "application/jsonl" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "sal-pipeline-receipts-20261114.jsonl";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }

    /* ----- cursor controls (simulation only) ----- */
    $("advanceBtn").addEventListener("click", function () {
      var before = cursor;
      cursor = SAL.nextCursor(cursor);
      var q = SAL.queueFileFor(cursor);
      var log = $("cursorLog");
      var line = document.createElement("div");
      line.textContent = "Advanced " + before + " -> " + cursor + ". Next queue file " + q.file + " covers bank item " + q.bankItem + ". (Simulation: on-page state only. No file was written.)";
      log.prepend(line);
      renderQueue();
    });
    $("resetCursorBtn").addEventListener("click", function () {
      cursor = 0;
      var line = document.createElement("div");
      line.textContent = "Cursor reset to 0 (simulation). Next queue file item0.md covers bank item 1.";
      $("cursorLog").prepend(line);
      renderQueue();
    });
    $("runBtn").addEventListener("click", runPipeline);
    $("exportBtn").addEventListener("click", exportJsonl);

    renderQueue();
    renderReceipts();
  })();
}
