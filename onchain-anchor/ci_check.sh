#!/bin/sh
# Neuruh On-Chain Anchor v2 — CI check (item 79).
# Fails (exit 1) if the Python builder and the browser verifier produce
# different roots on the full manifest, or if any test vector diverges.
# Run: sh ci_check.sh
set -eu
cd ~/workspace/onchain-anchor
echo "== 1. Python test vectors =="
python3 test_vectors.py
echo "== 2. Python root recompute (full manifest) =="
PY_ROOT=$(python3 verify_membership.py --manifest manifest-v2.json --root | grep '^RECOMPUTED ROOT' | awk '{print $3}')
echo "python root: $PY_ROOT"
echo "== 3. JS root recompute (full manifest, jsdom + verify.js) =="
JS_ROOT=$(NODE_PATH=~/workspace/your_files/repo-tiers/node_modules node -e '
const {JSDOM}=require("jsdom");
const {webcrypto}=require("crypto");
const fs=require("fs");
const manifest=JSON.parse(fs.readFileSync("manifest-v2.json","utf8"));
const js=fs.readFileSync("verify.js","utf8");
const dom=new JSDOM("<!doctype html><html><body></body></html>",{url:"https://example.com/",runScripts:"outside-only",pretendToBeVisual:true});
Object.defineProperty(dom.window,"crypto",{value:webcrypto,configurable:true});
dom.window.eval(js+" ; window.__M=JSON.parse("+JSON.stringify(JSON.stringify(manifest))+");");
(async()=>{
  const AV=dom.window.AnchorVerify;
  const v=AV.validateManifest(dom.window.__M);
  if(!v.ok){console.error("JS manifest validation failed:",v.errors);process.exit(3);}
  const entries=dom.window.__M.entries.concat(dom.window.__M.self_entries);
  const leaves=[];
  for(const e of entries) leaves.push(await AV.leafHash(e));
  const root=await AV.merkleRoot(leaves);
  const estate=await AV.merkleRoot(leaves.slice(0,dom.window.__M.entries.length));
  console.log(root);
  console.log("ESTATE:"+estate);
})().catch(e=>{console.error(e);process.exit(4);});
' | head -1)
echo "js root:     $JS_ROOT"
echo "== 4. Compare =="
if [ "$PY_ROOT" != "$JS_ROOT" ]; then
  echo "CI FAIL: Python root != JS root"
  exit 1
fi
PUB_ROOT=$(python3 -c "import json;print(json.load(open('manifest-v2.json'))['merkle_root'])")
if [ "$PY_ROOT" != "$PUB_ROOT" ]; then
  echo "CI FAIL: recomputed root != published root"
  exit 1
fi
echo "CI PASS: Python root == JS root == published root ($PY_ROOT)"
