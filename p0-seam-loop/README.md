# P0 Seam Reference Loop

SIMULATION. Reference implementation only. This is NOT the production loop on Jeramie's Mac.

## What it closes (in reference form)

The P0 seam is the missing automatic handoff: receipt watcher, Sentinel invocation, result ingest, custody, promotion. The production loop lives on the Mac (launchd ticks, always-running Switchboard, loopback Sentinel organ at 127.0.0.1:18731) and cannot be reached from here. This module implements the same loop shape against receipt v1.0 so the logic is executable, testable, and demonstrable.

## Files

- `p0-seam.js`: the module, UMD style. Node tests and the browser demo share this one file, so the logic cannot drift between them.
- `test.js`: Node tests. Run `node test.js`. 33 checks, exit 0 only when all pass.
- `index.html`: browser demo. Loads `p0-seam.js`, runs the loop in-page, shows the recorded cases live.
- `README.md`: this file.

## Receipt standard

Receipt v1.0: SHA-256 hash chain, first prev hash is the literal string `GENESIS`, canonical JSON (sorted keys, arrays in order) with the hash field stripped before hashing. The pure-JS SHA-256 and canonical functions are copied verbatim from the Land Intelligence Report store (`buildReceipt`, `runtime.js`). The N-Cell adapter demo uses FNV-1a 32-bit hashing; that is demo-only and is NOT used here.

## Formulas (implemented exactly)

- CRUCIBLE gate score = max(0, emergence_raw - objection_penalty) x multiplier
- Multiplier ladder: revenue / signed contract 1.00, paid pilot 0.50, one real lead 0.30, nothing 0.15
- Verdicts: KILL below 20, ITERATE 20-49, SHIP-CANDIDATE at or above 50 only with a real external signal (50+ without a signal downgrades to ITERATE)
- Strikes: a KILL adds one strike. The first KILL does NOT move the file. `kill_move` fires only at strike 3.
- Doctrine eta = (I_q x I_r x I_v) / (1 + E_wasted + C_violations), bounded 0-100. Seed requires eta >= 70 AND feedback accuracy >= 0.6.
- Promotion gate: only SHIP-CANDIDATE with a real external signal promotes.

## Recorded cases (in test.js and live on the demo page)

- Fabricated world eta 0.0 is blocked.
- (94-56)x0.15 = 5.7 KILL.
- Perfect world with zero signal = 15 KILL.
- Chain verification accepts a good chain and rejects a tampered link and a wrong GENESIS.
- Strike counting: strike 1 KILL does not move, strike 3 KILL moves.
- Promotion gate refuses SHIP-CANDIDATE without external signal and refuses ITERATE/KILL.

## Live demo

https://neuruhai.github.io/neuruh-demos/p0-seam-loop/

## What is still open (production)

The retro-court of PR #13, the live-seam test run on the Mac, and the live mission proof are still owed. See `~/workspace/neuruh-obsidian-vault/_research/p0-seam-workorder.md`. This reference implementation does not substitute for any of them.
