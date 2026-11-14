# Unified Chain flagship demo (SIMULATION)

One claim through the whole organism loop in a single working page:
ingest, N-Cell/64 header, governance intersection, memory write-gate,
CRUCIBLE verdict, v1.0 SHA-256 receipt, promotion, outcome, next mission.

Live: https://neuruhai.github.io/neuruh-demos/unified-chain/

## What it is

A browser-local reference implementation. No backend, no database, no live
system. Every stage is a real working tool in the page: change an input and
the outputs change. State flows from stage to stage in the session ledger
only. The estate status strip at the top of the page is the honest live
picture as of 2026-11-14: data spine down, DeedSonar paused, pipeline
designed but not run, land report storefront a simulation.

## Files

- `index.html`: the page. Editorial document style: bone/paper, ink,
  brass single accent, Archivo/Inter/JetBrains Mono, document-control
  header, two numbered figures with captions, print stylesheet.
- `unified-chain.js`: core logic, UMD (Node and browser). Assembled
  verbatim from proven pieces by `assemble.py`; see that script for the
  sources.
- `app.js`: browser wiring only. No network calls.
- `test.js`: Node test suite. Run `node test.js`. 56/56 pass.
- `dom-smoke.js`: jsdom smoke check that every stage control responds.
  Run `node dom-smoke.js`. 22/22 pass. jsdom is resolved from a sibling
  workspace install; no new dependency is added to this demo.
- `assemble.py`: the assembler that built `unified-chain.js` from the
  proven pieces. Re-run it after changing a source, then re-run tests.

## Reuse (verbatim, extracted by script, not retyped)

- SHA-256, canonical JSON, receipt v1.0, chain verification, CRUCIBLE
  gate, strike counting, eta gate, outcome ingest: `~/workspace/p0-seam-loop/p0-seam.js`.
- Memory write-gate (`evaluateWrite`, illustrative thresholds) and decay
  (`F(t) = 2^(-t/h)`, presets): `~/workspace/memory-gate/lib/`.
- Header stamper and governance intersection: `~/workspace/governance-loop/governance-loop.js`.

## Rules implemented

- Header: 8 bytes, paper Section 3.3 layout. Worked example
  OPP-2026-RE-0042 stamps to `1f0701070fa52d01`.
- Intersection: E* = E_proposed intersect E_allowed intersect E_available.
  Verdicts NO PROPOSAL / BLOCKED / PARTIAL / PROCEED. Blocked-by-policy
  (not allowed) and blocked-by-infrastructure (allowed but not available)
  are shown separately. Defaults are decision D-001: propose 8, allow 6,
  available 5, PARTIAL, which blocks promotion.
- Write-gate: evidence below 3 REJECT, contradiction QUARANTINE even at
  high evidence, evidence below 6 QUARANTINE, else WRITE. Thresholds are
  ILLUSTRATIVE; the paper sets none.
- CRUCIBLE: score = max(0, emergence_raw - objection_penalty) x
  multiplier. Ladder: revenue/signed 1.00, paid pilot 0.50, one real lead
  0.30, nothing 0.15. KILL below 20 or at strike 3 (first KILL does not
  move the file), ITERATE 20-49, SHIP-CANDIDATE at or above 50 only with
  a real external signal.
- Receipt: v1.0, SHA-256, hash-chained, GENESIS first, canonical JSON
  with sorted keys. The Verify box recomputes and rejects tampered
  receipts.
- Promotion (unified-chain rule): PROCEED only when the intersection is
  PROCEED, the CRUCIBLE verdict is not KILL, and the write-gate is WRITE,
  or QUARANTINE with an explicit override noted. This differs from the
  earlier governance-loop demo rule, deliberately; see the build report.
- Outcome: recorded outcomes append to an in-page ledger with their own
  chained receipts. The outcome generates a next-mission card that can
  be sent back to stage 1 as a new claim.

## Limits

- Simulation only. It proves the chain logic runs end to end in a
  browser. It proves nothing about the production Mac loop, the data
  spine, or any live system.
- Live-browser click-through (real Chromium) has not been run; the DOM
  smoke check is jsdom. That is the known remaining verification gap.
