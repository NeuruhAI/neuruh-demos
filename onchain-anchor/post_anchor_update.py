#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — post-anchor updater (items 37, 83).
Run ONLY after a real chain write exists and Jeramie has approved it.
Injects the txid / .ots proof into the page (removes the SIMULATION badge),
updates status.json, and records block height/time. It never makes a write
itself and refuses to run without an approval record (item 45).

Usage:
  python3 post_anchor_update.py --txid <txhash> --chain base --block-height 123456
  python3 post_anchor_update.py --ots manifest-v2.json.ots --chain opentimestamps
"""
import argparse, hashlib, json, os, re, sys
from datetime import datetime, timezone

WORK = os.path.expanduser("~/workspace/onchain-anchor")

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def main():
    ap = argparse.ArgumentParser(description="Record a completed on-chain anchor (human-approved only).")
    ap.add_argument("--txid", help="transaction hash or signature")
    ap.add_argument("--ots", help="path to the .ots proof file")
    ap.add_argument("--chain", required=True, choices=["opentimestamps", "solana", "base", "polygon"])
    ap.add_argument("--block-height", type=int)
    ap.add_argument("--block-time")
    args = ap.parse_args()
    if not args.txid and not args.ots:
        ap.error("give --txid or --ots (or both)")
    approval = os.path.join(WORK, "anchor-approval.txt")
    if not os.path.exists(approval):
        print("STOP: no human approval record at %s. Create it first." % approval, file=sys.stderr)
        return 1
    print("approval on file: %s" % open(approval).read().strip())
    manifest = json.load(open(os.path.join(WORK, "manifest-v2.json")))
    status = json.load(open(os.path.join(WORK, "status.json")))
    anchor = {
        "chain": args.chain,
        "txid": args.txid,
        "ots_file": args.ots,
        "root": manifest["merkle_root"],
        "manifest_sha256": sha256(open(os.path.join(WORK, "manifest-v2.json"), "rb").read()),
        "block_height": args.block_height,
        "block_time": args.block_time,
        "anchored_at": datetime.now(timezone.utc).isoformat(),
        "status": "confirmed",
    }
    if args.ots:
        anchor["ots_sha256"] = sha256(open(args.ots, "rb").read())
    status.update({
        "anchored": True,
        "status": "confirmed",
        "chain": args.chain,
        "txid": args.txid,
        "ots_file": args.ots,
        "anchor_root": manifest["merkle_root"],
        "block_height": args.block_height,
        "block_time": args.block_time,
        "anchored_at": anchor["anchored_at"],
    })
    with open(os.path.join(WORK, "status.json"), "w") as f:
        json.dump(status, f, indent=2)
    with open(os.path.join(WORK, "anchor-receipt.json"), "w") as f:
        json.dump(anchor, f, indent=2)
    # Update the page: remove the SIMULATION badge, add the anchor proof.
    page_path = os.path.join(WORK, "index.html")
    page = open(page_path).read()
    if "SIMULATION — NOT YET ON-CHAIN" not in page:
        print("page already updated (no SIMULATION badge found).")
    else:
        proof = (
            '<p><span class="badge" style="background:#123a1e;color:#7ed67e;border-color:#4caf50">'
            "ANCHORED ON-CHAIN</span></p>"
            '<p>Chain: <b>%s</b>. Transaction: <span class="mono">%s</span>. '
            "Block: %s. Anchored: %s.</p>"
            % (args.chain, args.txid or "(see .ots proof)", args.block_height or "—", anchor["anchored_at"])
        )
        page = page.replace(
            '<p><span class="badge">SIMULATION — NOT YET ON-CHAIN</span></p>', proof, 1)
        open(page_path, "w").write(page)
        print("page updated: SIMULATION badge removed, anchor proof added.")
    print("status.json and anchor-receipt.json written.")
    print("NEXT: redeploy index.html + status.json + anchor-receipt.json to GitHub Pages,")
    print("then re-run audit_anchor.py — it must show page root == recomputed root == anchored root.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
