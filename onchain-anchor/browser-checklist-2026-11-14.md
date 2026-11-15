# Browser and interaction checklist used 2026-11-14 (published for third-party re-verification)

Convergence spec item 8. This file is the VERBATIM checklist the doubt-removal
program dispatched on 2026-11-14 (source:
~/workspace/research-drift-2026-11-14/doubt-removal-browser-checklist.md),
with this header added. Nothing below the header was edited.

## Outcome (from the final report, ~/workspace/research-drift-2026-11-14/final-report.md)

- 177 checklist sites + hypersonics-zero-to-ground = 178 sites.
- Final browser-verified tally: 178 WORKING, 0 PARTIAL, 0 BROKEN.
- Method: live Chromium, named steps only (the step codes L1/S1/S2/V1/C1/W1/D1/R1
  below). A page that loads but does nothing when touched counts as BROKEN.
  jsdom verdicts are STATIC-WORKING at most, never browser-verified WORKING.
- The per-site "Browser steps" line is the exact interaction that was confirmed
  in the browser for that site. Those steps are reproduced in the machine-readable
  inventory (demo-inventory.json) as the `interaction_confirmed` field.
- Float32 read rule (in force): a raw number-input value counts as CLEAN if it
  equals the expected decimal OR its float32 rounding (Chromium exposes
  spinbutton values as 32-bit floats). Do not dispatch a page fix on float
  evidence alone.

## How to re-verify

1. Load the URL (L1), confirm the page renders, open devtools console, record
   console errors, take a full-page screenshot.
2. Run the site's "Browser steps" line (S1/S2/V1/C1/W1/D1/R1 as coded).
3. Record the verdict (WORKING / PARTIAL / BROKEN) and the observed result.
4. Compare the live content hash to the manifest (manifest-v2.json); a changed
   hash without an updated verification record fails the CI re-fetch
   (ci_refetch.py).

---

# Doubt-removal browser checklist: 177 sites, ready to dispatch

Date: 2026-11-14. Compiled from the two jsdom audit reports, the two fix reports, and the unified-chain build report. Refreshed 2026-11-14 with the GitHub E-series hang fixes, the GitHub PARTIAL fixes, and the hub v2.51 bump (see sources below). No browser verification has happened for any site in this file. Every verdict below is a jsdom verdict only, unless it says "jsdom smoke only". Nothing here claims a live-browser result. No em dashes are used anywhere in this file.

Sources:
- `doubt-removal-audit-github.md` (82 GitHub Pages sites, jsdom verdicts)
- `doubt-removal-audit-cloudflare.md` (94 Cloudflare Pages sites, jsdom verdicts)
- `fix-cloudflare-doubt-removal.md` (4 Cloudflare fixes, live, jsdom re-verified)
- `fix-ghpy-testfire.md` (gh.py proven; 5 E-series defects fixed on GitHub Pages, live)
- `fix-github-e-hang.md` (GitHub E2, E4, E10 hang fixes, live 2026-11-14, jsdom re-verified)
- `fix-github-partials.md` (GitHub PARTIAL fixes: master-command-lab, neuruh-prompter, component-library-gallery, autonomous-builder-factory, convergence-graph-visuals, live 2026-11-14, jsdom re-verified)
- `fix-hub-v251.md` (hub v2.51, 177 sites, live 2026-11-14; the 177 entries in this file match the hub total)
- `build-unified-chain.md` (flagship demo, jsdom smoke only, no audit verdict)
- `doubt-removal-urls.txt` (176 hub URLs; unified-chain is entry 177, not in that file; hub v2.51 now lists 177 sites including unified-chain)

## Tally box

### Verdict counts (jsdom only)

| Host | STATIC-WORKING | BROKEN | PARTIAL | NEEDS-BROWSER | DOC | Total |
|---|---|---|---|---|---|---|
| GitHub Pages | 59 | 3 | 5 | 12 | 3 | 82 |
| Cloudflare Pages | 89 | 3 | 1 | 0 | 1 | 94 |
| Combined (176 URLs) | 148 | 6 | 6 | 12 | 4 | 176 |
| Plus unified-chain (jsdom smoke only, no audit verdict) | 0 | 0 | 0 | 0 | 0 | 1 |
| Grand total entries | 148 | 6 | 6 | 12 | 4 | 177 |

### Fix status after the 2026-11-14 refresh (jsdom re-verified live only, browser re-verification still owed)

The verdict counts above are the audit-time jsdom verdicts and are kept as the audit record. The table below shows the current fix state. All 6 BROKEN sites and all 6 PARTIAL sites now have fixes live.

| Host | BROKEN in audit | BROKEN fixed | PARTIAL in audit | PARTIAL fixed |
|---|---|---|---|---|
| GitHub Pages | 3 | 3 | 5 | 5 |
| Cloudflare Pages | 3 | 3 | 1 | 1 |
| Combined | 6 | 6 | 6 | 6 |

Re-verification entries (browser check must confirm the fix, not just re-run jsdom): the 6 BROKEN sites (GitHub e2, e4, e10; Cloudflare e2, e5, e10), the 6 PARTIAL sites (GitHub master-command-lab, neuruh-prompter, component-library-gallery, autonomous-builder-factory, convergence-graph-visuals; Cloudflare aegis), plus the 3 GitHub E-series sites whose audit verdict was STATIC-WORKING but which carried kill-box defects (e8, e10, e11). Distinct fixed sites total 14: Cloudflare e2, e5, e10, aegis (4); GitHub e8, e10, e11, e2, e4, master-command-lab, neuruh-prompter, component-library-gallery, autonomous-builder-factory, convergence-graph-visuals (10). GitHub e10 appears in both the BROKEN set and the kill-box set; it carries two fixes. Convergence-graph-visuals needed no code fix; its audit gap was a harness artifact (see Batch 5).

### Controls exercised in jsdom

- GitHub Pages: 2601 controls exercised (plus 78 attempted on the 3 hang pages before they timed out). 286 dead entries in final runs, of which 18 are genuine dead controls on non-WebGL pages, 40 are dead controls on NEEDS-BROWSER pages caused by the failed WebGL scene init, 43 are jsdom-unverifiable clipboard/download/print/external-link controls, and the rest were proven working in isolation or flow probes.
- Cloudflare Pages: 6385 controls exercised, 6031 responded, 5 threw on activation, 11 had no observable effect and no listener, 145 ran clean with no visible DOM change (idempotent or precomputed on load). 338 controls unassessed, all on the 3 BROKEN Cloudflare sites.

### jsdom-unverifiable control types (browser tap still owed for each)

- Copy/download/print/external-link controls: 43 named on GitHub Pages (see per-site entries). On Cloudflare Pages, 19 named in per-site sections (13 Print buttons across the E-series and residential/land-zoning engines, Print packet on clarity-builder, Download Packet on self-compounding-knowledge-engine, Copy receipt JSON on neuruh-constitution, and 3 share-link buttons: Update share link, Generate share link, Show share link), plus the full E-series copy/download set whose handlers reached the anchor click in jsdom but whose downloaded files were never verified.
- WebGL canvas: 12 sites, all GitHub Pages (the NEEDS-BROWSER set). jsdom has no WebGL; every one of these failed at `THREE.WebGLRenderer: Error creating WebGL context`.
- Camera: 1 site (neuruh-prompter, camera select needs getUserMedia and real devices).
- Remote API lane: 1 site (neuruh-prompter, remote buttons POST to ./api/ctl, ./api/meta, ./api/take; ./api/health returned HTTP 503 on the live host at the 2026-11-14 fix verification, not HTTP 404 as the audit stated, because no backend is hosted with the page. The fix treats any non-ok response as offline).

### Fixed since the audits (jsdom re-verified live, browser re-verification still owed)

- Cloudflare, 4 sites: e2-small-multifamily, e5-commercial, e10-short-term-rental (share-link self-serialization fix, one line each), aegis-intelligence-core (War Room buttons disabled until their phase runs, plus handler guards).
- GitHub Pages, 3 sites, 5 defects: e8-distressed-title (auto kill boxes now synced), e10-short-term-rental (auto kill boxes now synced; duplicate loadSample removed), e11-agricultural-timber (auto kill boxes now synced; stale comp rows reset on sample load).
- GitHub Pages, 3 hang fixes, live 2026-11-14 per `fix-github-e-hang.md`: e2-small-multifamily (commit 1c442f8b, live MD5 77f07c9719b48c3b188229dc483db27e), e4-development-feasibility (commit 71255e43, live MD5 104ddb995571c48de32e259235b2f9f3), e10-short-term-rental (commit 8e57155d, live MD5 f2783e10dd8b59896f7f25d77c99ad18). Same root cause in all three: the collect function serialized the shareUrl input into its own base64 state. One-line fix each: exclude shareUrl from the collect. 20-edit jsdom verification flat and fast on all three (E2 share link flat at 2,144 chars, max 37.53 ms per edit, 19/19 tests; E4 flat at 1,730 chars, max 24.91 ms, 14/14 tests; E10 flat at 2,325 chars, max 13.72 ms, 25/25 tests).
- GitHub Pages, 5 PARTIAL fixes, live 2026-11-14 per `fix-github-partials.md`: master-command-lab (runFabricPanel rename, stack overflow fixed, commit 9814c24a), neuruh-prompter (remote lane disabled gracefully on static hosting, commit 3d76af3e), component-library-gallery (counter selector widened, tooltips on click, commit 031759e9), autonomous-builder-factory (sample loaders name the applied view, full per-view re-probe 213 controls, 0 dead, commit 3676c9e5), convergence-graph-visuals (no code fix; audit gap was the harness typing TEST123 into search; full re-probe 12/12).

### Still open, no fix landed

None, as of the 2026-11-14 refresh. Every BROKEN and PARTIAL site from the audits now has a fix live (jsdom re-verified only). The items formerly listed here are all fixed:

- GitHub Pages e2-small-multifamily and e4-development-feasibility: hang fixed, see `fix-github-e-hang.md`. HOLD cleared. Dispatch as re-verification in Batch 4.
- GitHub Pages e10-short-term-rental: hang fixed, see `fix-github-e-hang.md`. HOLD cleared. Dispatch the hang check with the kill-box re-verification in Batch 4.
- GitHub Pages master-command-lab: Run fabric stack overflow fixed, see `fix-github-partials.md`. Dispatch as re-verification in Batch 5.
- GitHub Pages neuruh-prompter: remote lane disabled gracefully with a plain-language note, local prompter unchanged, see `fix-github-partials.md`. Camera select still needs a real device; Download take still needs a recorded take in a real browser. Dispatch as re-verification in Batch 5.
- GitHub Pages component-library-gallery: counter and tooltip handlers fixed, see `fix-github-partials.md`. Dispatch as re-verification in Batch 5.
- GitHub Pages autonomous-builder-factory and convergence-graph-visuals: fixed or no-fix-needed, see `fix-github-partials.md`. Dispatch as re-verification in Batch 5.

### Sites whose browser verdict is still fully open

All 177. No site in this file has any live-browser verdict yet. That includes the 148 STATIC-WORKING sites (jsdom only), the 12 NEEDS-BROWSER sites (jsdom could not run them at all), the 6 BROKEN sites (fixed, jsdom re-verified only), the 6 PARTIAL sites (fixed, jsdom re-verified only), the 4 DOC sites, the 14 fixed sites (jsdom re-verified only, browser re-verification still owed), and unified-chain (jsdom smoke only).

## Priority order for browser dispatch

1. Batch 1 and 2: the 12 NEEDS-BROWSER WebGL sites first. jsdom could not run them at all, so these have the least evidence of any site.
2. Batch 3 and 4: fixed sites for re-verification. Cloudflare e2, e5, e10, aegis (4), unified-chain (1), GitHub E8, E10, E11 (3), GitHub e2, e4, and the e10 hang check (3). All Batch 4 HOLD entries are cleared: the GitHub e2, e4, and e10 hang fixes landed 2026-11-14 per `fix-github-e-hang.md`. Dispatch all five Batch 4 sites as re-verification.
3. Batch 5: the fixed PARTIAL sites, now re-verification (neuruh-prompter, autonomous-builder-factory, component-library-gallery, master-command-lab, convergence-graph-visuals).
4. Batches 6 to 20: STATIC-WORKING spot checks, grouped by family so one browser task covers a batch of related sites.
5. Batch 21: DOC pages render check (3 GitHub DOC pages; the Cloudflare DOC page, jeramie-general-intelligence, rides in Batch 15 with the other long documents).

## Standard step codes (used in every per-site entry)

- L1: Load the URL. Confirm the page renders (no blank page, no spinner stuck), note HTTP status if the browser shows it, open devtools console, record any console errors, take a full-page screenshot.
- S1: Click or activate each primary control named in the entry. Confirm a visible change on the page for each (text, panel, number, or state change). Record any control that does nothing.
- S2: Type a realistic value into each named input or select (not TEST123 where a real value matters, for example an address, a rent, a price). Confirm the calculated outputs update.
- V1: Run the named verify flow (Verify chain, Verify receipt, Verify whole chain). Confirm it reports VALID or equivalent. Then use the tamper path if the page has one and confirm it reports TAMPERED or equivalent.
- C1: Tap each named copy/download/print control. For copy, paste into a scratch field and confirm the text arrived. For download, confirm a file lands in Downloads and open it to confirm it is non-empty and well formed. For print, confirm the print dialog opens.
- W1: Confirm the WebGL canvas renders a visible 3D scene (not a black or blank box). Drag on the canvas to rotate, scroll to zoom, click each named view/filter button and confirm the scene changes.
- D1: Scroll the full document top to bottom, confirm figures and tables render, click 3 in-page nav anchors and confirm each jumps to the right section.
- R1: Repeat-edit stress test (E-series only). Make 20 consecutive input edits, one per second, watching the share-link field length and the response time of each edit. Pass is a share link that stays bounded (roughly under 3,000 chars) and no visible slowdown. Fail is a link that keeps growing or edits that get slower.

## Batching plan for the parent

Shared Chromium profile queues FIFO, so dispatch small batches in order and do not stack many at once. One browser task per batch. Estimated step counts count the named steps per site, not clicks inside a step.

| Batch | Sites | Priority | Est. steps |
|---|---|---|---|
| 1 | WebGL set A (6) | 1, NEEDS-BROWSER | 48 |
| 2 | WebGL set B (6) | 1, NEEDS-BROWSER | 46 |
| 3 | Cloudflare fixes + unified-chain (5) | 2, fixed re-verify | 42 |
| 4 | GitHub E-series fixes (5 live, all fixed re-verify) | 2, fixed re-verify | 48 |
| 5 | PARTIAL sites, fixed (5) | 3, fixed re-verify | 38 |
| 6 | GitHub E-series working (6) | 4, spot check | 36 |
| 7 | Cloudflare E-series working + underwriting engines (10) | 4, spot check | 52 |
| 8 | Cloudflare real-estate and product (10) | 4, spot check | 44 |
| 9 | Cloudflare JGI workbenches (10) | 4, spot check | 42 |
| 10 | Cloudflare frameworks and papers (11) | 4, spot check | 44 |
| 11 | Cloudflare live demos A (10) | 4, spot check | 42 |
| 12 | Cloudflare misc tools (10) | 4, spot check | 42 |
| 13 | Cloudflare engines and codexes (11) | 4, spot check | 44 |
| 14 | Cloudflare dossiers and manuals (10) | 4, spot check | 42 |
| 15 | Cloudflare swarm/blueprints + DOC (8) | 4 and 5, spot check + DOC | 34 |
| 16 | GitHub interactive builds A (10) | 4, spot check | 42 |
| 17 | GitHub land and commerce (8) | 4, spot check | 40 |
| 18 | GitHub organism and governance (11) | 4, spot check | 44 |
| 19 | GitHub labs (12) | 4, spot check | 46 |
| 20 | GitHub live demos and visuals (10) | 4, spot check | 40 |
| 21 | GitHub DOC pages (3) | 5, DOC render | 10 |
| Total | 177 entries (176 URLs + unified-chain) | | about 866 |

## Batch 1: WebGL set A (NEEDS-BROWSER, priority 1)

### legion-replay (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/legion-replay/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 34,116 bytes. 14 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Nothing else proved: scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`, and the 8 controls named below were dead in jsdom as a direct consequence (handlers bind after renderer creation).
- Browser steps: L1. W1: confirm the swarm scene renders and animates. Click C1, C2, C3, C4, C5, C6, C7 in turn and confirm each changes the view or selection. Click Reset view and confirm the camera returns to the starting angle. Drag to rotate and scroll to zoom.
- jsdom could not verify: the entire WebGL canvas, all 8 named buttons, animation, rotation, zoom.

### nrh-registry (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/nrh-registry/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 30,459 bytes. 12 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Nothing else proved: scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`, and the 11 controls named below were dead in jsdom as a direct consequence.
- Browser steps: L1. W1: confirm the registry scene renders. Click each category filter in turn (RE Real Estate Intelligence, IN Infrastructure / Core, CO Commerce / Resale, SV Client Services, CR Creator / Publication, RS Research, FN Finance / Capital, OP Ops, FM Family / Personal) and confirm each filters or highlights its nodes. Click Reset view, then toggle Auto-rotate off and on and confirm rotation stops and resumes.
- jsdom could not verify: the entire WebGL canvas, all 11 named controls, auto-rotation.

### eta-gate (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/eta-gate/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 28,473 bytes. 14 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. No dead non-3D controls in jsdom.
- Browser steps: L1. W1: confirm the gate scene renders. Click every control on the page (14 in jsdom) and confirm each responds. Drag to rotate, scroll to zoom.
- jsdom could not verify: the entire WebGL canvas, scene animation.

### landos-signals (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/landos-signals/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 26,292 bytes. 0 controls in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. This is a pure 3D visualization with no controls at all.
- Browser steps: L1. W1: confirm the signal registry scene renders with visible nodes or points. Drag to rotate, scroll to zoom. Confirm the page is not a blank canvas.
- jsdom could not verify: the entire WebGL canvas. There are no controls to click.

### red-team-build-map (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/red-team-build-map/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 32,627 bytes. 4 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`, plus an uncaught Error of the same text. The 3 controls named below were dead in jsdom as a direct consequence.
- Browser steps: L1, note any console error on load. W1: confirm the build-map scene renders. Click Amplification stack (A to J) and confirm the stack highlights. Click Pause rotation and confirm rotation stops, click again and confirm it resumes. Click Reset view and confirm the camera returns.
- jsdom could not verify: the entire WebGL canvas, all 3 named controls, rotation.

### crucible-gate (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/crucible-gate/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 22,244 bytes. 10 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. No dead non-3D controls in jsdom.
- Browser steps: L1. W1: confirm the gate scene renders. Click every control on the page (10 in jsdom) and confirm each responds. Drag to rotate, scroll to zoom.
- jsdom could not verify: the entire WebGL canvas, scene animation.

## Batch 2: WebGL set B (NEEDS-BROWSER, priority 1)

### axon-lattice-substrate (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/axon-lattice-substrate/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 20,562 bytes. 4 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. The 3 controls named below were dead in jsdom as a direct consequence.
- Browser steps: L1. W1: confirm the lattice scene renders. Click Interiors, then Transfer, then Reset view, confirming a visible change for each. Drag to rotate, scroll to zoom.
- jsdom could not verify: the entire WebGL canvas, all 3 named controls.

### axon-lattice-code-map (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/axon-lattice-code-map/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 31,422 bytes. 6 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`, plus an uncaught Error of the same text. The 5 controls named below were dead in jsdom as a direct consequence.
- Browser steps: L1, note any console error on load. W1: confirm the code-map scene renders. Click Tests + demos, then Phase 1 (lattice + router), then Phase 2 (substrate + verticals), confirming each changes the highlighted layer. Click Pause rotation (rotation stops), then Reset view (camera returns).
- jsdom could not verify: the entire WebGL canvas, all 5 named controls, rotation.

### decision-traces (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/decision-traces/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 35,999 bytes. 14 of 19 controls exercised in jsdom (5 disabled, skipped).
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. The decision-trace simulator itself was verified working in a jsdom flow probe: choose episode EP-CF-20261104, Run step, Run all emitted trace JSON, Copy produced output.
- Browser steps: L1. W1: confirm the 3D scene renders. Click Reset view and Top view and confirm the camera moves. Then run the simulator flow: select episode EP-CF-20261104, click Run step, click Run all, confirm trace JSON appears. Click Copy and paste into a scratch field to confirm the trace text arrived.
- jsdom could not verify: the entire WebGL canvas, Reset view, Top view, real clipboard write.

### mineral-pits (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/mineral-pits/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 92,207 bytes. 7 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. The 6 controls named below were dead in jsdom as a direct consequence.
- Browser steps: L1. W1: confirm the placer map scene renders with visible pit markers. Click Offtake (active producers, 1,110), then Tailings (past producers, 509), then Recon (88), confirming each filters the markers. Click Tier 1 focus, then Pause rotation, then Reset view, confirming a visible change for each.
- jsdom could not verify: the entire WebGL canvas, all 6 named controls.

### landgraph-model (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/landgraph-model/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 24,650 bytes. 3 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. The 2 controls named below were dead in jsdom as a direct consequence.
- Browser steps: L1. W1: confirm the entity-graph scene renders. Click Run the P0 pivot and confirm the graph pivots or re-centers. Click Reset view and confirm the camera returns. Drag to rotate, scroll to zoom.
- jsdom could not verify: the entire WebGL canvas, both named controls.

### repo-tiers (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/repo-tiers/
- jsdom verdict: NEEDS-BROWSER (jsdom only). HTTP 200, 21,524 bytes. 7 controls exercised in jsdom.
- jsdom proved: Page loads, Three.js inlined, window.THREE present. Scene init failed at `THREE.WebGLRenderer: Error creating WebGL context`. No dead non-3D controls in jsdom.
- Browser steps: L1. W1: confirm the repo-tier scene renders. Click every control on the page (7 in jsdom) and confirm each responds. Drag to rotate, scroll to zoom.
- jsdom could not verify: the entire WebGL canvas, scene animation.

## Batch 3: Cloudflare fixes + unified-chain (priority 2, re-verification)

### e2-small-multifamily (Cloudflare Pages, FIXED)

- URL: https://e2-small-multifamily.pages.dev/
- jsdom verdict: BROKEN in the audit (jsdom only), FIXED and live per `fix-cloudflare-doubt-removal.md`, jsdom re-verified (not browser verified). Deploy dcea8439-3adf-4a64-bacd-52a381ad8606, live MD5 4790e89e6d1008cc3188e34f1020394a.
- jsdom proved: Before the fix, shareUrl grew 2,070 to 76,578 chars across 8 changes. After the one-line fix (shareUrl excluded from collectState), 20 consecutive changes kept shareUrl at max 2,122 chars, final 2,110, total 898 ms, zero JS errors.
- Browser steps: L1. R1: make 20 consecutive edits to grade selects and inputs, watch the share-link field length after each edit, confirm it stays bounded near 2,100 chars and edits stay fast. Click Copy share link (C1: paste and confirm the link loads the same state). Click Sample A, B, C in turn (S1). Click Clear all, confirm fields blank. C1: Copy receipt JSON, Download receipt JSON, Print.
- jsdom could not verify: real clipboard write, downloaded file contents, print dialog, real-browser edit latency.

### e5-commercial (Cloudflare Pages, FIXED)

- URL: https://e5-commercial.pages.dev/
- jsdom verdict: BROKEN in the audit (jsdom only), FIXED and live per `fix-cloudflare-doubt-removal.md`, jsdom re-verified (not browser verified). Deploy 9adddce8-6a6f-4793-9e87-8f6393107018, live MD5 09bf981f42394ed22068850a97ced8bb.
- jsdom proved: Before the fix, shareUrl grew 1,975 to 38,719 chars across 6 changes. After the fix, 20 consecutive changes kept shareUrl at max 2,015 chars, final 2,003, total 990 ms, zero JS errors.
- Browser steps: L1. R1: make 20 consecutive edits, confirm the share link stays bounded near 2,000 chars and edits stay fast. Click Sample A, B, C (S1). Click Copy share link (C1). C1: Download receipt JSON, Print, Download chain JSON. V1: Verify chain.
- jsdom could not verify: real clipboard write, downloaded file contents, print dialog, real-browser edit latency.

### e10-short-term-rental (Cloudflare Pages, FIXED)

- URL: https://e10-short-term-rental.pages.dev/
- jsdom verdict: BROKEN in the audit (jsdom only), FIXED and live per `fix-cloudflare-doubt-removal.md`, jsdom re-verified (not browser verified). Deploy 4831179e-472d-4049-89a2-9c1369e5fe82, live MD5 cefa44250791537f4f5fc4d15e98005e.
- jsdom proved: Before the fix, per-change cost exploded 24 ms to 16,080 ms and the Node process aborted with a V8 fatal error inside btoa. After the fix, 20 consecutive changes kept shareUrl at max 2,363 chars, final 2,363, total 647 ms, zero JS errors.
- Browser steps: L1. R1: make 20 consecutive edits, confirm the share link stays bounded near 2,360 chars and no edit lags. Click Sample A, B, C (S1). Click Copy share link (C1). C1: Copy receipt JSON, Download receipt JSON, Copy system prompt, Print. V1: Verify chain.
- jsdom could not verify: real clipboard write, downloaded file contents, print dialog, real-browser edit latency.

### aegis-intelligence-core (Cloudflare Pages, FIXED)

- URL: https://aegis-intelligence-core.pages.dev/
- jsdom verdict: PARTIAL in the audit (jsdom only), FIXED and live per `fix-cloudflare-doubt-removal.md`, jsdom re-verified (not browser verified). Deploy 2f3d1c76-4d82-4d26-9926-88f8f32ed93c, live MD5 d081b6429a31675930dbd8482f860b2d.
- jsdom proved: Before the fix, 5 scenario buttons threw uncaught TypeErrors when clicked before their phase ran. After the fix, all 6 War Room buttons start disabled with a title naming the prerequisite; force-enabled clicks write a plain-language reason instead of throwing; in-order flow works end to end (Phase 1, then Litigation 284 chars, Zeitgeist 257 chars, pre-mortem 432 chars; Phase 2, then Payout 261 chars, Ask 204 chars, Record decision 304 chars; Reset re-locks everything). Zero JS errors.
- Browser steps: L1. On load, confirm Ask, Payout at 75 percent, Simulate Litigation, Query Zeitgeist, Simulate Denial, and Record decision are all disabled, and hover each to confirm the title names the prerequisite. Click each disabled button and confirm nothing throws and the output area is unchanged. Click Run Phase 1, confirm Litigation, Zeitgeist, and pre-mortem enable while Payout, Ask, and Record decision stay disabled. Click Simulate Litigation and confirm output appears (about 284 chars). Click Run Phase 2, confirm Payout, Ask, and Record decision enable. Click Payout at 75 percent and confirm output shows payout $13,875 and saves $4,625 vs the full $18,500. Click Ask, then Record decision and issue receipt, confirm a receipt is recorded. Click Reset and confirm all 6 buttons lock again.
- jsdom could not verify: real disabled-button behavior in Chromium, hover titles, real receipt rendering.

### unified-chain (GitHub Pages, flagship, jsdom smoke only)

- URL: https://neuruhai.github.io/neuruh-demos/unified-chain/
- jsdom verdict: NONE. No audit verdict exists. Status per `build-unified-chain.md`: node tests 56/56 pass, jsdom DOM smoke 22/22 pass, live MD5 verified (index.html b6ef964e365cf42e96b2785a9208745e). This is a SIMULATION (browser-local, no backend, nothing leaves the page). The estate status strip is dated 2026-11-14 and is not a live probe.
- jsdom proved (smoke only): every stage control responded in jsdom: claim id generation, header hex live update, worked preset, intersection edits to PROCEED, gate boundaries, decay, kill preset, receipt seal plus VALID, verify box accepts genuine and the tamper button produces TAMPERED, outcome ledger, next-mission card, send-to-stage-1 prefills stage 1.
- Browser steps: L1. Stage 1: type a claim into the text input, confirm a claim id (UC-YYYY-MM-DD-NNNN) and UTC timestamp appear. Stage 2: click the worked example preset, confirm the header hex reads 1f0701070fa52d01, edit one byte and confirm the hex updates. Stage 3: edit the three edge sets to the PROCEED preset and confirm the verdict reads PROCEED. Stage 4: set evidence to 2 and confirm the gate reads REJECT, set to 6 and confirm WRITE. Stage 5: run the CRUCIBLE kill preset and confirm the verdict and strike counter update. Stage 6: click Run the chain, confirm a sealed receipt with a real SHA-256 hash appears, click Verify and confirm VALID, click the tamper button and confirm TAMPERED. Stage 7: confirm the promotion decision names every blocking reason. Stage 8: record an outcome with result and notes, confirm it appends to the outcome ledger with its own chained receipt. Stage 9: click send to stage 1 and confirm the next mission prefills stage 1 as a new claim. Confirm the scroll-to on next-mission works (window.scrollTo logged a notice in jsdom only).
- jsdom could not verify: real Chromium click-through of the full 9-stage chain, scroll behavior, receipt rendering at full size.

## Batch 4: GitHub E-series fixes (priority 2)

### e8-distressed-title (GitHub Pages, FIXED)

- URL: https://neuruhai.github.io/neuruh-demos/e8-distressed-title/
- jsdom verdict: STATIC-WORKING in the audit (jsdom only), plus 1 defect fixed live per `fix-ghpy-testfire.md`: auto kill checkboxes never synced. Commit d1b93f936bfacacdd3c52c9c2512f1e4bb55b603, new live MD5 deb5ba8dd3e55e1d0b3fc1a78cf7f21f. jsdom re-verified (not browser verified). Audit: 112 controls exercised, no genuine dead controls.
- jsdom proved: After the fix, Sample C checks all three auto kill boxes (k_lien_incomplete, k_heir_no_counsel, k_cure_gt_equity), killAuto lists all three, no duplicate in the fired list, recommendation PASS. Sample A after C unchecks all three and total liens read $97,000.00. Node suite 24 pass, 0 fail.
- Browser steps: L1. Load Sample C, confirm the three auto kill checkboxes (lien stack incomplete, heir complexity with no probate counsel path, cure cost greater than equity) are all checked and the fired kill list shows all three with no duplicates. Load Sample A, confirm all three boxes uncheck and total liens read $97,000.00. Click Copy receipt JSON, Download receipt JSON, Print (C1). V1: Verify chain.
- jsdom could not verify: real checkbox rendering, real clipboard write, downloaded file contents, print dialog.

### e10-short-term-rental (GitHub Pages, FIXED kill boxes, FIXED hang)

- URL: https://neuruhai.github.io/neuruh-demos/e10-short-term-rental/
- jsdom verdict: BROKEN in the audit (jsdom only, progressive hang). 2 defects fixed live per `fix-ghpy-testfire.md`: auto kill boxes never synced, duplicate loadSample removed. Commit 52de205641dfc6bdb13e342d08675d930d82ecda, live MD5 at that time e61f04cee040725c2acd18c889bfa011. jsdom re-verified (not browser verified). Node suite 25 pass, 0 fail.
- jsdom proved: After the fix, Sample C checks k_str_illegal and k_adr_single; Sample A unchecks both; setting strLegal to illegal by hand checks the box and fires the kill, setting it back unchecks it. Samples A, B, C load with expected values (A annual STR gross $42,100.00, B $19,937.50, C PASS). Audit: 0 controls exercised before the hang (94 found, run aborted).
- Hang fix, live 2026-11-14 per `fix-github-e-hang.md`: one line in collectData(), line 557, `if(e.id==="shareUrl")return;`. Same self-serialization root cause as E2/E4: collectData serialized every input including shareUrl, and updateShareUrl/shareLink re-encoded that state into shareUrl on every calc, so the link grew without bound. Commit 8e57155d, new live MD5 f2783e10dd8b59896f7f25d77c99ad18 (old live MD5 e61f04cee040725c2acd18c889bfa011). 20-edit jsdom verification, fixed local file and live page identical: share link flat at 2,325 chars over all 20 edits (was 288,541 chars after 6 edits in the pre-fix control), per-edit max 13.72 ms local and 12.38 ms live, zero JS errors, receipt output 3,285 chars on every edit. Node suite 25 pass, 0 fail. HOLD cleared: dispatch as re-verification.
- Browser steps (kill-box re-verification plus hang re-verification, dispatch now): L1. R1: make 20 consecutive edits to adrSource1, one per second, watching the share-link field. Pass is a share link that stays bounded near 2,325 chars with no visible slowdown. Load Sample C, confirm k_str_illegal and k_adr_single are checked. Load Sample A, confirm both uncheck. Change the STR legality select to illegal by hand, confirm the box checks and the kill fires; change it back, confirm it unchecks. Load Samples A, B, C and confirm A shows $42,100.00, B shows $19,937.50, C shows PASS. C1: Copy receipt JSON, Download receipt JSON, Copy system prompt, Print. V1: Verify chain.

### e11-agricultural-timber (GitHub Pages, FIXED)

- URL: https://neuruhai.github.io/neuruh-demos/e11-agricultural-timber/
- jsdom verdict: STATIC-WORKING in the audit (jsdom only), plus 2 defects fixed live per `fix-ghpy-testfire.md`: auto kill boxes never synced, stale comp rows on sample switch. Commit ffb560bf4c4d33b3dfe2e9325d1675118d5930ff, new live MD5 7847a76441f6ece2b0ffa8ab29ec05ff. jsdom re-verified (not browser verified). Audit: 122 controls exercised, no genuine dead controls. Node suite 29 pass, 0 fail.
- jsdom proved: After the fix, Sample C checks kill_1 and kill_2 and leaves kill_3 unchecked; setting legalAccess to none by hand checks kill_3 and fires PASS, setting it back unchecks it. Adding a fourth comp row filled with "999 Stale Row Rd" / 123456, then loading Sample A, returns comp rows to 3 and the stale address is gone.
- Browser steps: L1. Load Sample C, confirm kill_1 and kill_2 are checked and kill_3 is unchecked. Change legal access to none by hand, confirm kill_3 checks and PASS fires; change it back, confirm it unchecks. Click Add comp row, type "999 Stale Row Rd" and 123456 into the new row, load Sample A, confirm comp rows return to 3 and the stale address is gone. C1: Copy receipt JSON, Download receipt JSON, Copy system prompt, Print. V1: Verify chain.
- jsdom could not verify: real checkbox rendering, real clipboard write, downloaded file contents, print dialog.

### e2-small-multifamily (GitHub Pages, FIXED hang)

- URL: https://neuruhai.github.io/neuruh-demos/e2-small-multifamily/
- jsdom verdict: BROKEN in the audit (jsdom only). Audit: 53 controls found, 0 exercised, run aborted by the 90 second timeout. Timed probe: per-input cost grew 53 ms to 8,281 ms across edits, then hung on #parcelSources. The staged copy carried the same self-serialization defect as the Cloudflare copy (collectState reads every input including shareUrl, updateHash re-encodes on every calc).
- Hang fix, live 2026-11-14 per `fix-github-e-hang.md`: one line in collectState(), line 950, `if(el.id==="shareUrl"){return;}`. Commit 1c442f8b, new live MD5 77f07c9719b48c3b188229dc483db27e (old live MD5 fce470203612bc7ae0b848355513a6ff). 20-edit jsdom verification, fixed local file and live page identical: share link flat at 2,144 chars over all 20 edits (was 266,528 chars after 6 edits in the pre-fix control), per-edit max 37.53 ms local and 60.29 ms live, zero JS errors, receipt output 3,570 chars on every edit. Node suite 19 pass, 0 fail. HOLD cleared: dispatch as re-verification.
- Browser steps: L1. R1: make 20 consecutive edits to purchasePrice, one per second, watching the share-link field. Pass is a share link that stays bounded near 2,144 chars with no visible slowdown. Load Samples A, B, C (S1). C1: Copy share link, Copy receipt JSON, Download receipt JSON, Print. V1: Verify chain.
- jsdom could not verify: real-browser responsiveness across the 20 edits; the whole control set was unverified in a browser before the fix.

### e4-development-feasibility (GitHub Pages, FIXED hang)

- URL: https://neuruhai.github.io/neuruh-demos/e4-development-feasibility/
- jsdom verdict: BROKEN in the audit (jsdom only). Audit: 60 controls found, 0 exercised, run aborted by the 90 second timeout. Timed probe: per-input cost grew to 7,903 ms, then hung on #maxUnits. Same growth pattern as e2 and e10.
- Hang fix, live 2026-11-14 per `fix-github-e-hang.md`: one line in collectState(), line 827, `if(el.id==="shareUrl"){return;}`. Same defect as E2/E10, checked first and confirmed the same, with no second issue found. Commit 71255e43, new live MD5 104ddb995571c48de32e259235b2f9f3 (old live MD5 2f70f87a47da95bd5445a229a4ad80a0). 20-edit jsdom verification, fixed local file and live page identical: share link flat at 1,730 chars over all 20 edits (was 215,514 chars after 6 edits in the pre-fix control), per-edit max 24.91 ms local and 19.13 ms live, zero JS errors, receipt output 2,155 chars on every edit. Node suite 14 pass, 0 fail. HOLD cleared: dispatch as re-verification.
- Browser steps: L1. R1: make 20 consecutive edits to landAsking, one per second, watching the share-link field. Pass is a share link that stays bounded near 1,730 chars with no visible slowdown. Load Samples A, B, C (S1). C1: Copy share link, Copy receipt JSON, Download receipt JSON, Print. V1: Verify chain.
- jsdom could not verify: real-browser responsiveness across the 20 edits; the whole control set was unverified in a browser before the fix.

## Batch 5: PARTIAL sites, all fixed (priority 3)

### neuruh-prompter (GitHub Pages, FIXED)

- URL: https://neuruhai.github.io/neuruh-demos/neuruh-prompter/
- jsdom verdict: PARTIAL in the audit (jsdom only). HTTP 200, 65,610 bytes. 42 controls exercised in jsdom. 12 genuine dead controls, all in the remote-control lane and backend-backed actions.
- jsdom proved: The local prompter works (29 controls responded, including Start reading, Pause, Rehearse without recording, Calibrate my pace, font/wpm/sensitivity ranges).
- Fix, live 2026-11-14 per `fix-github-partials.md`: the remote lane is now disabled gracefully on static hosting. Commit 3d76af3e, new live MD5 3ce7ca16f73b0654b518504f994be9d2 (old live MD5 93cbb2b1c76d1c8920d98167d85a0885). The 8 remote controls (Pair plus Pause/Resume, pace down, pace up, back 8 words, skip 8 words, Restart, Stop take) start disabled and are only enabled when the health check proves the server is there. On failure the remote status line reads "Remote control needs the Neuruh server running. Pairing is off on this page." and a note on the remote screen explains pairing is off on static hosting while the prompter on the device works normally. The setup Remote control toggle is dimmed and unclickable when offline. No polling loop starts against the missing ./api/ctl relay. Local prompter behavior unchanged. Note: ./api/health returned HTTP 503 on the live host at verification time, not HTTP 404 as the audit stated; the fix treats any non-ok response as offline. jsdom re-verification 14/14 on staged and live, identical: all 8 remote controls disabled without a hub, offline note visible, only one API call attempted in the whole session (./api/health), no call to ./api/ctl, ./api/take, or ./api/meta, clicking a disabled remote button changes nothing and triggers no fetch, local prompter still works (typing updates the wordcount, New clears, Save stores, font-up changes size 34 to 36, pace range changes wpm 130 to 150). Original audit harness on live: 34 of 42 exercised, 7 dead entries remaining, all 7 proven in a flow probe to be harness artifacts or real-browser-only controls. No Node test suite exists for this demo.
- Browser steps: L1. Confirm the fixed offline state: all 8 remote controls are visibly disabled, the offline note shows on the remote screen, the remote status line explains the server is needed, the setup Remote control toggle is dimmed and does not respond, the hub pill is hidden. Confirm the local prompter works: type or paste a script, click Start reading, confirm the text scrolls; click Pause, confirm it stops; click Calibrate my pace and confirm it responds; move the font, wpm, and sensitivity sliders and confirm the display changes. Click New and Save with text in the script box and confirm each works (New clears, Save stores). Open the camera select and record whether any real camera device is offered (getUserMedia needs a real device; jsdom had none). Do not dispatch the camera check unless the browser machine has a camera or a virtual camera available; otherwise record the camera select as untestable in that run and keep it open.
- jsdom could not verify: real scrolling behavior, camera device list, download of a take (Download take needs a recorded take in a real browser; jsdom has no MediaRecorder), any backend response.

### autonomous-builder-factory (GitHub Pages, FIXED)

- URL: https://neuruhai.github.io/neuruh-demos/autonomous-builder-factory/
- jsdom verdict: PARTIAL in the audit (jsdom only). HTTP 200, 40,752 bytes. Only 53 of 213 controls exercised in jsdom; after control 53 the page switched views and positions 54 to 199 no longer existed in the DOM. 1 genuine dead control: Sample 1: Apr 17-20 cycle view.
- jsdom proved: The first 53 controls responded, except Sample 1 cycle view.
- Fix, live 2026-11-14 per `fix-github-partials.md`: each sample loader now names the applied view in the share-state line after rendering. Commit 3676c9e5, new live MD5 d8e8eb909f76db14506eee5033ba59c2 (old live MD5 29b901c1a113ef11e5a94eed65b12cf4). Sample 1 writes "Sample 1 applied: Apr 17-20 cycle view, all 64 cycles shown." Sample 2 writes "Sample 2 applied: CODE PACK queue view, Draft packs shown." Sample 3 writes "Sample 3 applied: Registry honesty-gap view, Tested assets shown." The share-state line is overwritten on the next filter change, so the note never goes stale. Full per-view jsdom re-probe, staged and live identical, 11/11 checks: 213 controls accounted for at load (84 enabled pack Advance buttons, 16 disabled pack buttons for Posted terminal packs, 103 enabled asset Record buttons, 4 sample/reset buttons, 1 share button, 1 share-output input, 4 filter selects); all 21 options across the 4 selects applied; all 84 enabled Advance buttons responded; all 103 enabled Record buttons responded; share button changes text to "Link copied (or in the box below)". 0 dead. No Node test suite exists for this demo.
- Browser steps: L1. Navigate through every view or tab on the page in turn (do not click controls in bulk order; open each view first, then click its controls). Click Sample 1 and confirm the share-state line reads "Sample 1 applied: Apr 17-20 cycle view, all 64 cycles shown." and the cycle table shows 64 cycles. Click Sample 2 and confirm the line reads "Sample 2 applied: CODE PACK queue view, Draft packs shown." and the pack table shows 28 Draft packs with 28 enabled Advance buttons. Click Sample 3 and confirm the line reads "Sample 3 applied: Registry honesty-gap view, Tested assets shown." and the asset table shows 0 rows with the asset-empty message displayed (empty by design: no asset is in the Tested state in the demo data). Click Reset and confirm all filters return to All with the default counts (84 enabled pack buttons, 103 enabled asset buttons). Spot-check pack Advance and asset Record buttons in each view and confirm each advances its item one state.
- jsdom could not verify: real-browser rendering of the per-view tables at full size.

### component-library-gallery (GitHub Pages, FIXED)

- URL: https://neuruhai.github.io/neuruh-demos/component-library-gallery/
- jsdom verdict: PARTIAL in the audit (jsdom only). HTTP 200, 106,064 bytes. 113 of 116 controls exercised in jsdom (3 disabled, skipped). 4 genuine dead controls in the final run.
- jsdom proved: Go to Buttons, Go to Data Display, and Save responded in an isolated probe (1 character DOM deltas: hash and active-state writes).
- Fix, live 2026-11-14 per `fix-github-partials.md`: button click-counter selector widened to `#button-row .btn, #sec-buttons [data-variant]`, which wires Default size and Large alongside Small and the six variant buttons; tooltip triggers gained a click handler that shows the tooltip, the same show() used on hover and focus. Commit 031759e9, new live MD5 ba068c68ea4a0ed49bdbeb57671a4f3a (old live MD5 a32fef7673b25a125411c9ef27f11eb1). Cancel and the contact radios were not defects: Cancel is wired to closeDialog and the contact radios update the preference line; both only show a change in flow. jsdom re-verification 11/11 on staged and live, identical: Default size gives "Clicks: 1, Last clicked: default-size", Large gives "Clicks: 2, Last clicked: lg", Small gives "Clicks: 3, Last clicked: sm"; click Run recipe shows its tooltip ("Runs the recipe against the selected county."), click Export shows its tooltip ("Exports the visible rows as CSV."), click Save shows its tooltip ("Saves the current draft to the ledger."); dialog Cancel flow (open, Cancel, state "Dialog: closed", overlay class removed); alert Cancel writes "Alert dialog: cancelled, draft kept"; contact radios set "Contact preference: phone" and "Contact preference: text". No Node test suite exists for this demo.
- Browser steps: L1. Click Default size and confirm the counter reads "Clicks: 1, Last clicked: default-size". Click Large and confirm "Clicks: 2, Last clicked: lg". Click Small and confirm "Clicks: 3, Last clicked: sm". Click Run recipe and confirm its tooltip appears ("Runs the recipe against the selected county."). Click Export and confirm its tooltip appears ("Exports the visible rows as CSV."), then confirm whether a file downloads (C1). Click Save and confirm its tooltip appears ("Saves the current draft to the ledger."). Open the dialog, click Cancel, confirm the state reads "Dialog: closed". Click the phone and text contact radios and confirm the preference line updates for each. Click Go to Buttons and Go to Data Display and confirm each jumps to its section.
- jsdom could not verify: real Export download, tooltip rendering at full size.

### master-command-lab (GitHub Pages, FIXED)

- URL: https://neuruhai.github.io/neuruh-demos/master-command-lab/
- jsdom verdict: PARTIAL in the audit (jsdom only). HTTP 200, 29,185 bytes. 26 controls exercised in jsdom. 1 genuine dead control: Run fabric throws `Uncaught [RangeError: Maximum call stack size exceeded]` on every click.
- jsdom proved: Everything else works (Run command works once crypto.subtle is polyfilled, receipts verify in the main loop).
- Fix, live 2026-11-14 per `fix-github-partials.md`: the audit's stated root cause was wrong. The real defect is name shadowing: the pure `runFabric(state, taskText, failAt)` is declared at line 296, and a second `function runFabric()` inside the browser-wiring block at line 568 reads the task and fail-stage inputs and calls `runFabric(hub, task, failAt)`, which resolves to itself, so every click recursed until the stack overflowed. The fix renames the inner panel handler to `runFabricPanel` and updates the binding at line 601 to `runFabricPanel`; the body is unchanged, so its call now resolves to the pure function. Commit 9814c24a, app.js new live MD5 9562cae8a08049a158acab9df680c5cf (old live MD5 9d82d60a5f4af67a34a01e6957ef45f7), index.html unchanged. Node suite 25/25 pass. jsdom re-verification 11/11 on staged and live, identical: no RangeError on load, no load errors; Run fabric clean run gives "Fabric run COMPLETE for mcp-task-0001" with all six stages listed and receipt `fabric-run` emitted; Run fabric with failure injected at automatic-retry gives FAILED, "rolled back safely", "Rollback complete"; run-route, run-direct, run-failover, run-assign, run-status all still respond. Original audit harness on live: 26/26 controls exercised, 0 dead, 0 load errors.
- Browser steps: L1, note any console error on load. Click Run fabric and confirm a clean run: output reads "Fabric run COMPLETE for mcp-task-0001", all six stages listed, receipt `fabric-run` emitted. Run fabric again with failure injected at automatic-retry and confirm the output reads FAILED with "rolled back safely" and "Rollback complete". Click run-route, run-direct, run-failover, run-assign, run-status and confirm each responds. Click Run command, confirm it runs and receipts verify. V1: Verify all receipts.
- jsdom could not verify: real-browser behavior of the Run fabric flow (whether the tab stays responsive through the full run).

### convergence-graph-visuals (GitHub Pages, NO CODE FIX NEEDED)

- URL: https://neuruhai.github.io/neuruh-demos/convergence-graph-visuals/
- jsdom verdict: PARTIAL in the audit (jsdom only). HTTP 200, 37,905 bytes. Only 5 of 18 controls exercised in jsdom, all responding; after control 5 the page switched views and positions 5 to 17 no longer existed in the DOM.
- jsdom proved: The first 5 controls responded.
- No code fix needed, per `fix-github-partials.md`: the audit gap was the harness itself. The harness types "TEST123" into the search box as its first action, then every DAG selection re-renders the nav through `renderNav` with that filter text, which matches zero DAGs, so the 13 nav buttons vanish from the harness list and positions 5 to 17 were skipped as "gone after re-render". The page was never broken. No file changed, nothing pushed. index.html MD5 unchanged 653a142e6d5b7a9ac2e33892c4fb0526, live HTTP 200. Full re-probe, staged and live identical, 12/12 checks: all 13 nav buttons select their DAG (13/13); all 13 grid cards jump to their DAG (13/13); Play marks step 1 active ("Step 1 / 18, FOUNDER INTENT" on DAG A); Reset clears all active and done steps; Next DAG moves A to B; Prev DAG moves B back to A; Prev DAG wraps A to N; typing "court" in search filters the nav to 2 matching DAGs and clearing the search restores all 13 nav buttons. No load errors. 0 dead. No Node test suite exists for this demo.
- Browser steps: L1. Leave the search box EMPTY while testing navigation (do not type TEST123 or any filter text before the nav checks; that is what poisoned the audit run). Click each of the 13 DAG nav buttons in turn (DAGs A to I, K, L, M, N) and confirm the panel head changes to that DAG each time. Click each of the 13 grid cards and confirm the panel jumps to that DAG. Click Play and confirm step 1 becomes active. Click Reset and confirm all active and done steps clear. Click Next DAG from A and confirm the panel moves to B, then Prev DAG and confirm it moves back to A. From A, click Prev DAG and confirm it wraps to N. Then type "court" in the search box and confirm the nav filters to 2 matching DAGs; clear the search and confirm all 13 nav buttons return.
- jsdom could not verify: real-browser rendering of the graph panels at full size.

## Batch 6: GitHub E-series working (priority 4, spot check)

Spot-check template for this batch: L1, load each sample (A, B, C) and confirm outputs update, change one input by hand and confirm the calc updates, C1 for the named copy/download/print controls, V1 Verify chain. One realistic edit per page (a rent, a price, a rate) is enough; do not re-run the full 100-plus control sweep.

### e3-rental-brrrr (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/e3-rental-brrrr/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 79,551 bytes. 92 controls exercised, no genuine dead controls.
- jsdom proved: All 92 controls responded. Verify chain responded in the verify pass.
- Browser steps: Spot-check template. C1: Copy share link, Copy receipt JSON, Download receipt JSON, Print.
- jsdom could not verify: real clipboard writes, downloaded file contents, print dialog.

### e5-commercial (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/e5-commercial/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 91,833 bytes. 122 of 124 controls exercised (2 disabled, skipped), no genuine dead controls. Note: this is the GitHub copy, whose collectState uses a FIELD_IDS allowlist that does not contain shareUrl, so it does not carry the self-serialization defect. Do not confuse with the Cloudflare e5, which was BROKEN and fixed (Batch 3).
- jsdom proved: All 122 controls responded. Verify chain responded in the verify pass.
- Browser steps: Spot-check template. C1: Download receipt JSON, Print, Download chain JSON.
- jsdom could not verify: real clipboard writes, downloaded file contents, print dialog.

### e6-self-storage (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/e6-self-storage/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 88,703 bytes. 125 controls exercised, no genuine dead controls.
- jsdom proved: All 125 controls responded. Verify chain responded in the verify pass.
- Browser steps: Spot-check template. C1: Download receipt JSON, Print.
- jsdom could not verify: downloaded file contents, print dialog.

### e7-mobile-home-park (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/e7-mobile-home-park/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 92,142 bytes. 102 controls exercised, no genuine dead controls. Clear all was dead in the sequential run but proven working in an isolated probe.
- jsdom proved: All 102 controls responded. Verify chain responded in the verify pass.
- Browser steps: Spot-check template, plus click Clear all and confirm fields blank. C1: Copy receipt JSON, Download receipt JSON, Copy system prompt, Print.
- jsdom could not verify: real clipboard writes, downloaded file contents, print dialog.

### e9-creative-finance (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/e9-creative-finance/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 74,542 bytes. 85 controls exercised, no genuine dead controls. The five kill checkboxes (k_neg_cf, k_neg_equity, k_strike, k_balloon, k_ask_arv) were dead in the sequential run but proven working in an isolated probe; they are auto-checked computed outputs, so clicking one does not stick because the calc re-derives it.
- jsdom proved: All 85 controls responded. Verify chain responded in the verify pass.
- Browser steps: Spot-check template. Change an input so a kill condition flips and confirm the matching kill checkbox checks itself. C1: Copy receipt JSON, Download receipt JSON, Copy system prompt, Print, Copy chain JSON, Download chain JSON.
- jsdom could not verify: real clipboard writes, downloaded file contents, print dialog.

### e12-tax-sale-auction (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/e12-tax-sale-auction/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 87,739 bytes. 87 controls exercised, no genuine dead controls. Kill checkboxes k_title and k_maxbid were dead in the sequential run but proven working in an isolated probe; they are auto-checked computed outputs.
- jsdom proved: All 87 controls responded. Verify chain responded in the verify pass.
- Browser steps: Spot-check template. Change an input so a kill condition flips and confirm the matching kill checkbox checks itself. C1: Download receipt JSON, Print, Download chain JSON.
- jsdom could not verify: downloaded file contents, print dialog.

## Batch 7: Cloudflare E-series working + underwriting engines (priority 4, spot check)

Spot-check template for this batch: L1, load each sample and confirm outputs update, change one input by hand and confirm the calc updates, C1 for the named print controls, V1 Verify chain where the page has one. The Cloudflare E-series pages share one note: jsdom reported `Not implemented: navigation (except hash changes)` on download/copy handlers, which is a jsdom gap, not a page defect; the browser tap is what settles those controls.

### e3-rental-brrrr (Cloudflare Pages)

- URL: https://e3-rental-brrrr.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 69,011 bytes. 86 controls exercised, 86 responded.
- jsdom proved: All 86 controls responded. Print handler ran clean with no visible DOM change (expected: print is a jsdom stub).
- Browser steps: Spot-check template. C1: Print (confirm the print dialog opens).
- jsdom could not verify: print dialog, download contents.

### e4-development-feasibility (Cloudflare Pages)

- URL: https://e4-development-feasibility.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 65,404 bytes. 72 controls exercised, 72 responded. Do not confuse with the GitHub e4, which is now FIXED (Batch 4).
- jsdom proved: All 72 controls responded. Print and Print summary handlers ran clean with no visible DOM change (expected: print is a jsdom stub).
- Browser steps: Spot-check template. C1: Print, Print summary.
- jsdom could not verify: print dialogs, download contents.

### e6-self-storage (Cloudflare Pages)

- URL: https://e6-self-storage.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 73,009 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded. Clear all and Print handlers ran clean with no visible DOM change.
- Browser steps: Spot-check template, plus click Clear all and confirm fields blank. C1: Print.
- jsdom could not verify: print dialog, download contents.

### e7-mobile-home-park (Cloudflare Pages)

- URL: https://e7-mobile-home-park.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 77,303 bytes. 96 controls exercised, 96 responded.
- jsdom proved: All 96 controls responded. Clear all and Print handlers ran clean with no visible DOM change.
- Browser steps: Spot-check template, plus click Clear all and confirm fields blank. C1: Print.
- jsdom could not verify: print dialog, download contents.

### e8-distressed-title (Cloudflare Pages)

- URL: https://e8-distressed-title.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 68,746 bytes. 106 controls exercised, 106 responded. Do not confuse with the GitHub e8, which had a kill-box fix (Batch 4); no fix was reported for this Cloudflare copy.
- jsdom proved: All 106 controls responded. Print handler ran clean with no visible DOM change.
- Browser steps: Spot-check template. C1: Print.
- jsdom could not verify: print dialog, download contents.

### e9-creative-finance (Cloudflare Pages)

- URL: https://e9-creative-finance.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 69,203 bytes. 78 controls exercised, 78 responded.
- jsdom proved: All 78 controls responded. Print handler ran clean with no visible DOM change.
- Browser steps: Spot-check template. C1: Print.
- jsdom could not verify: print dialog, download contents.

### e11-agricultural-timber (Cloudflare Pages)

- URL: https://e11-agricultural-timber.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 84,539 bytes. 114 controls exercised, 114 responded. Do not confuse with the GitHub e11, which had kill-box and stale-row fixes (Batch 4); no fix was reported for this Cloudflare copy.
- jsdom proved: All 114 controls responded. Print and Print summary handlers ran clean with no visible DOM change.
- Browser steps: Spot-check template. C1: Print, Print summary.
- jsdom could not verify: print dialogs, download contents.

### e12-tax-sale-auction (Cloudflare Pages)

- URL: https://e12-tax-sale-auction.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 73,954 bytes. 80 controls exercised, 80 responded.
- jsdom proved: All 80 controls responded. Print handler ran clean with no visible DOM change.
- Browser steps: Spot-check template. C1: Print.
- jsdom could not verify: print dialog, download contents.

### residential-underwriting-engine (Cloudflare Pages)

- URL: https://residential-underwriting-engine.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 57,919 bytes. 76 controls exercised, 76 responded.
- jsdom proved: All 76 controls responded. Print and Print summary handlers ran clean with no visible DOM change.
- Browser steps: Spot-check template. C1: Print, Print summary.
- jsdom could not verify: print dialogs, download contents.

### land-zoning-unlock-engine (Cloudflare Pages)

- URL: https://land-zoning-unlock-engine.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 76,996 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded. Clear all and Print handlers ran clean with no visible DOM change.
- Browser steps: Spot-check template, plus click Clear all and confirm fields blank. C1: Print.
- jsdom could not verify: print dialog, download contents.

## Batch 8: Cloudflare real-estate and product (priority 4, spot check)

Spot-check template for this batch: L1, click the named controls and confirm a visible change, run the named walkthrough or simulator, C1 where a copy/download control is named.

### real-estate-agent-c03 (Cloudflare Pages)

- URL: https://real-estate-agent-c03.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 37,076 bytes. 17 controls exercised, 17 responded.
- jsdom proved: All 17 controls responded. Headings: mission intake, agent router, run simulator, module registry (18 modules).
- Browser steps: L1. Run the simulator (S1), open the module registry and confirm all 18 modules list, step through mission intake.
- jsdom could not verify: real rendering of the simulator output.

### lead-gen-console (Cloudflare Pages)

- URL: https://lead-gen-console.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 70,449 bytes. 73 controls exercised, 71 responded.
- jsdom proved: Recipe explorer, hunt runner, 6071b7ad replay, DeedSonar sync simulator all responded. "All 30" showed no change because it is the already-active filter; "Step" showed no change within the 400 ms wait when clicked before any hunt was selected (it runs stepOnce asynchronously, gated on a selected hunt).
- Browser steps: L1. Select a hunt first, then click Step and confirm it advances. Click the Run button and confirm the hunt runs. Click a sibling recipe filter and confirm the list changes. Confirm the 6071b7ad replay and the DeedSonar sync simulator render.
- jsdom could not verify: async step timing in a real browser.

### estate-inventory (Cloudflare Pages)

- URL: https://estate-inventory.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 57,478 bytes. 33 controls exercised, 33 responded.
- jsdom proved: All 33 controls responded. Check completeness handler ran clean with no visible DOM change (idempotent or precomputed).
- Browser steps: L1. Click Check completeness and confirm it reports a result. Open each inventory section and confirm the lists render.
- jsdom could not verify: real rendering of the inventory tables.

### sreic-blueprint (Cloudflare Pages)

- URL: https://sreic-blueprint.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 106,723 bytes. 69 controls exercised, 69 responded.
- jsdom proved: All 69 controls responded, including the explorers, Figures 1 to 4 (SVG), the OpportunityCase workbench, and the try-it walkthrough. Back and Refresh link from current state ran clean with no visible DOM change.
- Browser steps: L1. Confirm Figures 1 to 4 render as diagrams (not broken images). Run the try-it walkthrough end to end. Click Back and Refresh link from current state and confirm each does something sensible.
- jsdom could not verify: real SVG rendering at full size.

### estate-audit-2026 (Cloudflare Pages)

- URL: https://estate-audit-2026.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 101,146 bytes. 29 controls exercised, 29 responded.
- jsdom proved: All 29 controls responded. Previous handler ran clean with no visible DOM change.
- Browser steps: L1. Click Previous and Next through the audit sections and confirm each step changes. Confirm the Supabase and local host state sections render.
- jsdom could not verify: real rendering of the long audit document.

### deedsonar-forensic-dossier (Cloudflare Pages)

- URL: https://deedsonar-forensic-dossier.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 111,927 bytes. 35 controls exercised, 35 responded.
- jsdom proved: All 35 controls responded. Previous step handler ran clean with no visible DOM change.
- Browser steps: L1. Step through the dossier sections, confirm the timeline and headline figures render. Click Previous step and confirm it moves back.
- jsdom could not verify: real rendering of the long dossier document.

### deedsonar-buyer-demo (Cloudflare Pages)

- URL: https://deedsonar-buyer-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 32,827 bytes. 26 controls exercised, 26 responded.
- jsdom proved: All 26 controls responded, including the try-it walkthrough, sample loaders, and lead intake form.
- Browser steps: L1. Run the try-it walkthrough. Load a sample, fill the lead intake form with a test name and email, submit, and confirm the form responds. Confirm the document-control header renders.
- jsdom could not verify: real form submission behavior (no backend is expected; confirm what the page itself does on submit).

### landos-buyer-walkthrough (Cloudflare Pages)

- URL: https://landos-buyer-walkthrough.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 30,411 bytes. 15 controls exercised, 15 responded.
- jsdom proved: All 15 controls responded. Step handler ran clean with no visible DOM change.
- Browser steps: L1. Walk the walkthrough step by step and confirm each step advances the content. Confirm the provenance receipts section renders.
- jsdom could not verify: real step animation timing.

### recipe-system-demo (Cloudflare Pages)

- URL: https://recipe-system-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 37,955 bytes. 100 controls exercised, 99 responded.
- jsdom proved: Recipe picker, active hunt recipes, worked scoring run, signal value computation all responded. "All 30" showed no change because it is the already-active filter; sibling filters responded.
- Browser steps: L1. Pick 3 different recipe families and confirm each shows its recipe. Run the worked scoring run and confirm the score appears. Click a sibling filter and confirm the list changes.
- jsdom could not verify: real rendering of the recipe picker.

### sitegrid-ckr (Cloudflare Pages)

- URL: https://sitegrid-ckr.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 78,595 bytes. 56 controls exercised, 56 responded.
- jsdom proved: All 56 controls responded, including the Site Viability Analyzer, Agent Prompt Stack Explorer, and System Diagram. Atlas handler ran clean with no visible DOM change.
- Browser steps: L1. Run the Site Viability Analyzer with a test input and confirm a result. Open the Prompt Stack Explorer and the System Diagram and confirm each renders. Click Atlas and confirm it responds.
- jsdom could not verify: real rendering of the system diagram.

## Batch 9: Cloudflare JGI workbenches (priority 4, spot check)

Spot-check template for this batch: L1, click the named calculator or tool buttons and confirm a result appears, click Reset and confirm fields reset, open 2 or 3 content sections and confirm they render.

### jgi-economics-workbench (Cloudflare Pages)

- URL: https://jgi-economics-workbench.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 41,053 bytes. 107 controls exercised, 107 responded.
- jsdom proved: All 107 controls responded. Compute VOI, Optimize portfolio, Compute retry value, Compute option value, Compute value density, and 5 Reset sample buttons ran clean with no visible DOM change (idempotent or precomputed).
- Browser steps: L1. Click Compute VOI and confirm a value appears. Click Optimize portfolio and confirm a result. Click one Reset sample and confirm the sample resets.
- jsdom could not verify: real numeric output rendering.

### jgi-calibration-lab (Cloudflare Pages)

- URL: https://jgi-calibration-lab.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 30,597 bytes. 50 controls exercised, 50 responded.
- jsdom proved: All 50 controls responded.
- Browser steps: L1. Run the hypothesis engine and the counterfactual engine with a test input and confirm each returns a result. Open 2 sections and confirm they render.
- jsdom could not verify: real rendering of the lab panels.

### jgi-memory-workbench (Cloudflare Pages)

- URL: https://jgi-memory-workbench.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 31,978 bytes. 86 controls exercised, 86 responded.
- jsdom proved: All 86 controls responded.
- Browser steps: L1. Open the memory write gate, decay, and consolidation sections. Run one memory tool and confirm it responds.
- jsdom could not verify: real rendering of the workbench.

### jgi-organization-compiler (Cloudflare Pages)

- URL: https://jgi-organization-compiler.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 49,308 bytes. 60 controls exercised, 60 responded.
- jsdom proved: All 60 controls responded.
- Browser steps: L1. Run one compiler tool with a test input and confirm output appears. Open 2 sections and confirm they render.
- jsdom could not verify: real rendering of the compiler output.

### jgi-sentinel-court (Cloudflare Pages)

- URL: https://jgi-sentinel-court.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 42,453 bytes. 60 controls exercised, 60 responded.
- jsdom proved: All 60 controls responded.
- Browser steps: L1. Open the failure classifier and autonomous debugging sections. Run one court tool and confirm it responds.
- jsdom could not verify: real rendering of the court panels.

### jgi-founder-interface (Cloudflare Pages)

- URL: https://jgi-founder-interface.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 34,046 bytes. 48 controls exercised, 48 responded.
- jsdom proved: All 48 controls responded. Build packet and Reset ran clean with no visible DOM change.
- Browser steps: L1. Click Build packet and confirm a packet is built or shown. Click Reset and confirm fields reset. Open the attention firewall and mobile decision packet sections.
- jsdom could not verify: real packet rendering.

### jgi-autonomy-lab (Cloudflare Pages)

- URL: https://jgi-autonomy-lab.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 40,070 bytes. 96 controls exercised, 96 responded.
- jsdom proved: All 96 controls responded. Two Reset buttons and Score ran clean with no visible DOM change.
- Browser steps: L1. Click Score and confirm a score appears. Click Reset and confirm fields reset. Open the self-model and capability gap sections.
- jsdom could not verify: real score rendering.

### jgi-ops-console (Cloudflare Pages)

- URL: https://jgi-ops-console.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 49,993 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded. Detect loop, Sample: clean loop, and Compare ran clean with no visible DOM change.
- Browser steps: L1. Click Detect loop, then Sample: clean loop, then Compare, and confirm each shows a result. Open 2 console sections.
- jsdom could not verify: real console output rendering.

### jgi-opportunity-workbench (Cloudflare Pages)

- URL: https://jgi-opportunity-workbench.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 53,152 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded. Score analogy, Reset, Check surprise, Score curiosity ran clean with no visible DOM change.
- Browser steps: L1. Click Score analogy and confirm a score appears. Click Check surprise and Score curiosity and confirm each returns a result. Click Reset and confirm fields reset.
- jsdom could not verify: real score rendering.

### jgi-command-language (Cloudflare Pages)

- URL: https://jgi-command-language.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 38,508 bytes. 79 controls exercised, 79 responded.
- jsdom proved: All 79 controls responded. Parse command, Mark all verified, Balance the load ran clean with no visible DOM change.
- Browser steps: L1. Type a test command and click Parse command, confirm the parse appears. Click Mark all verified and Balance the load and confirm each responds.
- jsdom could not verify: real parse output rendering.

## Batch 10: Cloudflare frameworks and papers (priority 4, spot check)

Spot-check template for this batch: L1, click the named calculator or tool buttons and confirm a result, open 2 or 3 content sections, C1 where a copy control is named.

### ncell-position-paper (Cloudflare Pages)

- URL: https://ncell-position-paper.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 56,353 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded.
- Browser steps: L1. Scroll through the paper, confirm the abstract, problem statement, and sections render. Click 3 in-page nav links and confirm each jumps to the right section.
- jsdom could not verify: real document rendering at full size.

### ncell-worked-example (Cloudflare Pages)

- URL: https://ncell-worked-example.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 44,162 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded, including the multi-step run and governance playground.
- Browser steps: L1. Run the multi-step worked example (OPP-2026-RE-0042) end to end and confirm each step updates. Open the governance playground and confirm it responds.
- jsdom could not verify: real rendering of the worked example.

### clearpath-formula (Cloudflare Pages)

- URL: https://clearpath-formula.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 42,987 bytes. 78 controls exercised, 78 responded.
- jsdom proved: All 78 controls responded. Calculate CPV, Reset levers, Compare scenarios ran clean with no visible DOM change.
- Browser steps: L1. Move a lever, click Calculate CPV, confirm a value appears. Click Compare scenarios and confirm the comparison shows. Click Reset levers and confirm the levers reset.
- jsdom could not verify: real calculator output rendering.

### clearpath-value-system (Cloudflare Pages)

- URL: https://clearpath-value-system.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 36,365 bytes. 58 controls exercised, 58 responded.
- jsdom proved: All 58 controls responded.
- Browser steps: L1. Open 3 sections (purpose, foundational beliefs, framework structure) and confirm each renders. Click the section nav and confirm it jumps.
- jsdom could not verify: real document rendering.

### invisible-physics-of-genius (Cloudflare Pages)

- URL: https://invisible-physics-of-genius.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 39,283 bytes. 42 controls exercised, 42 responded.
- jsdom proved: All 42 controls responded. Reset HASI, Truth 1: Frozen Light, Reset self-check ran clean with no visible DOM change.
- Browser steps: L1. Click Truth 1: Frozen Light and confirm the takeaway shows. Run the self-check, click Reset self-check, confirm it resets. Click Reset HASI and confirm it responds.
- jsdom could not verify: real rendering of the takeaways.

### neuruh-constitution (Cloudflare Pages)

- URL: https://neuruh-constitution.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 38,593 bytes. 64 controls exercised, 64 responded.
- jsdom proved: All 64 controls responded. Copy receipt JSON handler ran clean with no visible DOM change.
- Browser steps: L1. Open the executive summary and 2 chapters and confirm each renders. C1: click Copy receipt JSON, paste into a scratch field, confirm the receipt JSON arrived.
- jsdom could not verify: real clipboard write.

### liability-layer (Cloudflare Pages)

- URL: https://liability-layer.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 37,660 bytes. 31 controls exercised, 31 responded.
- jsdom proved: All 31 controls responded.
- Browser steps: L1. Open 3 sections (the blind spot, the insured action protocol, the governance moat) and confirm each renders.
- jsdom could not verify: real document rendering.

### personal-executive-agent (Cloudflare Pages)

- URL: https://personal-executive-agent.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 52,235 bytes. 56 controls exercised, 56 responded.
- jsdom proved: All 56 controls responded. Check all and Mark all done ran clean with no visible DOM change.
- Browser steps: L1. Click Check all, confirm items check. Click Mark all done, confirm the state changes. Open 2 chapters and confirm each renders.
- jsdom could not verify: real checklist rendering.

### advanced-agent-template (Cloudflare Pages)

- URL: https://advanced-agent-template.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 127,212 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded, including the v1/v2/v3 version switcher. The v1 full button ran clean with no visible DOM change (already active).
- Browser steps: L1. Switch versions v1, v2, v3 in turn and confirm the content changes each time. Open the JSON spec section and confirm it renders.
- jsdom could not verify: real version-switch rendering.

### atomic-ai-agent (Cloudflare Pages)

- URL: https://atomic-ai-agent.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 90,681 bytes. 112 controls exercised, 112 responded.
- jsdom proved: All 112 controls responded. Generate spec and Run the check ran clean with no visible DOM change.
- Browser steps: L1. Click Generate spec and confirm a spec appears. Click Run the check and confirm a result. Open the eight-modes spec section and confirm it renders.
- jsdom could not verify: real spec output rendering.

### modular-ai-research-agent (Cloudflare Pages)

- URL: https://modular-ai-research-agent.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 87,002 bytes. 51 controls exercised, 51 responded.
- jsdom proved: All 51 controls responded. Mark all in place ran clean with no visible DOM change.
- Browser steps: L1. Click Mark all in place and confirm the state changes. Open the architecture overview and 2 module sections and confirm each renders.
- jsdom could not verify: real document rendering.

## Batch 11: Cloudflare live demos A (priority 4, spot check)

Spot-check template for this batch: L1, run the named demo control or presenter flow, click 2 or 3 section controls, confirm each responds. Note: the EPROTO TLS errors jsdom logged on organism-live-demo, ontology-live-demo, and self-compounding-knowledge-engine are jsdom sandbox failures fetching Google Fonts CSS, not page JS; in the browser, confirm the fonts load and the typography looks right.

### swarm-live-demo (Cloudflare Pages)

- URL: https://swarm-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 35,069 bytes. 75 controls exercised, 75 responded.
- jsdom proved: All 75 controls responded, including the swarm console and presenter script.
- Browser steps: L1. Run the swarm console demo and confirm it responds. Read the 60-second presenter script section and confirm it renders.
- jsdom could not verify: real console animation.

### organism-live-demo (Cloudflare Pages)

- URL: https://organism-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 30,720 bytes. 22 controls exercised, 21 responded.
- jsdom proved: The 11 Launch live demo buttons responded in the v3 pass. "All demos" showed no change because it is the already-active filter; the other filter buttons responded. EPROTO TLS error on Google Fonts fetch is a jsdom sandbox failure, not page JS.
- Browser steps: L1, confirm fonts render correctly. Click a category filter other than All and confirm the list filters, then click All demos and confirm the full list returns. Click 2 Launch live demo buttons and confirm each demo renders.
- jsdom could not verify: real font loading, real demo launch rendering.

### ontology-live-demo (Cloudflare Pages)

- URL: https://ontology-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 74,850 bytes. 35 controls exercised, 35 responded. EPROTO TLS error on Google Fonts fetch is a jsdom sandbox failure, not page JS.
- jsdom proved: All 35 controls responded, including run control and the event log.
- Browser steps: L1, confirm fonts render correctly. Run the demo via run control and confirm the event log fills. Open the World Landing Protocol section and confirm it renders.
- jsdom could not verify: real font loading, real event-log animation.

### adaptive-intelligence-live-demo (Cloudflare Pages)

- URL: https://adaptive-intelligence-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 73,674 bytes. 47 controls exercised, 47 responded.
- jsdom proved: All 47 controls responded. Snapshot: BEFORE ran clean with no visible DOM change.
- Browser steps: L1. Run the adaptive intelligence cycle and confirm it advances. Click Snapshot: BEFORE and confirm a snapshot appears. Open the polarity phase space and LCDE sections.
- jsdom could not verify: real cycle animation.

### blueprint-live-demo (Cloudflare Pages)

- URL: https://blueprint-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 84,816 bytes. 99 controls exercised, 99 responded.
- jsdom proved: All 99 controls responded, including Figure 1, the gap register, and the polarity model.
- Browser steps: L1. Confirm Figure 1 renders as a diagram. Open the gap register and the capability tensor sections and confirm each renders. Run one interactive control in the polarity model.
- jsdom could not verify: real figure rendering at full size.

### case-zero-live-demo (Cloudflare Pages)

- URL: https://case-zero-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 71,561 bytes. 72 controls exercised, 72 responded.
- jsdom proved: All 72 controls responded, including Figure 1, the evidence stack, and the temporal epochs.
- Browser steps: L1. Confirm Figure 1 renders. Open the evidence stack (L0-L7) and the cutoff adjudication sections and confirm each renders. Run one interactive control.
- jsdom could not verify: real figure rendering at full size.

### thread-ledger-live-demo (Cloudflare Pages)

- URL: https://thread-ledger-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 29,680 bytes. 11 controls exercised, 11 responded.
- jsdom proved: All 11 controls responded.
- Browser steps: L1. Open the chronological stages, the decision ledger (D-001 to D-020), and the contradiction ledger, confirming each renders.
- jsdom could not verify: real document rendering.

### polarity-theory-live-demo (Cloudflare Pages)

- URL: https://polarity-theory-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 29,230 bytes. 29 controls exercised, 29 responded.
- jsdom proved: All 29 controls responded, including the productive polarity laboratory and the emergence qualification criteria.
- Browser steps: L1. Run one experiment in the polarity laboratory and confirm a result. Open the axioms section and confirm each axiom renders with its falsifier.
- jsdom could not verify: real laboratory output rendering.

### neural-core-live-demo (Cloudflare Pages)

- URL: https://neural-core-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 31,390 bytes. 47 controls exercised, 47 responded.
- jsdom proved: All 47 controls responded, including the memory model, ingestion steps, and packet builder.
- Browser steps: L1. Run the packet builder with a test input and confirm a packet appears. Open the ingestion (11 steps) and retrieval sections.
- jsdom could not verify: real packet output rendering.

### crucible-live-demo (Cloudflare Pages)

- URL: https://crucible-live-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 34,954 bytes. 22 controls exercised, 22 responded.
- jsdom proved: All 22 controls responded, including the four smoke tests, the hash-chained ledger, and the live map feed.
- Browser steps: L1. Run the four smoke tests and confirm each reports a result. Confirm the ledger shows hash-chained entries. V1: run the verify flow if the page exposes one and confirm VALID.
- jsdom could not verify: real ledger rendering, real map feed updates.

## Batch 12: Cloudflare misc tools (priority 4, spot check)

Spot-check template for this batch: L1, run the named tool or walkthrough, click 2 or 3 section controls, C1 where a download control is named.

### osint-observe-act-demo (Cloudflare Pages)

- URL: https://osint-observe-act-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 31,751 bytes. 3 controls exercised, 3 responded. EPROTO TLS error on Google Fonts fetch is a jsdom sandbox failure, not page JS.
- jsdom proved: All 3 controls responded. Step handler ran clean with no visible DOM change.
- Browser steps: L1, confirm fonts render correctly. Click Step through the mission end to end and confirm each step advances.
- jsdom could not verify: real font loading, real step animation.

### public-commons-chain-demo (Cloudflare Pages)

- URL: https://public-commons-chain-demo.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 27,829 bytes. 9 controls exercised, 9 responded.
- jsdom proved: All 9 controls responded, including the mission picker, policy gate simulator, and hash-chained receipt log.
- Browser steps: L1. Pick a synthetic mission, run the policy gate simulator, confirm a receipt appears in the log. V1: verify the receipt chain if the page exposes it.
- jsdom could not verify: real receipt-log rendering.

### modular-agentic-cockpit (Cloudflare Pages)

- URL: https://modular-agentic-cockpit.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 65,026 bytes. 86 controls exercised, 85 responded.
- jsdom proved: 85 of 86 responded. "All" chip showed no change because it is the already-active filter; sibling category chips responded.
- Browser steps: L1. Click 3 category chips other than All and confirm the cockpit view changes each time. Open 2 architecture layers and confirm each renders.
- jsdom could not verify: real cockpit rendering.

### conceptual-lexicon (Cloudflare Pages)

- URL: https://conceptual-lexicon.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 64,549 bytes. 83 controls exercised, 83 responded. jsdom reported `Not implemented: navigation (except hash changes)` on one handler, a jsdom gap, not a page defect.
- jsdom proved: All 83 controls responded, including number lookup and the full lexicon (1 to 143). Replace word at 130 ran clean with no visible DOM change.
- Browser steps: L1. Look up a number (for example 130) and confirm its entry shows. Open the pattern analysis section. Click Replace word at 130 and confirm it responds.
- jsdom could not verify: real lookup rendering.

### intent-preservation-protocol (Cloudflare Pages)

- URL: https://intent-preservation-protocol.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 95,029 bytes. 117 controls exercised, 117 responded.
- jsdom proved: All 117 controls responded. Phase 1 (0 percent), Reset all to 80, Week 1 ran clean with no visible DOM change.
- Browser steps: L1. Open the problem and core philosophy sections. Click Phase 1 and confirm it advances. Click Reset all to 80 and confirm the values reset.
- jsdom could not verify: real protocol rendering.

### token-swap-studio (Cloudflare Pages)

- URL: https://token-swap-studio.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 54,871 bytes. 76 controls exercised, 76 responded.
- jsdom proved: All 76 controls responded. P1 Aerial Overview, None (template default), Golden hour, Landscape showcase ran clean with no visible DOM change (already-active defaults).
- Browser steps: L1. Pick a template other than the default and confirm the preview changes. Pick a different lighting option and confirm the preview changes. Confirm the full template renders.
- jsdom could not verify: real preview rendering.

### card-id-system (Cloudflare Pages)

- URL: https://card-id-system.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 47,803 bytes. 49 controls exercised, 49 responded.
- jsdom proved: All 49 controls responded, including the CardTraits schema, intelligence engine, and FeatureCard display.
- Browser steps: L1. Open the schema, engine, and FeatureCard sections and confirm each renders. Run one identification flow if the page exposes it.
- jsdom could not verify: real FeatureCard rendering.

### qeca (Cloudflare Pages)

- URL: https://qeca.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 36,395 bytes. 47 controls exercised, 47 responded.
- jsdom proved: All 47 controls responded, including the seven equations recomputed and the defense impact sections.
- Browser steps: L1. Confirm the seven equations render with recomputed values. Open the defense impact and DARPA sections.
- jsdom could not verify: real equation rendering.

### genealogy-research-agent (Cloudflare Pages)

- URL: https://genealogy-research-agent.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 80,863 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded, including the enhanced and standard prompt template builders and the worked examples.
- Browser steps: L1. Build one prompt in the enhanced template builder and confirm output appears. Open a worked example (brick wall or DNA match) and confirm it renders.
- jsdom could not verify: real prompt-builder output.

### clarity-builder (Cloudflare Pages)

- URL: https://clarity-builder.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 23,177 bytes. 23 controls exercised, 23 responded.
- jsdom proved: All 23 controls responded. Phase 1 and Print packet ran clean with no visible DOM change.
- Browser steps: L1. Walk the 6-phase walkthrough and confirm each phase advances. C1: click Print packet and confirm the print dialog opens.
- jsdom could not verify: print dialog.

## Batch 13: Cloudflare engines and codexes (priority 4, spot check)

Spot-check template for this batch: L1, run the named calculator or tool, click 2 or 3 section controls, C1 where a download or share-link control is named. Note: the EPROTO TLS errors jsdom logged on lenduruh and self-compounding-knowledge-engine are jsdom sandbox failures fetching Google Fonts CSS, not page JS; in the browser, confirm the fonts load.

### aias-deployment-blueprint (Cloudflare Pages)

- URL: https://aias-deployment-blueprint.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 52,860 bytes. 19 controls exercised, 19 responded.
- jsdom proved: All 19 controls responded. Expanded Version, Expanded (v1), RECON Stack, Phase 4: Legacy Intelligence ran clean with no visible DOM change (already-active selections).
- Browser steps: L1. Open Documents 1, 2, 3, and the executive summary in turn and confirm each renders. Open the v1 vs v2 vs Global comparison.
- jsdom could not verify: real document rendering.

### creator-economy-djd (Cloudflare Pages)

- URL: https://creator-economy-djd.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 98,409 bytes. 93 controls exercised, 93 responded. This is the correct URL with the -djd suffix; the plain creator-economy.pages.dev belongs to an unrelated page.
- jsdom proved: All 93 controls responded, including the duplication map and working tools. One tab section 1, Direct sales, GTA Streamers ran clean with no visible DOM change (already-active selections).
- Browser steps: L1. Open the duplication map and confirm it renders. Run one working tool and confirm output. Click a different tab and confirm the content changes.
- jsdom could not verify: real tool output rendering.

### self-compounding-knowledge-engine (Cloudflare Pages)

- URL: https://self-compounding-knowledge-engine.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 46,096 bytes. 16 controls exercised, 15 responded. EPROTO TLS error on Google Fonts fetch is a jsdom sandbox failure, not page JS.
- jsdom proved: 15 of 16 responded. "1 - Capsule Creation" showed no change because phase 0 is already active at load; the other phase buttons responded. Download Packet works via the download path (jsdom navigation gap noted).
- Browser steps: L1, confirm fonts render correctly. Click phase 2 and phase 3 buttons and confirm the engine view changes. C1: click Download Packet, confirm a file lands in Downloads, open it and confirm it is non-empty.
- jsdom could not verify: real font loading, downloaded file contents.

### super-intelligence-knowledge-framework (Cloudflare Pages)

- URL: https://super-intelligence-knowledge-framework.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 48,913 bytes. 16 controls exercised, 15 responded. EPROTO TLS error on Google Fonts fetch is a jsdom sandbox failure, not page JS.
- jsdom proved: 15 of 16 responded. "Visionary" tone showed no change because it is already active; sibling tones responded.
- Browser steps: L1, confirm fonts render correctly. Click 2 other tones and confirm the content changes. Open the fifteen files list and the execution reasoning engine.
- jsdom could not verify: real font loading.

### sal-content-pipeline (Cloudflare Pages)

- URL: https://sal-content-pipeline.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 42,281 bytes. 16 controls exercised, 16 responded. Do not confuse with the GitHub sal-content-pipeline (Batch 19).
- jsdom proved: All 16 controls responded, including the 13-node hybrid workflow and the pipeline runner.
- Browser steps: L1. Run the pipeline runner simulation and confirm it advances through the nodes. Open the gatekeeper section and confirm it renders.
- jsdom could not verify: real runner animation.

### universal-interfacing-framework (Cloudflare Pages)

- URL: https://universal-interfacing-framework.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 63,808 bytes. 30 controls exercised, 30 responded.
- jsdom proved: All 30 controls responded. Model 1 - Cognitive and Route query ran clean with no visible DOM change.
- Browser steps: L1. Select Model 1 - Cognitive and confirm it shows. Type a test query and click Route query, confirm a route appears. Open the memory map figure and confirm it renders.
- jsdom could not verify: real figure rendering.

### lenduruh (Cloudflare Pages)

- URL: https://lenduruh.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 50,942 bytes. 19 controls exercised, 17 responded. EPROTO TLS error on Google Fonts fetch is a jsdom sandbox failure, not page JS.
- jsdom proved: 17 of 19 responded. Balanced (document weights) and 1 - Identity and Entity showed no change because both are the already-active option at load; sibling presets and steps responded.
- Browser steps: L1, confirm fonts render correctly. Click a different underwriting preset and confirm the grid changes. Step the wizard to step 2 and confirm it advances. Open the regulatory overlay engine.
- jsdom could not verify: real font loading, real wizard rendering.

### local-ai-estate-codex (Cloudflare Pages)

- URL: https://local-ai-estate-codex.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 58,224 bytes. 80 controls exercised, 80 responded.
- jsdom proved: All 80 controls responded. All axes, Update completeness, Previous step ran clean with no visible DOM change.
- Browser steps: L1. Open the mandate, taxonomy, and topology sections. Click Update completeness and confirm the meter updates. Click All axes and confirm the view changes.
- jsdom could not verify: real codex rendering.

### ecosystem-codex (Cloudflare Pages)

- URL: https://ecosystem-codex.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 87,140 bytes. 25 controls exercised, 25 responded.
- jsdom proved: All 25 controls responded. Load: Full estate (28 components) ran clean with no visible DOM change.
- Browser steps: L1. Click Load: Full estate (28 components) and confirm all 28 components list. Open the systems explorer (Appendix A) and confirm it renders.
- jsdom could not verify: real explorer rendering.

### canonical-receipt-index (Cloudflare Pages)

- URL: https://canonical-receipt-index.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 48,968 bytes. 20 controls exercised, 20 responded.
- jsdom proved: All 20 controls responded. Calculate rates, Reset to source counts, Recalculate completeness, Update share link ran clean with no visible DOM change.
- Browser steps: L1. Click Calculate rates and confirm rates appear. Click Recalculate completeness and confirm the meter updates. C1: click Update share link, confirm the link field updates, copy it and confirm it loads.
- jsdom could not verify: real clipboard write, real meter rendering.

### forensic-recovery-dossier (Cloudflare Pages)

- URL: https://forensic-recovery-dossier.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 70,071 bytes. 76 controls exercised, 76 responded.
- jsdom proved: All 76 controls responded. Compute parity, Load public, Compute match rate, Compute config shortfall, Compute identity coverage, Compute estate total, Recalculate completeness, Previous step ran clean with no visible DOM change.
- Browser steps: L1. Click Compute parity and Compute match rate and confirm each shows a result. Click Load public and confirm the view changes. Step through the remediation order section.
- jsdom could not verify: real calculator output rendering.

## Batch 14: Cloudflare dossiers and manuals (priority 4, spot check)

Spot-check template for this batch: L1, run the named calculator or tool, open 2 or 3 sections, C1 where a share-link control is named. jsdom reported `Not implemented: navigation (except hash changes)` on impact-edge-tool, a jsdom gap, not a page defect.

### factory-operating-manual (Cloudflare Pages)

- URL: https://factory-operating-manual.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 46,140 bytes. 75 controls exercised, 75 responded.
- jsdom proved: All 75 controls responded. Load sample 2: N-Cell, Load sample 3: Land and Zoning Engine, Compute slices per week ran clean with no visible DOM change.
- Browser steps: L1. Load sample 2 and sample 3 in turn and confirm each loads. Click Compute slices per week and confirm a result. Open the core loop and operating boundaries sections.
- jsdom could not verify: real sample rendering.

### organism-code-bible (Cloudflare Pages)

- URL: https://organism-code-bible.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 105,136 bytes. 79 controls exercised, 79 responded.
- jsdom proved: All 79 controls responded.
- Browser steps: L1. Open Parts I, II, III, and IV in turn and confirm each renders. Click 2 in-page nav links and confirm each jumps.
- jsdom could not verify: real long-document rendering.

### founder-story-bza (Cloudflare Pages)

- URL: https://founder-story-bza.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 38,194 bytes. 72 controls exercised, 72 responded.
- jsdom proved: All 72 controls responded. 1 The struggle season, Select all 25, Calculate catalog runtime, Check slot fit, Show share link ran clean with no visible DOM change.
- Browser steps: L1. Open the timeline explorer and confirm it renders. Click Calculate catalog runtime and confirm a runtime appears. C1: click Show share link, confirm the link appears, copy it and confirm it loads.
- jsdom could not verify: real clipboard write, real timeline rendering.

### case-zero-protocol (Cloudflare Pages)

- URL: https://case-zero-protocol.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 102,705 bytes. 80 controls exercised, 80 responded.
- jsdom proved: All 80 controls responded, including the 8-stage closed loop, the evidence stack, and the temporal epochs.
- Browser steps: L1. Step through the 8-stage closed loop and confirm each stage shows. Open the evidence stack (L0 to L7) and confirm it renders.
- jsdom could not verify: real loop rendering.

### master-convergence-handoff (Cloudflare Pages)

- URL: https://master-convergence-handoff.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 95,936 bytes. 113 controls exercised, 113 responded.
- jsdom proved: All 113 controls responded. All 13 and All ran clean with no visible DOM change (already-active filters).
- Browser steps: L1. Open the executive state map and the truth-precedence sections. Click a filter other than All and confirm the view changes, then click All and confirm the full view returns.
- jsdom could not verify: real handoff rendering.

### p11-tracker (Cloudflare Pages)

- URL: https://p11-tracker.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 47,523 bytes. 72 controls exercised, 72 responded.
- jsdom proved: All 72 controls responded. Generate share link ran clean with no visible DOM change.
- Browser steps: L1. Check off 2 checklist items (ccT18 to ccT26) and confirm the completeness meter moves. C1: click Generate share link, confirm the link appears, copy it and confirm it loads.
- jsdom could not verify: real clipboard write.

### impact-edge-tool (Cloudflare Pages)

- URL: https://impact-edge-tool.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 48,570 bytes. 77 controls exercised, 77 responded. jsdom reported `Not implemented: navigation (except hash changes)` on one handler, a jsdom gap, not a page defect.
- jsdom proved: All 77 controls responded, including the walkthrough and evidence ledger. Recalculate completeness ran clean with no visible DOM change.
- Browser steps: L1. Run the walkthrough and confirm each step advances. Click Recalculate completeness and confirm the meter updates. Open the impact edges section.
- jsdom could not verify: real walkthrough rendering.

### defynal-scorer (Cloudflare Pages)

- URL: https://defynal-scorer.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 33,005 bytes. 36 controls exercised, 36 responded.
- jsdom proved: All 36 controls responded. Calculate Tvalue ran clean with no visible DOM change.
- Browser steps: L1. Score one worked example and confirm the score appears. Click Calculate Tvalue and confirm a value shows. Run the 5-minute walkthrough.
- jsdom could not verify: real score rendering.

### migration-convergence-dossier (Cloudflare Pages)

- URL: https://migration-convergence-dossier.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 78,690 bytes. 31 controls exercised, 31 responded.
- jsdom proved: All 31 controls responded. Compute coverage, Compute ratio, Compute density, Compute expiry ran clean with no visible DOM change.
- Browser steps: L1. Click Compute coverage and Compute ratio and confirm each shows a result. Open the convergence timeline and confirm it renders.
- jsdom could not verify: real calculator output rendering.

### autonomous-execution-dossier (Cloudflare Pages)

- URL: https://autonomous-execution-dossier.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 81,043 bytes. 101 controls exercised, 101 responded.
- jsdom proved: All 101 controls responded. Spine explorer, All gates, L0, Compute rates, Compute pass rates, Compute share, Compute rank score, Compute leverage, Previous ran clean with no visible DOM change.
- Browser steps: L1. Click Spine explorer and confirm the spine shows. Click Compute rates and Compute pass rates and confirm each shows a result. Open Parts I, III, IV, and V in turn.
- jsdom could not verify: real dossier rendering.

## Batch 15: Cloudflare swarm/blueprints + DOC (priority 4 and 5, spot check + DOC)

Spot-check template for this batch: L1, open 2 or 3 sections, run the named calculator or explorer, D1 for jeramie-general-intelligence.

### agent-swarm-domination (Cloudflare Pages)

- URL: https://agent-swarm-domination.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 59,258 bytes. 41 controls exercised, 41 responded.
- jsdom proved: All 41 controls responded, including the legion explorer, US swarm map, and hunt verticals explorer.
- Browser steps: L1. Open the legion explorer and confirm it renders. Open the US swarm map and confirm markers show. Open one hunt vertical and confirm it responds.
- jsdom could not verify: real map rendering.

### swarm-integration-blueprint (Cloudflare Pages)

- URL: https://swarm-integration-blueprint.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 122,196 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded. Founder Copilot, World 1 - Real Estate / SREIC, Acquisition, Load sample: donor capacity audit, NOW, Mission, Load sample: SREIC hunt batch, ActivityFeed, 1. Visual truth court, Load sample: Berrien tax-lien signal ran clean with no visible DOM change (already-active selections or precomputed samples).
- Browser steps: L1. Load the Berrien tax-lien signal sample and confirm it shows. Load the SREIC hunt batch sample and confirm it shows. Open the visual truth court and confirm it renders.
- jsdom could not verify: real sample rendering.

### swarm-architecture-blueprint (Cloudflare Pages)

- URL: https://swarm-architecture-blueprint.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 63,760 bytes. 64 controls exercised, 62 responded.
- jsdom proved: 62 of 64 responded. Atomic Types and Zero Trust Access showed no change and no listener because both are already-active panels at load; sibling panels responded. Legion 1: Signal Legion (800) ran clean with no visible DOM change.
- Browser steps: L1. Click a panel other than Atomic Types and confirm the view changes, then click Atomic Types and confirm it shows. Click Legion 1: Signal Legion (800) and confirm the legion details show. Open the topology explorer and the edge mesh figure.
- jsdom could not verify: real panel rendering.

### uif-pillar-11-drafts (Cloudflare Pages)

- URL: https://uif-pillar-11-drafts.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 71,158 bytes. 92 controls exercised, 92 responded.
- jsdom proved: All 92 controls responded. Calculators, Try-it walkthrough, Completeness meter, How it works, Honest gaps, Calculate DSCR, Calculate deadline, Calculate detention pay ran clean with no visible DOM change.
- Browser steps: L1. Open the pillar article and 2 niche drafts and confirm each renders. Click Calculate DSCR and Calculate deadline and confirm each shows a result. Run the try-it walkthrough.
- jsdom could not verify: real article rendering.

### adaptive-intelligence-atlas (Cloudflare Pages)

- URL: https://adaptive-intelligence-atlas.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 64,806 bytes. 26 controls exercised, 26 responded.
- jsdom proved: All 26 controls responded. All 18 and Refresh completeness ran clean with no visible DOM change.
- Browser steps: L1. Confirm rendered figures 1 to 6 and 7 to 11 display as images or diagrams (not broken). Click All 18 and confirm the full figure list shows. Click Refresh completeness and confirm the meter updates.
- jsdom could not verify: real figure rendering at full size.

### founder-runtime (Cloudflare Pages)

- URL: https://founder-runtime.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 82,690 bytes. 56 controls exercised, 56 responded.
- jsdom proved: All 56 controls responded. Preset: all 5s (expect 3.00) and Verify chain ran clean with no visible DOM change.
- Browser steps: L1. Click Preset: all 5s and confirm the deterministic scorer reads 3.00. Run the scenario pipeline acceptance test and confirm a result. V1: Verify chain.
- jsdom could not verify: real scorer rendering.

### recipe-engine-49 (Cloudflare Pages)

- URL: https://recipe-engine-49.pages.dev/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 173,238 bytes. 120 controls exercised, 120 responded.
- jsdom proved: All 120 controls responded, including Figure 1 (hunter coverage across the 49 ingredients), Figure 2, Figure 3, and the probate record completeness calculator.
- Browser steps: L1. Confirm Figures 1, 2, and 3 render as diagrams. Run the probate record completeness calculator with a test input and confirm a result. Open the ingredient registry and confirm entries list.
- jsdom could not verify: real figure rendering at full size.

### jeramie-general-intelligence (Cloudflare Pages, DOC)

- URL: https://jeramie-general-intelligence.pages.dev/
- jsdom verdict: DOC (jsdom only). HTTP 200, 105,718 bytes. 120 controls exercised, 120 responded; all are in-page nav anchors on a long document page (77,240 chars of body text). No JS errors.
- jsdom proved: Page renders fully with no JS errors; every nav anchor responded.
- Browser steps: D1. Scroll the full document top to bottom and confirm the prime directive, the fundamental autonomous loop, and the system-of-systems sections render. Click 3 contents links and confirm each jumps to the right section. Confirm no section shows a broken layout.
- jsdom could not verify: real long-document rendering and scroll behavior.

## Batch 16: GitHub interactive builds A (priority 4, spot check)

Spot-check template for this batch: L1, click the named primary controls and confirm a visible change, run the named flow, C1 where a print or copy control is named.

### ai-language-agent-master (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/ai-language-agent-master/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 64,840 bytes. 23 controls exercised, no genuine dead controls.
- jsdom proved: All 23 controls responded.
- Browser steps: L1. Click through the build steps in order and confirm each advances the build. Confirm the final output renders.
- jsdom could not verify: real step rendering.

### neuruh-nexus (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/neuruh-nexus/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 59,944 bytes. 24 controls exercised, no genuine dead controls. Build the Compound Strategy was dead in the sequential run but proven working in an isolated probe.
- jsdom proved: All 24 controls responded in the end.
- Browser steps: L1. Click Build the Compound Strategy and confirm the strategy builds. Click the remaining primary controls and confirm each responds.
- jsdom could not verify: real build output rendering.

### agentic-design-compositing (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/agentic-design-compositing/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 72,663 bytes. 31 controls exercised, no genuine dead controls.
- jsdom proved: All 31 controls responded.
- Browser steps: L1. Run the compositing build in order and confirm each stage updates the output. Confirm the final composite renders.
- jsdom could not verify: real composite rendering.

### signal-to-outreach-pipeline (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/signal-to-outreach-pipeline/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 132,906 bytes. 38 of 39 controls exercised (1 disabled, skipped), no genuine dead controls. Run verification showed no DOM change in jsdom (idempotent or already-verified state).
- jsdom proved: All 38 exercised controls responded.
- Browser steps: L1. Run the pipeline from signal to outreach and confirm each stage shows output. Click Run verification and confirm it reports a result.
- jsdom could not verify: real pipeline output rendering.

### anti-doomer-field-manual (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/anti-doomer-field-manual/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 56,724 bytes. 25 controls exercised, no genuine dead controls.
- jsdom proved: All 25 controls responded. The daily checklist flow worked (5 Daily Checklist produced a DOM change; Reset the Checklist showed no change, idempotent).
- Browser steps: L1. Check off 2 daily checklist items and confirm the checklist updates. Click Reset the Checklist and confirm it clears. C1: click Print / Save as PDF and confirm the print dialog opens.
- jsdom could not verify: print dialog.

### reference-library (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/reference-library/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 68,076 bytes. 12 controls exercised, no genuine dead controls.
- jsdom proved: All 12 controls responded.
- Browser steps: L1. Click through the 50 reference sites list, open 3 entries, confirm each shows its reference. Confirm no link is broken.
- jsdom could not verify: real link targets (outbound navigation was not click-tested in jsdom).

### vault-overview (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/vault-overview/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 702,157 bytes. 11 controls exercised, no genuine dead controls.
- jsdom proved: All 11 controls responded.
- Browser steps: L1. Scroll the full overview and confirm the sections render. Click each control and confirm it responds. Confirm the page is not stale relative to the run log (the overview is the pre-section-33 version per the alignment record; record the version shown).
- jsdom could not verify: real long-page rendering.

### startup-needle-report (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/startup-needle-report/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 59,884 bytes. 11 controls exercised, no genuine dead controls.
- jsdom proved: All 11 controls responded.
- Browser steps: L1. Confirm the top 5 moves section renders. Click each control and confirm it responds.
- jsdom could not verify: real report rendering.

### fallow-yield (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/fallow-yield/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 66,263 bytes. 13 controls exercised, no genuine dead controls. Uses WebGL is flagged true in the audit metadata, but no THREE error occurred and all controls responded, so no browser WebGL check was assigned by the audit; still, confirm the visuals render.
- jsdom proved: All 13 controls responded.
- Browser steps: L1. Confirm the yield-stack visualization renders (not a blank box). Click each control and confirm the stack updates.
- jsdom could not verify: real visualization rendering.

### neuruh-codex (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/neuruh-codex/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 190,662 bytes. 90 controls exercised, no genuine dead controls.
- jsdom proved: All 90 controls responded.
- Browser steps: L1. Open 3 operator-manual sections and confirm each renders. Click 3 in-page controls and confirm each responds.
- jsdom could not verify: real long-document rendering.

## Batch 17: GitHub land and commerce (priority 4, spot check)

Spot-check template for this batch: L1, run the named flow (order, verify, sample, gallery viewer), C1 where a copy/download/print control is named.

### land-intelligence-report (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/land-intelligence-report/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 66,844 bytes. 77 controls exercised, no genuine dead controls. Verify receipt produced a DOM change on first click in an isolated probe (the verify pass showed no change only because it re-clicked an already-verified receipt).
- jsdom proved: All 77 controls responded.
- Browser steps: L1. Open the report sections (parcel, ownership chain, yield stack, mineral overlay, distress flags) and confirm each renders. V1: click Verify receipt and confirm it reports VALID. C1: click Print / save PDF and Download receipt JSON, confirm the dialog opens and a file downloads.
- jsdom could not verify: print dialog, downloaded file contents.

### land-report-store (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/land-report-store/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 49,762 bytes. 30 controls exercised, no genuine dead controls. Continue to parcel was dead in the sequential run but proven working in an isolated probe. Order the Verified Dossier ($295) produced a DOM change; Verify chain produced a DOM change.
- jsdom proved: All 30 controls responded in the end.
- Browser steps: L1. Click Continue to parcel and confirm it advances. Click Order the Verified Dossier ($295) and confirm the order view appears (do not complete any payment; the storefront is a SIMULATION with Stripe disconnected). V1: click Verify chain and confirm VALID. C1: click Copy report hash, paste into a scratch field, confirm the hash arrived. Click Book the free 10-min qualifier and confirm it opens cal.com/neuruh (do not book).
- jsdom could not verify: real clipboard write, real outbound link behavior.

### world-seeder-loop (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/world-seeder-loop/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 26,575 bytes. 9 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 9 controls responded.
- Browser steps: L1. Run the seeder loop and confirm each step updates. Confirm the SIMULATION label is visible.
- jsdom could not verify: real loop animation.

### maximum-resolution-blueprint (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/maximum-resolution-blueprint/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 49,238 bytes. 36 controls exercised, no genuine dead controls.
- jsdom proved: All 36 controls responded.
- Browser steps: L1. Run the blueprint demo controls in order and confirm each updates the output. Confirm the research OS sections render.
- jsdom could not verify: real demo rendering.

### ncell-runtime-adapter (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/ncell-runtime-adapter/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 52,162 bytes. 87 controls exercised, no genuine dead controls. Verify whole chain produced a DOM change.
- jsdom proved: All 87 controls responded.
- Browser steps: L1. Run the adapter demo end to end. V1: click Verify whole chain and confirm VALID. C1: click Copy share link, paste into a scratch field, confirm the link arrived.
- jsdom could not verify: real clipboard write.

### opportunity-genome (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/opportunity-genome/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 35,498 bytes. 30 of 35 controls exercised (5 disappeared after a re-render and were skipped), no genuine dead controls. Validate mappings produced a DOM change; Load invalid-mapping genome (fails validation) produced a DOM change.
- jsdom proved: The 30 exercised controls responded, including both validation paths.
- Browser steps: L1. Click Validate mappings and confirm a valid result. Click Load invalid-mapping genome and confirm validation fails as expected. Try to reach the 5 controls jsdom lost after re-render and confirm they respond.
- jsdom could not verify: the 5 re-render-lost controls.

### swarm-mission-dag (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/swarm-mission-dag/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 75,344 bytes. 37 controls exercised, no genuine dead controls. Add step, Down, Remove were dead in the sequential run but proven working in an isolated probe. Validate DAG and Verify chain produced DOM changes; Load sample C: broken cycle (fails validation) produced a DOM change.
- jsdom proved: All 37 controls responded in the end, including both validation paths.
- Browser steps: L1. Click Add step, confirm a step is added; click Down, confirm it moves; click Remove, confirm it is removed. Click Validate DAG and confirm it passes. Load sample C and confirm validation fails. V1: Verify chain.
- jsdom could not verify: real DAG rendering.

### newstyle-gallery (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/newstyle-gallery/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 29,911 bytes. 200 of 324 controls exercised (cap 200), no genuine dead controls. The 160 dead entries were a sequencing artifact (lane filter chips hid most cards); a dedicated probe with the All lane active verified the viewer opens on thumbnails 1 and 50, Next steps, and Close works.
- jsdom proved: Viewer opens and closes; lane filters work. 124 thumbnails were not individually clicked.
- Browser steps: L1. Click the All lane, then open thumbnail 1, confirm the full-size meme is readable; click Next twice and confirm each meme is readable; click Close. Open 5 more thumbnails at random and confirm each is readable at full size (this is the readability check Jeramie rated 2/10 on the agency page; read the text on each one).
- jsdom could not verify: real image readability at full size, 124 unclicked thumbnails.

## Batch 18: GitHub organism and governance (priority 4, spot check)

Spot-check template for this batch: L1, run the named verify flow (V1) where the page has one, click the primary controls, C1 where a copy/export control is named.

### p0-seam-loop (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/p0-seam-loop/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 11,622 bytes. 4 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 4 controls responded.
- Browser steps: L1. Run the loop and confirm each stage updates. Confirm the SIMULATION label is visible.
- jsdom could not verify: real loop animation.

### ncell-organ-manifest (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/ncell-organ-manifest/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 5,330 bytes. 19 controls exercised, no genuine dead controls. SAL was dead in the sequential run but proven working in an isolated probe. Page is labelled SIMULATION.
- jsdom proved: All 19 controls responded in the end.
- Browser steps: L1. Click each organ manifest button (including SAL) and confirm each shows its manifest.
- jsdom could not verify: real manifest rendering.

### memory-gate (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/memory-gate/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 18,866 bytes. 48 controls exercised, no genuine dead controls.
- jsdom proved: All 48 controls responded.
- Browser steps: L1. Run the memory gate with a test input and confirm the gate verdict appears. Open the JGI sections 34 to 39 and confirm each renders.
- jsdom could not verify: real gate rendering.

### receipt-chain-explorer (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/receipt-chain-explorer/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 25,980 bytes. 9 controls exercised, no genuine dead controls. Verify chain produced a DOM change in the verify pass.
- jsdom proved: All 9 controls responded.
- Browser steps: L1. V1: click Verify chain and confirm VALID. Click the file input and confirm the file picker opens (do not upload anything sensitive; a test JSON file is enough). Confirm the chain renders.
- jsdom could not verify: real file-picker behavior.

### governance-loop (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/governance-loop/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 23,669 bytes. 38 controls exercised, no genuine dead controls. Verify the receipt produced a DOM change, and Tamper with a copy, then verify produced a DOM change.
- jsdom proved: All 38 controls responded, including the tamper path.
- Browser steps: L1. Run the governance loop. V1: click Verify the receipt and confirm VALID, then click Tamper with a copy, then verify and confirm TAMPERED. Confirm the SIMULATION label is visible.
- jsdom could not verify: real loop rendering.

### datum-valuation-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/datum-valuation-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 29,712 bytes. 14 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 14 controls responded.
- Browser steps: L1. Run the valuation lab with a test input and confirm a label appears.
- jsdom could not verify: real lab rendering.

### recipe-ingredient-registry (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/recipe-ingredient-registry/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 27,610 bytes. 3 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 3 controls responded.
- Browser steps: L1. Open the two 49s registry and confirm entries list. Click each control and confirm it responds.
- jsdom could not verify: real registry rendering.

### placer-economics (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/placer-economics/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 29,696 bytes. 17 controls exercised, no genuine dead controls. Garnet, waterjet abrasive ($200-400) was dead in the sequential run but proven working in an isolated probe. Page is labelled SIMULATION.
- jsdom proved: All 17 controls responded in the end.
- Browser steps: L1. Run the calculator with a test input and confirm the economics update. Click Garnet, waterjet abrasive and confirm it responds.
- jsdom could not verify: real calculator rendering.

### vault-concept-explorer (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/vault-concept-explorer/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 20,024 bytes. 7 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 7 controls responded.
- Browser steps: L1. Open the vault concepts and confirm each renders. Click each control and confirm it responds.
- jsdom could not verify: real explorer rendering.

### estimator-cost-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/estimator-cost-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 13,472 bytes. 7 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 7 controls responded.
- Browser steps: L1. Run the rehab estimator with a test input and confirm a cost appears.
- jsdom could not verify: real estimator rendering.

### framework-atlas (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/framework-atlas/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 9,861 bytes. 7 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 7 controls responded.
- Browser steps: L1. Open the framework atlas and confirm entries list. Click each control and confirm it responds.
- jsdom could not verify: real atlas rendering.

## Batch 19: GitHub labs (priority 4, spot check)

Spot-check template for this batch: L1, run the named verify flow (V1) where the page has one, click the primary controls, C1 where a copy/export control is named. Note: the E-series kill-checkbox rule applies to these labs too where stated (auto-checked computed outputs do not stick when clicked, by design).

### territory-engine (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/territory-engine/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 37,555 bytes. 10 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 10 controls responded.
- Browser steps: L1. Run the territory scoring demo with a test territory and confirm a score appears.
- jsdom could not verify: real scoring rendering.

### lead-console (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/lead-console/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 33,941 bytes. 10 controls exercised, no genuine dead controls. VERIFIED (3), NOT VERIFIED (2), and Verify chain (recompute SHA-256) all produced DOM changes. Page is labelled SIMULATION.
- jsdom proved: All 10 controls responded, including both verification filters.
- Browser steps: L1. Click VERIFIED (3) and confirm the list filters to verified leads. Click NOT VERIFIED (2) and confirm it filters the other way. V1: click Verify chain (recompute SHA-256) and confirm VALID.
- jsdom could not verify: real lead-list rendering.

### midden-inventory-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/midden-inventory-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 29,221 bytes. 25 of 27 controls exercised (2 disabled, skipped), no genuine dead controls. Reset to stated order was dead in the sequential run but proven working in an isolated probe. Page is labelled SIMULATION.
- jsdom proved: All 25 exercised controls responded in the end.
- Browser steps: L1. Add an inventory item, confirm it lists. Click Reset to stated order and confirm the order restores.
- jsdom could not verify: real inventory rendering.

### sal-content-pipeline (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/sal-content-pipeline/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 19,384 bytes. 6 controls exercised, no genuine dead controls. Do not confuse with the Cloudflare sal-content-pipeline (Batch 13).
- jsdom proved: All 6 controls responded.
- Browser steps: L1. Run the pipeline and confirm each stage updates. C1: click Export receipts as JSONL, confirm a file downloads, open it and confirm it is non-empty.
- jsdom could not verify: downloaded file contents.

### token-swap-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/token-swap-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 20,528 bytes. 7 controls exercised, no genuine dead controls. Verify produced a DOM change. The angle select was dead in the sequential run but proven working in an isolated probe. Page is labelled SIMULATION.
- jsdom proved: All 7 controls responded in the end.
- Browser steps: L1. Run a token swap and confirm the prompt updates. V1: click Verify and confirm VALID. C1: click Copy after prompt, paste into a scratch field, confirm the prompt text arrived.
- jsdom could not verify: real clipboard write.

### dimear-decision-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/dimear-decision-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 24,985 bytes. 11 controls exercised, no genuine dead controls. Page is labelled SIMULATION.
- jsdom proved: All 11 controls responded.
- Browser steps: L1. Run the DIMEA 2.0 decision lab with a test decision and confirm a verdict appears.
- jsdom could not verify: real lab rendering.

### pmla-memory-loop (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/pmla-memory-loop/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 34,451 bytes. 18 controls exercised, no genuine dead controls. Verify whole chain showed no DOM change in the verify pass (idempotent: it responded in the main loop and the second click re-verified the same chain).
- jsdom proved: All 18 controls responded.
- Browser steps: L1. Run the memory loop and confirm the loop advances. V1: click Verify whole chain and confirm VALID. C1: click Export receipts as JSONL, confirm a file downloads, open it and confirm it is non-empty.
- jsdom could not verify: downloaded file contents.

### sovereign-conglomerate (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/sovereign-conglomerate/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 14,027 bytes. 9 controls exercised, no genuine dead controls. Verify this receipt produced a DOM change.
- jsdom proved: All 9 controls responded.
- Browser steps: L1. Open the conglomerate explorer and confirm it renders. V1: click Verify this receipt and confirm VALID.
- jsdom could not verify: real explorer rendering.

### ncp-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/ncp-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 30,377 bytes. 11 controls exercised, no genuine dead controls. Verify all receipts showed no DOM change in the verify pass (idempotent).
- jsdom proved: All 11 controls responded.
- Browser steps: L1. Run the NCP demo. V1: click Verify all receipts and confirm VALID.
- jsdom could not verify: real lab rendering.

### qeca-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/qeca-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 32,879 bytes. 22 controls exercised, no genuine dead controls. Verify chain showed no DOM change in the verify pass (idempotent). Page is labelled SIMULATION.
- jsdom proved: All 22 controls responded.
- Browser steps: L1. Run the 5-qubit hybrid simulator and confirm the state updates. V1: click Verify chain and confirm VALID. C1: click Copy latest receipt JSON, paste into a scratch field, confirm the receipt arrived.
- jsdom could not verify: real clipboard write.

### eta-transform-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/eta-transform-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 23,891 bytes. 21 controls exercised, no genuine dead controls. Verify produced a DOM change on all four checks.
- jsdom proved: All 21 controls responded.
- Browser steps: L1. Run the eta doctrine gate with a test input and confirm the gate verdict appears. V1: click each Verify control and confirm VALID.
- jsdom could not verify: real gate rendering.

### agent-framework-lab (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/agent-framework-lab/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 24,314 bytes. 21 controls exercised, no genuine dead controls. Meaning 1: Auto-bundled and the vertical input were dead in the sequential run but proven working in an isolated probe. Run the five-letter check and Verify all receipts produced DOM changes. Page is labelled SIMULATION.
- jsdom proved: All 21 controls responded in the end.
- Browser steps: L1. Type a vertical into the vertical input and confirm it accepts it. Click Meaning 1: Auto-bundled and confirm it responds. Click Run the five-letter check and confirm a result. V1: Verify all receipts.
- jsdom could not verify: real lab rendering.

## Batch 20: GitHub live demos and visuals (priority 4, spot check)

Spot-check template for this batch: L1, run the named demo flow, click the primary controls, C1 where a copy control is named. Note the dag-live-demo Approve note: it threw in jsdom only when clicked inside a hidden panel; in the browser, open the panel first, then click Approve.

### dag-live-demo (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/dag-live-demo/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 62,136 bytes. 29 controls exercised, no genuine dead controls. One uncaught TypeError on load (`Cannot read properties of undefined (reading 'gate')`) tied to Approve being clicked inside a hidden panel; Approve was proven working in an isolated probe once the panel was open.
- jsdom proved: All 29 controls responded in the end.
- Browser steps: L1, note any console error on load. Open the panel that holds Approve first, then click Approve and confirm the step approves. Run the DAG demo end to end.
- jsdom could not verify: real DAG rendering, whether the load-time TypeError appears in Chromium.

### learning-live-demo (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/learning-live-demo/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 82,959 bytes. 35 of 40 controls exercised (5 disabled, skipped), no genuine dead controls. 1 Seal forecast was dead in the sequential run but proven working in an isolated probe.
- jsdom proved: All 35 exercised controls responded in the end.
- Browser steps: L1. Run the learning demo, click 1 Seal forecast and confirm a forecast seals. Click the remaining primary controls and confirm each responds.
- jsdom could not verify: real demo rendering.

### lcde-live-demo (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/lcde-live-demo/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 26,277 bytes. 27 controls exercised, no genuine dead controls.
- jsdom proved: All 27 controls responded.
- Browser steps: L1. Run the LCDE demo and confirm the emergence output appears. Open the Case Zero section and confirm it renders.
- jsdom could not verify: real demo rendering.

### davinci-generator (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/davinci-generator/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 81,168 bytes. 32 controls exercised, no genuine dead controls. jsdom could not run toDataURL (canvas package not installed) and reported navigation-not-implemented on one handler; both are jsdom gaps, not page defects.
- jsdom proved: All 32 controls responded.
- Browser steps: L1. Generate a DaVinci output and confirm the canvas renders an image (not blank). C1: click Copy Motion Prompt, paste into a scratch field, confirm the prompt text arrived. Confirm the generated image downloads or displays correctly.
- jsdom could not verify: real canvas rendering, real clipboard write.

### learning-loop-visuals (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/learning-loop-visuals/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 54,880 bytes. 26 of 27 controls exercised (1 disabled, skipped), no genuine dead controls.
- jsdom proved: All 26 exercised controls responded.
- Browser steps: L1. Confirm the learning-loop figures render as diagrams. Click each control and confirm it responds.
- jsdom could not verify: real figure rendering at full size.

### ontology-codex-visuals (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/ontology-codex-visuals/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 62,162 bytes. 44 of 45 controls exercised (1 disabled, skipped), no genuine dead controls.
- jsdom proved: All 44 exercised controls responded.
- Browser steps: L1. Confirm the ontology figures render as diagrams. Click each control and confirm it responds.
- jsdom could not verify: real figure rendering at full size.

### organism-codex-visuals (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/organism-codex-visuals/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 105,728 bytes. 55 controls exercised, no genuine dead controls.
- jsdom proved: All 55 controls responded.
- Browser steps: L1. Confirm the organism figures render as diagrams. Click each control and confirm it responds.
- jsdom could not verify: real figure rendering at full size.

### swarm-visuals (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/swarm-visuals/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 43,210 bytes. 26 controls exercised, no genuine dead controls.
- jsdom proved: All 26 controls responded.
- Browser steps: L1. Confirm the swarm figures render as diagrams. Click each control and confirm it responds.
- jsdom could not verify: real figure rendering at full size.

### world-apg (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/world-apg/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 10,649 bytes. 13 controls exercised, no genuine dead controls.
- jsdom proved: All 13 controls responded.
- Browser steps: L1. Open the APG seed world sections and confirm each renders. Click each control and confirm it responds. Note: this page keeps its 10 [BRYAN TO CONFIRM] markers verbatim; record whether they are still present.
- jsdom could not verify: real world-page rendering.

### world-dispatch-iq (GitHub Pages)

- URL: https://neuruhai.github.io/neuruh-demos/world-dispatch-iq/
- jsdom verdict: STATIC-WORKING (jsdom only). HTTP 200, 14,986 bytes. 5 controls exercised, no genuine dead controls.
- jsdom proved: All 5 controls responded.
- Browser steps: L1. Open the DISPATCH-IQ seed world sections and confirm each renders. Click each control and confirm it responds.
- jsdom could not verify: real world-page rendering.

## Batch 21: GitHub DOC pages (priority 5, render check)

### verifiable-ai-pipeline (GitHub Pages, DOC)

- URL: https://neuruhai.github.io/neuruh-demos/verifiable-ai-pipeline/
- jsdom verdict: DOC (jsdom only). HTTP 200, 25,596 bytes. 0 controls, 14,439 chars of body text, no JS errors.
- jsdom proved: Page renders fully with no JS errors. Pure document page.
- Browser steps: D1. Scroll the full article and confirm the text and any figures render. Confirm the headline and byline show.
- jsdom could not verify: real document rendering.

### organism-state-dashboard (GitHub Pages, DOC)

- URL: https://neuruhai.github.io/neuruh-demos/organism-state-dashboard/
- jsdom verdict: DOC (jsdom only). HTTP 200, 19,076 bytes. 0 controls, 11,066 chars of body text, no JS errors.
- jsdom proved: Page renders fully with no JS errors. Static dashboard display with no interactive controls.
- Browser steps: D1. Confirm the dashboard state displays render (no blank panels, no missing numbers). Confirm the page is not showing stale or placeholder state.
- jsdom could not verify: real dashboard rendering.

### neurh-hub (GitHub Pages, DOC)

- URL: https://neuruhai.github.io/neuruh-demos/neurh-hub/
- jsdom verdict: DOC (jsdom only). HTTP 200, 37,691 bytes. 0 controls, 23,970 chars of body text, no JS errors.
- jsdom proved: Page renders fully with no JS errors. Link index page; outbound links are navigation, not in-page controls, and were not click-tested in jsdom.
- Browser steps: D1. Confirm the hub index renders with its cards and sections. Click 5 outbound links and confirm each lands on a live page (do not open all of them; the per-site entries above cover the targets).
- jsdom could not verify: real outbound link targets.

## Dispatch notes for the parent

- Dispatch in batch order (1 to 21). The Batch 4 HOLD entries are cleared: the GitHub e2, e4, and e10 hang fixes landed 2026-11-14 per `fix-github-e-hang.md`. Dispatch all five Batch 4 sites as re-verification, and all five Batch 5 sites as re-verification per `fix-github-partials.md`.
- One browser task per batch. Shared Chromium profile queues FIFO; do not stack batches.
- For every site, the browser task must report: load result, console errors, each named step result (pass or fail with what was seen), screenshots for WebGL scenes and for any failure, and the C1 evidence (pasted clipboard text, downloaded file name and size, print dialog seen or not).
- A STATIC-WORKING jsdom verdict is not a browser pass. A browser pass needs the spot-check steps in the entry plus L1 with no console errors.
- A NEEDS-BROWSER site passes only when W1 shows a visible 3D scene and the named buttons change it. A blank or black canvas is a fail, even if the page loads.
- A fixed site passes only when its re-verification steps pass in the browser (R1 bounded share link for the E-series fixes, the full disabled-then-enabled War Room flow for Aegis, the kill-box sync checks for GitHub E8/E10/E11, the 9-stage chain for unified-chain, the Run fabric clean run plus failure rollback for master-command-lab, the disabled remote lane plus working local prompter for neuruh-prompter, the counter and tooltip checks for component-library-gallery, the sample-line checks for autonomous-builder-factory, the 13-DAG nav checks with the search box empty for convergence-graph-visuals).
- Do not dispatch the neuruh-prompter camera check unless the browser machine has a camera or a virtual camera available; otherwise record the camera select as untestable in that run and keep it open.
- Do not complete any payment on land-report-store (SIMULATION, Stripe disconnected) and do not book the cal.com qualifier; opening the link to confirm it loads is enough.
- Nothing in this file was verified in a live browser. When the browser runs finish, the next step is a browser-verdict report that replaces each jsdom verdict here with a browser verdict, site by site.
