# Integrated Governance Loop (SIMULATION)

One page that runs a single claim through all three governance pieces in
sequence, so the loop is visible end to end.

## The six steps

1. **N-Cell/64 header** (paper Section 3.3). 8 bytes: routeMask, organMask,
   lifecycleMask, authorityMask, memoryMask, confidence 0-255, risk 0-255,
   outputMask. The paper defines the layout only and sets no numeric
   defaults. Defaults here are the Organ Manifest demo defaults: confidence
   128, every other byte 0, organMask 0x07 (SAL manifest bits 0, 1, 2).
2. **Governance intersection** (paper Section 3.4). E* = E_proposed AND
   E_allowed AND E_available, computed on edge id sets. Verdicts: NO
   PROPOSAL, BLOCKED, PARTIAL, PROCEED. Defaults: propose 8, allow 6,
   available 5, intersection 5, PARTIAL.
3. **Memory write-gate** (JGI Section 34). The claim's evidence answers the
   8 gate questions. Illustrative rule: evidence below 3 REJECT,
   contradicts QUARANTINE, evidence below 6 QUARANTINE, else WRITE. The
   paper sets no numeric thresholds; the thresholds are labeled
   illustrative everywhere they appear.
4. **CRUCIBLE gate.** Score = max(0, emergence - objections) x multiplier.
   Ladder: revenue/signed contract 1.00, paid pilot 0.50, one real lead
   0.30, nothing 0.15. KILL below 20, ITERATE 20-49, SHIP-CANDIDATE at or
   above 50 only with a real external signal.
5. **Receipt v1.0.** SHA-256 hash chain, first prev hash GENESIS, canonical
   JSON with the hash field stripped before hashing. Records the header,
   the intersection verdict, the gate verdict, and the CRUCIBLE verdict.
   FNV-1a is used nowhere.
6. **Promotion decision.** Only a claim that passes all three gates AND
   carries a real external signal promotes. Otherwise it stops and the
   blocking gate is named: intersection, memory-gate, crucible, or
   external-signal.

Doctrine eta is shown as a recorded check alongside step 2 (seed requires
eta at or above 70 AND feedback accuracy at or above 0.6). It is not one
of the three promotion gates.

## Reuse (verbatim where possible)

- SHA-256, canonical JSON, receipt v1.0, verifyChain, CRUCIBLE gate, eta
  gate: extracted verbatim from `~/workspace/p0-seam-loop/p0-seam.js`
  by script (no retyping). Cross-checked against Node crypto in tests.
- Memory write-gate constants, validate, evaluateWrite: extracted verbatim
  from `~/workspace/memory-gate/lib/write-gate.js`. The dead inference
  branch was already removed there; nothing new was invented here.
- Header byte order and defaults: N-Cell Organ Manifest demo
  (`~/workspace/ncell-organ-manifest/demo/app.js`); organMask 0x07 is the
  SAL manifest bit mapping, a placeholder, never a paper claim.
- New in this demo: the governance intersection computation, the
  promotion decision, and the runClaim orchestrator. The N-Cell demo shows
  the intersection formula but does not compute it.

## Presets (one click each)

- Passing claim, real signal: promotes.
- Fabricated world: eta 0.0, seed blocked; evidence 1 REJECTs; CRUCIBLE 0 KILL.
- World 94-56 x 0.15 = 5.7 KILL (other gates pass, CRUCIBLE blocks).
- Perfect world, zero signal: (100 - 0) x 0.15 = 15 KILL.

## Tests

`node test.js`, 29 checks, exit 0. Covers: SHA-256 vectors vs Node crypto,
header defaults and byte order, all four intersection verdicts, write-gate
branches, the three recorded cases, the multiplier ladder, SHIP-CANDIDATE
downgrade without an external signal, promotion on a fully passing claim,
non-promotion with the blocking gate named for each failing gate, receipt
v1.0 shape and payload contents, tampered receipt failing verification,
broken prev link failing chain verification.

## Status

SIMULATION. Reference implementation only. Not the production Mac loop.
No external sends, no Stripe, no production data.
