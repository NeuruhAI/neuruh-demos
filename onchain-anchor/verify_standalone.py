#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — single-file air-gapped verifier (item 89).
Runs with Python 3 stdlib only. No network, no dependencies, no install.
Copy this one file plus a manifest onto an air-gapped machine and verify.

Usage:
  python3 verify_standalone.py manifest-v2.json --root
  python3 verify_standalone.py manifest-v2.json --hash <sha256>
  python3 verify_standalone.py manifest-v2.json --file <path>
"""
import argparse, hashlib, json, sys

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

def main():
    ap = argparse.ArgumentParser(description="Air-gapped single-file verifier for the Neuruh On-Chain Anchor v2.")
    ap.add_argument("manifest")
    ap.add_argument("--hash", dest="hash")
    ap.add_argument("--file")
    ap.add_argument("--root", action="store_true")
    args = ap.parse_args()
    m = json.load(open(args.manifest, "r", encoding="utf-8"))
    entries = list(m["entries"]) + list(m["self_entries"])
    leaves = [leaf_hash(e) for e in entries]
    levels = build_levels(leaves)
    root = levels[-1][0] if leaves else sha256(b"")
    if args.root:
        print("recomputed: %s" % root)
        print("published:  %s" % m["merkle_root"])
        print("estate:     %s" % m["estate_root"])
        print("leaves: %d (estate %d + self %d)" % (len(entries), len(m["entries"]), len(m["self_entries"])))
        print("MATCH" if root == m["merkle_root"] else "MISMATCH")
        return 0 if root == m["merkle_root"] else 2
    target = None
    if args.hash:
        target = args.hash.strip().lower()
    elif args.file:
        target = sha256(open(args.file, "rb").read())
        print("file sha256: %s" % target)
    else:
        ap.error("give --hash, --file, or --root")
    for i, e in enumerate(entries):
        if (e.get("sha256") or "").lower() == target:
            leaf = leaves[i]
            path = get_path(i, levels)
            ok = verify_path(leaf, path, m["merkle_root"])
            print("entry: %s (%s)" % (e["id"], e["kind"]))
            print("leaf:  %s (#%d of %d)" % (leaf, i + 1, len(entries)))
            for j, step in enumerate(path):
                print("  %d. %s: %s" % (j + 1, step["side"], step["hash"]))
            print("MEMBERSHIP VERIFIED" if ok else "PATH INVALID")
            return 0 if ok else 2
    print("NOT FOUND: no entry has that content hash")
    return 1

if __name__ == "__main__":
    sys.exit(main())
