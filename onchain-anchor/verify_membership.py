#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — "verify membership" CLI (item 81).
Usage:
  python3 verify_membership.py --manifest manifest-v2.json --hash <sha256>
  python3 verify_membership.py --manifest manifest-v2.json --url <url>
  python3 verify_membership.py --manifest manifest-v2.json --file <path>
  python3 verify_membership.py --manifest manifest-v2.json --root
Prints the Merkle path and whether it recomputes to the published root.
Exit 0 on VERIFIED, 1 on NOT FOUND, 2 on PATH INVALID, 3 on manifest error.
Stdlib only. No network.
"""
import argparse, hashlib, json, os, sys

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def leaf_hash(entry):
    return sha256(canonical(entry))

def build_levels(leaf_hexes):
    if not leaf_hexes:
        return [[]]
    levels = [leaf_hexes[:]]
    while len(levels[-1]) > 1:
        prev, nxt = levels[-1], []
        for i in range(0, len(prev), 2):
            left = bytes.fromhex(prev[i])
            right = bytes.fromhex(prev[i + 1] if i + 1 < len(prev) else prev[i])
            nxt.append(hashlib.sha256(left + right).hexdigest())
        levels.append(nxt)
    return levels

def get_path(index, levels):
    path, idx = [], index
    for level in levels[:-1]:
        is_right = idx % 2 == 1
        sib = idx - 1 if is_right else idx + 1
        if sib >= len(level):
            sib = idx
        path.append({"hash": level[sib], "side": "left" if is_right else "right"})
        idx //= 2
    return path

def verify_path(leaf_hex, path, root):
    cur = bytes.fromhex(leaf_hex)
    for step in path:
        sib = bytes.fromhex(step["hash"])
        cur = hashlib.sha256(sib + cur if step["side"] == "left" else cur + sib).digest()
    return cur.hex() == root

ENTRY_FIELDS = {"id", "kind", "url_or_source", "sha256", "retrieved_at",
                "raw_bytes_locator", "schema_version", "content_type",
                "content_length", "status"}

def validate_manifest(m):
    errs = []
    for k in ("tool", "owner", "anchor_date", "created_at", "merkle_root", "leaf_count",
              "estate_root", "estate_leaf_count", "schema_version", "entries", "self_entries"):
        if k not in m:
            errs.append("missing top-level field " + k)
    if m.get("schema_version") != "2.0":
        errs.append("schema_version must be 2.0")
    for section in ("entries", "self_entries"):
        for i, e in enumerate(m.get(section, [])):
            unknown = set(e) - ENTRY_FIELDS
            if unknown:
                errs.append("%s[%d]: unknown fields %s" % (section, i, sorted(unknown)))
            missing = ENTRY_FIELDS - set(e)
            if missing:
                errs.append("%s[%d]: missing fields %s" % (section, i, sorted(missing)))
            h = e.get("sha256")
            if h is not None and (not isinstance(h, str) or len(h) != 64 or any(c not in "0123456789abcdef" for c in h)):
                errs.append("%s[%d]: sha256 must be null or 64 lowercase hex" % (section, i))
            if e.get("status") not in ("verified", "pending", "superseded"):
                errs.append("%s[%d]: bad status" % (section, i))
    n = len(m.get("entries", [])) + len(m.get("self_entries", []))
    if m.get("leaf_count") != n:
        errs.append("leaf_count %s != entries + self_entries (%d)" % (m.get("leaf_count"), n))
    return errs

def load_manifest(path):
    with open(path, "rb") as f:
        raw = f.read()
    m = json.loads(raw.decode("utf-8"))
    errs = validate_manifest(m)
    if errs:
        print("MANIFEST INVALID:", file=sys.stderr)
        for e in errs:
            print("  - " + e, file=sys.stderr)
        sys.exit(3)
    return m, raw

def all_entries(m):
    return list(m["entries"]) + list(m["self_entries"])

def show(entry, index, m):
    entries = all_entries(m)
    leaves = [leaf_hash(e) for e in entries]
    levels = build_levels(leaves)
    root = levels[-1][0] if leaves else sha256(b"")
    leaf = leaves[index]
    path = get_path(index, levels)
    ok = verify_path(leaf, path, m["merkle_root"])
    print("ENTRY: %s (%s)" % (entry["id"], entry["kind"]))
    print("CONTENT SHA-256: %s" % entry.get("sha256"))
    print("LEAF HASH: %s (leaf #%d of %d)" % (leaf, index + 1, len(entries)))
    print("MERKLE PATH (%d steps):" % len(path))
    for i, step in enumerate(path):
        print("  %d. sibling on the %s: %s" % (i + 1, step["side"], step["hash"]))
    print("RECOMPUTED ROOT: %s" % root)
    print("PUBLISHED ROOT:   %s" % m["merkle_root"])
    print("RESULT: %s" % ("MEMBERSHIP VERIFIED" if ok and root == m["merkle_root"] else "PATH INVALID"))
    return 0 if (ok and root == m["merkle_root"]) else 2

def main():
    ap = argparse.ArgumentParser(description="Verify membership in the Neuruh On-Chain Anchor v2 manifest.")
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--hash", dest="hash")
    ap.add_argument("--url")
    ap.add_argument("--file")
    ap.add_argument("--root", action="store_true", help="recompute the root and compare to the published root")
    args = ap.parse_args()
    m, _raw = load_manifest(args.manifest)
    entries = all_entries(m)
    if args.root:
        leaves = [leaf_hash(e) for e in entries]
        levels = build_levels(leaves)
        root = levels[-1][0] if leaves else sha256(b"")
        print("RECOMPUTED ROOT: %s" % root)
        print("PUBLISHED ROOT:   %s" % m["merkle_root"])
        print("ESTATE ROOT:     %s" % m["estate_root"])
        print("LEAF COUNT: %d (estate %d + self %d)" % (len(entries), len(m["entries"]), len(m["self_entries"])))
        if root == m["merkle_root"]:
            print("RESULT: MATCH")
            return 0
        print("RESULT: MISMATCH")
        return 2
    entry, index = None, None
    if args.hash:
        h = args.hash.strip().lower()
        for i, e in enumerate(entries):
            if (e.get("sha256") or "").lower() == h:
                entry, index = e, i
                break
        if entry is None:
            print("NOT FOUND: no manifest entry has content hash %s" % h)
            return 1
    elif args.url:
        u = args.url.strip().rstrip("/")
        for i, e in enumerate(entries):
            if (e.get("url_or_source") or "").rstrip("/") == u or e.get("id") == args.url.strip():
                entry, index = e, i
                break
        if entry is None:
            print("NOT FOUND: no manifest entry matches URL or id %s" % args.url)
            return 1
    elif args.file:
        data = open(args.file, "rb").read()
        h = sha256(data)
        print("FILE SHA-256: %s (%d bytes)" % (h, len(data)))
        for i, e in enumerate(entries):
            if (e.get("sha256") or "").lower() == h:
                entry, index = e, i
                break
        if entry is None:
            print("NOT FOUND: no manifest entry has that content hash")
            return 1
    else:
        ap.error("give --hash, --url, --file, or --root")
    return show(entry, index, m)

if __name__ == "__main__":
    sys.exit(main())
