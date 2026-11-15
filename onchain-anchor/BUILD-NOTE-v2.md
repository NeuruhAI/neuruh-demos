# On-Chain Anchor v2 — build note (2026-11-15)

## Live

- Page: https://neuruhai.github.io/neuruh-demos/onchain-anchor/
- Source: ~/workspace/onchain-anchor/ (builder: build_anchor_v2.py)
- Hub: NOT touched (parent hub-cards it after).

## Roots and counts

- v1 root: `0bdc4c196e2c80664f06c23cc36b0417e0121687233dfc390ac23235835cf3fd` (195 leaves: 181 sites, 7 papers, 3 documents, 4 ledgers). Retained.
- v2 estate root: `c83c79a84e6fc3c0593516ecf56fc8ebe73156289dfb2cf9ded9f77ce4c1f121` (204 estate leaves).
- v2 full root: `afd56cea3e4abe9265f83c3552cddebac2771ab6d5d50012a641695fd8b8777f` (235 leaves: 204 estate + 31 self).
- Sites: 187 (178 registry + 3 v1 newer demos + 6 added in v2). Verified: 235. Unverified: 0.
- Manifest file SHA-256: `c3adbc97ab9fd74ec04305f112f3c8107f97b5a8ecdc1ebb7b908143b238e158` (manifest-v2.sha256).
- Page MD5 (local build): `a5eea3b34f4ec8b06c6effe267a35d48` (54,873 bytes). Live MD5 to be confirmed after deploy.
- Verifier: verify.js 2.0.0, SHA-256 `6245e12795c29b8b27e746394ca60f3b947b30456d45af292bbb5c963d3996c7` (pinned in the manifest).
- Receipt schema: canonical v1.1 (receipt-schema.json).
- Anchor status: prepared. No chain write made.

## Why the root changed

Two reasons, both recorded in CHANGELOG.md:
1. The entry canonicalization changed (v2 strict 10-field schema with content_type, content_length, and status; v1 had a looser schema).
2. The estate grew: +6 sites (working-demos, onchain-anchor, done-ledger, neurh-topology, hard-problems-atlas, retardio-measurement-loop) and +3 estate ledgers (demo-inventory.json, brier.json, observations-pilot.jsonl).
- vs v1 (compared per host, keyed by id + URL): 194 unchanged, 1 changed (hub-index, the hub moved to v2.60), 9 added, 0 removed.
- Note: 12 demos exist on two hosts (E-series e2-e12 + sal-content-pipeline, Cloudflare Pages and GitHub Pages) with the same slug but different content. The manifest keeps the slug as the id and distinguishes them by url_or_source; the comparison and the inventory key by (id, host). This is inherited from v1, not introduced in v2.

## Finish criteria (hardening spec, section G)

- Criterion 1 (Python and browser produce identical roots on the full manifest): DEMONSTRATED. `sh ci_check.sh` passes: Python root == JS root == published root (`aa027cd2...`). The "181-entry" wording in the spec is the v1 count; v2 demonstrates it on the full 235-leaf manifest.
- Criterion 2 (an anchoring method executed, txid or .ots published): BLOCKED. Needs Jeramie's chain/wallet choice. The full execution path is built (ots_anchor.sh, Solana memo template, Base/Polygon calldata templates, post_anchor_update.py, anchor status machine, human approval gate). No chain write, no wallet, no spending in this build.
- Criterion 3 (independent reimplementation in a different language matches the root): DEMONSTRATED. verify.js (JavaScript, SubtleCrypto) recomputes the same root as the Python builder; the page does it live on every load.
- Criterion 4 (tamper of a single leaf detected by both the path check and the root recompute): DEMONSTRATED. The page tamper demo, the tamper harness (8/8 attacks detected: content-edit, receipt_hash flip, truncation, reordering, forged receipt, leaf edit, leaf reorder, leaf truncation), and the tampered-leaf/sibling test vectors.
- Criterion 5 (the page, manifest, verifier, and anchor proof are themselves included in a subsequent manifest): DEMONSTRATED. This page, verify.js, and all 31 self files are leaves in v2 (kind tool/document/ledger/manifest). The v2 manifest file itself will be a leaf in v3.

## Hardening spec (100 items, sections A-G) — status

All 100 items are addressed. 94 are done, 5 are built-but-awaiting-the-anchor (they activate when criterion 2 is executed), 1 is not implemented.

- A (1-15, manifest/Merkle): all done.
- B (16-30, verification interface): all done. Item 26 (mobile layout) is responsive CSS; a live mobile check was not run (no live browser in this build).
- C (31-45, anchoring execution path): all built. Items 32 (.ots file), 39 (anchor receipt), 40 (public verification links) have their formats and procedures built; the files/links do not exist until the anchor runs (blocked on criterion 2).
- D (46-60, receipts/audit): done except item 51 and the anchor-dependent parts of 50/52. Item 51 (cross-reference to CRUCIBLE-style eta/citation checks where artifacts are AI-generated) is NOT IMPLEMENTED: no per-artifact AI-generation provenance is recorded in the manifest, so there is nothing to cross-reference yet. The manifest's raw_bytes_locator is the provenance hook for a future version. Item 50 (link from each artifact card to its Merkle path and any later anchor): the path link is done; the anchor link activates after the anchor. Item 52 (on-chain root inside future CRUCIBLE/swarm receipts): the anchor side is done (merkle_root is carried in every v1.1 receipt; anchor_root activates after the anchor); the CRUCIBLE/swarm receipt formats are owned by those systems. Item 60 (long-term archive plan): documented below.
- E (61-75, observation extension): all done. The pilot is REAL: 25 observations from the St. Joseph County IN Assessor ArcGIS (via the Retardio Measurement Loop v1), 20 rapid-flip forecasts issued, all unresolved, 0 entity-cluster / 0 all-cash (formation dates and cash status are not in this source; stated, not faked). Real Brier is NOT YET COMPUTABLE (0 resolved). The one Brier example (0.0605) is labeled ILLUSTRATIVE and demonstrates the arithmetic only. Note: observation.py was corrected in this build — observation_id is the SHA-256 of the canonical PAYLOAD (spec line 23), not of the whole body; an earlier draft hashed the whole body. The loop's documented extensions (source "county_assessor_arcgis", entity_type "parcel_record", extra fields seq/prev_hash/source_extras) are accepted. The loop's observations validate 25/25 against the corrected schema, payload-hash ids 25/25, prev_hash chain intact.
- F (76-90, agent-executable build tasks): all done. Item 89 (air-gapped verifier) is verify_standalone.py (single file, stdlib only, no network).
- G (91-100): 91-95 done (including CSP meta; the page has no external scripts, so subresource integrity has nothing to apply to). 96, 98, 99, 100 demonstrated (see finish criteria). 97 blocked (criterion 2).

## Convergence spec (100 upgrades) — folded into v2

- Sections 1-15 (finish and harden the verified base): all 15 done, except item 5 (below).
  - 1: demo-inventory.json, 187 items, each with verification date, MD5/SHA-256, and the exact interaction confirmed (parsed from the 2026-11-14 checklist, 177 entries, host-specific for the 12 dual-host demos).
  - 2: ci_refetch.py; verified: 187 unchanged, 0 changed, 0 fetch failed. CI PASS.
  - 3: canonical receipt schema v1.1 (receipt-schema.json, receipts.py, verify.js).
  - 4: verify_receipts.py (the single offline verifier for any demo's exported receipt chain) + the page's receipt-chain verifier.
  - 5: hub-card-verification.json generated (per-site last-verified + verifier identity, 187 cards). PREPARED, NOT APPLIED: the hub is the parent's to edit; this build did not touch the hub.
  - 6: unified-chain-regression.js; 6/6 steps pass; the resulting receipt (seq 1, hash c6055c69dc68...) is recorded in unified-chain-regression.json.
  - 7: the anchor page has no external CDN dependencies (verified by scan); nothing to pin. Estate-wide CDN pinning is a per-demo job, not anchor scope.
  - 8: browser-checklist-2026-11-14.md (the verbatim 2026-11-14 checklist + a header recording the outcome: 178 WORKING, 0 PARTIAL, 0 BROKEN).
  - 9: HEURISTIC badges on the 3 verified keyword-bank demos (threat-deterrence-console, unified-swarm, solution-swarm). A full 178-demo audit is open (see code-data-sharing.md).
  - 10: demo-inventory.json is signed (signature 4e5722552ce3f6addc569b4ede19f41bfda5db638b288caf5dde5e998ba786a5) and its hash is a manifest leaf.
  - 11: status.json is the anchor's health endpoint (status + content hash + root + leaf count + anchor txid + last Brier). Per-demo endpoints for the other 186 demos are a per-demo change, not anchor scope.
  - 12: code-data-sharing.md (anchor sharing complete; estate families first pass).
  - 13: tamper-harness.py, 8/8 attacks detected.
  - 14: working-demos is a site entry in v2 (its version is its content hash + fetch date; the page itself carries no version string).
  - 15: the WORKING label rule is stated on the page, in the manifest's labeling_rule, and in done-ledger-integration.md.
- Sections 76-90 (receipts, Merkle, independent audit): all 15 done, except the anchor-dependent parts of 78 and 88 and the application part of 89.
  - 78: BLOCKED (criterion 2). 88: the procedure and location are built; the proof file does not exist until the anchor runs. 89: done-ledger-integration.md is the specification; applying it to the Done Ledger page is the parent's job.
- Sections 91-100: recorded as the finish criteria and acceptance bar on the page (section 10). Explicit non-goal: the system does not become recursively self-modifying general intelligence.
- Sections 16-75 (Layers 1-4): NOT in v2. Recorded in the page and in the manifest's convergence field as the sequence: Measurement Loop v2 (16-45), Layer 3 authority and gates (46-60), Layer 4 measurable learning and promotion (61-75), each as a separate build after the loop produces numbers an independent party can recompute.

## What was NOT implemented (and why)

- Hardening item 51 (CRUCIBLE cross-reference): no per-artifact AI-generation provenance is recorded in the manifest, so there is nothing to cross-reference yet. The manifest's raw_bytes_locator is the hook for a future version.
- Convergence item 5 (hub cards): data prepared (hub-card-verification.json); the hub edit itself is the parent's (this build does not touch the hub).
- Convergence item 89 (Done Ledger evidence hashes): specification written (done-ledger-integration.md); applying it to the Done Ledger page is the parent's job.
- Convergence items 7 and 11 (estate-wide): the anchor page's own parts are done (no CDN deps; status.json is the anchor's health endpoint). The estate-wide application (pinning CDN deps and adding health endpoints on all 186 other demos) is a per-demo job, not anchor scope.
- Finish criterion 2 / convergence item 78 (a real anchor): BLOCKED pending Jeramie's chain/wallet choice. The execution path is built; the write is not.

## Long-term archive plan (hardening item 60)

Keep, under ~/workspace/onchain-anchor/ (and deployed alongside the page):
- Every manifest version (manifest-v1.json, manifest-v2.json, ...), each with its SHA-256 beside it (manifest-v2.sha256).
- The page and verifier for each version (page-v1.html, index.html, verify.js).
- The anchor proof for each version once it exists (manifest-v2.json.ots or anchor-receipt.json), stored next to its manifest.
- The changelog (CHANGELOG.md) and the build receipt (build-receipt.json) for each version.
- Re-anchor policy: when the manifest changes, build a new version, compute a new root, anchor the new root, and retain the old root and its proof. Never delete a prior version.
- The Retardio Unified System (ordered 2026-11-15 07:53) is a separate parallel build, not part of v2. Its noted conflicts (baseline_v1 name collision, canonicalization divergence between the new rule and the loop/anchor, receipt self-reference, the 999 default, outcome coding blocked on the assessor source, SOS connector not built) are recorded in that build, not resolved here. The anchor's canonicalization (sorted keys, no whitespace, UTF-8, strings as-is) is locked and tested; it is not changed by the parallel build.

## Verification evidence (all run against the final manifest)

- `sh ci_check.sh`: CI PASS (Python root == JS root == published root, afd56cea...).
- `NODE_PATH=... node test-page.js`: 17/17 pass (roots, chain badge, table + heuristic badges, membership by URL and by hash, tamper demo, v1.1 receipts, chain verifier UI).
- `python3 tamper-harness.py`: 8/8 attacks detected.
- `python3 ci_refetch.py`: 187 unchanged, 0 changed, 0 fetch failed. CI PASS.
- `python3 test_vectors.py`: 10 vectors, all Python assertions pass.
- `python3 receipts.py`: 3-receipt chain valid; tampered chain rejected.
- `NODE_PATH=... node unified-chain-regression.js`: 6/6 steps pass.
- `python3 verify_membership.py --manifest manifest-v2.json --root`: recomputed root matches the published root.
- The observation pilot: 25/25 real loop observations validate; payload-hash ids 25/25; prev_hash chain intact. brier.json: 20 issued, 0 resolved, Brier null (illustrative 0.0605 recomputed and matches).

## Fetch note (found and fixed during this build)

The first three builder runs had 46, then 12, then 27 unverified sites (all Cloudflare Pages, all live). Root cause: the User-Agent string. A UA carrying a `(+https://...)` suffix was tarpitted by Cloudflare (read timeouts), while the bare tool/version UA works. The builder and ci_refetch.py now use `NeuruhAnchor/2.0` and `Neuruh-Anchor-CI/2.0`. After the fix: 235 verified, 0 unverified, and ci_refetch passes. If the fetch ever degrades again, check the UA first.

## Live-browser checks still owed (this subagent has no live browser)

- The v2 anchor page itself (control check after deploy).
- The Unified Chain regression is jsdom only; the loop's page is fully browser-verified (2026-11-15 07:08 EST).
- Mobile layout (item 26) was not checked in a live mobile browser.
