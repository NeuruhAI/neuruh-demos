# PMLA Memory Loop Lab (SIMULATION)

Live: https://neuruhai.github.io/neuruh-demos/pmla-memory-loop/

Static HTML + JS, no backend, no data leaves the page. PMLA (Prompt-as-Memory Loop Architecture, CORE-003) as a working loop in the browser.

## What it does

1. **Memory loop simulator.** Write a prompt (or load one of four library prompts built from cited content-bank facts) and run it through five steps in order: PROMPT, WRITE GATE, MEMORY STORE, RECALL, REFINE. Each step shows its input, its decision, and its output. The store is session-only, in-page memory. A reset button clears it.
2. **Loop trace.** Every turn is recorded (turn, prompt, gate verdict, store state, receipt id) with a per-receipt Verify button that recomputes the SHA-256 in-browser with the Web Crypto API and shows PASS/FAIL, plus a whole-chain verify.
3. **Decay calculator.** F(t) = 2^(-t/h) with the five stated presets (runtime 0.0167d, repo 0.5d, lead 7d, strategy 30d, historical 365d), computed step by step with a five-point retention table. The calculator is this demo's implementation; the formula and presets are stated facts from the memory-gate work.
4. **Status board.** PMLA's stated state with sources cited. Atlas tier is UNKNOWN, recorded exactly as the atlas states it. DESIGNED vs VERIFIED is labeled. SIMULATION throughout.

## Files

- `index.html` - the page (editorial document style, document-control header).
- `pmla-loop.js` - all logic, UMD (Node and browser). SHA-256, canonical JSON, and receipt v1.0 copied verbatim from the governance-loop demo; write gate and decay adapted from the memory-gate demo; 5-block parser, prompt library, session store, and loop runner are new here and marked NEW.
- `test.js` - Node tests, 28 checks. Run `node test.js`.
- `README.md` - this file.

## Rules reused, with their labels

- Write-gate thresholds are ILLUSTRATIVE: evidence below 3 REJECT, contradicts QUARANTINE, evidence below 6 QUARANTINE, else WRITE. The JGI paper gives no numeric thresholds.
- Receipt v1.0: canonical JSON (keys sorted, arrays in order), `provenance.report_hash_sha256` stripped before hashing, SHA-256 only, first prev hash GENESIS.
- No dollar valuations. No owner or property PII. No em dashes.

## Sources

- Vault `01-Core-Architecture/PMLA.md` (CORE-003), `00-Collisions/Collision - PMLA.md` (court verdict 2026-11-09), `10-Additional-Systems/PMLA Benchmark Suite.md` (EXT-015).
- Framework Atlas `frameworks.json`: PMLA tier UNKNOWN, function "Prompt engineering framework", posture "Independently developed", no dependencies stated.
- Ecosystem Codex NRH-DOC-CODEX-001 rev A (https://ecosystem-codex.pages.dev/): PMLA appears once, Volume VI row.
- Memory-gate demo (write gate, decay) and governance-loop demo (receipt v1.0).
- Content bank items 9, 10, 19, 20 (library facts, verbatim, cited).

## Gaps

- No PMLA design document with loop mechanics exists in the sources read. The loop steps, store rule, and recall mapping are this demo's design, labeled as such on the page.
- Ported percent, unique residue, transplant target: UNKNOWN. AI-CB-PMLA-001 code home beyond the sibling repo: UNKNOWN. No live PMLA runtime proven.
- The repo engine (`NeuruhAI/pmla-constraint-engineering`) was not read, run, or modified. This demo is a browser simulation of the stated loop idea only.
