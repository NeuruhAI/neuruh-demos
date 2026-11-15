#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — forecast, outcome, and Brier loop (Section E,
items 63-66, 73-74). Mirrors the narrow-loop spec. Forecasts are issued
before the outcome is known and stored with their own receipt. A scoring
change is retained only if it improves Brier on a held-out set.
No private-individual scoring. Transactions and entities only.
"""
import json, hashlib, math
from datetime import datetime, timezone

FORECAST_TYPES = ("rapid_flip", "entity_cluster", "all_cash_new_entity")

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def make_forecast(forecast_type, observation_ids, probability, features_used,
                  model_version="baseline_v1", issued_at=None):
    if forecast_type not in FORECAST_TYPES:
        raise ValueError("unknown forecast_type " + forecast_type)
    if not (0.0 <= probability <= 1.0):
        raise ValueError("probability must be in [0,1]")
    rec = {
        "forecast_id": None,
        "observation_ids": sorted(observation_ids),
        "forecast_type": forecast_type,
        "probability": probability,
        "issued_at": issued_at or now_iso(),
        "model_version": model_version,
        "features_used": sorted(features_used),
        "receipt": None,
    }
    body = {k: v for k, v in rec.items() if k not in ("forecast_id", "receipt")}
    rec["forecast_id"] = sha256(canonical(body))[:32]
    rec["receipt"] = sha256(canonical(rec))
    return rec

def make_outcome(forecast_id, outcome, evidence_observation_ids, coder="human", resolved_at=None):
    if outcome not in (0, 1):
        raise ValueError("outcome must be 0 or 1")
    if coder not in ("human", "rule"):
        raise ValueError("coder must be human or rule")
    rec = {
        "outcome_id": None,
        "forecast_id": forecast_id,
        "resolved_at": resolved_at or now_iso(),
        "outcome": outcome,
        "evidence_observation_ids": sorted(evidence_observation_ids),
        "coder": coder,
        "receipt": None,
    }
    body = {k: v for k, v in rec.items() if k not in ("outcome_id", "receipt")}
    rec["outcome_id"] = sha256(canonical(body))[:32]
    rec["receipt"] = sha256(canonical(rec))
    return rec

def brier_score(pairs):
    """pairs: list of (probability, outcome). Returns None on empty input."""
    if not pairs:
        return None
    return sum((p - o) ** 2 for p, o in pairs) / len(pairs)

def brier_by_type(resolved):
    """resolved: list of dicts with forecast_type, probability, outcome."""
    groups = {}
    for r in resolved:
        groups.setdefault(r["forecast_type"], []).append((r["probability"], r["outcome"]))
    return {k: {"n": len(v), "brier": brier_score(v)} for k, v in sorted(groups.items())}

def brier_over_time(resolved):
    """Brier in resolution order, cumulative. resolved must carry resolved_at."""
    rows = sorted(resolved, key=lambda r: r["resolved_at"])
    out, pairs = [], []
    for r in rows:
        pairs.append((r["probability"], r["outcome"]))
        out.append({"resolved_at": r["resolved_at"], "n": len(pairs),
                    "brier": brier_score(pairs), "forecast_type": r["forecast_type"]})
    return out

def constant_baseline_brier(resolved):
    """Brier of always predicting the base rate (the mean outcome)."""
    if not resolved:
        return None
    base = sum(r["outcome"] for r in resolved) / len(resolved)
    return brier_score([(base, r["outcome"]) for r in resolved])

def promote(candidate_brier, baseline_brier):
    """Promotion rule (item 66): keep the new scoring logic only if it
    improves Brier on the held-out set. Returns (keep, reason)."""
    if candidate_brier is None or baseline_brier is None:
        return False, "insufficient resolved forecasts to judge"
    if candidate_brier < baseline_brier:
        return True, "Brier improved %.4f -> %.4f on held-out data" % (baseline_brier, candidate_brier)
    return False, "Brier did not improve (%.4f vs %.4f); change rejected" % (candidate_brier, baseline_brier)

REVIEW_THRESHOLD = 0.80  # item 73: forecasts at or above this go to human review

def review_queue_entry(forecast):
    """A forecast crosses the threshold when its probability is at or above
    REVIEW_THRESHOLD. Returns a queue record, or None."""
    if forecast["probability"] >= REVIEW_THRESHOLD:
        return {
            "forecast_id": forecast["forecast_id"],
            "forecast_type": forecast["forecast_type"],
            "probability": forecast["probability"],
            "issued_at": forecast["issued_at"],
            "model_version": forecast["model_version"],
            "status": "awaiting_human_review",
            "receipt": forecast["receipt"],
        }
    return None

def authority_header(scope, expiry, authorizer="Jeramie Hicks (human)"):
    """Authority header stub (item 67) for any export or alert."""
    return {
        "authorizer": authorizer,
        "scope": scope,
        "expiry": expiry,
        "issued_at": now_iso(),
        "single_use": True,
    }

def calibration_dashboard(resolved):
    """Dashboard stub (item 74): running Brier, count resolved, last update."""
    if not resolved:
        return {"resolved_count": 0, "brier_overall": None, "brier_by_type": {},
                "constant_baseline_brier": None, "last_update": now_iso(),
                "note": "no resolved forecasts yet; Brier is not yet computable"}
    return {
        "resolved_count": len(resolved),
        "brier_overall": brier_score([(r["probability"], r["outcome"]) for r in resolved]),
        "brier_by_type": brier_by_type(resolved),
        "constant_baseline_brier": constant_baseline_brier(resolved),
        "last_update": max(r["resolved_at"] for r in resolved),
        "note": "lower Brier is better; compare against the constant baseline",
    }

if __name__ == "__main__":
    # Worked example (illustrative pilot data, not real county outcomes).
    forecasts = [
        make_forecast("rapid_flip", ["obs-a"], 0.70, ["consideration_ratio", "entity_age_days"]),
        make_forecast("rapid_flip", ["obs-b"], 0.20, ["consideration_ratio", "entity_age_days"]),
        make_forecast("entity_cluster", ["obs-c"], 0.60, ["prior_deed_count"]),
        make_forecast("all_cash_new_entity", ["obs-d"], 0.85, ["entity_age_days"]),
    ]
    outcomes = [
        make_outcome(forecasts[0]["forecast_id"], 1, ["obs-a1"], coder="rule"),
        make_outcome(forecasts[1]["forecast_id"], 0, ["obs-b1"], coder="rule"),
        make_outcome(forecasts[2]["forecast_id"], 1, ["obs-c1"], coder="rule"),
        make_outcome(forecasts[3]["forecast_id"], 0, ["obs-d1"], coder="rule"),
    ]
    resolved = [{"forecast_type": f["forecast_type"], "probability": f["probability"],
                 "outcome": o["outcome"], "resolved_at": o["resolved_at"]}
                for f, o in zip(forecasts, outcomes)]
    print(json.dumps(calibration_dashboard(resolved), indent=2))
    print("promote check (candidate 0.10 vs baseline):", promote(0.10, calibration_dashboard(resolved)["brier_overall"]))
    print("review queue:", [review_queue_entry(f) for f in forecasts if review_queue_entry(f)])
