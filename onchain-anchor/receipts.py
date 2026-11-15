#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — canonical verification receipt schema v1.1.

The single receipt format for the estate (convergence spec items 3 and 76).
One chain format for observation, forecast, outcome, gate, promotion,
verification, anchor, and build receipts.

Rules (identical in verify.js):
- receipt_version is "1.1" (the schema version; distinct from the verifier
  tool version 2.0.0 and the manifest schema version 2.0).
- receipt_hash = SHA-256 of the canonical JSON of the receipt with
  receipt_hash and receipt_id removed. receipt_id is defined to equal
  receipt_hash, so it cannot be part of its own hash input.
- prev_hash links to the previous receipt's receipt_hash, or "GENESIS".
- Every major receipt carries the current manifest Merkle root
  (merkle_root) and, once an anchor exists, the on-chain anchored root
  (anchor_root, null until then).
- A record hash (a forecast's own receipt, an observation_id) lives inside
  payload; the canonical receipt wraps the record hash and chains it.

Stdlib only. No network, no wallet, no keys.
"""
import json, hashlib

RECEIPT_VERSION = "1.1"
ACTIONS = ("observation", "forecast", "outcome", "gate", "promotion",
           "verification", "anchor", "build")
HEX64 = set("0123456789abcdef")

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def make_receipt(action, actor, payload, prev_hash="GENESIS", merkle_root=None,
                 anchor_root=None, timestamp=None, root=None, verifier_version=None):
    """Build one canonical v1.1 receipt. Returns the receipt dict."""
    if action not in ACTIONS:
        raise ValueError("bad action " + str(action))
    if not isinstance(payload, dict):
        raise ValueError("payload must be an object")
    body = {
        "receipt_version": RECEIPT_VERSION,
        "action": action,
        "actor": actor,
        "timestamp": timestamp or _now_iso(),
        "prev_hash": prev_hash,
        "merkle_root": merkle_root,
        "anchor_root": anchor_root,
        "payload": payload,
    }
    if root is not None:
        body["root"] = root
    if verifier_version is not None:
        body["verifier_version"] = verifier_version
    h = sha256(canonical(body))
    body["receipt_hash"] = h
    body["receipt_id"] = h
    return body

def verify_receipt_chain(receipts):
    """Verify a list of canonical v1.1 receipts. Returns (ok, error, index)."""
    prev = "GENESIS"
    for i, r in enumerate(receipts):
        if not isinstance(r, dict):
            return False, "receipt %d is not an object" % i, i
        if r.get("receipt_version") != RECEIPT_VERSION:
            return False, "receipt %d receipt_version is not 1.1" % i, i
        if r.get("prev_hash") != prev:
            return False, "receipt %d prev_hash does not link" % i, i
        if r.get("receipt_id") != r.get("receipt_hash"):
            return False, "receipt %d receipt_id does not equal receipt_hash" % i, i
        body = {k: v for k, v in r.items() if k not in ("receipt_hash", "receipt_id")}
        if sha256(canonical(body)) != r.get("receipt_hash"):
            return False, "receipt %d receipt_hash mismatch" % i, i
        if not isinstance(r.get("receipt_hash"), str) or len(r["receipt_hash"]) != 64 \
                or not set(r["receipt_hash"]) <= HEX64:
            return False, "receipt %d receipt_hash is not 64 lowercase hex" % i, i
        prev = r["receipt_hash"]
    return True, None, None

def _now_iso():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

if __name__ == "__main__":
    # Self-test: a 3-receipt chain, then tamper and confirm rejection.
    r1 = make_receipt("verification", "anchor-v2 (receipts.py)", {"kind": "membership", "result": "VERIFIED"}, merkle_root="0" * 64)
    r2 = make_receipt("observation", "measurement-loop", {"observation_id": "a" * 64}, prev_hash=r1["receipt_hash"], merkle_root="0" * 64)
    r3 = make_receipt("forecast", "measurement-loop", {"forecast_id": "RF-001", "record_hash": "b" * 64}, prev_hash=r2["receipt_hash"], merkle_root="0" * 64)
    ok, err, idx = verify_receipt_chain([r1, r2, r3])
    print("chain valid:", ok, err)
    assert ok
    # Tamper: flip one character in a payload.
    bad = json.loads(json.dumps(r2)); bad["payload"]["observation_id"] = "c" * 64
    ok2, err2, idx2 = verify_receipt_chain([r1, bad, r3])
    print("tampered chain rejected:", not ok2, "|", err2, "| index", idx2)
    assert not ok2
    # Truncation: drop the last receipt, then claim the chain is complete.
    ok3, _, _ = verify_receipt_chain([r1, r2])
    print("truncated chain is internally valid (2/3) but incomplete: count", len([r1, r2]), "vs expected 3")
    print("receipt_schema_version:", RECEIPT_VERSION)
