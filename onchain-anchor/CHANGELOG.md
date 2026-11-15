# On-Chain Anchor changelog

## v2.0 — 2026-11-15

- v1 root: `0bdc4c196e2c80664f06c23cc36b0417e0121687233dfc390ac23235835cf3fd` (195 leaves)
- v2 estate root: `c83c79a84e6fc3c0593516ecf56fc8ebe73156289dfb2cf9ded9f77ce4c1f121` (204 estate leaves)
- v2 full root: `afd56cea3e4abe9265f83c3552cddebac2771ab6d5d50012a641695fd8b8777f` (235 leaves: 204 estate + 31 self)
- The root changed because the entry canonicalization changed (v2 schema: strict 10-field entries with content_type, content_length, and status), and because the estate grew: +6 sites (working-demos, onchain-anchor, done-ledger, neurh-topology, hard-problems-atlas, retardio-measurement-loop) and +3 estate ledgers (demo-inventory.json, brier.json, observations-pilot.jsonl).
- Old root retained (re-anchor policy: new root, new anchor, old root retained).
- vs v1: 194 unchanged, 1 changed (live content moved), 9 added, 0 removed.
  - Changed: hub-index
  - Added: working-demos (https://neuruhai.github.io/neuruh-demos/working-demos/), onchain-anchor (https://neuruhai.github.io/neuruh-demos/onchain-anchor/), done-ledger (https://neuruhai.github.io/neuruh-demos/done-ledger/), neuruh-topology (https://neuruhai.github.io/neuruh-demos/neuruh-topology/), hard-problems-atlas (https://neuruhai.github.io/neuruh-demos/hard-problems-atlas/), retardio-measurement-loop (https://neuruhai.github.io/neuruh-demos/retardio-measurement-loop/), demo-inventory, brier-state, observations-pilot
- Receipt schema: canonical v1.1 (receipt-schema.json). Verifier: verify.js 2.0.0.
- Anchor status: prepared. No chain write made (criterion 2 BLOCKED pending Jeramie's chain/wallet choice).
- Convergence spec folded in: sections 1-15 and 76-90. Sections 91-100 are the finish criteria. Sections 16-75 are the sequenced next builds, not in v2.

## v1.0 — 2026-11-15

- Root: `0bdc4c196e2c80664f06c23cc36b0417e0121687233dfc390ac23235835cf3fd` (195 leaves: 181 sites, 7 papers, 3 documents, 4 ledgers). SIMULATION, NOT YET ON-CHAIN.
