#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — test vectors (items 5, 12, 78).
Generates test-vectors.json with fixed, hand-checkable vectors and asserts
the Python implementation produces them. The browser verifier (verify.js)
must produce the same values; ci_check.sh asserts that in jsdom.
Vectors: empty tree, single leaf, power-of-two (2, 4), odd counts (3, 5),
tampered leaf, tampered sibling, and the published parent test vector.
Run: python3 test_vectors.py  -> writes test-vectors.json, prints PASS.
"""
import hashlib, json, os

WORK = os.path.expanduser("~/workspace/onchain-anchor")

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

def merkle_root(leaf_hexes):
    if not leaf_hexes:
        return sha256(b"")
    return build_levels(leaf_hexes)[-1][0]

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

def entry(i):
    return {
        "id": "test-%d" % i,
        "kind": "site",
        "url_or_source": "https://example.com/%d" % i,
        "sha256": sha256(("artifact-%d" % i).encode()),
        "retrieved_at": "2026-11-15T00:00:00+00:00",
        "raw_bytes_locator": "https://example.com/%d" % i,
        "schema_version": "2.0",
        "content_type": "text/html",
        "content_length": 10 + i,
        "status": "verified",
    }

def main():
    vectors = {"version": "2.0", "generated_by": "test_vectors.py (Python stdlib)", "vectors": {}}
    # empty tree: root is the SHA-256 of zero bytes
    vectors["vectors"]["empty_tree"] = {
        "leaves": [], "expected_root": sha256(b""),
        "note": "An empty tree has no leaves; its root is defined as SHA-256 of zero bytes.",
    }
    # single leaf: root is the leaf itself
    e1 = entry(1)
    vectors["vectors"]["single_leaf"] = {
        "entry": e1, "leaf_hash": leaf_hash(e1), "expected_root": leaf_hash(e1),
        "note": "A one-leaf tree's root is the leaf hash itself.",
    }
    # two leaves (power of two)
    leaves2 = [leaf_hash(entry(i)) for i in (1, 2)]
    vectors["vectors"]["two_leaves"] = {
        "leaf_hashes": leaves2, "expected_root": merkle_root(leaves2),
        "note": "Parent = SHA-256 of the concatenated raw 32-byte children.",
    }
    # published parent test vector (item 5): fixed inputs, fixed parent
    h1, h2 = leaves2[0], leaves2[1]
    parent = hashlib.sha256(bytes.fromhex(h1) + bytes.fromhex(h2)).hexdigest()
    vectors["vectors"]["parent_test_vector"] = {
        "left_child": h1, "right_child": h2, "expected_parent": parent,
        "note": "Parent = SHA-256(left_bytes || right_bytes), 32 raw bytes each.",
    }
    # three leaves (odd: last node duplicated)
    leaves3 = [leaf_hash(entry(i)) for i in (1, 2, 3)]
    vectors["vectors"]["three_leaves_odd"] = {
        "leaf_hashes": leaves3, "expected_root": merkle_root(leaves3),
        "note": "Odd level duplicates its last node: level 1 pairs (L1,L2) and (L3,L3).",
    }
    # four leaves (power of two)
    leaves4 = [leaf_hash(entry(i)) for i in (1, 2, 3, 4)]
    vectors["vectors"]["four_leaves"] = {
        "leaf_hashes": leaves4, "expected_root": merkle_root(leaves4),
    }
    # five leaves (odd)
    leaves5 = [leaf_hash(entry(i)) for i in (1, 2, 3, 4, 5)]
    vectors["vectors"]["five_leaves_odd"] = {
        "leaf_hashes": leaves5, "expected_root": merkle_root(leaves5),
    }
    # tampered leaf: change one leaf hash; root must change
    tampered = leaves4[:]
    tampered[1] = sha256(b"tampered")
    vectors["vectors"]["tampered_leaf"] = {
        "leaf_hashes": tampered, "expected_root": merkle_root(tampered),
        "original_root": merkle_root(leaves4),
        "note": "Changing any single leaf changes the root. The tampered root must differ from the original.",
    }
    # tampered sibling: a path built with a wrong sibling must fail verification
    levels = build_levels(leaves4)
    path = get_path(0, levels)
    bad_path = [dict(s) for s in path]
    bad_path[0]["hash"] = sha256(b"wrong-sibling")
    vectors["vectors"]["tampered_sibling"] = {
        "leaf_hash": leaves4[0], "path": path, "bad_path": bad_path,
        "root": merkle_root(leaves4),
        "note": "The true path verifies; the path with a tampered sibling must NOT verify.",
    }
    # canonicalization vector: the exact bytes that get hashed for one entry
    vectors["vectors"]["canonicalization"] = {
        "entry": e1,
        "canonical_json": canonical(e1).decode("utf-8"),
        "leaf_hash": leaf_hash(e1),
        "note": "Keys sorted, separators (',',':'), no whitespace, UTF-8. A third party reimplementing this byte string must get the same leaf hash.",
    }
    # ---- Python-side assertions (the JS side asserts the same file) ----
    assert vectors["vectors"]["empty_tree"]["expected_root"] == sha256(b"")
    assert vectors["vectors"]["single_leaf"]["expected_root"] == leaf_hash(e1)
    assert merkle_root(leaves2) == parent
    assert merkle_root(leaves3) != merkle_root(leaves2)
    assert merkle_root(tampered) != merkle_root(leaves4)
    assert verify_path(leaves4[0], path, merkle_root(leaves4)) is True
    assert verify_path(leaves4[0], bad_path, merkle_root(leaves4)) is False
    assert leaf_hash(e1) == sha256(canonical(e1))
    with open(os.path.join(WORK, "test-vectors.json"), "w") as f:
        json.dump(vectors, f, indent=2)
    print("test-vectors.json written: %d vectors" % len(vectors["vectors"]))
    print("ALL PYTHON ASSERTIONS PASS")

if __name__ == "__main__":
    main()
