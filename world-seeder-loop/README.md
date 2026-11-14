# World Seeder Loop (SIMULATION)

Tier B working demo of the autonomous World Seeder (May 9-10, 2026), built from
dossier Batch 016 (`world-seeder-rebuild.md`, absorbed 2026-11-10). Live at
https://neuruhai.github.io/neuruh-demos/world-seeder-loop/

## What it is

A static page that presents ONLY what the dossier establishes:

- The pipeline: 2AM `connector.py` -> 3AM `world_seeder.py` -> 3AM+
  `world_activator.py` -> Sunday 4AM `feedback_loop.py`.
- The May 9 result (zero human input): 4 clusters from 500 edges -> 4 Worlds,
  self-scored Sovereign AI Infrastructure 94, Real Estate Intelligence
  Platform 89, Sovereign Agent Platform 94, Lead Conversion Intelligence 87,
  filed to the Notion IP Registry with real page IDs.
- The DATA CONTRACT (load-bearing): `edges.json` nests edges under `top_edges`
  with fields `from` / `to` / `from_title` / `to_title` / `score` /
  `shared_keywords` / `vertical_match`; top 50 of 500. Reading `e["source"]`
  or `e["from"]` at top level parses 0 edges: the May 12 bug.
- The TENSION: the seeder's 94/89/94/87 scores are exactly the self-graded
  scores CRUCIBLE was built to kill. Each World gets a CRUCIBLE score from the
  gate formula `score = max(0, emergence - objections) x multiplier`. With no
  external signal the multiplier is 0.15, so the four Worlds score 14.1 /
  13.35 / 14.1 / 13.05, all KILL (below 20). Even a perfect self-score of 100
  tops out at 15. Objections are 0 because no adversary pass was ever run:
  zero objections RECORDED, not zero found.
- The recovered prompt's "Neuruh LLC" is quoted ONLY as verbatim historical
  text with a FALSE flag: Neuruh is not a registered business entity.

## Interactive pieces

1. Run-the-pipeline simulator: paste an edges file in the contract shape,
   watch clusters form and Worlds file, with the recovered gates (emergence
   below 40 skips, existing World name skips, above 85 flags the activator
   scaffold) and a CRUCIBLE verdict per World.
2. Data-contract test: a "top-level read" button returns 0 parsed (the May 12
   bug), a "contract read" button returns the correct count.
3. May 9 result table with CRUCIBLE verdicts, plus a signal picker (none /
   lead / pilot / contract) that re-scores the same self-scores live.

## What is NOT in here

The dossier records these as never recovered, and the demo invents none of
them: `detect_clusters()` body, keyword-to-cluster map, config/header block,
`find_edges()` scoring logic, `world_activator.py` full text. Where the demo
needs cluster logic it uses its own illustrative keyword buckets and its own
illustrative emergence formula (`min(99, 20 + 6 per node + 2 per edge)`),
labeled as the demo's on the page and in `world-seeder.js`. The real seeder
drafted specs with Claude; the simulator drafts from a deterministic template
so the loop runs entirely in the browser. Nothing here files to Notion, sends
Slack messages, commits, or touches any vault.

## Files

- `index.html`: the demo page.
- `world-seeder.js`: UMD module shared by the page and the Node tests.
- `test.js`: Node tests. Run `node test.js`. 19 tests, all passing at build.
- `deploy.py`: pushes to `NeuruhAI/neuruh-demos` under `world-seeder-loop/`
  via the GitHub Contents API (GET sha first, retry 409 with fresh sha).

## Verification

Tests: `node test.js`, 19/19 pass. Live check after deploy: curl the Pages URL,
HTTP 200, MD5 matches the staged files. See
`~/workspace/research-drift-2026-11-14/build-world-seeder.md` for the build
report.
