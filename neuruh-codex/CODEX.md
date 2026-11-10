# NEURUH CODEX

**Operator manual for Jeramie Hicks and any future collaborator or AI session picking this up cold.**
**Source of truth:** this file. The HTML render is generated from it; never edit the HTML by hand.
**Compiled:** 2026-11-10. **Codex version:** 1.1.0. **Expansion:** 2026-11-10 from batch 006 (the July ecosystem codex, 3 PDFs + 6 SVGs + CRUCIBLE verification record + CRUCIBLE source), reconciled against live GitHub and Pages state the same day.
**Status:** LIVING, APPEND-ONLY. New facts arrive as dated entries. Wrong entries get a superseding entry, never a silent edit.

> Every number in this document carries an audit date. A stat without a date is a rumor with better formatting.
> Every claim carries one of three labels: **VERIFIED** (checked against a live source on the stated date), **RECORDED** (taken from a transcript, file, or run record; not independently re-checked), or **UNKNOWN** (no evidence either way). A transcript claim is never presented as current without a verdict.

---

## 0. Orientation

### 0.1 What this is

One document that answers, for the whole Neuruh estate: what exists, what it does, what state it is in, where it lives, how to run it, and what is blocking it. It is the operator manual, not the pitch deck. It is written for a person (or a future AI session) who has never seen the estate and needs to operate it without asking Jeramie to re-explain it.

It serves the canonical-codex goal (goal_6f80beb1b4c7): one living, append-only canonical codex. The workspace file is the source of truth until the Notion block cap clears or the workspace is upgraded. The Obsidian vault (`~/workspace/neuruh-obsidian-vault/`) is the deep record; this codex is the map over it.

### 0.2 What this is not

- Not a sales document. Prices appear because an operator needs them, not because a buyer is being pitched.
- Not a Notion replacement. The Topology Notebook (50 chapters) remains the historical canon. This codex reconciles it with live state as of 2026-11-10.
- Not a demo. Demos live at `https://neuruhai.github.io/neuruh-demos/` and are linked from Section III. This document describes them; it does not simulate them.

### 0.3 The estate in one paragraph

Neuruh is a sovereign AI execution substrate built by one founder on an 8 GB M1 Mac Mini in Benton Harbor, Michigan. The pattern is always the same: data is ingested, normalized, identified, turned into signals, run through recipes, ranked, decided, executed under governance, receipted, verified, and learned from. The flagship commercial product is DeedSonar, a real-estate CRM and lead app. The intelligence kernel is Lead Recipe OS (30 recipe families). The signal engine is LANDOS. The governance spine is the workers runtime with an independent Sentinel court, hash-chained CRUCIBLE receipts, and the NRH Registry as the addressing spine. Around that core sit a benchmark (prbench), a valuation product (DATUM), a land-yield venture (FALLOW), a deterministic swarm (LEGION), and a visual layer (cockpit and galaxy surfaces). Most of it is built. Much of it is not currently live. The bottleneck is not invention. It is closure: wiring, deployment, verification, and revenue.

### 0.4 The LandOS relationship

LANDOS is the land signal engine: county parcel ingestion plus a 50-signal scoring model. Everything that ranks parcels (DeedSonar leads, DATUM calibration, FALLOW yield scoring) either consumes LANDOS signals or descends from its architecture. LANDOS is not a CRM and not a valuation model. It answers one question: which parcels matter, and why, with the evidence attached. DATUM is a new valuation product beside LANDOS, not a rebuild of it. FALLOW is a new venture that licenses LANDOS-derived scoring methodology; the license is a legal gate (Section V), not a technical dependency.

### 0.5 How to read the as-of dates

The July ecosystem codex (NRH-DOC-CODEX-001 rev A, issued 28 July 2026) is the base this codex extends; Section VII records what it got wrong and what changed since. Batch 006 source files live in source-july/ under this folder.

Each section header carries the date its facts were last verified. A fact dated 2026-09-13 comes from the Sept 13 deep-dive dossier and is historical unless a later verification is cited. A fact dated 2026-11-10 was checked on the day this codex was compiled. When a transcript claim conflicts with a later verified record, the later record wins and the conflict is named in place.

### 0.6 The four things to remember

1. **DESIGNED is not DEPLOYED is not LIVE is not PROVEN.** Every state claim in this codex uses those words exactly. A commit is not a deployment. A deployment is not a healthy service. A service is not a proven loop.
2. **Chat is not storage.** A decision that survives a conversation becomes a record the same session (an ADR, a vault note, a codex entry). If it only exists in a transcript, it does not exist.
3. **One writer per dollar, one writer per row.** `sync_to_crm.py` is the sole writer to `acquisition_leads`. The adjustment registry is the sole owner of each valuation dollar. Violations of this rule are how silent 15% errors happen.
4. **The world scores; the operator trains.** Any evaluation whose test set contains a label Jeramie produced is not an evaluation. Holdouts must be recorded sale prices or offer outcomes, never judgment calls.

---

## I. Estate map

*As-of: 2026-11-10 (vault state), 2026-09-07 (notebook head), 2026-09-13 (deep-dive snapshot).*

### I.1 The Topology Notebook

The canonical map lives in Notion at the head page **NEURUH TOPOLOGY NOTEBOOK, Converged Chapters**, id `3d3a981d-75b6-81f1-9481-fbba6dc642aa`, last edited 2026-09-07. Its path is five levels deep: NEURUH COMMAND PROTOCOL (Apr 6 2026) > NEURUH HQ Navigation Hub > NEURUH LIVE OPERATIONS CANON > NEURUH EXECUTION TOPOLOGY CANON (2026-09-06) > TOPOLOGY NOTEBOOK. It holds Chapters 01–50, the START NOW MERGE-FIRST WAR ROOM (Sep 6/7), CONVERGENCE DELTA 01/02B, the STRATEGY LAYER (Canonical Commercial Strategy, Sep 7), and CHAPTER 50 (Operator Fleet V6).

Its governing rules bind this codex:

- **Ingest rule (2026-09-07):** new work converges into the existing chapter that owns the concept. Dated deltas for changed evidence. No fresh "master" because a new model found the same system again.
- **Truth precedence:** current provider/runtime, then exact Git/deploy/DB, then sealed independent receipt/court, then vault/live ops, then current mission checkpoint, then historical canon, then legacy artifacts, then model memory last.
- **Four labels per chapter:** PROVEN CURRENT / HISTORICAL PROVENANCE / UNRESOLVED-COLLISION / DONOR-RESIDUE.
- **Frozen at 50 chapters** by its own kill-list rule.

The notebook is mirrored in the Obsidian vault under `11-Notion/Topology-Notebook/` (42 of 42 chapters migrated, 2026-11-08) and `11-Notion/Recents/`. The vault holds 942 files in `11-Notion/`, 231 concept notes, a 33-section migration manifest, 217 learnings, and 22 of 22 regression checks passing (all as of 2026-11-09).

### I.2 Canonicals (pinned truths)

| Thing | Canonical value | Status | As-of |
|---|---|---|---|
| Cockpit main | `a545c17b7119c3b22799851e56abba5e263fec72` (Sep 3) | PROVEN CURRENT | 2026-09-06 |
| Cockpit PR13 | merged Sep 2 | CLOSED, do not reopen | 2026-09-06 |
| H02 / Sentinel typed-evidence | main at `03084a91…`, H02 commit `6736108f…`, PR #3 merged, independent final court PASS | CLOSED / MERGED / CANONICAL | 2026-09-06 |
| H01 / Workers observer-contract | Independent court PASS, 2026-09-09 | **CLOSED** (see I.3) | VERIFIED 2026-11-08 |
| DeedSonar accepted (T50 historical) | `693b648078cf61a79df8c001bb1ab3b259c635bc` | HISTORICAL branch proof only | 2026-09-06 |
| LandOS accepted (T50 historical) | `278465340331021b66fb6b93d870f72715981c82` | HISTORICAL branch proof only | 2026-09-06 |
| RE front door | Convergence Delta 02B `3d4a981d-75b6-8189-addf-c720d0a38e2d` | Current owner | 2026-09-07 |
| Commercial strategy | `3d4a981d-75b6-8111-bb14-d33704d46d5d` (Sep 7) | Current | 2026-09-07 |
| IP addressing spine | `NRH-[DD]-[ENT]-[TTT]-[NNN]` | Canonical | 2026-09-06 |
| RE snapshot | 30 recipes; 22,343 candidates (20,734 NC + 1,609 MI); 21,582 mapped / 761 unmapped | Sep 6 snapshot | 2026-09-06 |
| LANDOS hunt job `6071b7ad` | 153 leads scored, 153 synced to CRM | PROVEN (run record) | 2026-09-16 |
| PR #13 (neuruh-workers) | MERGED 2026-09-14, merge commit `e0c58ec…`, head `50d36e02…` | MERGED (see I.3) | VERIFIED 2026-11-09 |
| LEGION PR #26 | Merged 2026-09-30, merge commit `dbd9ef6…` | MERGED | VERIFIED 2026-11-10 |
| DATUM repo | NeuruhAI/datum, private, latest `07184f5` v0.4.0 | LIVE on GitHub | VERIFIED 2026-11-10 |
| prbench repo | NeuruhAI/prbench, public, latest `9a66444` (Nov 5 auto run) | LIVE on GitHub | VERIFIED 2026-11-10 |

### I.3 The H01 correction (read this before anything about the P0 seam)

The Sept 13 deep dive records H01 as BLOCKED: the independent judge died on an HTTP 429, so no court ever rendered, and H01 was the plug blocking R02D, T02, H04, and R13 in sequence. **That is stale.** Verified 2026-11-08 by direct GitHub read: **H01 is CLOSED.** The record is `NeuruhAI/neuruh-receipts`, file `20260909_h01_retrocourt.md`, commit `218771db`: "H01_INDEPENDENT = PASS against the seven predicates as charged", judge identity "Opus 5 (1M context), did not build this change", date 2026-09-09. H01 CLOSED does not close the T02/P0 seam. The seam stays open: **PR #13 (NeuruhAI/neuruh-workers) is MERGED 2026-09-14** (title: "feat(switchboard): inject adjudicator, close the COURT_REQUESTED -> SENTINEL seam (T02)", merge commit `e0c58ec15aa9298eb57170710b3a9cc7a0ef8e28`, head `50d36e02c7048516c0b9e045aa90935cafe80224`, self-merge, zero reviews, no court held). The vault's standing "#13 unmerged" claim was stale and has been corrected in place. What is still owed: a retro-court at head `50d36e02`, live-loop proof at current main, main-branch CI. Work order: vault `_research/p0-seam-workorder.md`.

### I.4 State-discipline laws

Already on the books (do not re-derive):

- MERGED != WIRED
- SOURCE MAIN != LIVE PIN
- DOCUMENTED != IMPLEMENTED
- CI PASS != SENTINEL PASS
- promotion.ready != merge authority
- REVENUE SOURCE != PAID CUSTOMER PROOF
- CRON_GREEN != ALIVE
- STUB_GREEN != CONTRACT_HONORED
- ROLE_TOPOLOGY != EXECUTION_TOPOLOGY

New laws from the Sept 13 deep dive (RECORDED 2026-09-13, durable):

- ORG_LISTING_TIMESTAMP != MAIN_HEAD (nimdp-validator: org listing said 2026-08-20; main head was 2025-08-10)
- BRANCH_PUSH != MAIN_MOVED
- BATCH_PUBLISH_SWEEP != DEVELOPMENT_ACTIVITY (35 of 37 public repos share main heads inside one 70-second window on 2026-08-20)
- SCHEMA_PRESENT != DATA_PRESENT (T50A case spine: schema present, zero rows)
- CONNECTOR_SCOPE != ESTATE_SCOPE (Supabase connector saw only the APG Land org, not Jeramie's own org)
- GIT_LINK_STORED != GIT_OWNER_EXISTS (Vercel git links point at `yousernamehere`, a handle that 404s)
- PLAN_LABEL != ACCOUNT_ENABLEMENT (Vercel team reports plan "pro" while deployments return 402)

### I.5 The repo estate (shape, not a count)

Chapter 19 deliberately refuses a repo count and gives a capability map instead. The NeuruhAI org holds **216 repos** (VERIFIED 2026-11-08 via paginated API; the CLI list caps at 100 and misses 116). Of the roughly 100 named repos in the chapter map, exactly 37 were publicly visible on 2026-09-13, and 35 of those are Public Commons spec micro-libraries pushed in one synchronized batch on 2026-08-20. Everything that actually runs (Cockpit, Workers, Switchboard, Sentinel repo, Git Custodian, JGI Founder Runtime, DeedSonar, LandOS, Liquidity, Aegis, neuruh-vault) is private.

Families: control/runtime (axon, workers, mother, sops, aegis, autonomous-governance-core, cockpit, sentinel-court, live-integration); data/memory/state (vault, vault-taxonomy, ncell, capability-registry, atomic-node-registry, evidence-ledger, lifecycle-state-ledger, canary-evaluation-ledger); canonical revision/policy/promotion (reconciliation-proposal, canonical-state-revision-*, policy-gate, promotion-gate, effective-canonical-state-resolver); outcome/learning (outcome-record, outcome-calibration-ledger, learning-update-proposal); real estate/opportunity (deedsonar, landos-engine, landos-ingest, recipe-engine, territory-engine, lead-recipe-os, contact-intelligence); build/packaging/release (factory, factory-router, repo-bootstrapper, notion-codepack-deploy-harness, ip-timestamp-bundler, axon-adapter-sdk); intent/immune/protocol (pmla-constraint-engineering, constraint-engineering-core, ipp-intent-preservation-api, semantic-fuse-api, drift-detector-api, contextual-inception-framework, ether-layer, ether-rbac, ether-layer-event-bus); products/public (neuruh-web, data-rescue, fulfillment-contracts, liquidity-engine, nimdp-validator, dispatch-iq, world-emitter, public-commons, estate-office, upl-runtime); legacy/donor personal estate (DFSE-QECA, TaxShield family, RealEstateDealArchitect, visual-cortex, pulsar-dc-mvp, bba-lite, henry, signal-iq, axon, private-ai-community, master-architect-toolkit, studio, find-sell-profit, command-hub, NeuruhOSv2, nmil, content-command-center, design-weaver, build-creatoros, autonomous-builder, lenduruh, intelhub, landing, Neuruh-Node, vehicle-viz-studio, poag-pathways, bookeit, Foundry-3D, Neuruh_AI, memory, edge-agent, ocn-bonsai, axon-daemon, probate-form, agent-authority-router, lakeshore-intelligence, rabbithole-observatory, jgi, plugin-marketplace).

TRAP: the org listing timestamp is not the main head. A repo that "updated 2026-08-20" may have a main head from 2025. Check the head, not the listing.

---

## II. Engines

*Each engine: what it does, how it works, verified current status, where it lives, how to run or demo it. "Recorded" means taken from a transcript or run record, not re-checked by this codex.*

### II.1 LEGION, the deterministic swarm

**What it does.** A governed batch engine that scores thousands of records with 10,000 lightweight workers on a shared thread pool, seals the results into a hash-chained roll-up, and proves the run is reproducible. It runs as a lease inside the neuruh-workers runtime, not as a separate orchestrator. **Status: PROVEN run, MERGED, not a live service.** LEGION is a job, not a service. It runs for seconds and exits.

**How it works.** One supervisor takes an exclusive lock on the run folder. Before starting and before every dispatch it checks for a HALT file (kill switch). If a journal exists, the whole hash chain is re-verified before resuming; a broken link or foreign entry halts the run as tampered. Records dispatch to agents on a fixed-size thread pool (memory stays inside 8 GB). Agents can only read, cannot spawn other agents, contact is permanently NOT_AUTHORIZED. Each result appends to the hash-chained journal and flushes to disk. 50 results seal into a squad, 20 squads into a cohort, cohorts into FINAL_OUTPUT. The main Workers ledger gets 11 records per run, not 6,487. Job identity derives from job type, scoring version, and inputs, so a scoring change can never mix with old scores.

**Verified proof (RECORDED 2026-09-28, run record).** NC run: 6,487 opportunities scored in 3.3 seconds, 0 failed. Tiers: A 208, B 1,452, C 4,793, government-excluded 34. Fault-injection run: 9,997 ok, 3 deliberate failures contained. Crash resume produced byte-identical output. 387 tests pass, 25 of them LEGION's. PR #26 merged 2026-09-30 (merge commit `dbd9ef6…`). Proof tag `legion-v0.1.0-proof-20260928` at `8719d8d…` (both VERIFIED via GitHub API 2026-11-10).

**Honest scorecard.** Each "agent" is a deterministic scoring unit with no language model in the main loop. 10,000 identical scorers is parallel processing with receipts, not swarm intelligence. The rare parts are real: deterministic replay with byte-identical output after a crash (Temporal does this for workflows; agent frameworks generally do not), the sealed roll-up applied to agent results, builder-separate-from-judge, and limits enforced in code rather than prompts. The next real build is three different scoring lenses per squad with disagreements traveling up at the cohort seal, each receipted.

**Where it lives.** `NeuruhAI/neuruh-workers`, `legion/` path. Run dir on the Mac: `~/.neuruh/legion/legion-8b4fcca041981a3af08a6331/`. **Demo:** the replay viewer is live at `https://neuruhai.github.io/neuruh-demos/legion-replay/` (34,116 B, MD5 `973003ad4d27c4cb2817f1f7fbf75039`, 87 DOM checks, shipped 2026-11-10). It shows 7 cohorts, 130 squads, 6,487 tier-shaped agents around a sealed FINAL_OUTPUT core, labeled "STRUCTURE REPLAY: counts recorded 2026-09-28; layout derived, not recorded telemetry." The live path (LEGION-LIVE on :8620 operator / :8621 aggregate-only, `--events` journal tail, paced runs, launchd) is specified but not built; the Mac capsule is at `~/workspace/your_files/legion-replay/MAC-CAPSULE.md`.

### II.2 LandOS + Lead Recipe OS, signal engine and kernel

**What they do.** LANDOS ingests county parcels and scores them against 50 signals with SHA-256 provenance receipts. Lead Recipe OS is the Signal-to-Opportunity kernel: 30 canonical recipe families (R1–R30; only R1–R7 named in the record: tax, probate, estate, heir, lien, code, absentee), 36 live registry rows including variants, 4 active hunt recipes (Berrien90+, LIVE_PROVEN tax lien, FLOW_C multi-territory taxsale, FLOW_C probate/estate). A recipe is a repeatable machine-readable acquisition pattern that turns evidence into a qualified opportunity. It is not a prompt template.

**How it works.** LANDOS ingest (FastAPI) pulls county ArcGIS (free-first acquisition; paid vendors sit behind the engine's controlled acquisition logic) into the engine, which scores, ranks, and synchronizes leads to the CRM. `landos-engine/scripts/sync_to_crm.py` is the SOLE WRITER of `public.acquisition_leads`; contact columns are written only when DNC is exactly clear AND skip-trace status is traced_web/traced_paid AND confidence >= 0.6. Recipe weights live in `landos-engine/app/scoring.py` (DEFAULT_WEIGHTS and EDGE_DEFAULT_WEIGHTS), seeded by `seed_weights.py`.

**Signal and test counts, CONFLICT (see VII.4 and VIII.2).** The July codex states 49 signals, 148 passing tests, and 43,897 records scored. The November estate record states 50 signals. Neither figure has been re-verified from the repository in this workspace (no local clone; the count cannot be confirmed by API alone). Both figures are carried with their dates; re-verification requires a clone and a test run on the Mac.

**Verified status.** Hunt job `6071b7ad` (2026-09-16): 153 leads scored, 153 synced. County ArcGIS live 2026-11-04 (St. Joseph 119,780 parcels, LaPorte 64,775). **The engine is not hosted** (`landos-engine.fly.dev` down). **The production database is unreachable** (see V.2). Lead pull failed 25 straight nights through 2026-11-09. The pipeline document (v2.2, `~/workspace/your_files/signal-to-content-to-outreach-pipeline.md`) is DESIGNED, not run. **Where it lives.** `NeuruhAI/landos-ingest`, `NeuruhAI/landos-engine`, `NeuruhAI/lead-recipe-os`, `NeuruhAI/recipe-engine`, `NeuruhAI/territory-engine`.

### II.3 DeedSonar, flagship CRM and lead app

**What it does.** All-in-one real-estate CRM and lead app (Next.js, Supabase, Vercel). The commercial shell around the intelligence stack: customer → property → LANDOS evidence → recipes → scan/dossier → action → outcome → learning.

**Ownership (CORRECTED 2026-10-22, controls everything).** DeedSonar is SOLELY Jeramie's. Bryan Franklin was the intended 50/50 JV partner and never signed. There is no partner consent gate. Any document, demo, or transcript that frames DeedSonar as 50/50 is stale and must not be repeated. Bryan owns the `anchorpointpg` Vercel team it deploys on; Jeramie is Developer there. Jeramie asserted 2026-11-04 that the Supabase/Vercel accounts are his and Bryan locked him out; ownership/access unresolved.

**Verified current status (2026-11-04).** `deedsonar.com` returns 503 DEPLOYMENT_PAUSED. Production Supabase `efxowqudmsfqjmbeidjc.supabase.co` unreachable (curl 000). Vercel stays disconnected per Jeramie's order. Repo `NeuruhAI/deedsonar`, private, last commit 2026-10-09 (PR #192). **Not live. Not sellable as a running product today; sellable as IP plus a buyer demo** (`deedsonar-buyer-demo.pages.dev` live). Sale: ask $95,000, target $50,000–$65,000, walk-away floor $25,000 cash, kernel retained and licensed (see IV.2).

**Historical lock-in (RECORDED 2026-07-27, do not treat as current).** A session found the app deployed but the database three migrations behind the code: 084_core_spine_pipelines, 085_contract_signed_spine, 086_alpha_final_hardening not applied; `pipeline_stage_audit` did not exist; `promote_lead` would break at runtime. Order is 084 → 085 → 086, never 086 first. Same session: 2,835 leads, 85 with a phone number (3%), 2,787 DNC unknown (TCPA exposure), 83 callable, 0 assigned. That was July. Current state is the November state above; the July numbers are history, not today.

**Redeploy routes (standing order).** Cloudflare Pages port (`@cloudflare/next-on-pages`) or Fly.io/VPS. Any redeploy serves a broken app until the data spine is fixed. Build order: data spine, DeedSonar, LANDOS runtime, hub backend, receipts (CRUCIBLE), outreach.

### II.4 CRUCIBLE, the notary, not the judge

**What it does.** A hash-chained receipt system acting as a publication gate. It produces a tamper-evident receipt of what was checked, which scorer checked it, and what the result was. The judge is pluggable; the benchmark harness is how judges get compared. **Status: ledger PROVEN, judge FAILED, iar UNTESTED.**

**How it works.** Service on port 8601. Hash-chained ledger, HMAC epoch signing, receipts, API auth, tenant keys. The heuristic scorer (rubric-v1, lexical/overlap) and the iar scorer (model-backed judge) are separate from the ledger.

**Verified evidence (RECORDED 2026-09-22, run record).** The service handled 1,200 authenticated requests with 0 errors. The chain stayed intact at 44 records; benchmark traffic did not pollute it. Heuristic on HaluBench (n=1,200): **0.512 against a 0.532 word-overlap baseline**, below the baseline and close to the 0.500 of passing everything. July's F1 0.923 was on its own seed set, out of distribution. **The honest positioning: CRUCIBLE is the notary, not the judge.** Drop the claim "the heuristic detects hallucinations." It is already covered in the WITHDRAWN.md register; stay consistent with it.

**Current status (VERIFIED 2026-11-10, from the live repo).** Repo `NeuruhAI/crucible` untouched since Sept 30 (last commit `6b7bf49`, PR #2 gate-fails-closed). The repo root contains receipt.py, crucible_service.py, verify_chain.py, bench/, ledger/, and three test files (test_gate_failclosed.py, test_gate_raises.py, test_signing.py). **No LICENSE file exists in the repo.** The production ledger (ledger/neuruh.PRODUCTION.jsonl, 31,362 B, 44 records; the archived copy is byte-identical) verifies CHAIN VALID under the repo verifier, with every receipt_hash recomputed and matching, 17 PASS / 27 FLAG, eta mean 49.9 against a 70.0 threshold. **Zero of the 44 production records carry a signature.** HMAC-SHA256 is implemented in receipt.py (generate/load/sign/verify; key from `~/crucible/.crucible_hmac_key` or the CRUCIBLE_HMAC_KEY environment variable), integrated into crucible_service.py (signing.required=true in config makes a missing key fatal), and tested by test_signing.py (34/34 assertions passed when run 2026-11-10; service tests skipped for lack of httpx in system Python). The authorship gap is therefore a deployment and custody gap, not a code gap: no key has been generated or applied. The repo verifier is strictly stronger than the uploaded copy: it recomputes every receipt_hash and catches content edits (verified: a verdict/eta edit fails with "record 10: receipt_hash does not match recomputed body hash"). The uploaded verify_chain.py is the older linkage-only version (see VII.5). The iar run against a Qwen model was never committed; iar is still untested. Batch 009 (2026-11-10, RECORDED, not verified by this codex) reports a hardened crucible_service.py (453 lines) and a 14-row seed comparison (heuristic F1 0.923 vs Bonsai-8B F1 0.700); neither is a benchmark. **Demo:** the tamper test (change one byte of a receipt, the chain breaks on screen) is the demo. Never demo it as a hallucination detector.

### II.5 prbench, Parcel Reality Bench

**What it does.** A benchmark that grades AI models against real, as-received county parcel records in the Indiana–Michigan region. Automated daily run. The public proof surface: it demonstrates technical work without requiring outsiders to understand the private stack.

**How it works.** Python CLI. Datasets are generated with a salt, sealed with receipts, and scored by a browser scorer that matches the Python scorer to six decimals. Holdout answers are sealed before any model runs, so nobody can train against it. New models get tested the morning after release.

**Verified evidence (RECORDED 2026-09-22, run record; repo state VERIFIED 2026-11-10).** First real run caught its own bug: the generator picked first names at random from a pool of 10, so about 1 in 11 clean sales ended up with matching first names, and on the hard tier a matching name is the family-sale signal, so Claude was punished for being careful (PRX-0005 ROBERT → ROBERT, PRX-0006 EMILY → EMILY). Fixed in v1.1.1; everything regenerated, holdouts re-sealed, baselines re-run, full ledger re-verified: 1,574 receipts, 0 mismatches. Claude 82.9 → 87.4 after the fix, still 7 points behind the rules pipeline at 94.5; face-value scores 45.7. Regenerating v1.1.0 reproduced the exact dataset fingerprint (`a51b4158…`). Claude's remaining misses are state-line jurisdiction mistakes and price ranges too wide to be useful. That is DATUM's territory.

**Current status (VERIFIED 2026-11-10).** Repo `NeuruhAI/prbench` is PUBLIC, latest commit `9a66444` (Nov 5 auto run). Apache-2.0 LICENSE added Nov 4 (commit `644d107`). `bench.neuruh.com` returns HTTP 200. Daily `bench.yml` runs succeeded Nov 7, 8, and 9. **Pinned models on main: exactly three Anthropic models** (claude-opus-5, claude-sonnet-5, claude-haiku-4-5-20251001); `max_new_models_per_run` is 0. The Sept 22 transcript's 7-model config **never landed**. The other model IDs (GPT-6 Astra, GPT-5.6 Sol, Gemini 3.8 Flash, gemini-3.1-pro-preview, plus gemini-3-pro-preview and gemini-pro-latest) appear as unpinned candidates in check_models.py; they are not pinned models and have never run. Do not run that config as written. (Correction issued 2026-11-10: an earlier draft of this codex said the IDs do not exist at all. They exist as candidates; they have never been pinned or run.) **Two open flags (Jeramie's call):** the repo is PUBLIC but `bench.yml` says "REPO MUST BE PRIVATE" (visibility decision); "Instrumentation" has no defined scope in README/RUNBOOK/bench.yml.

### II.6 DATUM, valuation beside LandOS

**What it does.** A new valuation product beside LANDOS, not a rebuild of it. It values parcels through a layer DAG with an LLM/Python seam: the model emits facts, deterministic Python emits dollars. The LLM structurally cannot emit a price.

**How it works (the corrected shape).** Layer 0 subject resolution (deterministic). Layer 1 fact extraction, the only genuinely parallel layer (regulatory, infrastructure, physical, market pullers hit different sources). Layer 2 feasibility solver, the only layer allowed to state what is buildable, this is where regulatory ∩ infrastructure ∩ soils resolves and double-counting dies. Layer 3 subtype router (selects the pricing engine). Layer 4 valuation engines (pure Python, no LLM arithmetic). Layer 5 calibration (versioned JSON coefficients, geography × subtype, hash-stamped). Layer 6 reconciler (fires only when engines disagree beyond a threshold; LLM judgment with the disagreement explicit, never averaged away). Layer 0.5 jurisdiction resolver sits before the DAG: it returns an authority map, not a jurisdiction, because zoning, septic, drainage, floodplain, wetlands, and assessment each resolve to a different body.

**The LLM/Python seam.** The model emits four things only: extracted facts (with evidence refs), categorical judgments (closed enums), ordinal judgments (bounded anchored scales), probabilities (0–1, separately calibrated), and abstention (null + evidence gap, first-class). No dollar field exists in its output schema. Reproducibility test: re-run last month's valuation from the cached feature vector through pinned code and get a byte-identical number. If the LLM touched arithmetic, that test fails.

**Two DSLs.** Ordinance rules (YAML per jurisdiction: dimensional rules, by-right/special uses, conditional density, the critical rule is that sewer availability unlocks density; authored by LLM, validated structurally, human-reviewed where density unlocks). Adjustment registry (declares which module owns which dollar; CI fails on duplicate ownership or mutex violation; this makes the ensemble double-count a compile-time error).

**Calibration, the billion-dollar question.** Five label tiers, different latencies and trust weights. Tier 0: hard labels, recorded arm's-length sales (Indiana Form 46021, with a real arm's-length flag; Michigan Form 2766, no flag, must be inferred). Tier 1: weak labels at scale, the sales-ratio study (fit the ratio of sale price to assessed value, IAAO method: COD for uniformity, PRD for regressivity; Michigan runs 24-month studies, Indiana annual trending). Tier 2: market signals (list price, DOM, list-to-sale, withdrawals, abundant and ahead of recorded sales). Tier 3: the operation's own offer outcomes, censored observations (accepted at $X means true value ≤ $X; rejected means > $X; survival analysis; nobody else has this). Tier 4: Jeramie's judgment, used correctly, define the feature space, not the coefficients; and pairwise preference labels (Bradley-Terry / learning-to-rank: 200 comparisons in an afternoon yields a ranking anchored to the real sales). Trust weights: Tier 0 drives the fit, Tier 1 supplies the geography multiplier, Tier 2 corrects recency, Tier 3 accumulates and eventually dominates, Tier 4 shapes structure then decays. **Self-reinforcement trap:** a model trained on Jeramie's labels, used by Jeramie, generates labels that agree with the model. The immune system is the exogenous anchor (recorded sales, offer outcomes). Hard rule: any evaluation whose test set contains a label Jeramie produced is not an evaluation.

**Loss function.** Not MSE. Overpaying loses real money; underpaying loses the deal. Asymmetric pinball/quantile loss, overestimation penalized about 3:1 (config value, Q-003). Fit P10/P50/P90, not a point estimate; the acquisition decision keys on P10. Score accuracy and calibration separately (Brier score, reliability diagrams; LLM probabilities are overconfident, fix with isotonic regression or Platt scaling). The metric that matters is decision quality: of parcels passed on, what fraction later sold above P50; of parcels pursued, realized margin versus predicted.

**Jurisdiction, the inversion.** Indiana's IC 36-7-4 splits into parallel regimes (ADVISORY, AREA, METRO). Under area planning law, when municipalities join the area plan commission, the municipal plan commission and BZA cease to exist. Under advisory law, a municipal plan commission may extend its comprehensive plan up to two miles beyond corporate boundaries (ETJ). Michigan is the mirror image: townships hold authority directly; county zoning is residual. The naive resolver (smallest polygon containing the parcel) returns the wrong ordinance in both states, for opposite reasons. Wrong ordinance → wrong min lot area → wrong lot yield → wrong price, silently. **St. Joseph County, Indiana: AREA planning law (VERIFIED from public record, 2026-07-25).** The body is named "The Area Plan Commission of St. Joseph County, Indiana." APC serves unincorporated county plus Lakeville, New Carlisle, North Liberty, Osceola, Roseland. It does NOT serve South Bend, Mishawaka, Indian Village, or Walkerton (South Bend left the APC between 2017 and 2023; ADR-0009: authority is time-varying, so historical sales need their authority pinned by date). ETJ is likely moot in an area county. The ordinance is St. Joseph County Code ch. 154 on Municode (structured HTML, not scanned PDF).

**Tier 0, resolved (RECORDED 2026-07-25, run record).** Indiana publishes every sales disclosure form since July 2008 as a free direct HTTP download (`https://www.stats.indiana.edu/sdfdata/SDF_2024.zip`, refreshed weekly Fridays 10am). Tier 0 and Tier 1 are in the same file: `P2_16_Valid_Trending` is the assessor's own arm's-length adjudication; `P2_5_Total_AV` is assessed value at sale; `B2_Buyer_Adjacent` is a labeled assemblage event. Three traps, confirmed against official metadata: UTF-16LE encoding, not UTF-8; scaling ("Format 12.2" → divide by 100; acreage "Format 8.4" → divide by 10,000); cardinality (SALEPARCEL is one row per parcel; aggregate per SDF_ID before any ratio). Measured St. Joseph County 2024: 5,841 records, 2,262 Tier 0 (38.7%), 48 vacant-land Tier 0 (the thin slice), 107 buyer-owns-adjacent, 789 multi-parcel sales. Sales ratio study: median 1.176, COD 68.8, PRD 1.534 (pooled across classes; stratify before production use). **The $7.4B outlier:** one LaPorte record (SDF_ID C46-2023-0077229, $7,400,074,000, assessed $67,200, marked Valid for Trending) moved 2023 COD from 12.8 to 11,771.7. An assessor-validated flag is not a data-quality guarantee. After quarantine, LaPorte reads 19.8 / 14.4 / 12.8 / 21.2 / 29.6 per year (inside IAAO range). St. Joseph 2023 sits at 46.0 (reassessment year, flagged review). The ratio is time-varying (St. Joseph by year: 1.255 / 1.240 / 0.802 / 1.176 / 1.051); the Tier 1 coefficient is per geography × subtype × YEAR, never pooled. Phase 0 exit: labeled Tier 0 exists (19,520 clean across two counties, RECORDED), join key validated, source hash stamped, prediction log standing; C5 (Tier 3 offer outcomes, Q-002) still open.

**Differentiators.** Assemblage valuation (value over combinations, not singletons; keystone premium; sequencing, the senior shoreline assemblage recipe is the seed). Predict dv/dt, not v (planning agendas, sewer/water capital plans, MDOT/INDOT let schedules, adjacent acquisitions, easement filings, school boundaries). The abstention set is the product (parcels no automation can value are where mispricing concentrates). The fact layer outlives the model and is separately salable (structured constraint data; the negative data is the moat). Sell the disagreement (surface the spread between approaches, name the driver).

**Current status (VERIFIED 2026-11-10).** Repo `NeuruhAI/datum`, private, latest commit `07184f5` (2026-07-26, v0.4.0: Tier 0 resolved, SDF loader, corrected APC municipality list). Root: `.gitignore, README.md, VERSION, docs, jurisdictions, schemas, scripts, src, tests, verify.sh`. The codex (10,959 words, 16 parts, 5 appendices, 95 sections) ships in the repo at `docs/CODEX.html` / `CODEX.md`. Indiana first, Michigan second, then the state/county/township template. **Open:** Q-002 (any record of past offers and outcomes, the only unreplicable tier); Q-013 (pin South Bend's APC exit date); Q-014 (four independent municipalities need their own ordinance extractions). The bootstrap saga (v0.3.0/v0.3.1, the Downloads suffix collision, PEP 668) is closed: the repo is on GitHub; update by `git pull`, never another bootstrap.

### II.7 FALLOW, the land-yield venture

**What it is.** A standalone dual-engine venture: a yield operating system for idle land. Find parcels that can earn, activate the owners, stack non-conflicting use-right leases, and sell the resulting yield intelligence to everyone holding land they cannot develop yet. Name locked: **FALLOW** (literal agricultural term for land deliberately left unproductive; short, ownable, no metaphor debt, deliberately unlike the Sonar family for the IP boundary). Alternates on record: IDLEWORKS, GROUNDRENT, ACREOS. **Status: thesis + v0.1.0 code, no entity filed, LaPorte pilot not run.**

**The gap.** Micro-leasing demand is already captured vertical by vertical (Hipcamp, Sniffspot, Neighbor, Base Camp Leasing, Peerspace). Nobody owns the supply-side operating system: interim yield management on temporally stranded land (probate, estate limbo, land banks, pre-development holds) that generates zero income while bleeding taxes. Raw land is the last unsliced asset class, not because demand is missing but because supply acquisition is the bottleneck. The three wedges: probate dead-time monetization (6–18 months of legal limbo; converts dead leads into a second monetization path), Land Yield Score as a LandOS module, micro-IOS/contractor yards (trailer parking $8,000–$20,000 per acre per month in strong markets, RECORDED; small yards fragmented).

**The two engines.** Engine A, Managed Yield Ops: score → outbound → management agreement → match demand across use verticals (hunting, storage, camping, apiary, laydown, cell/solar overlay) → agent-automated contracts, scheduling, insurance, collections → one check to the owner. Engine B, Yield Intelligence: Land Yield Score as SaaS/API, demand heatmaps, portfolio underwriting. Engine A's exhaust (realized dollars per parcel per use, by signal profile) is the moat data. Sequencing: A→B, with B's schema built on day zero so every lease A executes becomes training data B sells. Launching B with zero realized-yield data means selling a guess.

**The licensing correction (load-bearing).** The thesis as first drafted priced Engine A at a 15–25% take rate. In Michigan that is unlicensed real estate brokerage. MCL 339.2501 defines property management as leasing or renting real property of others for a fee pursuant to a property management employment contract, and a broker license requires 90 clock hours plus a minimum of three years full-time real estate experience (RECORDED from the thesis transcript; not independently verified by this codex, see Appendix D). The revised architecture has three lines: **A1 Master Lease (principal position, no license)**, the venture leases the parcel at fixed rent and sublets use-rights; it eats the rent obligation whether filled or not, and takes the whole spread (on a 40-acre parcel stacking $4,500 gross: $3,000 minus ops at a $1,500 fixed rent, versus $900 on the dead 20% take model). **A2 Flat-Fee Platform/SaaS (no license)**, owner subscribes to tooling and executes every lease themselves; the venture never negotiates, never takes a cut of rent. **A3 Broker-of-Record Affiliation (licensed, partnered)**, affiliate a licensed Michigan broker (and Indiana broker); commission leasing runs through them. A1 + A2 launch first; A3 is a week 4–8 conversation. A1 is also the home field: master-lease arbitrage on use-rights is structurally identical to 25 years of estate-sale arbitrage (buy the bundle cheap, unbundle, sell the components at retail).

**The score (v0).** 42 signals plus 7 hard gates. Gates suppress use verticals rather than discounting them (current-use enrollment kills laydown/camping/billboard/solar and leaves hunting and ag alive, because those are conforming uses). Signals span access/physical, hunting, storage/IOS/laydown, camping/recreation, energy/infra overlay, and owner activation (absentee, out-of-state, hold duration, parcel count, entity vs individual, tax delinquency, estate/trust/probate indicator, inherited transfer, tax burden, prior failed listing, no homestead exemption). Every score carries `score_version` (e.g. `lys-0.1.0`), non-nullable, because v0 is expert-weighted and the flywheel needs to measure v0.1 error against v0.2. The stacking conflict matrix (C/S/T/X with drafting conditions: hunting × camping emits actual blackout dates Oct 1–Jan 15 vs Apr 15–Sep 30; hunting × laydown emits the 300 ft stand separation and firearm exclusion; any stack with solar_option force-emits subordination language). The optimizer returns the highest-value conflict-free subset. `realized_yield.scoring_snapshot_id` is the single most valuable column: it joins prediction to reality with the exact signal vector retrievable.

**Live visual demo:** neuruhai.github.io/neuruh-demos/fallow-yield/ (HTTP 200, 66,263 B, verified 2026-11-10; built by the FALLOW coordinator in parallel with this codex).

**Verified build (VERIFIED 2026-11-10 by this codex).** FALLOW v0.1.0, extracted from the uploaded zip and run in this workspace: **39 tests passing** in the proper package layout (stdlib Python, zero pip installs for the engine; pytest only for the test run). Files: `signals.py`, `score.py`, `conflicts.py`, `test_score.py`, `run_score.py`, `schema/001_init.sql`, `config/market.laporte-in.json`, `config/brand.json`, `bootstrap.sh`, `README.md`. One bug the transcript records: the first run produced $845,231/yr on an 11-acre parcel because the laydown model used metro IOS per-SF pricing on a rural pad (overstated ~23x). Fixed to per-acre-month with a sanity ceiling; portfolio total went from $12.5M to $822K across 60 synthetic parcels, per-parcel stacks $7,800–$48,600. `ios_per_acre_month` is still DERIVED and UNVERIFIED: three real rural yard comps before any master lease is signed.

**Lane A (LaPorte pilot, 90 days, NOT RUN).** 500 mailers (revised up from 200; at ~$0.90 all-in, ~$450; 2% conversion on 200 is four expected signings, statistical noise). Weeks 1–13: gates and repo, parcel extract and 42 signals, Yield Score v0 and top 300, drive-verify top 60, two mailer batches of 250, owner conversations, demand-side fill, subleases, first `realized_yield` rows, kill-criteria read. Kill criteria (any two of three fail → drop long-tail A1/A2, go pure Engine B + Lane B): signed-agreement conversion below 2% of 500 contacts; median modeled-to-realized gross yield ratio below 0.6; demand-match rate below 50% within 60 days. Timing note: hunting leases transact in summer for fall season; storage/laydown is aseasonal and the better pilot vertical on a calendar basis. Demand-side seeding at zero CAC: Poag Civil Construction (laydown), Indy Roof & Restoration (material staging), Baker HVAC (fleet parking), three existing client relationships, three distinct laydown use cases.

**Lane B (institutional, parallel; audience RESOLVED to farm management firms).** The transcript's first two recommendations were both killed by its own research: land banks hold urban residential lots for disposal (Berrien's program is side-lot disposal; Detroit's ~100,000 parcels are vacant lots and abandoned houses sold for $100 a side lot), and builders will not encumber pre-development land and often hold it by option, not fee title. The solar-developer pitch was also overstated: developers typically hold options, and the landowner keeps farming during the option period. **The right target: farm management firms and farmland funds** (Peoples Company, Farmers National, Hertz Farm Management, regional equivalents, then TIMOs). Exact parcel profile, fee ownership, they already under-monetize the recreational/storage layer, portfolio scale, and they are already licensed entities that lease land for others, Fallow sells the intelligence layer, they execute every lease, brokerage exposure goes to zero. Gate 0.1 stops being a blocker. The deliverable is a two-page Interim Yield Program brief for a farm management firm principal or portfolio manager.

**Legal gates (Phase 0, Week 1, blocking; all RECORDED from the thesis, not yet executed).** Gate 0.1: Indiana licensing analysis (IC 25-34.1), since the pilot county is in Indiana. Gate 0.2: entity of record on every pilot contract, with an assignment clause permitting transfer to a successor entity without counterparty consent. **Gate 0.2 as drafted in the transcript is unusable: it says every pilot contract is a contract under the LLC-suffixed form of the Neuruh name. Neuruh is NOT an LLC and has never been one; the filing is unfiled. There is no such entity to be the entity of record.** The gate must be re-drafted around the actual facts (unregistered sole-proprietor operation, or the entity Jeramie forms). Gate 0.3: current-use tax program exposure (Michigan Qualified Forest Program and PA 116; Indiana classified forest and agricultural assessment), a non-conforming use can break enrollment and trigger retroactive recapture; this is a hard gate signal in the scoring model. Gate 0.4: IP license for LandOS-derived scoring methodology, **also drafted in the transcript with the LLC-suffixed licensor name, and equally unusable as written**; it needs the real licensor named. Gate 0.5 (added): USPTO clearance search in Class 36 and Class 42 before trademark or client-facing contracts at scale. Domains (RECORDED): fallow.ag available $89/yr, fallowhq.com $11.25/yr; fallow.com/.io/.co/.land, fallowland.com, getfallow.com, usefallow.com all taken. Do not register through Vercel (billing suspension); GoDaddy is the connected registrar.

**Market sizing (RECORDED, assumptions labeled, verify list applies).** Solar/storage dead-time: 2,060+ GW seeking grid connection end-2025, 773 GW solar (Lawrence Berkeley National Laboratory); 3.9–6.2M acres implied at 5–8 acres/MW (transcript math, verify conversion); 55-month interconnection pace; ~70% of queued projects ultimately withdrawn. Probate: low-hundreds-of-thousands of vacant/rural parcels entering administration annually (training-data estimate, needs Phase 0 verification). Family forest: ~10M+ ownerships (USDA National Woodland Owner Survey, verify edition). Builders: ~2M+ lots (verify from 10-Ks). Yield anchors: hunting Midwest ~$35/acre avg ($20–50 range), Indiana ~$19/acre; IOS $0.50–$2.00/SF/month metro; trailer stalls $75–200/month; cell tower $400–2,000/month where viable. Pilot hypothesis: a decent 40-acre Midwest parcel stacks $3–6K/yr gross; at 20% take that is $600–1,200/parcel/yr (note: the 20% take model is dead under the licensing correction; the hypothesis survives as a gross-yield figure, not a venture-revenue figure). Engine A long-tail alone needs ~1,000 managed parcels for ~$1M ARR, Engine B and Segment 1 B2B contracts are where leverage lives.

### II.8 NRH Registry, the addressing spine

**What it does.** SQLite CLI with addresses like `NRH-DD-ENT-TTT-NNN`, a hash-chained transition log, and verification decay. It is the canonical IP inventory and addressing spine for the estate (~140–215 repos in the NRH Registry). **Status: built as content, no repository.** No repo named neuruh-registry or neurh-registry exists in the NeuruhAI org (both 404, verified 2026-11-10). The registry lives only as content (vault, transcripts, demos), not as a repository under either spelling. CLI name unknown, discovery required before demo. The vault's Master-Data-List (231 rows × 29 fields) is the census built on top of it. **Live visual:** neuruhai.github.io/neuruh-demos/nrh-registry/ (HTTP 200, 30,459 B, verified 2026-11-10). Its commit message records 9 domains and 35 seeded entities, which conflicts with the July 10 domains / 48 seeded entities; both figures are carried with their dates (see Appendix F). **Where it lives.** Vault `Master-Data-List.csv` / `.json`; no GitHub repo.

### II.9 N-Cell, the deterministic protocol

**What it does.** A deterministic protocol around runtime state, authority, topology, provenance, outcomes, and governed computational organizations. Not an agent; a structural piece. **Status: implemented; test counts in CONFLICT.** The estate record states 36/36 (recorded 2026-10-04). The July codex states 47 tests across 3 packages (Wave 1, commit 39090e3, 952 insertions). Neither figure has been re-verified from the repository in this workspace. Both are carried with their dates; re-verification requires a clone and a test run on the Mac. Repo `NeuruhAI/ncell` (private), latest main commit `d2c8462` (2026-10-04, PR #3, docs/phase-2-3-landed).

### II.10 Galaxy / Cockpit, the visual layer

**What it is.** The organism's visual layer: a force-directed galaxy of the estate, organism health views, a mission runtime, and the cockpit command surface. **Status: running on the Mac via launchd (RECORDED Oct 4–5); the port map was never written down, which is why it feels missing.**

**Surfaces and ports (RECORDED from the Oct 5 lsof output; the 404s are API-only services, not dead ones).**

| Port | Surface | Launchd job | HTTP at / |
|---|---|---|---|
| 4789 | organism-status | com.neuruh.surface.organism-status | 404 (API, no page at /) |
| 8400 | galaxy-live | com.neuruh.surface.galaxy-live | 200 |
| 8500 / 8505 | cockpit command | com.neuruh.command.server | 200 |
| 8510 | adaptive | com.neuruh.surface.adaptive | 200 |
| 8511 | observations | com.neuruh.surface.observations | 404 (API) |
| 8520 | laric | com.neuruh.surface.laric | 200 |
| 8600 | client-galaxy | com.neuruh.surface.client-galaxy | 200 |
| 8893 | upl | com.neuruh.surface.upl | 404 (API; canon calls UPL a read-side runtime) |

Other listening ports on the same sweep: 8410 landos-engine, 8480 lead-recipe-os, 8300 neuruh-axon, 8055/8090 aegis, 8077 neuruh-mother, 8788 neuruh-axon, 8848 autonomous-governance-core, 18731 neuruh-sentinel-court-supervised, 19090 recipe-engine-supervised, 11434 Ollama (~4.7 GB; a loaded model and a LEGION run cannot share 8 GB).

**Galaxy-live** is the flagship: 12 worlds, 231 assets, 661 nodes, 188 edges (July counts, likely higher now), η health rings, a live agent ledger, a publish pipeline (review tray → gate → shelf). Read-only by design: every dot maps to a receipt on disk. **Client-galaxy** is, by name, the white-label client-facing galaxy (inference; verify). If true, it is the resale surface: "your company as a living galaxy." **Cockpit** (:8500) holds command-v2, the context-fusion organism dataset and visual, a 412-line world-model read model, organism topology and discovery configs, and a presidential briefing contract. Three cockpit clones exist on disk plus `-supervised`; launchd serves from `~/Neuruh/Neuruh/NeuruhAI/neuruh-cockpit` except :8500, which runs from `-supervised`. Name one canonical clone before merging anything.

**Built but not served.** Cockpit Spatial V4 (territory-engine@`5d218cc5`, a separate repo, not a cockpit branch; source survives at `/Volumes/NEURUH-HD/NEURUH_SPATIAL_ORGANISM_V4_REVIEW_20260816`). Founder Command Stage A (`product/founder-command-final-convergence-20260817`) and Stage B (`product/founder-command-v5-stage-b-20260817`). Neuruh Atlas (self-contained HTML/SVG map, two spines, authority NONE, pure map). HelmAI 3D Live Block viewer (Three.js, react-three-fiber, UnrealBloom). LandGraph canvas (Neo4j NVL, parcel → owner → LLC → human; Phase 0 only; designed for port 8500, which the cockpit now holds). SREIC swarm dashboard, **caution: its 2,550 / 5,150 / 10,000 agent counts are hardcoded display constants with no network activity behind them; never present those numbers as real.** Console on 127.0.0.1:7400 (branch `feat/w0-console-shell-7400-20261001`, the W0 shell for the 29-item frameworks build; frozen Oct 1, never pushed; needs plan review before unfreezing because it was started before the build gate opened).

**The 5,150 kill (settled, do not relitigate).** Agent Swarm Domination dashboard: `App.tsx:140 count: 2550` hardcoded, `:145 generateAgents('acquisition', 15)` (fifteen objects), a 2-second setInterval faking "live," `setTotalRevenue(p => p + Math.random() * 50000)`. Grep across `src/` returns zero fetch/axios/supabase. It never connected to anything. 5,150 / 10,000 are simulation display constants, not a count of anything. The only real runtime number is 0..N worker leases. SWARM stays design-stage.

### II.11 Heartwood + funding_fit, the other tenants

**Heartwood Arborist** is LEGION's second job type: it scores a system's structural integrity into rings R0–R4, kept in a hash-chained Ring Ledger and enforced by a Branch Gate. Built at `~/Neuruh/heartwood`: 12 commits and 326/326 tests as of 2026-10-05 (RECORDED). Whether it reached GitHub depends on the GITHUB ALL push run (UNKNOWN). **D-046 (two flaws to rule on):** (1) the packaging ruling was never actually made, the recommendation was a git dependency pinned to a SHA; Jeramie's reply "just push it all" approved the push, not the ruling. If the heartwood repo is private, CI in neuruh-workers cannot fetch the pinned dependency without a credential. Options: read-only deploy key in workers' Actions secrets (recommended now), make heartwood public (fits "open core" but the Heartwood Guild trademark conflict, D-002, is unresolved), or copy a built package (drifts silently). (2) A judge inside the builder: workers depends on Heartwood, and Heartwood's estate_paths include neuruh-workers, so the runtime would run the scanner that certifies the runtime itself, breaking the Chapter 04 rule that the builder never imports its own judge. Fix: Arborist inside workers may scan other repos; a certified ring for neuruh-workers itself must come from the standalone CLI (`python -m heartwood assess`), outside the runtime; the report records that the scanner's host is not the target.

**funding_fit** is the third job type (LENDURUH folded in as a capability): capital-matching scores. Being built by Run B in neuruh-workers. Status unknown (RECORDED).

### II.12 The swarm, complete anatomy (RECORDED 2026-09-13)

Four layers, four different statuses. Do not collapse them.

- **Layer A, Force Multiplier Stack (HISTORICAL CANON).** 60+ agent specs → 100 power tools → 15–20 buildable modules → vertical deployments. Named: ROOF-OPS AI, Baker HVAC Dispatcher, CartIQ, REIA GPT, AI Sales Closer, StudioGPT, ARB-BOT, Pulsar DC, HVAC/Security/MSP/Waste/Plumbing/Roofing/Electrical Acquisition Intel, Mirror Agent GPT, Command Protocol GPT, IP Librarian, MOTHER configs.
- **Layer B, Notion operator agents (DOCUMENTED).** AG-00…AG-14, 15 roles despite a heading that says 14: ROUTER, BuildOps, RepoRescue, KeyGuard, LaunchOps, ContentOps, IPLibrarian, SalesOps, ClientOps, DataOps, FinOps, ResearchOps, QAGate, RepoHygiene, Governance.
- **Layer C, JGI execution fleet, 32 narrow contracts (CANONICAL DESIGN).** Command/truth: Mission Compiler, Estate Census, Canon Arbiter, Dependency Mapper, Priority Scheduler. Build: Prime Builder, Repo Rescue, Integration Weaver, Migration Engineer, Test Forge, Performance Engineer, Packager. Security/authority: Sentinel, Capability Guard, SSRF Red-Team, Secrets KeyGuard, Governance Adapter. Git/release/ops: Git Custodian, Release Marshal, Deploy Marshal, MOTHER Watchdog, SRE Recovery. Intelligence/memory: Context Loader, Memory Curator, Research Ops, Signal Miner, Model Router. Revenue/world: Recipe Compiler, Contact Resolution, Underwriter, Outreach Ops, Revenue Ops. Pods reuse the 32 without duplicating control planes: DeedSonar, Signal Lead Machine, Liquidity Engine, FindSellProfit, Content OS, Design, IP/Packaging, Historical Research.
- **Layer D, V6/V6.1/V6.2 operator surfaces (PARTIALLY LIVE).** BOB (mission control), PRIME (build), SWITCH (contract router), SENTINEL (court), HONEY (git custody), RICHIE (economic priority), MOTHER (system watch), JGI (integration), VIBIN (founder brief), LARIC (canon steward), COMMONS (public proof), TINKA (connector lab). Standing routines (reported live on Grok, 2026-09-07): BOB Mission Queue Advancement every 30 min weekdays 08:00–19:30 ET; MOTHER System and Mission Watch 10,40 8–19 weekdays; RICHIE commercial court weekdays 08:00 + 15:00; VIBIN Morning Brief / Evening Close 08:30 / 17:30; LARIC Daily Canon Closure 18:00 weekdays; COMMONS Proofstream Court 09:00 weekdays. Shared Kernel V6.2 SHA-256: `84a1c4deda98befe32ccf344a396a70d0722a1ac894f278bbbb8352d5966a757`.

**The one real coordinated tape.** 2026-09-07 14:42–14:44 ET, parent AUTONOMY-ACCEPTANCE-WILLOW-PROOF-001 → child COMMONS-PROOFSTREAM-001. BOB classified RUNNABLE, dispatched COMMONS itself, set WAITING_ON_CHILD with a duplicate-dispatch guard, COMMONS sealed a receipt and returned it, BOB ingested, closed the child, advanced the parent to READY_FOR_REVIEW, routed the delta to LARIC. Founder transport: zero. Fleet classification (Sep 7 failure court): COORDINATED_CHILD_EXECUTION_PROVEN / CONTINUOUS_AUTONOMY_NOT_PROVEN / EXTERNAL_ACTUATION_PARTIAL.

**The V6 doomsday ruling.** Full read of all 60 Autonomous Builder cycles (2026-04-17 to 2026-04-20): cycles 001–013 produced genuine output (created `yousernamehere/lenduruh`, pushed 14 files in commit `e6d8cc5`; created neuruh-vault; filed the LENDURUH MVP spec, CIF v2 use policy, a Dev Log SQL cheat-sheet verified by a live query returning 5 clean rows; wrote to live Notion DBs, posted Slack #auto-bot). Cycles ~040–060 are self-referential audit loops. The blocker list at cycle 060 is byte-identical to cycle 047. Every item reads Jeramie-gated. Cycle 060 closes with "Fifteenth consecutive session-tick closes clean." Then the log stops forever at 2026-04-20 00:45 ET. Mechanism: every economically consequential action required a permission the agent did not hold. The only unblocked action left was auditing its own prior output. Revenue was never in its action space. Required contract change, already ruled, deployment-gated: ECONOMIC_LINK (which revenue predicate does this mission advance?) and NO_OP_BUDGET (consecutive no-change cycles before mandatory escalation; default 3). Three consecutive no-change cycles is a STALL, not "clean." Applied to April, it would have escalated at cycle 043 instead of dying at 060. Implemented in the V6.1 pack at `/Neuruh/Build Custody/2026-09-07/NEURUH_GROK_OPERATOR_FLEET_V6_1_CORRECTED_2026-09-07.zip`.

**The clipboard defect (the three unwired gaps).** The chain is built; three seams are unwired: worker → sealed receipt [GAP 1: receipt-watch] → Switchboard → court.requested [GAP 2: Sentinel-invocation] → Sentinel verdict [GAP 3: result-ingest] → court.passed → candidate.push.requested → Git Custodian. Jeramie is the courier across those three gaps. Confirmed by the 227-row Autonomous Builder log census: 178 Success / 47 No-op / 1 Queued / 1 Running. Bounded execution worked. It died at cross-boundary continuation, every time. Four bottlenecks, none architecture: standing-controller coverage (BOB and MOTHER are weekday-daytime only; intentional overnight dead zone); external mutation authority (H01 reached Sentinel PASS and Honey custody, then Grok Auto-review denied Honey's outbound Git push); durable T02 runtime continuation; founder-interrupt throttling (too eager, one interrupt per blocked lane instead of one batch).

---

## III. The demo reel + visual layer

*As-of: 2026-11-10.*

### III.1 The seven terminal demos

Ranked by wow per minute on stage. All run on the M1 Mac; the local demo reel commands below are macOS, zsh, Homebrew.

| # | Demo | What the room sees | Status |
|---|---|---|---|
| 1 | LEGION | 10,000-agent swarm; 6,487 real opportunities scored in 3.3s; fault-injection run with 9,997 succeed and exactly 3 fail, as designed; kill switch; tamper detection | PROVEN 2026-09-28; PR #26 merged 2026-09-30; replay live (see III.2) |
| 2 | Local open weights, offline | A model answers with Wi-Fi off; tokens/sec, peak RAM, GPU watts live; $0.00 per token | Weights at risk (RECORDED Oct): the Bonsai folder likely has no weights on disk; the Qwen2.5-3B download was the fix, nothing confirms it finished |
| 3 | CRUCIBLE ledger tamper test | Hash-chained ledger of 44 receipts; change one byte and the chain breaks on screen | Real service on port 8601; demo the ledger, not the hallucination detector |
| 4 | Test wall | Four suites green back to back: Legion 387, LandOS 148, Fallow 39, N-Cell 36/36 | Counts on record (RECORDED); exact paths need discovery; FALLOW 39 re-verified 2026-11-10 |
| 5 | DATUM outlier catch | The QA auditor catches a $7.4B outlier in Indiana sales data; COD lands inside the IAAO range after quarantine | Phase 0 complete (RECORDED); entrypoint: `scripts/qa_labels.py` in NeuruhAI/datum |
| 6 | NRH Registry | SQLite CLI with NRH-DD-ENT-TTT-NNN addresses, hash-chained transition log, verification decay | Built and published (RECORDED); CLI name unknown |
| 7 | Repo census | A live line count across 178 local clones | Runnable now (`tokei`); quote 321,901 defensible lines, use the tokei number only as the visual |

**Step 0, every time: free the RAM first (8 GB box).** Colima was given all 8 GiB. A model plus Chrome plus Colima means swap death mid-demo. `colima stop` (takes neuruh-qdrant and the local DeedSonar Postgres offline until `colima start`; nothing is deleted), check `memory_pressure` (want above ~40% free), quit Chrome and unneeded Claude Code lanes. Run one heavy thing at a time: Legion runs pushed swap to ~8.9 of 10 GB. Never run Legion and a model together.

**Demo 2 first (open weights, offline).** Run it first because it is the one most likely to be broken. Check weights: `ls -la ~/neuruh-workspace/models/*/config.json` (a path like `.../qwen2.5-3b/config.json` means the weights landed). Check the runtime: `ls -la "$HOME/Neuruh/Neuruh/neuruh-local-secrets/neuruh-ocn-bonsai/.venv/bin/" | grep mlx` (expect `mlx_lm.generate` and `mlx_lm.server`). If weights are missing, download ~1.8 GB with the Bonsai venv's Python (`huggingface_hub.snapshot_download('mlx-community/Qwen2.5-3B-Instruct-4bit', local_dir='qwen2.5-3b')`) into `~/neuruh-workspace/models/` (not iCloud-synced, not the secrets folder). Demo in three Terminal tabs: the model (`mlx_lm.generate --model ~/neuruh-workspace/models/qwen2.5-3b --prompt "Explain why a parcel owned 30+ years by the same person is a stronger off-market lead signal." --max-tokens 300`; read the tokens/sec and peak memory lines aloud), the power draw (`sudo powermetrics --samplers gpu_power -i 1000 -n 15`), and the sovereignty proof (Wi-Fi off, Ethernet unplugged, run again, then `lsof -i -n -P | grep -iE "python|mlx"` shows no network sockets from the model).

**Credibility traps (fix the framing before showing anyone technical).** "My open weights" is not accurate: Bonsai belongs to PrismML and Qwen belongs to Alibaba. Say "sovereign local inference." The only route to "my model" is a LoRA adapter trained on the NRH registry. LEGION is 10,000 governed workers on a shared thread pool, not 10,000 LLM agents; the honest version is stronger for a technical audience. Do not demo CRUCIBLE as a hallucination detector (0.512 vs 0.532 baseline; see II.4).

**Cross-vertical fusion (one pipeline, 90 seconds).** lead-recipe-os picks a place → LandOS signals → LEGION fans out → the local model writes notes on the A-tier → every stage writes a CRUCIBLE receipt → NRH addresses the artifact → powermetrics prints the energy bill. The receipt chain is the defense-procurement angle (provenance and tamper evidence are what SBIR/DIU reviewers look for). The same architecture covers the estate-intake retail layer: score an estate lot instead of a parcel.

### III.2 The LEGION replay (live)

Live at `https://neuruhai.github.io/neuruh-demos/legion-replay/` (VERIFIED 2026-11-10: 34,116 B, MD5 `973003ad4d27c4cb2817f1f7fbf75039`, HTTP 200 byte-identical, 87 DOM checks 0 failures). Three.js viewer (pinned cdnjs three.js 0.158.0): 7 cohort clusters, 130 squad nodes, 6,487 tier-shaped agents, sealed brass FINAL_OUTPUT core. Controls: drag rotate, wheel/pinch zoom, cohort focus, tier filters, slow-rotation toggle, reset. Plain fallback if WebGL or the CDN is unavailable. The page labels the layout as derived, not recorded telemetry, in three places. Below the viewer: why the run is different, the honest scorecard, the stack, 11-step mechanics, D-046 open rulings, and the path to LEGION-LIVE. Hub card live (v2.17, Section E). The Mac capsule for the true build is at `~/workspace/your_files/legion-replay/MAC-CAPSULE.md`. Diagram D9 (LEGION replay) is in the diagrams/ folder of this codex.

### III.3 The cockpit surfaces (how to open them)

On the Mac, all surfaces are launchd jobs named `com.neuruh.surface.<name>`. Check them with `launchctl list | grep com.neuruh` (a `-` in the first column means loaded but not running). Check ports with `for p in 4789 8400 8500 8510 8511 8520 8600 8893; do printf "%s " $p; curl -s -o /dev/null -w "%{http_code}\n" --max-time 2 http://127.0.0.1:$p/; done` (200 is up; 000 is nothing listening; 404 on 4789/8511/8893 means an API-only service, not a dead one). Restart one with `launchctl kickstart -k gui/$(id -u)/com.neuruh.surface.<name>`. Open all in Safari (less RAM than Chrome on 8 GB): `open -a Safari http://127.0.0.1:4789/ http://127.0.0.1:8400/ http://127.0.0.1:8500/ http://127.0.0.1:8510/ http://127.0.0.1:8511/ http://127.0.0.1:8520/ http://127.0.0.1:8600/ http://127.0.0.1:8893/`.

TRAP (RECORDED Oct 5): in zsh, `path` is tied to `$PATH`. A loop like `for path in /health ...` overwrites the shell's program search list and breaks every command in that window (`curl not found`, `git not found`). Fix in place with `export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"; hash -r`, or close the window and open a new one. Loop variables must be named `route`, never `path`.

### III.4 What is built but not served, and what was lost

Spatial V4, Stage A/B, Atlas, HelmAI viewer, LandGraph, the 7400 console: see II.10. The LEGION swarm render existed only inside chat windows (re-rendered Oct 4, never saved to disk) until the replay demo shipped Nov 10; the committed replay is the permanent version. LEGION-LIVE (:8620/:8621) was drafted as a mission capsule and never launched; it is the only path to watching a real swarm live, and until then any "live swarm" visual is a replay and must be labeled as one (design law forbids fake live activity).

---

## IV. Money layer

*As-of: 2026-11-09/10. No contract, invoice, payment, or cash figures are recorded in this codex, per standing rule. Prices below are Jeramie's published list prices.*

### IV.1 Service offers (live and able to take money, in principle)

Free 10-minute qualifier is the primary CTA everywhere (`cal.com/neuruh`). Property Opportunity Scan $100. Property Intelligence Dossier $1,500 (2–3 hrs). Data Rescue from $750 scoped. Workflow Replacement Sprint from $3,500. Forensic System Audit $950 scoped then invoiced. Consults: 15-min $75, 30-min $150, 60-min $250. Service clients on record: Baker HVAC (voice dispatcher), Indy Roof & Restoration (ROOF-OPS), Poag Civil Construction (AI training portal).

**The honest ledger (VERIFIED 2026-11-09): nothing is live end-to-end able to take money.** DeedSonar returns 503, the production database is unreachable, neuruh.com DNS still points at a dead Vercel deploy (the rebuild lives at `neuruh-web.pages.dev`, HTTP 200; the DNS swap is Jeramie only: delete A @ and CNAME www pointing at Vercel, add proxied CNAME @ and www to `neuruh-web.pages.dev`; do not touch MX/TXT email records). The offers are priced; the money path is broken in three places. That is the top of the Startup Needle Report (live at `neuruhai.github.io/neuruh-demos/startup-needle-report/`).

### IV.2 Sale catalog

| Asset | Ask / band | Status |
|---|---|---|
| DeedSonar | Ask $95,000; target $50,000–$65,000; walk-away floor $25,000 cash; kernel retained and licensed | Package built (`~/workspace/deedsonar-sale/`); buyer demo live; target list needs Jeramie's name-by-name approval before any send |
| Lead Recipe OS | Path A retain + license; Path B sell outright $150,000–$350,000 band | **Kernel fork unanswered; gates all sale paperwork.** The $150–350k band is the least grounded number in the catalog |
| LANDOS | Outright $35,000–$80,000; license ~$5,250–$20,000/yr | Terms drafted |
| CRUCIBLE | License only, no dollar range asserted | Integrations incomplete; HMAC custody open |
| Parcel Reality Bench, Neuruh Papers, Adaptive Intelligence series, SWARM, FALLOW | No dollar range asserted | SWARM design-stage only; FALLOW paid-pilot only |
| Not sellable | First Pick (CC0), edge-agent (export-control risk, never named in sale paperwork), named-owner PII standalone, the Neuruh brand, client work product | Excluded |

### IV.3 FALLOW economics

Three legal lines (see II.7): A1 master lease (principal position; venture takes the spread and the rent risk), A2 flat-fee platform/SaaS (owner executes every lease; venture never takes a cut of rent), A3 broker-of-record affiliation (commission through a licensed broker). Engine B: SaaS seats for land investors ($99–499/mo, RECORDED), per-parcel scoring API, portfolio underwriting engagements (annual per-acre), demand-heatmap data licensing. All white-labelable from inception. MRR is $0. No dollar valuation for the venture is current or claimable; the only defensible external claim is the structural argument plus verified rate anchors with sources attached.

### IV.4 DATUM SKUs

Five separable SKUs fall out of the design: fact layer / constraint DB (brokers, engineers, municipalities, title); valuation + distribution (investors, lenders); dv/dt signal feed (developers, land funds); assemblage engine (keep internal longest; highest margin, hardest to replicate); county calibration sets (effectively a private equalization study). The assemblage engine is the one to keep internal longest.

### IV.5 The demo reel as a sales asset

LEGION with lead-recipe-os demos the Opportunity Intelligence offer. CRUCIBLE with NRH demos the Forensic System Audit offer. The DATUM outlier catch demos Data Rescue. The :8621 aggregate view is a client deliverable: a buyer watches the swarm that scored their market and never sees a single lead. The reel script itself is sellable as a white-label "sovereign AI proof kit" to other local-AI consultancies.

---

## V. Gaps and seams

*As-of: 2026-11-10.*

### V.1 The P0 seam (the plug)

The chain is built; three seams are unwired (see II.12): receipt-watch, Sentinel-invocation, result-ingest. H01 is CLOSED (I.3). What is owed: retro-court at head `50d36e02`, live-loop proof at current main, main-branch CI. Work order: vault `_research/p0-seam-workorder.md`. The Mac filesystem lane is also unrun (work order `_research/mac-filesystem-lane-workorder.md`); all court verdicts are conditioned on it not having run.

### V.2 The data spine is dead

Production Supabase `efxowqudmsfqjmbeidjc.supabase.co` unreachable (curl 000, verified repeatedly through Nov 9). Lead pull failed 25 straight nights (2026-10-16 through 2026-11-09). Legacy project `lvdimujkfheeyqchjzra` also unreachable and refused by code. The pivot (Jeramie's order): stop depending on Bryan-held access. Backup scripts exist on the Mac (`landos-engine/scripts/backup_deedsonar_production.sh` → `/Volumes/NEURUH-HD/NEURUH_BACKUPS/deedsonar-efxo`; `scripts/backup_spine.sh` → `~/models/provenance/db`). Only Jeramie can check whether dumps exist in those two paths. If yes: restore into a NEW Supabase project in his own account. If no: re-ingest from live county ArcGIS (St. Joseph 119,780 parcels, LaPorte 64,775). No dumps exist in this workspace. Secure Vault holds only a facebook.com login; no saved Supabase or Vercel logins.

**Historical context (Sept 13 snapshot, do not treat as current).** On 2026-09-13 the production database was live in Bryan's "APG Land" Pro org with ~300k rows across 170+ tables, migrations through `20260913150000` (that day), estate identity rows 22,355 (canon Sep 6 said 22,343), `landos.*` as an 18-table schema inside the same project, and T50A case-spine tables at zero rows (schema present, data never loaded; the 120-record Willow accepted case exists only as a historical branch artifact). Security findings from that probe: 3 SECURITY DEFINER views, 23 SECURITY DEFINER functions executable by anon via `/rest/v1/rpc/` (including `public.deedsonar_estate_identity_sync_v1()`, a full rebuild of the 22,355-row identity projection callable by any unauthenticated caller, a free denial-of-service against the exact resource R01 classified COMPUTE_STARVED), 62 executable by authenticated, 19 with mutable search_path, leaked-password protection disabled, 39 tables with RLS enabled and zero policies. Current state of all of this is UNKNOWN because the database is unreachable; the Nov 4 repo-side grants audit (`~/workspace/supabase-oct30-grants-audit/`) covers grant gaps from code and is the current record. Do not cite the Sept 13 counts or findings as live.

### V.3 Licensing and entity gates

- **Neuruh is not an LLC.** The Michigan LLC filing ($50) remains unfiled. It gates SBIR/defense routes and A16Z follow-up. Four decisions are Jeramie's: legal name and designator, registered agent, member-managed vs manager-managed and ownership percent, processing tier. A funded card must be confirmed first (2026-10-23 Wells Fargo decline). **Never write the name with an LLC suffix anywhere.** Two drafted documents in the FALLOW thesis use that name (Gates 0.2 and 0.4); both are unusable as written and must be re-drafted.
- **FALLOW Michigan brokerage:** the 15–25% take-rate model is dead as specced (see II.7). Indiana analysis (IC 25-34.1) still open (Gate 0.1).
- **FALLOW current-use tax exposure:** Gate 0.3 open; a non-conforming use can trigger recapture.
- **Fly.io for LANDOS runtime:** ~$2–5/mo, approval unanswered.
- **CRUCIBLE HMAC key:** Mac check outstanding (`ls -la ~/crucible/`); never paste the key anywhere.

### V.4 Open questions (blocking flags)

| ID | Question | Blocks | Status |
|---|---|---|---|
| Kernel fork | Lead Recipe OS Path A (retain + license) vs Path B (sell outright)? | All DeedSonar sale paperwork | OPEN, unanswered |
| Q-001 | DATUM: Indiana or Michigan first? | Label pipeline schema | ANSWERED: Indiana first |
| Q-002 | Any record of past offers and outcomes (spreadsheet, texts, email)? | DATUM Tier 3 (only unreplicable tier); Phase 0 C5 | OPEN |
| Q-003 | Overestimation penalty ratio | DATUM calibration config | Set 3:1 as config value, reversible |
| Q-007 | DATUM codename | Nothing (name appears in zero code paths) | datum, locked |
| Q-009 | St. Joseph County planning regime? | DATUM jurisdiction resolver | RESOLVED: AREA planning law |
| Q-012 | Which municipalities joined the APC? | DATUM resolver correctness | RESOLVED: Lakeville, New Carlisle, North Liberty, Osceola, Roseland served; South Bend, Mishawaka, Indian Village, Walkerton independent |
| Q-013 | Pin South Bend's APC exit date | Historical label correctness | OPEN |
| Q-014 | Four independent municipalities need ordinance extractions | DATUM coverage | OPEN |
| Overview regen | Run the vault-overview regeneration + push (pre-§33 page is live) and hub v2.17 card update? | Hub accuracy | AWAITING Jeramie's tap (widget presented 2026-11-09) |
| AI-ART-001 | Asset ID reuse error; re-issue? | IP Registry cleanliness | Jeramie's call |
| verified_date vs VERIFY_DATE | Date-handling decision before any full vault rebuild | Vault rebuild | Jeramie's call |
| 306 unverified mention ids | Resume in a fresh rate-limit window | Vault completeness | His order on timing; do not chase |
| 18 owner-hunt items | Mac lane + founder rulings + code-search re-runs | Vault completeness | His order on timing; do not chase |
| FALLOW Gate 0.1/0.2/0.3/0.4 | Indiana licensing, entity of record, tax recapture, IP license | FALLOW pilot (any real money) | OPEN (0.2/0.4 need re-drafting, see V.3) |
| FALLOW Lane B brief | Audience resolved: farm management firm principal | Brief build | READY to build on his word |
| prbench visibility | Public repo vs "REPO MUST BE PRIVATE" header; Instrumentation scope | prbench positioning | Jeramie's call |

### V.5 Kill criteria on record

- **FALLOW Lane A (week 13 read):** any two of three fail → drop long-tail A1/A2, go pure Engine B + Lane B. Signed-agreement conversion below 2% of 500 contacts; median modeled-to-realized gross yield ratio below 0.6; demand-match rate below 50% within 60 days.
- **DATUM Phase 0:** exit criterion is a labeled Tier 0 dataset for one Indiana county, joined to scored parcels, every record traceable to a source file hash. C2 was redefined during the build: it gates key validity (18-digit format, county code sane, overlap ≥ 500), not forward coverage (structurally low; labels exist only for parcels that sold).

### V.6 What is stale by design in this codex

The Sept 13 deep-dive numbers (DB counts, Vercel 402s, the 37-repo org listing, xAI PR #503 open) are historical snapshots. The July 27 DeedSonar migration findings are historical. The Oct 4–5 cockpit port map is the last sweep; ports may have moved. The Nov 9 money ledger (4 paid buyers waiting, Kodiak photos unshot, Substack chargeback due ~Nov 13, Gmail full since Oct 23) is carried in the Startup Needle Report and MEMORY.md, not repeated here in full. When any of these is re-probed, the new entry supersedes the old one in place with a date.

---

## VI. Procedures, how to do it

*Every procedure is macOS-first (Terminal, zsh, Homebrew). Nothing here deletes, moves, or overwrites without saying so.*

### VI.1 Run the demo reel (on the Mac)

1. Free the RAM: `colima stop`; `memory_pressure | tail -1` (want above ~40% free); quit Chrome and unneeded Claude Code lanes.
2. Demo 2 first (open weights): check weights and venv (Section III.1), then three Terminal tabs (model, powermetrics, Wi-Fi off).
3. LEGION: show the sealed proof (`cat ~/.neuruh/legion/legion-8b4fcca041981a3af08a6331/FINAL_OUTPUT.md | head -60`, then `shasum -a 256` on the same file and write the fingerprint down). Confirm where Legion lives (`cd ~/neuruh-worktrees/legion-swarm-20260928 && git log --oneline -3 && git status -sb | head -1`; expect `b41516b` and `fd45791`; if status shows `[ahead 2]`, push before anything else). The deterministic demo (run, HALT mid-run, resume, hash FINAL_OUTPUT, compare, tamper a COPIED journal and show the halt) needs the exact run/resume commands, they live in the Claude Code capsule, not in this codex, because they were never written down. Do not guess them.
4. CRUCIBLE tamper test: start the service on 8601, show the receipt chain verifying, edit one receipt, show verification failing at that exact link. The exact verify endpoint is likewise in the capsule, not here.
5. Test wall and census: find the repos (`find "$ROOT" -maxdepth 2 -type d \( -iname "*landos*" -o -iname "*fallow*" -o -iname "*ncell*" -o -iname "*registry*" -o -iname "*datum*" -o -iname "*prbench*" \)` with ROOT=`/Users/jeramiehicks/Neuruh/Neuruh Builds Canotical/Neuruh`); per repo run `.venv/bin/python -m pytest -q` or `npm test`; census with `tokei "$ROOT" --exclude node_modules --exclude .venv --exclude dist --exclude build` (quote 321,901 defensible lines; the tokei total is the visual only).

### VI.2 Onboard a county for DATUM

1. Determine the planning regime. Indiana: advisory or area (IC 36-7-4). The question to ask a plan commission: "Do you operate under the advisory planning law or the area planning law?" They recognize their own statutory language. **St. Joseph County is already resolved: AREA.** Do not re-ask it.
2. List the municipalities joined to the APC (St. Joseph: Lakeville, New Carlisle, North Liberty, Osceola, Roseland served; South Bend, Mishawaka, Indian Village, Walkerton independent). Record the list with a date; authority is time-varying (ADR-0009).
3. Get the ordinance. St. Joseph County Code ch. 154 is on Municode as structured HTML. Check whether other target counties are on Municode before estimating extraction cost.
4. Author the ordinance DSL (YAML per district): dimensional rules, by-right/special uses, conditional density. A human reviews anything that unlocks density.
5. Register adjustments in `adjustments.registry.yaml` (one owner per dollar; CI fails duplicates).
6. Fill the label-source mapping from the real file. Never guess column names, a mis-mapped column poisons the label set.

### VI.3 Run the SDF loader (DATUM Tier 0)

In `NeuruhAI/datum`: `python3 scripts/fetch_sdf.py --years 2021 2022 2023 2024 2025 --county "St. Joseph"`, then `--county "LaPorte"`. It writes `data/sdf/{county}/labels_tier0.jsonl` and handles all three traps (UTF-16LE, /100 price scaling, per-SDF_ID aggregation). Then audit: `python3 scripts/qa_labels.py --county "St. Joseph" --write-clean` (same for LaPorte). Quarantined records go to `labels_quarantined.jsonl`, never deleted. Never pool ratio studies across years; the coefficient is per geography × subtype × YEAR.

### VI.4 Run the FALLOW pilot (Lane A)

Phase 0 gates first (Section II.7; Gates 0.2 and 0.4 need re-drafting per V.3, do not execute them as written). Phase 1: repo at `~/neuruh-repos/NeuruhAI/fallow`, gitignore as commit #1, gitleaks hook with a canary test that must be refused, config files, venv with duckdb + pytest, new Supabase project `fallow-core` (never reuse the exposed credential). Phase 2: 42 signals, 7 gates, `score_version` on every score, 20+ tests before the first parcel is scored in anger (v0.1.0 ships 39 passing, verified 2026-11-10). Phase 3: conflict matrix with drafting conditions. Phase 4: realized-yield instrumentation before the first outreach letter (the schema is the moat). Then the 13-week Lane A plan (Section II.7). Three real rural yard comps before any master lease is signed, the highest-value hour of phone calls in the plan.

### VI.5 Launch LEGION-LIVE

The capsule is at `~/workspace/your_files/legion-replay/MAC-CAPSULE.md`. Preconditions: Run B closed, `ollama ps` checked then Ollama stopped, one Claude Code session at a time. It builds `legion/viz/build_replay.py` (zero hardcoded numbers, three tests), the `--events` journal tail (default OFF, hash-identity proof), `live_server.py` on :8620/:8621 with a server-side allowlist plus a negative lead-leak test, the launchd plist, and a cockpit tile PR (no merge). Two questions for Jeramie first: who can see it (local-only, public aggregate link, or legion.neuruh.com behind Cloudflare Access), and what it runs (NC re-run, Arborist scan, or both).

### VI.6 The conversion protocol (how a conversation becomes a build)

The failure mode is documented: 50+ deploy-ready code packs sat in Notion and never reached GitHub. The protocol, six rules:

1. Chat is not storage. Any decision that survives becomes an ADR in the same session.
2. One decision per ADR. Immutable once accepted. Wrong decisions get a superseding ADR, never an edit.
3. The spec derives from ADRs and may never contradict one. If SPEC.md and an ADR disagree, the ADR wins and SPEC.md is the bug.
4. Schemas are executable, not prose. A rule that cannot be validated in CI is a suggestion.
5. Unresolved goes in OPEN_QUESTIONS.md with an ID and a blocking flag, never softened into spec prose as an assumption.
6. Repo hits GitHub the day it is created. Not when it is finished.

### VI.7 The phone-call scripts (verbatim where they exist)

- **DATUM county onboarding:** "Do you operate under the advisory planning law or the area planning law?" Then: "Which municipalities in the county have joined the Area Plan Commission? I'm trying to confirm which ones still have their own plan commission versus which ones the APC handles." Then: "How do I get the sales disclosure export, Form 46021, for the last 24 months? I specifically need the conditions-of-sale fields, not just price and date." (Note: for Indiana, the SDF download is public and free, the call is now unnecessary for the data, but the APC membership list still needs confirming per county.)
- **FALLOW demand validation (zero CAC):** to each of Poag, Indy Roof, Baker HVAC: "If secure yard space existed 20 minutes from your jobsites at half warehouse cost, would you take it, and at what price?"
- **FALLOW rural yard comps:** three real rural yard comps before any master lease. No script on record; the call is the verification.

---

## VII. The July codex, and what it got wrong

*As-of: 2026-11-10. Source: the four July PDFs and the CRUCIBLE source as uploaded in batch 006, read in full by this codex.*

### VII.1 What the July codex is

On 28 July 2026 Jeramie issued NRH-DOC-CODEX-001 rev A, the Neuruh Ecosystem Codex: 41 pages, 8,588 words, six SVG diagrams, plus a 32-page external brief (6,125 words), a 3-page defense volume (541 words), and a 5-page CRUCIBLE verification record (1,438 words). Its evidence basis was the Code-Verified Reality audit of 30 June 2026. Its governing rule was the Valuation Honesty Rule: no dollar valuation is current or claimable pre-MRR; every legacy figure (the $6M indicative, $750K to $1.75M, $15M to $25M pre-money, 801 IP entries, 858 assets, 130 repos framed as 130 products, quantum-proof and Palantir-class capability claims) SUPERSEDED and retained for history only. Its Tier A inventory, the only numbers allowed in a data room: about 43 real working codebases, 4 live properties, 1 revenue-verified product, about 8 sellable lines, 148 passing tests on landos-engine, 49 signals, 43,897 real records scored, 31 named IP frameworks, MRR $0.

The July codex is the base this codex extends. It is not discarded. It is corrected, dated, and carried forward. Everything below is what changed between 28 July and 10 November 2026, and what the July build got wrong on its own terms.

### VII.2 The MILK lesson (why this codex verifies first)

The July codex was built from a memory record, not from disk. It carried "62 passing tests" and an "HMAC-SHA256 ledger" as Tier A, code-verified, claimable in a data room. Neither survived contact with the filesystem. The CRUCIBLE verification record (28 July 2026, rev B) documents the failure: the HMAC grep returned zero across every file; there were no test files outside the virtualenv; pytest was not even installed in the venv; the repo had no git history. Rev A of that record over-corrected (concluding the core architecture did not exist) and rev B corrected the over-correction: the hash chain was real, 44 receipts, genesis anchor correct, links intact. The generalizable finding, quoted from that record: every Tier A number in the codex came from a memory record, not from disk, and the remaining Tier A claims (148 tests, 43,897 records, 49 signals, 47 ncell tests, 917-line migration 086, commit anchors 4674604, 39090e3, 1245b0b) were each checkable with a single command and none had been checked. The fix is not more rigor. It is running the command before writing the number down. This codex follows that rule: every number added on 10 November 2026 carries the command or the API call that produced it, or the label RECORDED with the date of the record it came from.

### VII.3 The July codex's own defects, as recorded then

The verification record lists three claims withdrawn on the day the codex was built: the HMAC-SHA256 ledger (zero hmac across the codebase), 62 passing tests (no test files; the bench harness is a different thing), and tamper-proof (sequence integrity only; the writing service can rewrite the chain). Those three are carried in Appendix F of this codex. The July codex also records, in its own Volume V, an exposure surface that has never been closed in any record available to this codex: committed .env files across six repositories including a live Supabase password; that password's rotation outstanding (Handoff D); the Desktop symlinked to iCloud since 2024-03-01 (every credential ever placed there to be treated as compromised); a full-scope GitHub token expiring 2026-08-05; a LAN-exposed Redis container (stopped, not remediated); Firebase key rotation overdue on FSP/ResellOS; OpenRouter credits exhausted; two Vercel properties dark at HTTP 402. Current status of every item in that list is UNKNOWN to this codex as of 10 November 2026, because no later record closes them and the database they concern is unreachable. They are carried forward as open, not as resolved.

### VII.4 Corrections from July to November (the verdicts)

| July claim (28 July 2026) | November verdict (10 November 2026) |
|---|---|
| DeedSonar is a joint venture with Bryan Franklin on a 50/50 equity split | WRONG. Corrected 2026-10-22: DeedSonar is solely Jeramie's; Bryan never signed; no partner consent gate exists. The July PDFs state the 50/50 framing as canon in five places (D1, D2, the DeedSonar page, the vertical assessment, the revenue table). All five are superseded. |
| The entity is named with an LLC suffix (cover page, both PDFs, the LICENSE file in the CRUCIBLE source) | WRONG. Neuruh is not a registered business entity; the Michigan LLC filing is unfiled. The suffix must never appear in any codex artifact. The LICENSE file in the uploaded CRUCIBLE source carries the same error and needs its copyright line corrected before that source is published. |
| landos-engine: 49 signals, 148 tests, 43,897 records | CONFLICT, UNRESOLVED. The estate record as of November states 50 signals and N-Cell 36/36; the July codex states 49 signals and ncell 47 tests. The 148-test and 43,897-record figures are July-recorded and have not been re-verified against the repository from this workspace (no local clone; the count cannot be confirmed by API alone). This codex carries both figures with their dates and does not assert either side as fact where they conflict. Re-verification requires a local clone and a test run on the Mac. |
| ncell Wave 1: 47 tests across 3 packages, commit 39090e3, 952 insertions | CONFLICT, UNRESOLVED. Estate record states N-Cell 36/36 (recorded 2026-10-04, last commit d2c84628). The 47-test figure is July-recorded. Same re-verification path as LandOS. |
| DeedSonar V3 in production, merge 4674604, Vercel Ready in 1m42s, Bryan awaiting UAT access | SUPERSEDED BY NOVEMBER STATE. As of 2026-11-04: deedsonar.com returns 503 DEPLOYMENT_PAUSED; production Supabase unreachable; Vercel disconnected per Jeramie's order; repo last commit 2026-10-09 (PR #192). The July state was true in July. It is not true now. The rebuild lives at neuruh-web.pages.dev for neuruh.com; the DNS swap is Jeramie only. |
| Bookeit and FSP/ResellOS dark at HTTP 402 (Vercel billing) | UNCHANGED as far as any record shows, but UNVERIFIED in November. No November record re-checks either property. Carried as last-known July state. |
| CRUCIBLE: 44 receipts, chain VALID, keyed signing absent, no tests | CONFIRMED AND EXTENDED. The uploaded source was read in full and run on 2026-11-10 (see VII.5). The chain claim is real. The keyed-signing gap is real. New finding: the shipped verifier checks linkage only (see VII.5). |
| prbench: not in the July codex | ADDED. Live with 3 Anthropic pinned models only (verified 2026-11-10). The September 7-model config with invented model IDs never landed. |
| DATUM, FALLOW, LEGION: not in the July codex | ADDED. DATUM v0.4.0 verified on GitHub 2026-11-10. FALLOW v0.1.0, 39 tests passing, verified by running the uploaded code 2026-11-10. LEGION run 2026-09-28, PR #26 merged 2026-09-30, replay live. |
| H01 blocked (Sept 13 record) | CLOSED. Verified 2026-11-08 (NeuruhAI/neuruh-receipts, 20260909_h01_retrocourt.md, commit 218771db). T02/P0 seam remains OPEN. |
| NCP Phase 1: 1,890 AtomicNodes, 98% LLM-bypass, /dev/shm 40-50x | JULY-RECORDED, UNVERIFIED in November. No November record re-checks any NCP figure. Carried as July-recorded. The 98% bypass figure is the most economically interesting number in the agentic tier and the least re-verified. |
| 130 total repos | SUPERSEDED. NeuruhAI org holds 216 repos (verified 2026-11-08 via paginated API). The July "130 repos" figure was already stale in July or counted a subset; either way it is not the org count. |
| "Four assets live and operating in real businesses" (TaxShield, Baker HVAC, Indy Roof, DeedSonar V3) | PARTLY SUPERSEDED. DeedSonar V3 is no longer live (see above). TaxShield, Baker HVAC, and Indy Roof have no November re-verification in any record available to this codex; carried as last-known July state, not as current. |

### VII.5 CRUCIBLE source audit, 2026-11-10 (run, not read-only)

The uploaded CRUCIBLE source (z43/z44, identical files except z44 adds audit_ledger.py and a ledger README) was read in full and executed in this workspace. What the code actually does:

- **verify_chain.py (125 lines, stdlib only).** Checks five things: genesis anchor (record 0 prev_receipt_hash is 64 zeros), chain linkage (each prev_receipt_hash equals the previous receipt_hash), required fields, monotonic timestamps, tenant consistency, plus receipt_id and receipt_hash uniqueness, and reports verdict/eta statistics. It does NOT recompute receipt_hash from the record body. It contains no hashlib usage at all.
- **What that means (NEW FINDING, 2026-11-10).** The verifier detects record deletion in the middle, reordering, and edits to the hash fields themselves. It does NOT detect content edits that leave the stored hashes untouched, and it does NOT detect truncation of the tail. Tested on a 3-record ledger built by stamp_documents.py: deleting the middle record fails (exit 1); changing a receipt_hash fails (exit 1); changing a verdict and eta from FLAG/0.0 to PASS/100.0 passes (exit 0, CHAIN VALID); deleting the last record passes (exit 0, CHAIN VALID). The README and storyboard claim that tampering with one record (their example edits char_count) makes the verifier fail with exit 1. For the shipped verifier, that claim is FALSE for content edits: the tampered ledger verifies clean. The fix is one function: recompute each receipt_hash from the canonical record body and compare it to the stored value, and record the expected tail length or anchor the head hash externally. Until that lands, the honest description is: the verifier proves no record was inserted, deleted in the middle, or reordered, and that the hash fields are self-consistent. It does not prove the record contents are unaltered.
- **Correction to the finding above (same day, from the live repo).** The repo's current verify_chain.py is a different, newer file (291 lines of diff vs the uploaded copy): it recomputes every receipt_hash from the canonical body (line 68-75, "Recompute every receipt_hash. The original verifier trusted the stored..."), checks HMAC epochs, and accepts --epoch-start and --require-signing. Tested against the live production ledger: CHAIN VALID with receipt_hash recompute PASS on all 44 records; the same tampered verdict fails with "record 10: receipt_hash does not match recomputed body hash" (exit 1). The linkage-only weakness applies to the UPLOADED copy only. Use the repo verifier. The uploaded copy should be treated as an older snapshot, not as the current verifier.
- **tamper_demo.sh has a shell bug.** The line `python3 verify_chain.py ledger/tampered.jsonl || echo "" && echo "Exit code 1 as expected."` prints the success message unconditionally, because `|| echo ""` succeeds and `&&` then runs regardless of the verifier's exit code. It also assumes the script lives in examples/ under a repo root (`cd "$(dirname "$0")/.."`), which is not the uploaded layout. A demo that prints success when verification passed is worse than no demo.
- **keyed_signing.py (228 lines, stdlib only).** A complete Level 1 HMAC implementation: canonical payload (sorted keys, no whitespace, signature fields stripped), 256-bit key from the CRUCIBLE_SIGNING_KEY environment variable, key_id fingerprint (first 16 hex of SHA-256 of the key), sign/verify/demo commands. The demo runs clean: a forged verdict fails verification, and the same forgery against a plain hash passes undetected. Levels 2 (separate signing process) and 3 (external anchoring via git push) are specified in the docstring, not implemented. **The repo goes further:** receipt.py in the live repo implements generate/load/sign/verify HMAC, the Ledger class signs records when constructed with a key, crucible_service.py loads the key once at import (signing.required=true in config makes a missing key fatal), and test_signing.py passes 34/34 assertions. The HMAC gap is no longer "designed and never built." Level 1 is built, integrated, and tested. It is not applied to the production ledger: zero of the 44 production records carry a signature. That is the precise current state.
- **stamp_documents.py (215 lines, stdlib only).** Scans a directory, builds a manifest (every entry defaults to tier C / UNVERIFIED, deliberately), builds a chained document ledger in the same receipt format, and checks for drift. Tested end to end on this codex folder: scan found 2 documents, build produced 2 receipts, verify returned CHAIN VALID with verdicts FLAG/FLAG and eta 0.0/0.0 against the 70.0 threshold. The tier rule is the point: a document is Tier C until a command proves otherwise. This is the tool that stamps the codex PDFs themselves (see Appendix G).
- **audit_ledger.py (61 lines, stdlib only).** Pre-publication leak audit: kind distribution, uncited claims as the primary leak vector (free text in receipts), and a walk for long non-hex strings. Exits 1 with DO NOT PUBLISH AS-IS when free text is present. This is the gate that must run before any ledger goes to a public repo.
- **SPEC.md v0.1 (82 lines).** Receipt format, chain rules 1-5, fallback notation (degraded checks recorded in the receipt with the reason), and the known limitation stated plainly: tamper-evident against third parties, not against the writer. Planned v0.2: sig/key_id fields, canonical serialization, migration to in-toto Statement + DSSE envelope.
- **WITHDRAWN.md (52 lines).** Three withdrawn claims with the exact commands that retracted them (HMAC ledger, 62 tests, tamper-proof). The method is the asset: every retraction is checkable.
- **STORYBOARD.md (215 lines).** An 11-slide technical talk, "I Audited My Own Verification System," 8-10 minutes, with a governing rule that every number on every slide must be reproducible by the audience from the public repo. Slide 8's claim (break a record, the script fails) is true for the repo verifier and false for the uploaded older verifier; the deck needs that line qualified before it is presented.
- **What was NOT in the upload.** No ledger file (no demo.jsonl, no neuruh.jsonl), no receipt.py service, no bench/ directory, no crucible_config.json. The 44-receipt chain was verified from the live repo instead (see II.4): downloaded via API, CHAIN VALID, receipt_hash recompute PASS on all 44 records. The README's clone URL uses the placeholder handle yousernamehere; the real repo is NeuruhAI/crucible.

### VII.6 What the July diagrams carry, and what the new set fixes

D1 (ecosystem topology) embeds the 50/50 framing, the 49-signal figure, the Contabo IP, the Supabase project reference, and the tenant UUID. D2 (lineage) embeds the 50/50 framing and the 49-signal figure. D4 (CRUCIBLE gate) states keyed signing absent, which is now imprecise (Level 1 exists as code, integrated, tested, unapplied). D5 (revenue surface) states DeedSonar V3 live and Bryan awaiting UAT, both superseded. D3 (NRH schema) and D6 (ncell waves) are structurally sound; D6 carries the 47-test figure, now in conflict. The new diagram set (Section III.5 and Appendix B) regenerates all six with corrections and adds four: D7 FALLOW yield stack, D8 DATUM DAG, D9 LEGION replay, D10 NRH graph. Redaction rule, enforced by construction: no diagram in any set contains a host address, a project reference, a UUID, a credential, or a file path on the Mac. Those identifiers live only in the INT text of Volume V, never in a vector diagram, because embedded diagram text is extractable.

## VIII. Volume I, real estate, at full detail

*As-of: 2026-11-10. July figures are labeled JULY; November figures are labeled NOV. Where the two conflict, both are carried and neither is asserted as fact.*

### VIII.1 The vertical in one paragraph

Real estate is the only vertical with a formalized scoring substrate, a delivery surface, and named commercial offers. The pipeline is six stages: county records (St. Joseph IN, LaPorte IN) → landos-ingest (ETL, snapshot 1245b0b JULY) → normalization and entity resolution → landos-engine (signal scoring) → sync_to_crm.py (single-writer firewall) → DeedSonar CRM (Supabase + Vercel, row-level tenancy). The July codex counts 43,897 real parcels scored. The November estate record counts St. Joseph at 119,780 parcels and LaPorte at 64,775 parcels in live county ArcGIS (verified 2026-11-04). Those two numbers measure different things (scored parcels vs parcels existing in the county) and must not be compared as if they were the same metric.

### VIII.2 LandOS scoring substrate, complete

**What it is.** A parcel-level scoring engine that ingests normalized county property records and emits a ranked acquisition score per parcel. Deterministic: the same input and model version always produce the same score.

**Signal count, CONFLICT.** The July codex states 49 discrete signals across ownership, tenure, equity posture, distress indicators, structural attributes, and geographic overlays. The November estate record states 50 signals. Neither figure has been re-verified from the repository in this workspace (no local clone; the count cannot be confirmed by API alone). The FALLOW thesis transcript cites a 49-signal model and 43,897 parcels, matching the July codex. The LANDOS hunt job 6071b7ad (2026-09-16) scored and synced 153 leads. **Re-verification path:** clone NeuruhAI/landos-engine on the Mac, count the signal definitions in app/scoring.py, run the test suite, and record the number with the commit hash. Until then, this codex writes "49 (JULY) / 50 (NOV, estate record), conflict unresolved."

**Test count, JULY-RECORDED.** 148 passing tests on landos-engine, per the July codex. Not re-verified in November. The repo's latest main commit is c99e190 (2026-10-07, PR #56, ops/track-landos-api-8410-runner). Re-verification path is the same clone-and-run as the signal count.

**Records scored, JULY-RECORDED.** 43,897 real parcels, not synthetic, not sampled, not projected. Not re-verified in November. The two live counties hold 184,555 parcels combined in ArcGIS; the scored subset is the estate's working set, not the county total.

**Weights.** Recipe weights live in landos-engine/app/scoring.py (DEFAULT_WEIGHTS and EDGE_DEFAULT_WEIGHTS), seeded by seed_weights.py. No November record re-checks the weight values.

**Fossil discipline.** ~/Downloads/landos-engine is a CONFIRMED FOSSIL (July codex). Do not read, do not commit, do not resurrect. Canonical is ~/neuruh-repos/NeuruhAI/landos-engine (Mac path) / NeuruhAI/landos-engine (GitHub, private).

**Commercial posture.** Highest-value technical asset in the estate. The scoring model is the moat; the CRM is the delivery vehicle. Licensable independently of DeedSonar. Sale catalog: LANDOS outright $35,000 to $80,000, license roughly $5,250 to $20,000 per year (see IV.2). Risk: geographic concentration in two Indiana counties; the model has not been validated against a third county's schema; expansion cost is unknown until attempted.

### VIII.3 landos-ingest

Live ETL pipeline pulling county property records into the LandOS normalized schema. Extracts raw county exports in native inconsistent formats, normalizes parcel identifiers, owner names, and mailing addresses, resolves entity variance (the same owner under multiple spellings, entity forms, and mailing addresses), and delivers scoring-ready records. Snapshot 1245b0b (JULY). Repo NeuruhAI/landos-ingest (private), latest main commit 1826032 (2026-09-15, PR #18, retire-ungated-paid-pullers). Free-first acquisition: ungated paid pullers retired; paid vendors sit behind the engine's controlled acquisition logic. Not independently saleable; it is the cost of entry for each new county. Risk: county schemas change without notice; pipeline fragility is the single largest hidden maintenance liability in the vertical.

### VIII.4 Single-writer firewall (sync_to_crm.py)

An architectural rule enforced in code: sync_to_crm.py is the sole permitted writer to the acquisition_leads table. Every scored lead is attributable to exactly one deterministic pipeline execution. Any mutation path that bypasses the gate is an integrity breach, not a convenience, and no exceptions are granted to UI, agent, or manual edit. Contact columns are written only when DNC is exactly clear AND skip-trace status is traced_web/traced_paid AND confidence is at least 0.6. This is the integrity control for the entire vertical, and it maps directly onto SOC2 change-integrity controls. It is also the control most likely to be voided by one convenience exception under deadline pressure; one exception voids the guarantee retroactively. Current enforcement status in the November codebase is UNVERIFIED from this workspace (no local clone); the rule is carried as the standing architecture.

### VIII.5 DeedSonar, complete register

**What it is.** White-label real-estate CRM and lead app (Next.js, Supabase, Vercel). The commercial shell around the intelligence stack.

**Ownership, CORRECTED.** Solely Jeramie's since the 2026-10-22 correction. Bryan Franklin was the intended 50/50 JV partner and never signed. There is no partner consent gate. The July codex states the 50/50 framing as canon; that framing is superseded in every place it appears. Bryan owns the anchorpointpg Vercel team it deploys on; Jeramie is Developer there. Jeramie asserted 2026-11-04 that the Supabase/Vercel accounts are his and Bryan locked him out; ownership and access unresolved.

**July state (HISTORICAL).** V3 alpha-final promoted to production, merge 4674604, Vercel Ready in 1m42s, project renamed apg-crm to deedsonar. Migration 086 applied (917 lines, RLS rewrites, row-level tenancy). Tenant identifier on record in the July codex (withheld from this codex; it is an infrastructure identifier). Canonical Mac path ~/neuruh-repos/AnchorPG/apg-land-crm; fossil ~/dev/apg-land-crm (do not touch). The July session of 27 July 2026 found the app deployed but the database three migrations behind the code (084_core_spine_pipelines, 085_contract_signed_spine, 086_alpha_final_hardening not applied; pipeline_stage_audit did not exist; promote_lead would break at runtime). Order is 084, then 085, then 086, never 086 first. Same session: 2,835 leads, 85 with a phone number (3 percent), 2,787 DNC unknown (TCPA exposure), 83 callable, 0 assigned. All July numbers are history, not today.

**November state (VERIFIED 2026-11-04 and 2026-11-10).** deedsonar.com returns 503 DEPLOYMENT_PAUSED (99-byte body, verified 2026-11-10). Production Supabase unreachable (curl 000, verified 2026-11-10). Vercel disconnected per Jeramie's order. Repo NeuruhAI/deedsonar (private), latest main commit 954367a (2026-10-09, PR #192, court/g7-timing-probe). **Not live. Not sellable as a running product today; sellable as IP plus a buyer demo** (deedsonar-buyer-demo.pages.dev live, HTTP 200, 32,653 B, verified 2026-11-10). Sale: ask $95,000, target $50,000 to $65,000, walk-away floor $25,000 cash, kernel retained and licensed. Redeploy routes on record: Cloudflare Pages port (@cloudflare/next-on-pages) or Fly.io/VPS. Any redeploy serves a broken app until the data spine is fixed. Build order: data spine, DeedSonar, LANDOS runtime, hub backend, receipts (CRUCIBLE), outreach.

**Data spine status (see V.2).** Production database unreachable since mid-October 2026. Lead pull failed 25 straight nights through 2026-11-09. Backup scripts exist on the Mac; only Jeramie can check whether dumps exist. If yes, restore into a NEW Supabase project in his own account. If no, re-ingest from live county ArcGIS.

### VIII.6 Senior Assemblage Recipe

A codified targeting recipe layered on the scoring model, oriented toward senior-owned parcels suitable for assemblage along the Lake Michigan shoreline. It filters and reweights the base score toward assemblage viability rather than single-parcel acquisition, encoding a specific geographic and demographic thesis into repeatable machine logic. Tier B: built, not independently validated against closed transactions. Currently unpriced and unnamed as a commercial product. Risk, stated in the July codex and carried here: it encodes a demographic targeting thesis, and any external packaging must be reviewed for fair-housing and elder-protection sensitivity before it is marketed. This is a real legal surface, not a hypothetical one. DATUM's assemblage engine (Section II.6) is the deeper version of this idea: value over combinations, keystone premium, sequencing. The recipe is the targeting overlay; DATUM is the valuation engine. Do not conflate them.

### VIII.7 Probate vertical and BirdDog

**Probate expansion (Tier C, unconverted).** The LandOS approach extended into probate-sourced leads in Washington and Texas. Washington: v3 proposal delivered. Texas: warm, no proposal. Same engine and CRM, new ingest work per jurisdiction. The highest-signal near-term conversion opportunity in the July assessment: a delivered proposal that has not closed is worth more attention than a new build. Risk: probate record access varies enormously by jurisdiction; ingest cost may exceed the Indiana baseline by a wide margin and has not been scoped. November status: no record of closure or follow-up in any source available to this codex. The warm pipeline (Min Qiu, Ryan McCreay, Joe Turco) is carried in Section VIII.9.

**BirdDog (Tier C, boundary undefined).** A lead-sourcing component whose entity boundary against DeedSonar is NRH Registry open decision #05. Cannot be accurately described until the boundary is ruled. An undefined boundary between two components is how duplicate functionality gets built twice. Rule this before either side is extended.

### VIII.8 The SDF Tier 0 dataset and the jurisdiction resolver (DATUM data layer)

Full DATUM treatment is in Section II.6. This section records the data layer as a real-estate asset in its own right.

**Indiana SDF (Form 46021).** Every real property sale in Indiana since July 2008 is published as a free direct HTTP download, refreshed weekly Fridays 10am. Tier 0 (hard labels, recorded arm's-length sales) and Tier 1 (sales-ratio study) live in the same file. Three traps, confirmed against official metadata: UTF-16LE encoding, not UTF-8; scaling (price fields divide by 100, acreage divide by 10,000); cardinality (SALEPARCEL is one row per parcel; aggregate per SDF_ID before any ratio). Measured St. Joseph County 2024: 5,841 records, 2,262 Tier 0 (38.7 percent), 48 vacant-land Tier 0, 107 buyer-owns-adjacent, 789 multi-parcel sales. Sales ratio study: median 1.176, COD 68.8, PRD 1.534 (pooled across classes; stratify before production use). The $7.4B outlier (SDF_ID C46-2023-0077229, $7,400,074,000, assessed $67,200, marked Valid for Trending) moved 2023 COD from 12.8 to 11,771.7; after quarantine LaPorte reads inside IAAO range. The ratio is time-varying; the Tier 1 coefficient is per geography, subtype, and YEAR, never pooled.

**Jurisdiction resolver (Layer 0.5).** Returns an authority map, not a jurisdiction, because zoning, septic, drainage, floodplain, wetlands, and assessment each resolve to a different body. St. Joseph County, Indiana: AREA planning law (verified from public record 2026-07-25). APC serves unincorporated county plus Lakeville, New Carlisle, North Liberty, Osceola, Roseland. It does not serve South Bend, Mishawaka, Indian Village, or Walkerton. South Bend left the APC between 2017 and 2023; authority is time-varying, so historical sales need their authority pinned by date (ADR-0009). Michigan is the mirror image: townships hold authority directly; county zoning is residual. The naive resolver (smallest polygon containing the parcel) returns the wrong ordinance in both states, for opposite reasons.

**Where it lives.** NeuruhAI/datum (private), latest commit 07184f5 (2026-07-26, v0.4.0), verified 2026-11-10. docs/CODEX.html (109,086 B) and docs/CODEX.md (74,855 B) on main. Loader: scripts/fetch_sdf.py. Auditor: scripts/qa_labels.py. Quarantined records go to labels_quarantined.jsonl, never deleted.

### VIII.9 Revenue surface, real estate (November state)

| Asset | July state | November state |
|---|---|---|
| TaxShield | LIVE, only revenue-verified product | No November re-verification in any record available to this codex; carried as last-known July state |
| Baker HVAC voice dispatcher | LIVE in a real business | No November re-verification; carried as last-known July state |
| Indy Roof ROOF-OPS Phase 1 | LIVE | No November re-verification; carried as last-known July state |
| DeedSonar V3 | LIVE, merge 4674604 | NOT LIVE: 503 DEPLOYMENT_PAUSED, DB unreachable (verified 2026-11-10) |
| Poag AI Training Portal | BUILT, branch redesign/poag-pathways-ui | No November re-verification; carried as last-known July state |
| Valermus (Toronto) | BUILT, partnership locked, joint product imminent | No November re-verification; carried as last-known July state |
| Bookeit | DARK, HTTP 402 (Vercel billing) | No November re-verification; carried as last-known July state |
| FSP / ResellOS | DARK, HTTP 402 + Firebase key rotation overdue | No November re-verification; carried as last-known July state |
| Warm pipeline (Min Qiu, McCreay, Turco) | UNCONVERTED | No November re-verification; carried as last-known July state |

The July structural finding stands and sharpens: four assets were live in July; one of the four (DeedSonar) is now dark, and the other three have no November verification. The build-to-monetize ratio remains the defining problem. Every asset in the built column was harder to build than it would be to close.

### VIII.10 FALLOW, complete (see II.7 for the full treatment)

Summary for the register: standalone dual-engine land-yield venture, name locked, no entity filed, LaPorte pilot not run. Engine A managed yield ops (A1 master lease, A2 flat-fee platform, A3 broker-of-record affiliation); Engine B yield intelligence (Land Yield Score SaaS/API, demand heatmaps, portfolio underwriting). 42 signals plus 7 hard gates; stacking conflict matrix; realized_yield table with scoring_snapshot_id as the moat. v0.1.0: 39 tests passing, verified by running the uploaded code 2026-11-10. The 15 to 25 percent take-rate model is dead as specced under Michigan brokerage law (MCL 339.2501, cited in the thesis transcript, not independently verified by this codex). Lane A pilot: 500 mailers, 90 days, kill criteria at week 13. Lane B: farm management firms and farmland funds (land banks and builders killed by the thesis's own research). Live visual demo: neuruhai.github.io/neuruh-demos/fallow-yield/ (HTTP 200, 66,263 B, verified 2026-11-10; built by the FALLOW coordinator in parallel with this codex).

## IX. The rest of the ecosystem

*As-of: 2026-11-10. July figures labeled JULY; November verifications labeled NOV.*

### IX.1 Protocol, registry, and governance (July Volume II, updated)

**ncell Protocol.** TypeScript protocol library: 12 Zod schemas in packages/protocol/src/types.ts, 4 profiles in packages/protocol/src/profiles.ts. Wave 1 shipped at commit 39090e3 (952 insertions). Test count CONFLICT: July codex states 47 tests across 3 packages; estate record states 36/36 (recorded 2026-10-04). Repo NeuruhAI/ncell (private), latest main commit d2c8462 (2026-10-04, PR #3, docs/phase-2-3-landed). Wave 1.1 hardening items identified but unshipped: ed25519 hex length constraints, z.enum over z.literal, .min(1) on about 14 bare z.string() fields, confidenceNormalized divisor documented as 255 not 256, self-referential hash rule alignment. None are production defects; all are correctness debt. Waves 2-8 deliberately parked. The July assessment stands: shipping Wave 1 and stopping is the single strongest process signal in the estate, and Waves 2-8 should remain parked until at least one protocol consumer exists that is not owned by Neuruh. Commercial value is entirely contingent: protocol libraries are worthless without adopters. Zero external consumers (JULY; no November record changes this).

**NRH Registry.** Universal addressing and inventory system: NRH-[DD]-[ENT]-[TTT]-[NNN]. July figures: 10 domains, 36 artifact types, 48 seeded entities, SQLite with WAL journal mode, stdlib Python CLI (nrh.py) with zero pip dependencies, hash-chained transition log, SPEC Rule R2 (strip NRH ID tokens before hashing) resolving the self-referential hash convergence defect. **November corrections:** no repo named neuruh-registry or neurh-registry exists in the NeuruhAI org (both 404, verified 2026-11-10). The registry lives only as content (vault, transcripts, demos), not as a repository under either spelling. The vault's Master-Data-List (231 rows) is the census built on top of it. Six open decisions still block completion (JULY, no November record closes any): FM domain creation, tier semantics, origin_thread as a first-class THR entity, EVIDENCES as a structural requirement, the BirdDog/DeedSonar boundary, DF domain seeding. **New live visual:** neuruhai.github.io/neuruh-demos/nrh-registry/ (HTTP 200, 30,459 B, verified 2026-11-10; built by the catch-up coordinator in parallel with this codex). Its commit message records 9 domains and 35 seeded entities, which conflicts with the July 10 domains / 48 seeded entities; the discrepancy is unresolved and both figures are carried with their dates.

**CRUCIBLE / BuildOS v2.** Full treatment in Sections II.4 and VII.5. November state, verified 2026-11-10 from the live repo: private, latest commit 6b7bf49 (2026-09-30, PR #2 gate-fails-closed). Root contains receipt.py, crucible_service.py, verify_chain.py, bench/, ledger/, requirements.txt, crucible_config.example.json, NRH-GV-CRU-REP-001.json, and three test files (test_gate_failclosed.py 7,922 B; test_gate_raises.py 6,549 B; test_signing.py 10,048 B). **No LICENSE file exists in the repo** (the uploaded LICENSE is a standalone file, not from the repo). The production ledger (ledger/neuruh.PRODUCTION.jsonl, 31,362 B, 44 records) verifies CHAIN VALID under the repo's verifier, with receipt_hash recompute passing on all 44 records, 17 PASS / 27 FLAG, eta mean 49.9 against a 70.0 threshold. The archived ledger is byte-identical to production. **Zero of the 44 production records carry a signature.** HMAC-SHA256 is implemented in receipt.py (generate/load/sign/verify, key from ~/crucible/.crucible_hmac_key or the CRUCIBLE_HMAC_KEY environment variable), integrated into crucible_service.py (signing.required=true in config makes a missing key fatal), and tested by test_signing.py (34/34 assertions passed when run 2026-11-10; service tests skipped for lack of httpx in system Python). The authorship gap is therefore a deployment and custody gap, not a code gap: the key has never been generated or applied to the production ledger. The July "zero HMAC anywhere" claim is superseded for the codebase and remains true for the ledger. The July "no tests" claim is superseded for the repo. The July "tamper-proof" withdrawal stands.

**Valuation Honesty Rule.** Binding since the 30 June 2026 audit: no dollar valuation is current or claimable pre-MRR. The rule governs NUMBERS ONLY. There is no equivalent constraint on scope, and since the audit the estate has added the NRH Registry, ncell Wave 1, DATUM, FALLOW, LEGION, and this codex. The honesty mechanism works and has not been pointed at the variable that is actually inflating. That sentence is from the July codex and it is more true in November than it was in July.

### IX.2 Agentic infrastructure (July Volume III, updated)

**AXON Gateway.** Phase 1 shipped 2026-04-01 to NeuruhAI/neuruh-axon: Python daemon on port 7331 and TypeScript gateway on port 8300, confirmed coexisting (JULY). October sweep: port 8300 listening (neurah-axon), plus 8788. Phase 2 scope undefined. Tier B.

**MOTHER daemon.** Process supervision and monitoring stack on the M1 Mac Mini. Single-host: loss of the Mac is loss of the monitoring layer along with everything it monitors. Standing routines (reported live on Grok, 2026-09-07): MOTHER System and Mission Watch 10,40 8-19 weekdays; BOB Mission Queue Advancement every 30 min weekdays 08:00-19:30 ET; RICHIE commercial court weekdays 08:00 and 15:00; VIBIN Morning Brief / Evening Close 08:30 / 17:30; LARIC Daily Canon Closure 18:00 weekdays; COMMONS Proofstream Court 09:00 weekdays. November status of these routines: UNVERIFIED from this workspace.

**Eight-stage autonomous nightly pipeline.** Cron-driven unattended build loop on the Mac. The mechanism that explains the output-to-headcount ratio, and the single most compelling thing to demonstrate live to a technical investor. It has never been packaged as a demonstration. November status: UNVERIFIED from this workspace.

**L4 Engine (Layers 1-10).** Autonomous code synthesis: AST-surgical mutation, Darwinian synthesis (three competing branches, one Apex Predator survivor), eta Transform, decision provenance with SHA-256 receipts tying into CRUCIBLE. Built (JULY). Bus factor of one. November status: UNVERIFIED from this workspace.

**NCP Phase 1.** Generative Node Matrix (1,890 AtomicNodes), Convergence Router, Semantic Cache Vault at 98 percent LLM-bypass, KuzuDB Cognitive Graph, /dev/shm RAM-disk measured at 40-50x I/O improvement over SSD on small-file durable writes. All JULY-RECORDED, none re-verified in November. The 98 percent bypass figure is the most economically interesting number in the agentic tier (inference cost is the dominant operating expense in this category) and has never been framed that way externally. It is also the least re-verified number in the tier. Risk: RAM-disk dependency on an 8 GB machine; the performance characteristic that makes it valuable is contributing to the host's load crisis.

**NCP Phase 2 (PHALANX, SYMBIOTE, UIR, Firecracker Micro-VMs).** Specified, not compiled. Tier C. Correctly deferred. The risk is building them before a paying customer exists for Phase 1.

**Autonomous Builder HQ.** Filesystem and orchestration root at ~/repos/autonomous-builder/ (Mac path). Hosts the Poag AI Training Portal working tree among others. Concentration point: multiple active client artifacts under a single build root on a single machine.

**DISPATCH-IQ.** Dispatch intelligence system, scoped, hardware-blocked pending RTL-SDR confirmation. A hardware-blocked scope is not an asset. The July assessment stands: cheap hardware blocking a scoped system is a tell about priority, not supply.

**The swarm, complete anatomy.** See Section II.12. The one real coordinated tape (2026-09-07 14:42-14:44 ET, AUTONOMY-ACCEPTANCE-WILLOW-PROOF-001 to COMMONS-PROOFSTREAM-001) remains the only recorded cross-agent coordination with a sealed receipt and a closed parent. Fleet classification stands: COORDINATED_CHILD_EXECUTION_PROVEN / CONTINUOUS_AUTONOMY_NOT_PROVEN / EXTERNAL_ACTUATION_PARTIAL.

### IX.3 IP framework register (31 named, July count)

Named frameworks and their posture (JULY; no November record changes the count): DIMEA 2.0 (personal operating system, non-commercial), PMLA (prompt engineering, independently developed), SAL (Stacked Agent Logic; prompt engineering framework), Token-Swap Prompting, eta Transform (embedded in L4), QECA, Holy Grail v2.0 (toroidal geometry, 1,980 nodes; Tier C theoretical, never externalize as product), CRUCIBLE (Tier A, separable and licensable), NCP (Phase 1 built, Phase 2 specced), L4 Engine (built), NRH (built, six decisions open), ncell (Wave 1 shipped), LandOS (Tier A), DeedSonar (Tier A), ROOF-OPS (Phase 1 deployed), AXON (Phase 1 shipped), MOTHER (operational), BuildOS (v1 void, v2 sealed), DISPATCH-IQ (hardware-blocked), Sovereign Conglomerate (positioning framework). Caveat from the July codex, carried here: a named framework is not an asset until it is either embedded in running code or licensed to someone. Roughly half of this register is embedded in code; the other half is nomenclature. The genealogical research programme and the CROATOAN / Ananias publication identity are deliberately excluded from this codex; they are not components of the commercial ecosystem.

### IX.4 Infrastructure reality (July Volume V, INT; November status)

**Publication rule for this section.** The July Volume V is INT: it contains live infrastructure identifiers, host addresses, and an unremediated credential exposure inventory, and it must not be included in any investor package, partner share, data room, or acquirer disclosure. This codex follows the same rule, extended: **no published artifact in the neuruh-codex set (HTML, master PDF, external brief, diagrams) contains a host address, a project reference, a UUID, or a credential, in text or in embedded diagram vectors.** The July identifiers are not reprinted here. The full July Volume V text remains the source for the identifiers; the state below is what changed.

**Hardware (JULY, no November re-verification).** M1 Mac Mini (Macmini9,1, 8 GB) is the primary build machine and runs the build environment, the nightly pipeline, MOTHER, the NCP RAM-disk, and the prompter hub. It reports load-average overload; disk and RAM crises have been resolved repeatedly by removing git worktrees, stopping the colima VM, and pruning models. A Contabo VPS is paid monthly while its role remains unaudited (Phase 0 audit gates all hardware build decisions). A Gigabyte GA-Z270P-D3 with i7-7700K is the strongest always-on hub candidate and is not built. A Lenovo ThinkCentre M92p is confirmed too old. A Dell Latitude 5580 needs an M.2 NVMe drive. Hub services and the Tailscale mesh were NOT confirmed operational as of 2026-07-08; no deployment step may assume they are live.

**Hosting (NOVEMBER, verified 2026-11-10).** Cloudflare free-plan ceiling is 100 projects; the account sits at 100. GitHub Pages (NeuruhAI/neuruh-demos) is now the demo home that bypasses the ceiling, one repo with unlimited pages as subpaths. Hub v2.17 live at neuruh-hub.pages.dev (68,663 B). The neuruh.com rebuild is live at neuruh-web.pages.dev (HTTP 200, 13,014 B); the domain still points at the dead Vercel deploy and the DNS swap is Jeramie only. bench.neuruh.com returns HTTP 200 (13,006 B). deedsonar.com returns 503 DEPLOYMENT_PAUSED. The production Supabase host is unreachable (curl 000). Vercel stays disconnected per Jeramie's order.

**Exposure surface (JULY, status UNKNOWN in November).** Committed .env files across six repositories including a live Supabase password; that password's rotation outstanding (Handoff D); Desktop symlinked to iCloud since 2024-03-01 (treat every credential ever placed there as compromised); a full-scope GitHub token expiring 2026-08-05; a LAN-exposed Redis container (stopped, not remediated); Firebase key rotation overdue on FSP/ResellOS; OpenRouter credits exhausted; two Vercel properties dark at HTTP 402. Remediation sequence, order matters: rotate the Supabase password first (rotation is the remediation; history purging is hygiene that follows); delete the full-scope token now; treat Desktop credentials as compromised; rotate Firebase keys before restoring Vercel billing; confirm the Redis container has no persisted exposed data, then rebind to localhost before restart. **The September 13 deep-dive adds a second exposure layer, also UNKNOWN in November because the database is unreachable:** 23 SECURITY DEFINER functions executable by anon via the REST RPC endpoint, including a full rebuild of the 22,355-row estate identity projection callable by any unauthenticated caller; 62 executable by authenticated; 19 with mutable search_path; leaked-password protection disabled; 39 tables with RLS enabled and zero policies. The November repo-side grants audit (~/workspace/supabase-oct30-grants-audit/) covers grant gaps from code and is the current record. Do not cite the September 13 counts as live.

### IX.5 New live demos since the July codex

| Demo | URL | Size | Verified |
|---|---|---|---|
| LEGION Replay | neuruhai.github.io/neuruh-demos/legion-replay/ | 34,116 B | 2026-11-10, HTTP 200, MD5 verified |
| FALLOW Yield | neuruhai.github.io/neuruh-demos/fallow-yield/ | 66,263 B | 2026-11-10, HTTP 200 |
| NRH Registry visual | neuruhai.github.io/neuruh-demos/nrh-registry/ | 30,459 B | 2026-11-10, HTTP 200 |
| Neuruh Codex (this document) | neuruhai.github.io/neuruh-demos/neuruh-codex/ | 111,116 B | 2026-11-10, HTTP 200, MD5 verified |
| Vault Overview (pre-section-33) | neuruhai.github.io/neuruh-demos/vault-overview/ | 573,846 B | 2026-11-10, HTTP 200 |
| Startup Needle Report | neuruhai.github.io/neuruh-demos/startup-needle-report/ | 59,168 B | 2026-11-10, HTTP 200 |
| Reference Library | neuruhai.github.io/neuruh-demos/reference-library/ | 68,076 B | 2026-11-10, HTTP 200 |
| DeedSonar buyer demo | deedsonar-buyer-demo.pages.dev | 32,653 B | 2026-11-10, HTTP 200 |

The FALLOW Yield and NRH Registry visuals were built by parallel coordinators on 2026-11-10 and are not carded on the hub as of v2.17. The hub card added with this codex (v2.18) covers the codex; the two parallel demos are flagged in the codex delivery report for carding. The LEGION replay, FALLOW yield, and NRH registry visuals are the three newest proof surfaces in the estate, all shipped the same day.

## X. End analysis: how close is he to doing the impossible?

*Analysis, 2026-11-10. Built from the enumerated evidence in this codex, not from memory. Every count below is traceable to a section above.*

### X.1 What "the impossible" means here

The impossible, as Jeramie frames it, is a one-person operation that builds a sovereign AI execution organism: dozens of systems, a governed agent fleet, a real-estate intelligence vertical, a verification spine, and a commercial surface, with receipts for all of it, without hiring engineers, without venture capital, and without the thing collapsing into a pile of demos. The honest question is not whether the ambition is large. It is how much of the machine is real, how much is scaffolding, and what distance remains to a system that earns money while he sleeps.

### X.2 The enumeration (November 10, 2026)

**Four Tier A assets, code-verified in July and still standing in November (with corrections):**

1. **LandOS scoring substrate.** A deterministic parcel scorer with a real model, real county data, and a real test suite (148 tests JULY, 49/50 signals in conflict, 43,897 records JULY). The model is the moat. It is also the asset with the weakest November verification: no local clone was run, no test count was re-confirmed, and the engine is not hosted.
2. **The single-writer firewall.** An integrity control most competing CRMs cannot answer for. It is an architectural rule, not a product, and its value is entirely in the discipline of never granting an exception.
3. **CRUCIBLE.** The strongest asset in the estate, and the one this codex verified hardest on 2026-11-10. The production ledger (44 receipts) verifies CHAIN VALID under the repo's verifier, with every receipt hash recomputed and matching. HMAC-SHA256 is implemented in receipt.py, integrated into the service behind a config gate, and tested by test_signing.py at 34/34 assertions passed. The gap is now precise and small: zero of the 44 production records carry a signature, because no key has been generated or applied. That is a one-command fix (generate the key, enable signing, pin the epoch) plus a custody decision. No other asset in the estate has a gap this small and this well located.
4. **The valuation honesty mechanism itself.** A founder who voluntarily marks a claimed $15M to $25M pre-money down to MRR $0 and publishes the delta is doing something the overwhelming majority of founders will not do. The withdrawn-claims register is the most credible page in the July codex, and this codex extends it. In diligence, that page is an asset.

**The three strongest process signals:**

1. **ncell Wave 1 shipped and stopped.** Scope discipline in the exact place where the operator's documented failure mode is scope expansion. Waves 2-8 parked by decision, not by failure.
2. **The CRUCIBLE self-audit.** A verification system pointed at its own claims, catching three of them, and publishing the retractions with the commands that retracted them. The July verification record is the template for auditing every other component.
3. **LEGION's deterministic replay.** A 6,487-record run reproduced byte-identically after a crash, with a sealed roll-up and a merged PR. Deterministic replay with receipts is the one property agent frameworks generally do not have.

**The 98 percent LLM-bypass margin argument.** NCP Phase 1's Semantic Cache Vault claims 98 percent of operations resolve without a model call. If that number is real, it is a direct gross-margin argument: inference cost is the dominant operating expense for this entire category of system, and a 98 percent bypass converts an API bill into a rounding error. It is also the least re-verified number in the estate. It was recorded in July and has not been re-checked since. The margin argument is the single highest-value verification left to run: one command on the Mac, and the number either becomes the strongest commercial claim in the agentic tier or joins the withdrawn register. Until it is re-verified, it is a hypothesis with a dollar sign attached.

**The fossil-vs-production discipline inversion.** The July codex records two confirmed fossil paths (a Downloads copy of landos-engine, a dev copy of the CRM) and a discipline for never touching them. That discipline is real and it works: the fossils are labeled, not deleted, and the canonical paths are named. But the same estate has the opposite problem at the top: production itself is the fossil. DeedSonar V3 was live in July and is dark in November. The production database is unreachable. The flagship product is a buyer demo and a sale package, not a running service. The discipline that protects the code from the fossils has not protected the product from going dark. The inversion is the whole story of the last four months: the code got cleaner and the product got darker.

**The scope-honesty gap.** The Valuation Honesty Rule governs numbers only. It does not govern scope. Since the audit, the estate has added the NRH Registry, ncell Wave 1, DATUM, FALLOW, LEGION, prbench, the demo reel, the visual layer, and this codex. The rule works and has not been pointed at the variable that is actually inflating. The July codex says this plainly. The November estate proves it. The counterweight is real: Jeramie's November 4 correction ("nothing is parked, every unbuilt doc, tool, and system gets built") is a deliberate choice, not an accident, and the November 10 build sequence (LEGION replay, FALLOW yield, NRH registry visual, this codex, all in one day) is that choice executing. But a build rate that exceeds the verification rate is how the July codex ended up with Tier A claims that failed on contact with disk. The fix is the one the verification record already stated: run the command before writing the number down.

### X.3 The distance, in concrete terms

**Three signed contracts from a working organism.** The P0 seam is three unwired gaps (receipt-watch, Sentinel-invocation, result-ingest) plus a retro-court, live-loop proof, and main-branch CI. The data spine is one restore decision (check two Mac paths for dumps; restore into a new project in his own account, or re-ingest from live county ArcGIS). The money path is one DNS swap (neurah.com), one LLC filing ($50, four decisions, one funded card), and one kernel-fork decision (Lead Recipe OS Path A vs Path B) that gates all sale paperwork. None of these is a research problem. All of them are decisions and executions. That is the good news: the distance is measured in weeks of closure work, not years of invention.

**What is already done that most builders never do.** A deterministic swarm with sealed receipts. A citation-grounding checker with a verified chain and a working HMAC implementation waiting for a key. A 50-signal scorer (49 or 50, the conflict is a counting problem, not a capability problem) over real county data. A benchmark that caught its own bug and fixed it in public. A withdrawn-claims register. A hub with 115 live sites. A vault with 942 migrated files and 22 of 22 regression checks passing. None of that is a demo. It is infrastructure, and it is the reason the answer to the question is not "far."

**What is not done, and must not be claimed.** Continuous autonomous production execution has not been proven (the honest language is governed, supervised execution with receipts). No live loop exists from receipt to Sentinel to ingest to custody to promotion. The flagship product is dark. The production database is dead. MRR is $0 and one product carries verified revenue. The defense tier is a liability line until a paid ITAR/EAR review exists. The exposure surface from July (committed credentials, unrotated passwords, a two-year iCloud window) has no November closure in any record available to this codex.

### X.4 The verdict

He is closer than the estate looks from the outside, and further than the build rate suggests from the inside. The impossible part was never building 43 codebases. One person with AI leverage can build 43 codebases; the July and November records prove it. The impossible part is the last ten percent of each system: the key applied to the ledger, the database restored, the DNS swapped, the contract signed, the loop closed. That last ten percent is not an engineering problem. It is a closure problem, and it is the entire bottleneck. The machine that does the impossible is not the one with the most components. It is the one whose components are wired, verified, and earning. By that measure, the estate is about 70 percent built, about 30 percent wired, and about 5 percent earning. The path from here is not another build. It is the knock-out list: key the ledger, restore the spine, swap the DNS, file the LLC, rule the kernel fork, close the seam. Six items. Every one of them is a decision followed by a command. That is how close he is.

## Appendices

### A. Glossary

- **ADR:** Architecture Decision Record. One decision, immutable once accepted, superseded never edited.
- **APC:** Area Plan Commission (Indiana area planning law).
- **Cohort / squad:** LEGION roll-up units. 50 results seal into a squad; 20 squads into a cohort; cohorts into FINAL_OUTPUT.
- **CRUCIBLE:** Hash-chained receipt system and publication gate. The notary, not the judge.
- **DATUM:** Valuation product beside LandOS. LLM emits facts; Python emits dollars.
- **DNC:** Do Not Call. Scrubbing is always optional, never an automatic gate.
- **ETJ:** Extraterritorial jurisdiction (Indiana advisory law, up to two miles).
- **FALLOW:** Standalone land-yield venture (dual-engine: managed ops + yield intelligence).
- **H01 / H02:** Merge-first mission rows. H01 Workers observer-contract (CLOSED). H02 Sentinel typed-evidence (CLOSED, canonical).
- **Iar:** CRUCIBLE's model-backed judge (model-backed scoring; untested).
- **LANDOS:** Land signal engine (ingest + 50-signal scoring).
- **LEGION:** Deterministic governed swarm in neuruh-workers.
- **LOI / LOE:** (Not used in this codex; if you see them in a transcript, they are not canon terms.)
- **NRH:** Neuruh Registry addressing spine (`NRH-DD-ENT-TTT-NNN`).
- **P0 seam:** The receipt-watch / Sentinel-invocation / result-ingest gap. Open.
- **SDF:** Indiana Sales Disclosure Form (Form 46021). Tier 0 label source.
- **T02:** The Switchboard → Sentinel seam (see P0 seam).
- **TTL:** Time to live. The outreach pipeline's applied default is 7 days for a signal.

### B. File index, where everything lives

| What | Where |
|---|---|
| This codex (source) | `~/workspace/your_files/neuruh-codex/CODEX.md` (+ `render_codex.py`, `CODEX.html`) |
| This codex (live) | `https://neuruhai.github.io/neuruh-demos/neuruh-codex/` |
| The hub | `~/workspace/neuruh-hub-site/index.html` → `https://neuruh-hub.pages.dev/` (v2.17, 115 cards) |
| The vault | `~/workspace/neuruh-obsidian-vault/` (231 concepts; `11-Notion/` 942 files; `_research/notion-migration-manifest.md` 33 sections; `_research/learnings.md` 217 entries) |
| LEGION replay demo | `~/workspace/your_files/legion-replay/` → `https://neuruhai.github.io/neuruh-demos/legion-replay/` |
| LEGION Mac capsule | `~/workspace/your_files/legion-replay/MAC-CAPSULE.md` |
| FALLOW v0.1.0 (uploaded) | `~/workspace/user/files/files__39.zip` (extracted copy verified at `/tmp/fallow-check/pkg/fallow/`) |
| FALLOW pilot proposal | `~/workspace/fallow/pilot-proposal.md` |
| DATUM repo | `NeuruhAI/datum` (private; v0.4.0, commit `07184f5`) |
| DATUM codex | `NeuruhAI/datum`, `docs/CODEX.html` / `CODEX.md` |
| prbench repo | `NeuruhAI/prbench` (public) → `https://bench.neuruh.com/` |
| CRUCIBLE repo | `NeuruhAI/crucible` |
| DeedSonar sale package | `~/workspace/deedsonar-sale/` (ip-schedule, one-pager, landos-license-terms, kernel-license-terms) |
| Estate sale catalog | `~/workspace/estate-sale/` (11 files) |
| Supabase grants audit | `~/workspace/supabase-oct30-grants-audit/` (gap-report, fix-migration.sql, summary) |
| Signal-to-content pipeline | `~/workspace/your_files/signal-to-content-to-outreach-pipeline.md` (v2.2, DESIGNED) |
| Startup Needle Report | `https://neuruhai.github.io/neuruh-demos/startup-needle-report/` |
| Vault Overview (pre-§33) | `https://neuruhai.github.io/neuruh-demos/vault-overview/` (573,846 B; regeneration blocked pending Jeramie's call) |
| Reference Library | `~/workspace/neuruh-obsidian-vault/12-Reference-Library/` → `https://neuruhai.github.io/neuruh-demos/reference-library/` |
| P0 seam work order | `~/workspace/neuruh-obsidian-vault/_research/p0-seam-workorder.md` |
| Mac filesystem lane work order | `~/workspace/neuruh-obsidian-vault/_research/mac-filesystem-lane-workorder.md` |
| Upload absorption log | `~/workspace/neuruh-obsidian-vault/_research/upload-absorption-log.md` (batches 001–003) |
| Compiled Notion reading doc | `~/workspace/your_files/notion-pages-full-details.md` (24 pages, 1,116,120 B) |
| Demo hub rebuild inventory | `~/workspace/hub-rebuild-inventory-2026-11-03.md` |

### C. Statutory citations (with retrieval dates, re-verify; statutes amend)

- **Michigan MCL 339.2501** (property management / broker definition; 90 clock hours + 3 years full-time experience for a broker license). Cited in the FALLOW thesis transcript. **Not independently verified by this codex.** Retrieval date: none on record. Re-verify before relying on it.
- **Indiana IC 36-7-4** (planning law; ADVISORY / AREA / METRO regimes; IC 36-7-4-202 area enabling statute; IC 36-7-4-205 two-mile ETJ under advisory law). Verified from public record 2026-07-25 (DATUM research).
- **Indiana IC 6-1.1-5.5** (sales disclosure form required on every real property sale; electronic filing mandatory since July 1, 2008). Verified via the public SDF download, 2026-07-25.
- **Indiana IC 25-34.1** (brokerage statute). Cited as FALLOW Gate 0.1. Not yet read. Open.
- **Michigan MZEA** (Michigan Zoning Enabling Act; townships hold authority directly; county zoning residual). Verified from public record 2026-07-25 (DATUM research).
- **Michigan PA 116 / Qualified Forest Program; Indiana classified forest and agricultural assessment.** Cited as FALLOW Gate 0.3. Recapture mechanics unverified. Open.

### D. Open questions (full register)

See V.4 for the blocking register. Additional non-blocking questions carried from the transcripts:

- **DATUM Q-005, Q-008:** closed with the SDF resolution (RECORDED).
- **DATUM Q-013:** pin South Bend's APC exit date (between 2017 and 2023). Open.
- **DATUM Q-014:** four independent municipalities need their own ordinance extractions. Open.
- **Token-Swap P5 canonical name:** undecided (Sunset Silhouette vs Workshop Focus).
- **Lexicon slot 130 Formation:** proposed, awaiting confirmation.
- **Open-source scope:** no scope decision recorded. Prep allowed; do not flip repos public without Jeramie's scope call.
- **DeedSonar redeploy route:** Cloudflare Pages port vs Fly.io/VPS. Undecided.
- **LEGION-LIVE visibility + workload:** local-only vs public aggregate link vs legion.neuruh.com behind Cloudflare Access; NC re-run vs Arborist scan vs both. Open.
- **FALLOW name:** locked as FALLOW. Trademark clearance (Gate 0.5) sequenced with LLC formation.
- **FALLOW Lane B brief audience:** resolved to farm management firm principal. Ready to build on Jeramie's word.

### E. The four things to remember (again, because they are the whole discipline)

1. DESIGNED is not DEPLOYED is not LIVE is not PROVEN.
2. Chat is not storage. Decisions become records the same session.
3. One writer per dollar, one writer per row.
4. The world scores; the operator trains.

---

### F. Withdrawn claims register (extended)

*The July register, carried forward, plus every correction issued by this codex on 2026-11-10. A claim that is withdrawn is retained, dated, and replaced, never silently deleted.*

| Withdrawn claim | Status | Replaced with |
|---|---|---|
| $6M indicative valuation | WITHDRAWN 30 JUN 2026 | No dollar valuation is current or claimable pre-MRR |
| $750K to $1.75M | WITHDRAWN 30 JUN 2026 | No dollar valuation is current or claimable pre-MRR |
| $15M to $25M pre-money | WITHDRAWN 30 JUN 2026 | No dollar valuation is current or claimable pre-MRR |
| 801 IP entries | WITHDRAWN 30 JUN 2026 | 31 named IP frameworks |
| 858 assets | WITHDRAWN 30 JUN 2026 | About 43 working codebases, 4 live properties, about 8 sellable lines |
| 130 repos framed as 130 products | WITHDRAWN 30 JUN 2026 | About 43 working codebases across Tier 0+1+2; org holds 216 repos (verified 2026-11-08) |
| Quantum-proof / Palantir-class capability | WITHDRAWN 30 JUN 2026 | Withdrawn entirely. Not supportable. |
| 62 passing tests on CRUCIBLE | WITHDRAWN 28 JUL 2026 | No test files at project root on disk in July. Superseded in part: the repo now contains three test files (test_gate_failclosed.py, test_gate_raises.py, test_signing.py, 34/34 assertions passed 2026-11-10). |
| CRUCIBLE HMAC-SHA256 ledger | WITHDRAWN 28 JUL 2026 | Not implemented in July (zero hmac across the codebase). Superseded in part: HMAC-SHA256 is implemented in receipt.py, integrated into the service, and tested. The production ledger still carries zero signed records (verified 2026-11-10). |
| CRUCIBLE is tamper-proof | WITHDRAWN 28 JUL 2026 | Tamper-evident on sequence only. The writing service can rewrite the chain. Do not claim tamper-proof. |
| Bryan Franklin 15% equity | WITHDRAWN 30 JUN 2026 | 50/50 JV split (July correction of the 15% figure) |
| DeedSonar is a 50/50 joint venture with Bryan Franklin | WITHDRAWN 10 NOV 2026 | DeedSonar is solely Jeramie's (corrected 2026-10-22; Bryan never signed). The July PDFs state the 50/50 framing as canon; all five occurrences are superseded. |
| The entity carries an LLC suffix | WITHDRAWN 10 NOV 2026 | Neuruh is not a registered business entity; the Michigan LLC filing is unfiled. The suffix never appears in any codex artifact. The uploaded CRUCIBLE LICENSE file carries the same error and needs its copyright line corrected before publication. |
| H01 is blocked (no court ever rendered) | WITHDRAWN 10 NOV 2026 | H01 is CLOSED (verified 2026-11-08; NeuruhAI/neuruh-receipts, 20260909_h01_retrocourt.md, commit 218771db). T02/P0 seam remains OPEN. |
| PR #13 (neuruh-workers) is unmerged | WITHDRAWN 10 NOV 2026 | PR #13 is MERGED 2026-09-14 (merge commit e0c58ec15aa9298eb57170710b3a9cc7a0ef8e28, head 50d36e02). Retro-court at head 50d36e02 still owed. |
| prbench runs 7 models including GPT-6 Astra, GPT-5.6 Sol, Gemini 3.8 Flash, gemini-3.1-pro-preview | WITHDRAWN 10 NOV 2026 | prbench pins exactly 3 Anthropic models (verified 2026-11-10). The other IDs appear as unpinned candidates in check_models.py; they are not pinned models and have never run. The 7-model config never landed. |
| The uploaded verify_chain.py detects any tampering with a record | WITHDRAWN 10 NOV 2026 | The uploaded (older) verifier checks linkage only: content edits that leave stored hashes untouched pass verification, and tail truncation passes. The repo's current verifier recomputes every receipt_hash and catches content edits (verified 2026-11-10). Use the repo verifier. |
| The tamper_demo.sh script proves the chain detects tampering | WITHDRAWN 10 NOV 2026 | The script prints "Exit code 1 as expected" unconditionally (shell precedence bug) and assumes a directory layout that does not match the upload. A demo that reports success when verification passed is worse than no demo. |
| DeedSonar V3 is live in production | WITHDRAWN 10 NOV 2026 | deedsonar.com returns 503 DEPLOYMENT_PAUSED; production Supabase unreachable (verified 2026-11-04 and 2026-11-10). The July live state is historical. |
| The production database holds about 300k rows across 170+ tables (Sept 13 snapshot) | WITHDRAWN 10 NOV 2026 | Historical snapshot only. The database is unreachable since mid-October 2026; current row counts are UNKNOWN. |
| The org holds 130 repos | WITHDRAWN 10 NOV 2026 | 216 repos (verified 2026-11-08 via paginated API). |
| A repo named neuruh-registry (or neurh-registry) holds the NRH Registry | WITHDRAWN 10 NOV 2026 | Neither name exists in the org (both 404, verified 2026-11-10). The registry lives only as content (vault, transcripts, demos). |
| The NRH Registry seeds 10 domains and 48 entities | CONFLICT 10 NOV 2026 | The July codex states 10 domains / 48 entities. The NRH Registry visual shipped 2026-11-10 records 9 domains / 35 seeded entities. Both figures carried; discrepancy unresolved. |
| LandOS has 49 signals / ncell has 47 tests | CONFLICT 10 NOV 2026 | July codex states 49 signals and 47 ncell tests. Estate record states 50 signals and N-Cell 36/36. Neither side re-verified from the repository in this workspace. Re-verification requires a local clone and a test run on the Mac. |
| 148 tests on landos-engine / 43,897 records scored | UNVERIFIED 10 NOV 2026 | July-recorded figures, not re-verified in November. Carried with their dates; re-verification requires a local clone and a test run. |

### G. Verification log, 2026-11-10 (what was actually run)

*Every check in this codex that was run on 2026-11-10, with the command and the result. A future session re-runs these first.*

| Check | Command or call | Result |
|---|---|---|
| DATUM repo | GitHub API GET /repos/NeuruhAI/datum, /commits, /contents | Private, main, pushed 2026-07-26, latest 07184f5 v0.4.0; docs/CODEX.html 109,086 B, docs/CODEX.md 74,855 B on main |
| prbench repo + config | GitHub API GET /repos/NeuruhAI/prbench; read bench.config.json | Public, latest 9a66444 (2026-11-05 auto run); exactly 3 pinned Anthropic models; bench.yml daily cron 17 13 UTC; repo is PUBLIC despite the "REPO MUST BE PRIVATE" header |
| CRUCIBLE repo | GitHub API GET /repos/NeuruhAI/crucible, /contents, /contents/ledger | Private, latest 6b7bf49 (2026-09-30); no LICENSE file; three test files present; ledger has neuruh.PRODUCTION.jsonl and neuruh.archived.jsonl (31,362 B each, byte-identical) |
| CRUCIBLE production ledger | Downloaded via API; repo verify_chain.py | CHAIN VALID, 44 records, receipt_hash recompute PASS 0 mismatched, 17 PASS / 27 FLAG, eta mean 49.9, threshold 70.0; genesis epoch 44 records, signed epoch 0 records; 0 records carry a sig field |
| CRUCIBLE repo verifier vs tamper | Edited record 10 verdict/eta, ran repo verify_chain.py | CHAIN INVALID, exit 1, "record 10: receipt_hash does not match recomputed body hash" |
| CRUCIBLE uploaded verifier vs tamper | Built 3-record ledger with stamp_documents.py; edited verdict, deleted middle, deleted last, edited hash | Verdict edit: PASS (exit 0). Middle delete: FAIL. Hash edit: FAIL. Last delete: PASS (exit 0). Uploaded verifier is linkage-only. |
| CRUCIBLE test_signing.py | python3 test_signing.py (repo files, system Python) | 34/34 assertions passed; service tests skipped (no httpx) |
| CRUCIBLE keyed_signing.py --demo | python3 keyed_signing.py --demo (uploaded source) | Forgery detected (verify False); plain-hash forgery undetected (verify True). Mechanism sound. |
| CRUCIBLE stamp_documents.py | Scan + build + verify on this codex folder | 2 documents scanned, 2 receipts built, CHAIN VALID, verdicts FLAG/FLAG, eta 0.0/0.0, tier C/UNVERIFIED |
| FALLOW v0.1.0 tests | Extracted fallow-v0.1.0.tar.gz; venv + pytest | 39 passed in 0.13s |
| H01 court record | GitHub API GET /repos/NeuruhAI/neuruh-receipts/contents/20260909_h01_retrocourt.md | Exists, 17,801 B, sole history commit 218771db (2026-09-09) |
| PR #13 neuruh-workers | GitHub API GET /repos/NeuruhAI/neuruh-workers/pulls/13 | Closed, merged true, merged 2026-09-14T11:17:17Z, merge commit e0c58ec15aa9298eb57170710b3a9cc7a0ef8e28, head 50d36e02c7048516c0b9e045aa90935cafe80224 |
| LEGION PR #26 + tag | GitHub API GET pulls/26, GET tags | PR #26 closed, merged 2026-09-30T12:32:45Z, merge commit dbd9ef6efd565e596fed71516c23a14fad513731; tag legion-v0.1.0-proof-20260928 annotated (7ea2877) pointing at 8719d8d |
| Org repo count | GitHub API paginated list | 216 repos (100 + 100 + 16) |
| NRH Registry repo existence | GitHub API GET /repos/NeuruhAI/neuruh-registry and neurh-registry | Both 404. No repo under either spelling. |
| Live pages | curl -s -o /dev/null -w "%{http_code} %{size_download}" | hub 200/68,663; neuruh-web 200/13,014; bench 200/13,006; deedsonar 503/99 (DEPLOYMENT_PAUSED body); legion-replay 200/34,116; neuruh-codex 200/111,116; vault-overview 200/573,846; startup-needle-report 200/59,168; buyer demo 200/32,653; reference-library 200/68,076; fallow-yield 200/66,263; nrh-registry 200/30,459 |
| Production Supabase | curl efxowqudmsfqjmbeidjc.supabase.co | curl 000, connection failure, 0 bytes. Unreachable. |
| Repo latest commits | GitHub API GET /repos/NeuruhAI/<repo> (16 repos) | landos-engine c99e190 (2026-10-07); landos-ingest 1826032 (2026-09-15); deedsonar 954367a (2026-10-09); crucible 6b7bf49 (2026-09-30); prbench 9a66444 (2026-11-05); datum 07184f5 (2026-07-26); ncell d2c8462 (2026-10-04); lead-recipe-os 7363dcb (2026-10-03); recipe-engine 33f77f4 (2026-09-22); territory-engine 22ca137 (2026-07-23); neuruh-workers 341612c (2026-09-30); neuruh-cockpit 6da16c5 (2026-10-01); neuruh-demos 9c02c1f (2026-11-10, NRH Registry visual) |
| July PDFs | pdftotext -layout, read in full | Ecosystem Codex 41 pp / 8,588 words; External Brief 32 pp / 6,125 words (read pp. 1-7 fully, remainder verified structurally: same component pages, same numbers, redactions confirmed); Defense Vol VII 3 pp / 541 words; CRUCIBLE Verification Record 5 pp / 1,438 words |
| July SVGs | Read headers + inventory | D1-D6, 1400 px wide, blue-accent style; D1/D2/D5 carry the superseded 50/50 and 49-signal figures and infrastructure identifiers |
| CRUCIBLE source | Read in full | verify_chain.py 125 lines; keyed_signing.py 228; stamp_documents.py 215; audit_ledger.py 61; SPEC.md 82; WITHDRAWN.md 52; README.md 207; STORYBOARD.md 215; tamper_demo.sh 22; ledger README 14; LICENSE Apache 2.0 (copyright line carries the wrong entity name) |
| Codex HTML verify | node verify.js (jsdom) | 21 checks passed, 0 failed (see CODEX verify.js) |
| Codex live check | curl + MD5 | HTTP 200, 111,116 B, MD5 50cd6d600c01358b4978bca5564f08a2, byte-identical to staged (pre-expansion; re-verified after expansion) |
| PDF builds | WeasyPrint 70.0 via build_pdfs.py (venv .pdfvenv) | Master 59 pp A4, 415,653 B; external brief 9 pp A4, 163,102 B; defense volume 3 pp A4, 20,021 B |
| Brief secret scan | pdftotext -layout + grep over the external brief | 0 IPv4, 0 UUID, 0 supabase, 0 Mac paths, 0 forbidden-string, 0 em dash, 0 defense-file link; 4 "50/50" hits, all in correction/withdrawn context |
| Diagrams | xml parse + secret grep + cairosvg render | 10 SVGs valid XML, 0 secrets; D1 and D8 rendered to PNG and visually inspected, no text overflow |
| Stamp run 1 (superseded) | stamp_documents.py --scan/--build + repo verify_chain.py (NeuruhAI/crucible) | 8 receipts, CHAIN VALID, 5 PASS / 3 FLAG, eta mean 85.0, receipt_hash recompute PASS 0 mismatched, head 34b2c7c81f37733d985ea6a82de82a3c6e5fb49f6be4c1fba2a47d160c14e00d; unsigned, sequence integrity only (same caveat as the production ledger) |
| Stamp scope | stamp_documents.py EXTS | The tool stamps .pdf/.md/.html/.json only. The 10 SVGs and 4 build scripts are verified by the diagram checks and verify.js above, not by the ledger. The published ledger is docs_ledger.jsonl, rebuilt after the final freeze and verified CHAIN VALID before publication; its head hash is recorded in the delivery record, not here, because embedding it would change the file it stamps. |

*End of Codex v1.1.0. Compiled 2026-11-10 from the vault, the live GitHub and Pages state, and the transcripts listed in Section 0.5. The next entry is an append, not an edit. When a fact in this document is re-verified, superseded, or proven wrong, add a dated entry naming the old claim, the new evidence, and the verdict.*
