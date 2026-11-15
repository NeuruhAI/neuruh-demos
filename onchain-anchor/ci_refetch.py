#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — CI re-fetch job (convergence spec item 2).

Re-fetches every site URL in manifest-v2.json and fails if the content
hash changes without an updated verification record. The manifest IS the
verification record: each site entry carries its sha256 and retrieved_at.
A changed hash means the live site changed since the manifest was built;
the fix is to rebuild the manifest (build_anchor_v2.py), which re-fetches
and records the new hash with a new retrieved_at. A fetch failure is a
failure too (the site cannot be verified as unchanged).

Usage: python3 ci_refetch.py [manifest_path] [--workers N]
Exit 0: every site re-fetched and every hash matches the manifest.
Exit 1: any hash changed or any fetch failed.

Stdlib only. Read-only: it never writes the manifest.
"""
import hashlib, json, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent": "Neuruh-Anchor-CI/2.0"}  # NOTE: a UA carrying a (+https://...) suffix was tarpitted by Cloudflare on 2026-11-15; the bare tool/version UA works.

def fetch(url, timeout=25, retries=2):
    last = None
    for _ in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), None
        except Exception as e:
            last = e
    return None, str(last)

def main():
    path = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "manifest-v2.json"
    workers = 20
    for a in sys.argv[1:]:
        if a.startswith("--workers="):
            workers = int(a.split("=", 1)[1])
    with open(path, encoding="utf-8") as f:
        manifest = json.load(f)
    sites = [e for e in manifest.get("entries", []) if e.get("kind") == "site"]
    print("ci_refetch: %d site entries in %s (manifest root %s...)" % (
        len(sites), path, manifest.get("merkle_root", "?")[:12]))

    def check(entry):
        body, err = fetch(entry["url_or_source"])
        if body is None:
            return entry["id"], "FETCH FAILED", err
        h = hashlib.sha256(body).hexdigest()
        if h != entry["sha256"]:
            return entry["id"], "CHANGED", "manifest %s... live %s..." % (entry["sha256"][:12], h[:12])
        return entry["id"], "UNCHANGED", None

    changed, failed, unchanged = [], [], 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for eid, status, detail in ex.map(check, sites):
            if status == "UNCHANGED":
                unchanged += 1
            elif status == "CHANGED":
                changed.append((eid, detail))
            else:
                failed.append((eid, detail))
    print("unchanged: %d  changed: %d  fetch failed: %d" % (unchanged, len(changed), len(failed)))
    for eid, detail in changed:
        print("  CHANGED %s  %s" % (eid, detail))
    for eid, detail in failed:
        print("  FETCH FAILED %s  %s" % (eid, detail))
    if changed or failed:
        print("CI FAIL: %d site(s) changed or unreachable since the manifest was built."
              % (len(changed) + len(failed)))
        print("Fix: run python3 build_anchor_v2.py to re-fetch and record the new hashes")
        print("with a new retrieved_at (the updated verification record).")
        return 1
    print("CI PASS: all %d site hashes match the manifest." % unchanged)
    return 0

if __name__ == "__main__":
    sys.exit(main())
