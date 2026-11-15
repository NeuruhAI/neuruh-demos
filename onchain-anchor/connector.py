#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — connector interface (Section E, items 70-72).
Connector contract: fetch -> canonicalize -> hash -> emit observation.
Rate-limit and caching rules for public APIs (item 71) and the error
observation type (item 72) live here. No private data. No keys.
"""
import json, hashlib, time, os

RATE_LIMIT_SECONDS = 1.0        # at most one request per second per source
CACHE_TTL_SECONDS = 3600        # cached responses are good for one hour
MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2.0

def sha256(b):
    return hashlib.sha256(b).hexdigest()

class Connector:
    """Base connector. Subclass and implement fetch_raw(locator) -> bytes.
    The pipeline is fixed: fetch, canonicalize, hash, emit observation."""
    source = "connector"
    cache_dir = os.path.expanduser("~/workspace/onchain-anchor/.cache")

    def __init__(self):
        self._last_fetch = 0.0
        os.makedirs(self.cache_dir, exist_ok=True)

    def fetch_raw(self, locator):
        raise NotImplementedError("subclass must implement fetch_raw(locator) -> bytes")

    def _cache_path(self, locator):
        return os.path.join(self.cache_dir, sha256(locator.encode("utf-8")) + ".bin")

    def _cache_get(self, locator):
        p = self._cache_path(locator)
        if not os.path.exists(p):
            return None
        if time.time() - os.path.getmtime(p) > CACHE_TTL_SECONDS:
            return None
        return open(p, "rb").read()

    def _cache_put(self, locator, data):
        with open(self._cache_path(locator), "wb") as f:
            f.write(data)

    def fetch(self, locator):
        """Rate-limited, cached fetch. Returns (data, from_cache, error).
        On failure returns (None, False, error_kind)."""
        cached = self._cache_get(locator)
        if cached is not None:
            return cached, True, None
        wait = RATE_LIMIT_SECONDS - (time.time() - self._last_fetch)
        if wait > 0:
            time.sleep(wait)
        last_err = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                data = self.fetch_raw(locator)
                self._last_fetch = time.time()
                self._cache_put(locator, data)
                return data, False, None
            except Exception as e:  # noqa: BLE001 - connector errors become error observations
                last_err = type(e).__name__ + ": " + str(e)[:200]
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_BACKOFF_SECONDS * (attempt + 1))
        return None, False, last_err

    def canonicalize(self, raw, locator):
        """Turn raw bytes into the observation payload dict. Subclass it."""
        raise NotImplementedError("subclass must implement canonicalize(raw, locator) -> payload dict")

    def emit(self, locator, retrieved_at, entity_type):
        """Run the full pipeline and return an observation dict (from
        observation.py). On fetch failure returns an error observation."""
        from observation import make_observation, make_error_observation
        data, _cached, err = self.fetch(locator)
        if err is not None:
            kind = "rate_limited" if "429" in err or "rate" in err.lower() else "source_unavailable"
            return make_error_observation(self.source, locator, retrieved_at, kind, err)
        try:
            payload = self.canonicalize(data, locator)
        except Exception as e:  # noqa: BLE001
            return make_error_observation(self.source, locator, retrieved_at,
                                          "schema_mismatch", type(e).__name__ + ": " + str(e)[:200])
        return make_observation(self.source, locator, retrieved_at,
                                sha256(data), entity_type, payload)


class CountyBulkConnector(Connector):
    """Pilot connector for one county's public bulk extract (item 68).
    The county is St. Joseph County, Indiana (public ArcGIS / recorder bulk).
    Only the fields in the narrow-loop spec are ingested; everything else
    is ignored. Subclass fetch_raw to point at the county's real endpoint
    once the Measurement Loop build settles the source."""
    source = "county_recorder"

    def __init__(self, county="St. Joseph County, IN"):
        super().__init__()
        self.county = county

    def fetch_raw(self, locator):
        # Pilot stub: no live county deed endpoint is wired in this build.
        # The Measurement Loop build owns the live county source; this
        # connector's fetch is intentionally unimplemented rather than
        # pointed at a guessed URL. Callers get an error observation.
        raise NotImplementedError(
            "county bulk endpoint not wired in the anchor build; "
            "see the Retardio Measurement Loop for the live source")

    def canonicalize(self, raw, locator):
        raise NotImplementedError("county bulk canonicalization lives in the Measurement Loop build")
