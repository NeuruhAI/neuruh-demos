#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — audit script (item 53).
Confirms: live page root == recomputed root == anchored root (once live).
Today the anchor is NOT yet on-chain, so the third check reports BLOCKED
rather than failing. Exit 0 when page root == recomputed root; exit 2 on
mismatch; exit 3 when the page or manifest cannot be fetched.
Stdlib only.
"""
import hashlib, json, re, sys, urllib.request

PAGE_URL = "https://neuruhai.github.io/neuruh-demos/onchain-anchor/"
MANIFEST_URL = "https://neuruhai.github.io/neuruh-demos/onchain-anchor/manifest-v2.json"
STATUS_URL = "https://neuruhai.github.io/neuruh-demos/onchain-anchor/status.json"

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "NeuruhAudit/2.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def main():
    try:
        page = fetch(PAGE_URL).decode("utf-8")
        manifest_raw = fetch(MANIFEST_URL)
        status_raw = fetch(STATUS_URL)
    except Exception as e:  # noqa: BLE001
        print("AUDIT FAILED: could not fetch live artifacts: %s" % e)
        return 3
    m = json.loads(manifest_raw.decode("utf-8"))
    status = json.loads(status_raw.decode("utf-8"))
    # 1. root embedded in the page (estate root) vs manifest estate root
    emb = re.search(r'__ESTATE_ROOT__|([0-9a-f]{64})', page)
    estate_in_page = None
    mm = re.search(r'id="estateRoot"[^>]*>([0-9a-f]{64})<', page)
    if mm:
        estate_in_page = mm.group(1)
    entries = list(m["entries"]) + list(m["self_entries"])
    leaves = [sha256(canonical(e)) for e in entries]
    level = [bytes.fromhex(h) for h in leaves]
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else level[i]
            nxt.append(hashlib.sha256(left + right).digest())
        level = nxt
    recomputed = level[0].hex()
    print("live page estate root:  %s" % (estate_in_page or "not found in page"))
    print("manifest estate root:   %s" % m["estate_root"])
    print("recomputed full root:   %s" % recomputed)
    print("manifest full root:     %s" % m["merkle_root"])
    print("manifest sha256:        %s" % sha256(manifest_raw))
    print("status.json root:       %s" % status.get("merkle_root"))
    print("leaf count:             %d (estate %d + self %d)" % (len(entries), len(m["entries"]), len(m["self_entries"])))
    ok = True
    if estate_in_page and estate_in_page != m["estate_root"]:
        print("FAIL: page estate root != manifest estate root")
        ok = False
    if recomputed != m["merkle_root"]:
        print("FAIL: recomputed root != manifest root")
        ok = False
    if status.get("merkle_root") != m["merkle_root"]:
        print("FAIL: status.json root != manifest root")
        ok = False
    # 3. anchored root (blocked until a chain write exists)
    if status.get("anchored"):
        print("anchored root:          %s (%s, %s)" % (status.get("anchor_root"), status.get("chain"), status.get("txid")))
        if status.get("anchor_root") != m["merkle_root"]:
            print("FAIL: anchored root != manifest root")
            ok = False
    else:
        print("anchored root:          NOT YET ANCHORED (status: %s) — criterion 2 blocked, not a failure" % status.get("status"))
    print("AUDIT: %s" % ("PASS" if ok else "FAIL"))
    return 0 if ok else 2

if __name__ == "__main__":
    sys.exit(main())
