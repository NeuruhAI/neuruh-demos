#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — the single offline receipt-chain verifier
(convergence spec item 4; hardening items 47-49).

Accepts ANY demo's exported receipt chain (a JSONL file, one canonical
receipt v1.1 per line, as exported by the verify page or any demo that uses
the canonical receipt schema) and recomputes every receipt_hash from its
body, checking the prev_hash chain. The chain logic lives in receipts.py;
this file is the CLI front end. Exit 0 when the chain is VALID, 1 otherwise.
Stdlib only. No network.
"""
import json, sys
from receipts import verify_receipt_chain, RECEIPT_VERSION

def load_receipts(path):
    receipts = []
    with open(path, "r", encoding="utf-8") as f:
        for ln, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                receipts.append(json.loads(line))
            except json.JSONDecodeError as e:
                return None, "line %d is not valid JSON: %s" % (ln, e)
    return receipts, None

def verify_chain(path):
    receipts, err = load_receipts(path)
    if err:
        return False, err
    if not receipts:
        return False, "no receipts in file"
    ok, verr, idx = verify_receipt_chain(receipts)
    if not ok:
        return False, "chain BROKEN at receipt %d: %s" % (idx, verr)
    return True, "chain VALID (%s): %d receipts, all hashes recompute, all links intact" % (
        RECEIPT_VERSION, len(receipts))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: python3 verify_receipts.py <verification-log.jsonl>", file=sys.stderr)
        sys.exit(2)
    ok, msg = verify_chain(sys.argv[1])
    print(msg)
    sys.exit(0 if ok else 1)
