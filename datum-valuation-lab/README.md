# DATUM Valuation Label Lab (SIMULATION)

Working demo turning the Tier C DATUM valuation concept into a Tier B working demo.
Built 2026-11-14 in the overnight Neuruh run.

Live: https://neuruhai.github.io/neuruh-demos/datum-valuation-lab/

## What it is

A static page presenting ONLY what the DATUM dossier establishes, with the dossier's
own honesty labels. Source: `~/workspace/neuruh-obsidian-vault/_research/datum-valuation/datum-valuation.md`
(absorbed 2026-11-10, 15 verdicts: DURABLE 7, STILL TRUE 4, HISTORICAL 3, SUPERSEDED 1).

## Contents

- Label tiers 0 to 4 (Tier 0 = recorded arm's-length sales via Indiana SDF Form 46021,
  free at stats.indiana.edu).
- St. Joseph County 2024 measured figures: 5,841 records, 2,262 Tier 0 (38.7%),
  48 vacant-land Tier 0, median ratio 1.176, COD 68.8, PRD 1.534 pooled across all
  property classes. Labeled on the page as NOT production coefficients.
- The $7.4B outlier, SDF_ID C46-2023-0077229, quarantined, with its effect on LaPorte COD.
- South Bend left the APC between 2017 and 2023; authority is time-varying (ADR-0009).
- Asymmetric pinball loss, about 3:1 overestimation penalty (Q-003, config value).
- LLM emits feature vectors only, never dollars (invariant I-1).
- The 5 SKUs.
- Interactive tier classifier (quarantine check first, then Tier 0 to 4, else abstain).
- Interactive pinball-loss calculator (P10 / P50 / P90, business-weighted loss).
- St. Joseph 2024 stats table with the quarantine case flagged.

## Hard rules the page follows

- Labeled SIMULATION throughout.
- Never emits a dollar valuation for any input parcel. The pinball calculator scores an
  estimate the user supplies; it values nothing.
- Never presents COD 68.8 or PRD 1.534 as production coefficients.
- No em dashes.

## Tests

Node harness (2026-11-14, 5/5 pass): Tier 0 classification; quarantine on the $7.4B
case (ratio about 110,119x); abstain with no evidence; pinball overestimate
P50 245,000 vs 225,000 gives raw loss 10,000, weighted 30,000; pinball underestimate
P10 200,000 vs 225,000 gives raw loss 2,500, weighted 2,500.

## Deploy

`python3 deploy.py` pushes index.html and README.md to NeuruhAI/neuruh-demos under
`datum-valuation-lab/` via the GitHub Contents API (`gh api`, authenticated as
Jeramie-Hicks). GET sha first, retry 409 with a fresh sha, 3 second pause between PUTs.
