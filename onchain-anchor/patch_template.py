#!/usr/bin/env python3
"""Patch page_template_v2.html for the convergence additions (items 9, 15, 82, 87, 91-100)
plus the v1.1 receipt wiring and the real brier.json field names.
Run once; asserts each anchor exists so a partial patch fails loudly.
"""
t = open('page_template_v2.html').read()

def rep(old, new):
    global t
    assert old in t, "NOT FOUND: " + old[:90]
    t = t.replace(old, new, 1)

# CSS: heuristic badge + chain badge states
rep('.badge.anchored{background:#123a1e;color:var(--good);border-color:#4caf50}',
    '.badge.anchored{background:#123a1e;color:var(--good);border-color:#4caf50}\n'
    '.badge.heuristic{background:#3a2f10;color:#ffd76a;border:1px solid var(--accent);font-size:11px;padding:1px 7px}\n'
    '.badge.chainok{background:#123a1e;color:var(--good);border-color:#4caf50}\n'
    '.badge.chainbad{background:#3a0f0f;color:var(--bad);border-color:#b3261e}')

# Header: chain-valid badge (item 87), driven by recomputation
rep('<p><span class="badge" id="anchorBadge">SIMULATION — NOT YET ON-CHAIN</span>',
    '<p><span class="badge" id="anchorBadge">SIMULATION — NOT YET ON-CHAIN</span>\n'
    '<span class="badge" id="chainBadge">CHAIN: CHECKING...</span>')

# Counts: placeholders for the builder
rep('<p><b>Estate root</b> (195 estate leaves, baked into this page at build time):</p>',
    '<p><b>Estate root</b> (__ESTATE_LEAF_COUNT__ estate leaves, baked into this page at build time):</p>')
rep("A single root covers all 181 sites, the six papers, the codex, the maps, and the ledgers, plus the anchor's own tooling",
    "A single root covers all __SITE_COUNT__ sites, the seven papers, the codex, the maps, and the ledgers, plus the anchor's own tooling")
rep('Leaf order is locked: the 181 sites in registry order, then the papers, then the documents, then the ledgers, then the self entries',
    'Leaf order is locked: the __SITE_COUNT__ sites in registry order, then the papers, then the documents, then the ledgers, then the self entries')
rep('<option value="">All kinds</option><option value="site">Sites (181)</option>',
    '<option value="">All kinds</option><option value="site">Sites (__SITE_COUNT__)</option>')
rep('The v2 manifest publishes two roots: the <b>estate root</b> (195 estate leaves, baked into this page)',
    'The v2 manifest publishes two roots: the <b>estate root</b> (__ESTATE_LEAF_COUNT__ estate leaves, baked into this page)')

# Section 3: receipt-chain verifier (item 82, one-click, offline)
rep('<div class="panel">\n<h3>Verification certificate</h3>',
    '<div class="panel">\n'
    '<h3>Verify a receipt chain (offline)</h3>\n'
    '<p>Paste a JSONL receipt chain (one canonical receipt v1.1 per line) or upload the log file. The page recomputes every receipt hash and checks the chain links, entirely in your browser, no network. Works offline once this page is loaded. Accepts any demo\'s exported receipt chain that uses the canonical schema (<a href="receipt-schema.json">receipt-schema.json</a>).</p>\n'
    '<textarea id="chainInput" aria-label="JSONL receipt chain, one receipt per line" placeholder=\'{"receipt_version":"1.1", ...}\'></textarea>\n'
    '<p><input type="file" id="chainFile" aria-label="Receipt chain JSONL file"> <button onclick="verifyChainLog()">Verify this receipt chain</button> <button class="ghost" onclick="verifyOwnLog()">Verify this page\'s own receipt log</button></p>\n'
    '<div id="chainOut"></div>\n'
    '</div>\n\n'
    '<div class="panel">\n'
    '<h3>Verification certificate</h3>')

# Section 4: labeling rule (item 15) + inventory links (items 1, 8, 10)
rep('<p class="small">Content SHA-256 is the hash of the artifact\'s bytes. The <b>leaf hash</b> is the SHA-256 of the canonical entry JSON (content hash + provenance). They are different values and are labeled separately everywhere. Click "path" on any row to see that entry\'s Merkle path.</p>',
    '<p class="small">Content SHA-256 is the hash of the artifact\'s bytes. The <b>leaf hash</b> is the SHA-256 of the canonical entry JSON (content hash + provenance). They are different values and are labeled separately everywhere. Click "path" on any row to see that entry\'s Merkle path.</p>\n'
    '<p class="small"><b>Labeling rule:</b> a demo may be labeled WORKING only after the interaction checklist and the content hash are recorded in the Done Ledger. The Done Ledger is the record of record for the WORKING label; the machine-readable inventory below carries the same facts into this Merkle tree.</p>\n'
    '<p class="small"><b>Heuristic badge:</b> demos that still use pure keyword banks (no real observation) carry a <span class="badge heuristic">HEURISTIC</span> badge. Their scores are keyword matches, not measured signal. The full list is the manifest\'s <span class="mono">heuristic</span> field.</p>\n'
    '<p class="small">Machine-readable inventory of the verified demos: <a href="demo-inventory.json">demo-inventory.json</a> (verification date, MD5/SHA-256, and the exact interaction confirmed per demo; signed, its hash is a manifest leaf). The exact browser checklist used 2026-11-14: <a href="browser-checklist-2026-11-14.md">browser-checklist-2026-11-14.md</a>. Canonical receipt schema: <a href="receipt-schema.json">receipt-schema.json</a>. Code/data sharing map: <a href="code-data-sharing.md">code-data-sharing.md</a>. Unified Chain regression record: <a href="unified-chain-regression.json">unified-chain-regression.json</a>. Tamper-test harness: <a href="tamper-harness.py">tamper-harness.py</a> (8 attacks, all detected).</p>')

# Finish criteria: convergence acceptance bar (91-100)
rep('<p><b>Criterion 5 — The page, manifest, verifier, and (once done) anchor proof are themselves included in a subsequent manifest.</b> <span id="fc5">Demonstrated: this page, verify.js, and the build tooling are leaves in this manifest (kind tool/manifest); the v2 manifest file itself will be a leaf in v3.</span></p>\n</div>',
    '<p><b>Criterion 5 — The page, manifest, verifier, and (once done) anchor proof are themselves included in a subsequent manifest.</b> <span id="fc5">Demonstrated: this page, verify.js, and the build tooling are leaves in this manifest (kind tool/manifest); the v2 manifest file itself will be a leaf in v3.</span></p>\n'
    '<h3>Convergence acceptance bar (sections 91-100 of the convergence spec)</h3>\n'
    '<p><b>97 —</b> 178 demos still verify, one real anchor exists, one data source produces calibrated forecasts, and an independent party can recompute the receipts and the Brier. <span class="bad">Not yet:</span> the anchor (criterion 2) is still blocked and the first Brier is not yet computable (0 resolved forecasts).</p>\n'
    '<p><b>98 —</b> Every promotion has a recorded Brier improvement on data not used to propose it. <span class="bad">Not yet:</span> no promotion has been proposed; the gate (brier.py <span class="mono">promote</span>) requires Brier improvement on held-out data before any promotion.</p>\n'
    '<p><b>99 —</b> The simulation badges are removed only where the above evidence exists; elsewhere they stay. <span>This page keeps SIMULATION until a real anchor exists.</span></p>\n'
    '<p><b>100 — Explicit non-goal:</b> the system does not become recursively self-modifying general intelligence. Improvement is limited to better-calibrated observation and forecasting under logged authority and independent verification.</p>\n'
    '<p class="small">Sequenced next builds (convergence sections 16-75, NOT in v2): Measurement Loop v2 (sections 16-45: real observation and pre-registered forecasts with Brier), then Layer 3 authority and gates (46-60), then Layer 4 measurable learning and promotion (61-75), each as a separate build after the loop produces numbers an independent party can recompute.</p>\n'
    '</div>')

# issueReceipt: canonical v1.1 (map action names, carry merkle_root)
rep('''async function issueReceipt(action,inputs,result){
  var prev=RECEIPTS.length?RECEIPTS[RECEIPTS.length-1].receipt_hash:"GENESIS";
  var r=await AnchorVerify.makeReceipt({action:action,inputs:inputs,root:MANIFEST?MANIFEST.merkle_root:null,result:result,prevHash:prev,anchorRoot:MANIFEST&&MANIFEST.anchor?MANIFEST.anchor.root:null});
  RECEIPTS.push(r);saveReceipts();return r;
}''',
    '''async function issueReceipt(action,inputs,result){
  var prev=RECEIPTS.length?RECEIPTS[RECEIPTS.length-1].receipt_hash:"GENESIS";
  /* Canonical receipt schema v1.1: the page's action names map to the
     canonical action "verification"; the specific operation goes in
     payload.kind. Every receipt carries the current Merkle root. */
  var canonAction={verify_membership:"verification",verify_file:"verification",verify_batch:"verification",tamper_demo:"verification"}[action]||"verification";
  var payload={kind:action};
  Object.keys(inputs||{}).forEach(function(k){payload[k]=inputs[k]});
  var r=await AnchorVerify.makeReceipt({action:canonAction,actor:"anchor-v2 (verify.js "+AnchorVerify.VERIFIER_VERSION+")",inputs:inputs,payload:payload,root:MANIFEST?MANIFEST.merkle_root:null,merkleRoot:MANIFEST?MANIFEST.merkle_root:null,result:result,prevHash:prev,anchorRoot:MANIFEST&&MANIFEST.anchor?MANIFEST.anchor.root:null});
  RECEIPTS.push(r);saveReceipts();return r;
}
async function verifyChainLog(){
  var out=$("chainOut");
  var text=$("chainInput").value;
  var f=$("chainFile").files[0];
  if(f){text=await f.text()}
  var lines=text.split(/\\r?\\n/).map(function(s){return s.trim()}).filter(Boolean);
  if(!lines.length){out.innerHTML='<p>Paste a JSONL receipt chain first, or choose a file.</p>';return}
  var receipts=[];
  for(var i=0;i<lines.length;i++){try{receipts.push(JSON.parse(lines[i]))}catch(e){out.innerHTML='<div class="panel bad"><h3>CHAIN BROKEN</h3><p>Line '+(i+1)+' is not valid JSON: '+esc(String(e))+'</p></div>';return}}
  var v=await AnchorVerify.verifyReceiptChain(receipts);
  out.innerHTML=v.ok
    ?'<div class="panel good"><h3>CHAIN VALID</h3><p>'+v.count+' receipts. Every receipt hash recomputes and every prev_hash links. Verified offline in this browser.</p></div>'
    :'<div class="panel bad"><h3>CHAIN BROKEN</h3><p>'+esc(v.error)+' (receipt '+v.index+'). Do not trust this chain.</p></div>';
  await issueReceipt("verify_chain",{count:receipts.length},v.ok?"CHAIN VALID":"CHAIN BROKEN");
}
async function verifyOwnLog(){
  $("chainInput").value=RECEIPTS.map(function(r){return JSON.stringify(r)}).join("\\n");
  await verifyChainLog();
}''')

# Receipt display: show receipt_id and merkle_root too
rep('''$("receiptOut").innerHTML='<div class="panel"><h3>Verification receipt</h3><p class="mono small">receipt_hash: '+receipt.receipt_hash+'<br>prev_hash: '+receipt.prev_hash+'<br>timestamp: '+esc(receipt.timestamp)+' &middot; verifier: '+esc(receipt.verifier_version)+'</p></div>';''',
    '''$("receiptOut").innerHTML='<div class="panel"><h3>Verification receipt (schema v1.1)</h3><p class="mono small">receipt_id: '+receipt.receipt_id+'<br>receipt_hash: '+receipt.receipt_hash+'<br>prev_hash: '+receipt.prev_hash+'<br>merkle_root: '+esc(receipt.merkle_root||"")+'<br>timestamp: '+esc(receipt.timestamp)+' &middot; verifier: '+esc(receipt.verifier_version)+'</p></div>';''')

# renderTable: heuristic badge (item 9)
rep('''  $("manifestBody").innerHTML=rows.map(function(e){
    var idx=allEntries().indexOf(e);
    return '<tr><td>'+esc(e.id)+'</td><td>'+esc(e.kind)+'</td>''',
    '''  var heuList=(MANIFEST.heuristic||[]);
  $("manifestBody").innerHTML=rows.map(function(e){
    var idx=allEntries().indexOf(e);
    var isHeu=heuList.indexOf(e.id)>=0;
    return '<tr><td>'+esc(e.id)+(isHeu?' <span class="badge heuristic" title="Pure keyword bank; scores are keyword matches, not measured signal.">HEURISTIC</span>':'')+'</td><td>'+esc(e.kind)+'</td>''')

# Chain badge: set from the live recompute in init() and recomputeRoots() (item 87)
rep('''  $("rootPanel").className="panel "+(full===MANIFEST.merkle_root&&estate===MANIFEST.estate_root?"good":"bad");
  var memo="NEURUH-ANCHOR v2 root="+MANIFEST.merkle_root+" manifest=manifest-v2.json";''',
    '''  var chainOk=full===MANIFEST.merkle_root&&estate===MANIFEST.estate_root;
  $("rootPanel").className="panel "+(chainOk?"good":"bad");
  var cb=$("chainBadge");
  cb.textContent=chainOk?"CHAIN VALID (recomputed)":"CHAIN BROKEN (recomputed)";
  cb.className="badge "+(chainOk?"chainok":"chainbad");
  var memo="NEURUH-ANCHOR v2 root="+MANIFEST.merkle_root+" manifest=manifest-v2.json";''')
rep('''  $("rootPanel").className="panel "+(fullOk&&estateOk?"good":"bad");
  out.innerHTML=(fullOk?''',
    '''  $("rootPanel").className="panel "+(fullOk&&estateOk?"good":"bad");
  var cb2=$("chainBadge");
  cb2.textContent=(fullOk&&estateOk)?"CHAIN VALID (recomputed)":"CHAIN BROKEN (recomputed)";
  cb2.className="badge "+((fullOk&&estateOk)?"chainok":"chainbad");
  out.innerHTML=(fullOk?''')

# Calibration dashboard: match the real brier.json field names
rep('''      $("calDash").innerHTML="Resolved forecasts: <b>"+bj.resolved_count+"</b> &middot; Brier overall: <b>"+(bj.brier_overall===null?"not yet computable":bj.brier_overall.toFixed(4))+"</b> &middot; Constant baseline: <b>"+(bj.constant_baseline_brier===null?"—":bj.constant_baseline_brier.toFixed(4))+"</b> &middot; Last update: "+esc(bj.last_update);''',
    '''      $("calDash").innerHTML="Forecasts issued: <b>"+bj.forecasts_issued+"</b> &middot; Resolved: <b>"+bj.forecasts_resolved+"</b> &middot; Brier overall: <b>"+(bj.brier===null?"not yet computable":bj.brier.toFixed(4))+"</b> &middot; Constant baseline: <b>"+(bj.constant_baseline_brier===null?"—":bj.constant_baseline_brier.toFixed(4))+"</b> &middot; Status: "+esc(bj.status||"")+" &middot; Last update: "+esc(bj.generated_at||"");''')

open('page_template_v2.html', 'w').write(t)
print("template patched OK")
print("placeholders: ESTATE_ROOT", t.count("__ESTATE_ROOT__"),
      "ANCHOR_DATE", t.count("__ANCHOR_DATE__"),
      "VERIFIER_VERSION", t.count("__VERIFIER_VERSION__"),
      "SITE_COUNT", t.count("__SITE_COUNT__"),
      "ESTATE_LEAF_COUNT", t.count("__ESTATE_LEAF_COUNT__"))
