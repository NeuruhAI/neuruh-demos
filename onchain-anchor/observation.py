#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — observation schema (Section E).
An observation is a structured public record with provenance. Nothing enters
the system without a hash. Observations become manifest leaves (kind
"observation") in a future manifest; the pilot set is the REAL 25-observation
St. Joseph County IN Assessor ArcGIS sample produced by the Retardio
Measurement Loop v1 (~/workspace/retardio-measurement-loop/), fetched live
2026-11-15T11:53:33Z.
Schema mirrors ~/workspace/research-drift-2026-11-15/narrow-measurement-loop-spec.md.
observation_id is the SHA-256 of the canonical PAYLOAD (spec line 23), not of
the whole body. The loop's documented extensions are accepted: source
"county_assessor_arcgis", entity_type "parcel_record", and the extra fields
seq / prev_hash / source_extras (the prev_hash chain links observations).
No private-individual scoring. No non-public data. Transactions and entities only.
"""
import json, hashlib

SCHEMA_VERSION = "1.0"
SOURCES = ("county_recorder", "secretary_of_state", "court_docket",
           "county_assessor_arcgis")  # last: loop-documented extension
ENTITY_TYPES = ("deed", "llc_filing", "ucc", "lis_pendens", "judgment", "error",
                "parcel_record")  # last: loop-documented extension
ERROR_KINDS = ("source_unavailable", "schema_mismatch", "rate_limited", "fetch_error")

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def validate_observation(obs):
    """Return a list of errors; empty means valid."""
    errs = []
    # schema_version is optional per-observation: the Measurement Loop records
    # it once in the document meta ("1.0"). If present it must be "1.0".
    for k in ("observation_id", "source", "source_locator", "retrieved_at",
              "raw_hash", "entity_type", "payload"):
        if k not in obs:
            errs.append("missing field " + k)
    if obs.get("source") not in SOURCES:
        errs.append("bad source " + str(obs.get("source")))
    if obs.get("entity_type") not in ENTITY_TYPES:
        errs.append("bad entity_type " + str(obs.get("entity_type")))
    if obs.get("schema_version") not in (None, SCHEMA_VERSION):
        errs.append("schema_version must be " + SCHEMA_VERSION)
    if not isinstance(obs.get("raw_hash"), str) or len(obs.get("raw_hash", "")) != 64:
        errs.append("raw_hash must be 64 hex")
    if not isinstance(obs.get("payload"), dict):
        errs.append("payload must be an object")
    if obs.get("entity_type") == "error" and obs.get("payload", {}).get("error_kind") not in ERROR_KINDS:
        errs.append("error observation needs a known error_kind")
    # observation_id is the SHA-256 of the canonical PAYLOAD (spec line 23).
    # (An earlier draft of this file hashed the whole body; the spec and the
    # live Measurement Loop both hash the payload only. Fixed 2026-11-15.)
    if "observation_id" in obs and "payload" in obs and isinstance(obs["payload"], dict):
        if sha256(canonical(obs["payload"])) != obs["observation_id"]:
            errs.append("observation_id does not match hash of canonical payload")
    return errs

def make_observation(source, source_locator, retrieved_at, raw_hash, entity_type, payload):
    """Build an observation; observation_id is the SHA-256 of the canonical
    PAYLOAD (spec line 23)."""
    body = {
        "source": source,
        "source_locator": source_locator,
        "retrieved_at": retrieved_at,
        "raw_hash": raw_hash,
        "entity_type": entity_type,
        "payload": payload,
        "schema_version": SCHEMA_VERSION,
    }
    obs = dict(body)
    obs["observation_id"] = sha256(canonical(payload))
    return obs

def make_error_observation(source, source_locator, retrieved_at, error_kind, detail):
    return make_observation(source, source_locator, retrieved_at,
                            sha256(canonical({"error_kind": error_kind, "detail": detail})),
                            "error", {"error_kind": error_kind, "detail": detail})

def observation_to_entry(obs, retrieved_at):
    """Convert a validated observation into a v2 manifest entry (kind
    'observation'). The entry's sha256 is the observation's raw_hash (the
    content hash); the leaf hash is the SHA-256 of the canonical entry JSON.
    Returns the entry dict, or raises ValueError on an invalid observation."""
    errs = validate_observation(obs)
    if errs:
        raise ValueError("invalid observation: " + "; ".join(errs))
    return {
        "id": "obs-" + obs["observation_id"][:16],
        "kind": "observation",
        "url_or_source": obs["source_locator"],
        "sha256": obs["raw_hash"],
        "retrieved_at": retrieved_at,
        "raw_bytes_locator": obs["source_locator"],
        "schema_version": "2.0",
        "content_type": "application/json",
        "content_length": len(canonical(obs)),
        "status": "verified",
    }

def leaf_hash(entry):
    return sha256(canonical(entry))
