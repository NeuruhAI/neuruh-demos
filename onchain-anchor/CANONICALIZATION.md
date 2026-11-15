# Byte-level canonicalization — Neuruh On-Chain Anchor v2.0

So a third party can reimplement the Merkle tree from scratch and get the
same root. No trust in Neuruh's code is required; only these rules and SHA-256.

## 1. The entry (leaf input)

A manifest entry is a JSON object with exactly these fields (item 1):

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable identifier (registry slug, or `obs-<hash16>` for observations) |
| `kind` | string | `site`, `paper`, `document`, `ledger`, `tool`, `manifest`, `observation` |
| `url_or_source` | string or null | Human-facing locator (URL for sites, workspace path for local files) |
| `sha256` | string (64 lowercase hex) or null | **Content hash**: SHA-256 of the artifact's raw bytes. Null only when `status` is `pending`. |
| `retrieved_at` | string | ISO-8601 timestamp of the fetch/hash |
| `raw_bytes_locator` | string | Machine-facing pointer to the exact bytes (final URL after redirects, or the file path) |
| `schema_version` | string | Always `"2.0"` in v2 |
| `content_type` | string or null | MIME type where known (`text/html`, `text/markdown`, `application/json`, ...) |
| `content_length` | integer or null | Byte length of the hashed artifact |
| `status` | string | `verified`, `pending`, or `superseded` |

Status transitions (item 14): `pending` -> `verified` (when the stored hash
matches a recompute), `verified` -> `superseded` (when a newer entry for the
same id is added). `superseded` is terminal; a superseded entry is never
un-superseded. Its old hash stays in the manifest and stays verifiable.

## 2. Canonical JSON (the exact bytes that get hashed)

1. Take the entry object.
2. Sort its keys **bytewise** (plain lexicographic order on the UTF-8 bytes
   of the key; all v2 keys are ASCII, so this is ordinary alphabetical order).
3. Serialize with **no whitespace**: separators are `,` between members and
   `:` between key and value.
4. Strings are JSON strings (double quotes, with the standard JSON escapes
   for `"`, `\`, and control characters; all other characters raw).
5. Numbers are JSON numbers (integers print as integers; no floats appear
   in v2 entries).
6. `null` prints as `null`.
7. The result is encoded as **UTF-8**.

Python: `json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")`.
JavaScript: the recursive `canonicalStringify` in `verify.js` (it sorts keys
at every level; `JSON.stringify` handles the string escaping identically
for the ASCII content in v2 entries).

Example (from `test-vectors.json`, vector `canonicalization`): the entry
`{"id":"test-1",...}` canonicalizes to a single line with no spaces; its
SHA-256 is the leaf hash. If your reimplementation produces a different
byte string, your leaf hash will differ — that is the check working.

## 3. Leaf hash (item 4)

`leaf = SHA-256(canonical_json_bytes)`.

Why hash the entry JSON and not the raw file? The raw file's hash is the
**content hash** (stored in the entry's `sha256` field). The leaf hashes
the entry, which binds the content hash together with its provenance
(id, source, retrieval time, content type, length, status). A leaf therefore
commits to *what the bytes are and where they came from*, not just the bytes.
Content hash and entry hash are different values and are labeled separately
everywhere they appear (item 58).

## 4. Parent hash (item 5)

`parent = SHA-256(left_32_bytes || right_32_bytes)` where each child is the
raw 32-byte digest (not its hex string). Concatenate left then right, hash
once. Published test vector (see `test-vectors.json`, `parent_test_vector`):
given two fixed 64-hex child hashes, the expected parent is fixed.

## 5. Odd levels (item 3)

When a level has an odd number of nodes, the last node is duplicated
(paired with itself) before hashing upward. This is the standard Merkle
rule and it is tested with 3- and 5-leaf vectors.

## 6. Empty tree and single leaf (item 12)

- Empty tree (zero leaves): root = SHA-256 of zero bytes
  (`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).
- Single leaf: root = the leaf hash itself.

## 7. Leaf ordering (item 13, locked)

Leaves are ordered deterministically and the order is part of the root:

1. The 181 sites in registry order (`final-working-sites.json` order, then
   the three added sites: threat-deterrence-console, unified-swarm,
   solution-swarm).
2. The 7 papers, in the order listed in the builder.
3. The 3 documents, in builder order.
4. The 4 ledgers, in builder order.
5. The self entries, in the order listed in the manifest's `self_entries`
   array (page, verifier, manifest-content, then the build tools, then the
   retained v1 artifacts).

Re-running the builder with unchanged inputs must produce the same order;
the test suite asserts the entry id list.

## 8. The root

Repeat the parent rule level by level until one hash remains. That hash is
the Merkle root. The v2 manifest publishes two roots: `estate_root` (over
the 195 estate entries only, also baked into the verify page) and
`merkle_root` (over all entries + self entries). The page recomputes both
and both must match.

## 9. The manifest's own hash (item 100)

A file cannot contain its own hash. The v2 manifest therefore commits to
itself in two honest ways:

- The `manifest-content` self leaf is the SHA-256 of the canonical JSON of
  the `entries` array (the exact estate entry list). It is labeled
  `manifest-content`, not `manifest-file`.
- The manifest file's own SHA-256 is published beside it in
  `manifest-v2.sha256` and in `status.json` (field `manifest_sha256`).

The v2 page, the v2 verifier, and the v2 tooling are leaves in the v2
manifest; the v2 manifest file itself will be a leaf in the next manifest
(v3), which is the "subsequent manifest" of the spec.

## 10. Receipts

A verification receipt is a JSON object with `receipt_version`, `action`,
`inputs`, `root`, `result`, `timestamp`, `prev_hash`, `verifier_version`,
and `receipt_hash`. `receipt_hash` = SHA-256 of the canonical JSON of the
receipt body **without** the `receipt_hash` field. The chain starts at
`prev_hash: "GENESIS"`. See `verify_receipts.py` for the independent
recomputation.
