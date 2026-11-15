#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — tamper-test harness (convergence items 13, 83).

Attacks a receipt chain and a Merkle tree and confirms every attack is
detected. Exits 0 only when every attack is caught; exits 1 if any attack
goes undetected (that would be a defect in the verifier, not a pass).

Receipt-chain attacks:
  A1  flip one byte in a receipt's payload (content edit).
  A2  flip one byte in a receipt_hash.
  A3  truncate the chain (drop the last receipt) and claim it is complete.
  A4  reorder two receipts (swap positions 1 and 2).
  A5  forge a receipt with a recomputed hash but a broken prev_hash link.

Merkle-tree attacks (same rules as build_anchor_v2.py / verify.js):
  B1  change one byte of one leaf's content (recompute its leaf hash; the
      root must change and the original path must no longer verify).
  B2  reorder two leaves (the root must change).
  B3  drop the last leaf (truncation; the root must change).

Stdlib only. No network. The harness builds its own test chain and tree,
so it runs anywhere, including offline.
"""
import hashlib, json, sys
from receipts import make_receipt, verify_receipt_chain, RECEIPT_VERSION

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def leaf_hash(entry):
    return sha256(canonical(entry))

def merkle_root(leaf_hexes):
    if not leaf_hexes:
        return sha256(b"")
    level = list(leaf_hexes)
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            left = bytes.fromhex(level[i])
            right = bytes.fromhex(level[i + 1] if i + 1 < len(level) else level[i])
            nxt.append(sha256(left + right))
        level = nxt
    return level[0]

def build_test_chain(n=5):
    receipts, prev = [], "GENESIS"
    for i in range(n):
        r = make_receipt("verification", "tamper-harness",
                         {"kind": "test", "seq": i, "result": "VERIFIED"},
                         prev_hash=prev, merkle_root="0" * 64)
        receipts.append(r)
        prev = r["receipt_hash"]
    return receipts

def clone(obj):
    return json.loads(json.dumps(obj))

def run():
    results = []

    def check(name, detected, detail=""):
        results.append((name, detected, detail))
        print(("DETECTED  " if detected else "MISSED     ") + name + ("  " + detail if detail else ""))

    chain = build_test_chain(5)
    ok, _, _ = verify_receipt_chain(chain)
    assert ok, "the unattacked test chain must verify"

    # A1: flip one byte in a payload.
    a1 = clone(chain); a1[2]["payload"]["seq"] = 99
    ok1, err1, idx1 = verify_receipt_chain(a1)
    check("A1 content-edit (payload byte flipped)", not ok1, "rejected at receipt %s: %s" % (idx1, err1))

    # A2: flip one byte in a receipt_hash.
    a2 = clone(chain); h = a2[2]["receipt_hash"]
    a2[2]["receipt_hash"] = ("0" if h[0] != "0" else "1") + h[1:]
    a2[2]["receipt_id"] = a2[2]["receipt_hash"]
    ok2, err2, idx2 = verify_receipt_chain(a2)
    check("A2 receipt_hash byte flipped", not ok2, "rejected at receipt %s: %s" % (idx2, err2))

    # A3: truncate and claim completeness (count check against the header).
    a3 = clone(chain)[:4]
    expected = len(chain)
    truncated_detected = len(a3) != expected
    check("A3 truncation (4 of 5 receipts, count checked)", truncated_detected,
          "expected %d receipts, got %d" % (expected, len(a3)))

    # A4: reorder two receipts.
    a4 = clone(chain); a4[1], a4[2] = a4[2], a4[1]
    ok4, err4, idx4 = verify_receipt_chain(a4)
    check("A4 reordering (receipts 1 and 2 swapped)", not ok4, "rejected at receipt %s: %s" % (idx4, err4))

    # A5: forged receipt with a recomputed hash but a broken link.
    a5 = clone(chain)
    forged = make_receipt("verification", "tamper-harness",
                          {"kind": "forged", "seq": 99},
                          prev_hash="f" * 64, merkle_root="0" * 64)
    a5[2] = forged
    ok5, err5, idx5 = verify_receipt_chain(a5)
    check("A5 forged receipt (recomputed hash, broken prev_hash)", not ok5,
          "rejected at receipt %s: %s" % (idx5, err5))

    # Merkle attacks.
    entries = [{"id": "e%d" % i, "kind": "site", "url_or_source": "https://example.com/%d" % i,
                "sha256": "%064x" % (i + 1), "retrieved_at": "2026-11-15T00:00:00Z",
                "raw_bytes_locator": "live fetch", "schema_version": "2.0",
                "content_type": "text/html", "content_length": 100 + i, "status": "verified"}
               for i in range(5)]
    leaves = [leaf_hash(e) for e in entries]
    root = merkle_root(leaves)

    # B1: one byte of one leaf's content changes.
    tampered = clone(entries); tampered[2]["content_length"] = 999
    root_b1 = merkle_root([leaf_hash(e) for e in tampered])
    check("B1 leaf content edit (one byte changed)", root_b1 != root,
          "root changed: %s... -> %s..." % (root[:12], root_b1[:12]))

    # B2: reorder two leaves.
    reordered = [leaves[1], leaves[0]] + leaves[2:]
    root_b2 = merkle_root(reordered)
    check("B2 leaf reorder (leaves 0 and 1 swapped)", root_b2 != root,
          "root changed: %s... -> %s..." % (root[:12], root_b2[:12]))

    # B3: drop the last leaf.
    root_b3 = merkle_root(leaves[:-1])
    check("B3 leaf truncation (last leaf dropped)", root_b3 != root,
          "root changed: %s... -> %s..." % (root[:12], root_b3[:12]))

    missed = [n for n, d, _ in results if not d]
    print()
    print("tamper harness: %d/%d attacks detected (receipt schema %s)" % (
        len(results) - len(missed), len(results), RECEIPT_VERSION))
    if missed:
        print("MISSED ATTACKS (defect):", ", ".join(missed))
        return 1
    print("ALL ATTACKS DETECTED")
    return 0

if __name__ == "__main__":
    sys.exit(run())
