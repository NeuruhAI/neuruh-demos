# Done Ledger integration (convergence spec item 89)

How the Done Ledger pulls its evidence hashes from the same chain as the
anchor. This is the anchor-side specification; applying it to the Done
Ledger page (https://neuruhai.github.io/neuruh-demos/done-ledger/) is the
parent's job (the anchor build does not edit other demos).

## Rule

Every Done Ledger item's evidence hash is a canonical verification receipt
v1.1 (receipt-schema.json), not a bare hash string. The receipt wraps the
evidence and chains it to the anchor's Merkle root, so a Done Ledger claim
is verifiable by the same verifier as the anchor.

## Mapping

| Done Ledger field | Canonical receipt field |
|---|---|
| `evidence_hash` (today: a bare hash) | `payload.record_hash` (the evidence's own hash, unchanged) |
| (new) `receipt_id` | The receipt's id, which equals its `receipt_hash` |
| (new) `merkle_root` | The current manifest Merkle root at issuance (the anchor's `merkle_root`) |
| (new) `anchor_root` | The on-chain anchored root, null until a real anchor exists |
| (new) `prev_hash` | The previous Done Ledger evidence receipt's `receipt_hash`, or `GENESIS` for the first |
| (new) `receipt_version` | `"1.1"` |
| (new) `action` | `"verification"` (or `"build"` for a build completion) |
| (new) `actor` | `"done-ledger"` (or the issuing tool) |
| (new) `timestamp` | ISO 8601 UTC |

## Verification

A Done Ledger evidence chain verifies with the same tools as the anchor:

- Python (offline): `python3 verify_receipts.py done-ledger-evidence.jsonl`
- Browser: the anchor page's receipt-chain verifier (paste or upload the
  JSONL log; it works offline once the page is loaded).

The chain is VALID only when every receipt hash recomputes and every
prev_hash links. A broken link or a mismatched hash means the evidence
does not check out, regardless of what the ledger's display says.

## Labeling rule (convergence item 15, shared)

A demo may be labeled WORKING only after the interaction checklist and the
content hash are recorded in the Done Ledger. The Done Ledger is the
record of record for the WORKING label; the anchor's `demo-inventory.json`
is the machine-readable inventory that carries the same facts
(verification date, hash, interaction confirmed) into the Merkle tree.
