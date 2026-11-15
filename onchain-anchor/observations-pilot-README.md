# Observations pilot — REAL county data (not illustrative)

Source: Retardio Measurement Loop v1
(https://neuruhai.github.io/neuruh-demos/retardio-measurement-loop/),
which fetched the records live from the St. Joseph County IN Assessor
ArcGIS parcel service (LandRecords/Parcels_County/MapServer/0).

- Retrieved: 2026-11-15T11:53:33Z
- Response file: raw/sjc_llc_sample.json, SHA-256 a40226358055b7b7842d42a65856f31dbde5624db3cf92ef48453e2b84d18cf0
- Sample frame: 14415 LLC-owned parcels with a recorded sale match the filter;
  the first 25 returned are carried here (the service reports
  exceededTransferLimit; NOT claimed as the most recent 25).
- Observations: 25 (20 deed, 5 parcel_record). Each observation_id is the
  SHA-256 of the canonical payload (spec line 23); raw_hash is the SHA-256 of
  the canonical normalized raw feature record. prev_hash chains them.
- Forecasts: 20 rapid_flip back-test forecasts (baseline_v1), all UNRESOLVED.
  0 entity_cluster, 0 all_cash_new_entity (formation dates and cash status
  are not in this source; stated, not faked).
- Real Brier: NOT YET COMPUTABLE (0 resolved forecasts). The Brier example
  in brier.json is labeled ILLUSTRATIVE and demonstrates the arithmetic only.
- No private individual is named or scored. Entity (LLC) names are from
  public records. Street addresses are not published; property_id is the
  parcel ID.

This file is the anchor-side copy of the loop's observation log. The loop's
page is the authoritative source; this copy is verified against it by
observation.validate_observation (25/25 valid, payload-hash ids 25/25,
prev_hash chain intact) and is hashed as a manifest leaf.
