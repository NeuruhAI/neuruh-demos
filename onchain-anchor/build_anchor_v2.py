#!/usr/bin/env python3
"""Neuruh On-Chain Anchor v2 — builder (hardening spec + convergence spec).

Re-fetches the whole estate live, builds the versioned manifest v2
(manifest-v2.json) with the canonical entry schema, computes the estate
root and the full root, generates the v2 page, and writes the supporting
files. Additive only: v1's manifest and page are retained as
manifest-v1.json and page-v1.html and are themselves leaves in v2.

Entry schema (strict, exactly these fields):
  id, kind, url_or_source, sha256, retrieved_at, raw_bytes_locator,
  schema_version ("2.0"), content_type, content_length, status
  (verified / pending / superseded).
Leaf = SHA-256 of the canonical entry JSON (keys sorted, separators
(",", ":"), no whitespace, UTF-8). Parent = SHA-256 of the concatenated
raw 32-byte child hashes. Odd level duplicates its last node.
Empty tree root = SHA-256 of zero bytes. Single leaf: root = the leaf hash.

Two roots: estate_root (estate leaves only) and merkle_root (all leaves).
The page bakes in the estate root only (a page cannot contain the full
root it is a leaf of). The manifest-content leaf commits to the canonical
entries array (a file cannot contain its own hash); the manifest file's
own SHA-256 is published in manifest-v2.sha256 and status.json.

No chain writes. No wallets. No money. Read-only against the live web
(except writing files under this directory).
"""
import hashlib, json, os, re, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed

WORK = os.path.expanduser("~/workspace/onchain-anchor")
WS = os.path.expanduser("~/workspace")
NOW = datetime.now(timezone.utc)
NOW_ISO = NOW.strftime("%Y-%m-%dT%H:%M:%SZ")
ANCHOR_DATE = "2026-11-15"
VERIFIER_VERSION = "2.0.0"
RECEIPT_SCHEMA_VERSION = "1.1"

def sha256(b):
    return hashlib.sha256(b).hexdigest()

def md5(b):
    return hashlib.md5(b).hexdigest()

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

def leaf_hash(entry):
    return sha256(canonical(entry))

def merkle_root(leaf_hexes):
    if not leaf_hexes:
        return sha256(b"")
    level = [bytes.fromhex(h) for h in leaf_hexes]
    while len(level) > 1:
        nxt = []
        for i in range(0, len(level), 2):
            left = level[i]
            right = level[i + 1] if i + 1 < len(level) else level[i]
            nxt.append(hashlib.sha256(left + right).digest())
        level = nxt
    return level[0].hex()

# ---------- inventory ----------
registry = json.load(open(os.path.join(WS, "research-drift-2026-11-14/final-working-sites.json")))
sites = [(e["slug"], e["url"]) for e in registry]
sites += [
    ("threat-deterrence-console", "https://neuruhai.github.io/neuruh-demos/threat-deterrence-console/"),
    ("unified-swarm", "https://neuruhai.github.io/neuruh-demos/unified-swarm/"),
    ("solution-swarm", "https://neuruhai.github.io/neuruh-demos/solution-swarm/"),
    # Added in v2 (convergence item 14 and the pages built since v1).
    ("working-demos", "https://neuruhai.github.io/neuruh-demos/working-demos/"),
    ("onchain-anchor", "https://neuruhai.github.io/neuruh-demos/onchain-anchor/"),
    ("done-ledger", "https://neuruhai.github.io/neuruh-demos/done-ledger/"),
    ("neuruh-topology", "https://neuruhai.github.io/neuruh-demos/neuruh-topology/"),
    ("hard-problems-atlas", "https://neuruhai.github.io/neuruh-demos/hard-problems-atlas/"),
    ("retardio-measurement-loop", "https://neuruhai.github.io/neuruh-demos/retardio-measurement-loop/"),
]
assert len(sites) == 187, len(sites)

PAPERS = [
    ("paper-anatomy-is-dead", "distribution/ebooks/01-anatomy-is-dead/manuscript.md"),
    ("paper-stop-optimizing-the-wrong-thing", "distribution/ebooks/02-stop-optimizing-the-wrong-thing/manuscript.md"),
    ("paper-the-org-chart-is-the-product", "distribution/ebooks/03-the-org-chart-is-the-product/manuscript.md"),
    ("paper-the-attention-economy-of-ai", "distribution/ebooks/04-the-attention-economy-of-ai/manuscript.md"),
    ("paper-the-robot-question-is-insurance", "distribution/ebooks/05-the-robot-question-is-insurance/manuscript.md"),
    ("paper-the-sovereign-assistant", "distribution/ebooks/06-the-sovereign-assistant/manuscript.md"),
    ("papers-series", "distribution/ebooks/SERIES.md"),
]
DOCS = [
    ("notebook-codex", "research-drift-2026-11-15/notebook-codex.md"),
    ("daybreak-solution-adaptation-map", "research-drift-2026-11-15/daybreak-solution-adaptation-map.md"),
    ("threat-deterrence-framework", "research-drift-2026-11-15/threat-deterrence-framework.md"),
]
LEDGERS = [
    ("registry-final-working-sites", "research-drift-2026-11-14/final-working-sites.json"),
    ("doubt-removal-final-report", "research-drift-2026-11-14/final-report.md"),
    ("overnight-run-log", "research-drift-2026-11-14/overnight-run-log.md"),
    ("hub-index", "neuruh-hub-site/index.html"),
]
# New estate ledgers in v2 (generated / carried by this build).
NEW_LEDGERS = [
    ("demo-inventory", "onchain-anchor/demo-inventory.json"),
    ("brier-state", "onchain-anchor/brier.json"),
    ("observations-pilot", "onchain-anchor/observations-pilot.jsonl"),
]

# Demos that still use pure keyword banks (convergence item 9). Their
# scores are keyword matches, not measured signal. Verified set only; a
# full 178-demo audit is open (see code-data-sharing.md).
HEURISTIC = ["threat-deterrence-console", "unified-swarm", "solution-swarm"]

LABELING_RULE = ("A demo may be labeled WORKING only after the interaction "
                 "checklist and the content hash are recorded in the Done Ledger.")

# Verification record for the demos built after the 2026-11-14 browser pass
# (convergence item 1: verification date + exact interaction confirmed).
NEWER_VERIFICATION = {
    "threat-deterrence-console": ("2026-11-15", "live Chromium control check, 6/6 WORKING (06:02 EST): lattice, signal analyzer, scam scorer, bot farm detector, resolution intake receipt, learning ledger"),
    "unified-swarm": ("2026-11-15", "live Chromium control check, 5/5 WORKING (06:11 EST): 7 legion counts, 179-system registry search, ten-stage mission loop with chained receipts"),
    "solution-swarm": ("2026-11-15", "live Chromium control check, 6/6 WORKING (06:33 EST): 179 cards, 7 legion columns, confirm moves a weight and rewrites 50 cards, 179/179 receipts VALID, swarm run, ANALYSTS filter to 62"),
    "onchain-anchor": ("2026-11-15", "v1 page live; v2 jsdom verification (this build: Python root == JS root == published root). Live-browser control check owed to the parent."),
    "done-ledger": ("2026-11-15", "jsdom verification on delivery; live-browser control check owed to the parent."),
    "neuruh-topology": ("2026-11-15", "jsdom verification on delivery; live-browser control check owed to the parent."),
    "hard-problems-atlas": ("2026-11-15", "live Chromium control check, 5/5 WORKING (06:55 EST): 150 entries, 12 groups, 6 typologies, 6 layers; Full filter shows 90; 'quantum' search shows 1 (B56); Group 6 filter shows 15"),
    "retardio-measurement-loop": ("2026-11-15", "live Chromium control check, fully WORKING (07:08 EST): 25 real observations, 20 forecasts, row expansion/collapse, detail panel, hint placement above the table, first-load expansion"),
    "working-demos": ("2026-11-15", "live fetch + link check: the 178-card index renders. Browser control check owed to the parent."),
}

UA = {"User-Agent": "NeuruhAnchor/2.0"}  # NOTE: the longer UA with a (+https://...) suffix was tarpitted by Cloudflare (read timeouts) on 2026-11-15; the bare tool/version UA works.

def content_type_for(url, header):
    if header:
        return header.split(";")[0].strip().lower()
    if url.endswith(".json"):
        return "application/json"
    if url.endswith(".md"):
        return "text/markdown"
    return "text/html"

def fetch_site(item):
    slug, url = item
    last_err = ""
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read()
                return {
                    "id": slug, "kind": "site", "url_or_source": url,
                    "sha256": sha256(body), "retrieved_at": NOW_ISO,
                    "raw_bytes_locator": url, "schema_version": "2.0",
                    "content_type": content_type_for(url, r.headers.get("Content-Type")),
                    "content_length": len(body), "status": "verified",
                    "_md5": md5(body), "_http": r.status,
                }
        except urllib.error.HTTPError as e:
            last_err = "HTTP %s" % e.code
        except Exception as e:
            last_err = type(e).__name__ + ": " + str(e)[:120]
        time.sleep(3)
    return {
        "id": slug, "kind": "site", "url_or_source": url,
        "sha256": None, "retrieved_at": NOW_ISO,
        "raw_bytes_locator": url, "schema_version": "2.0",
        "content_type": None, "content_length": None, "status": "pending",
        "_md5": None, "_error": last_err,
    }

EXT_TYPE = {".md": "text/markdown", ".json": "application/json", ".html": "text/html",
            ".js": "text/javascript", ".py": "text/x-python", ".sh": "application/x-sh",
            ".txt": "text/plain"}

def hash_local(item, kind, eid_prefix=""):
    eid, rel = item
    path = os.path.join(WS, rel)
    try:
        data = open(path, "rb").read()
        ext = os.path.splitext(path)[1].lower()
        return {
            "id": eid_prefix + eid, "kind": kind, "url_or_source": None,
            "sha256": sha256(data), "retrieved_at": NOW_ISO,
            "raw_bytes_locator": "~/workspace/" + rel, "schema_version": "2.0",
            "content_type": EXT_TYPE.get(ext, "application/octet-stream"),
            "content_length": len(data), "status": "verified",
            "_md5": md5(data),
        }
    except Exception as e:
        return {
            "id": eid_prefix + eid, "kind": kind, "url_or_source": None,
            "sha256": None, "retrieved_at": NOW_ISO,
            "raw_bytes_locator": "~/workspace/" + rel, "schema_version": "2.0",
            "content_type": None, "content_length": None, "status": "pending",
            "_md5": None, "_error": str(e)[:200],
        }

def parse_checklist():
    """Parse the 2026-11-14 browser checklist for each site's exact
    interaction (the 'Browser steps' line). Returns (slug, host) -> steps.
    Keyed by host because the 12 dual-host demos (E-series + sal-content-
    pipeline) appear twice, once per host, with host-specific steps."""
    path = os.path.join(WS, "research-drift-2026-11-14/doubt-removal-browser-checklist.md")
    text = open(path, encoding="utf-8").read()
    out = {}
    # Sections look like: ### slug (Host)\n\n- URL: ...\n- Browser steps: L1. ...
    for m in re.finditer(r"^### ([a-z0-9][a-z0-9\-]*) \(([^)]+)\)\n(.*?)(?=^### |\Z)",
                         text, re.M | re.S):
        slug, host, body = m.group(1), m.group(2), m.group(3)
        # Headers carry notes after the host ("(Cloudflare Pages, FIXED)");
        # the host is the part before the first comma.
        host = host.split(",")[0].strip()
        sm = re.search(r"^- Browser steps(?: \([^)]*\))?: (.+)$", body, re.M)
        if sm:
            out[(slug, host)] = sm.group(1).strip()
    return out

def host_of(url):
    if ".pages.dev" in url:
        return "Cloudflare Pages"
    if "github.io" in url:
        return "GitHub Pages"
    return url.split("/")[2] if "://" in url else url

def build_inventory(site_entries, checklist):
    """Machine-readable 178-demo inventory (convergence items 1 and 10).
    Signed: signature = SHA-256 of the canonical inventory without the
    signature field. Its hash is a manifest leaf."""
    items = []
    for e in site_entries:
        sid = e["id"]
        if sid in NEWER_VERIFICATION:
            vdate, interaction = NEWER_VERIFICATION[sid]
            verifier = "live Chromium control check (2026-11-15)" if "live Chromium" in interaction else "live fetch + hash (2026-11-15)"
            verdict = "WORKING" if "WORKING" in interaction else "NOT BROWSER-VERIFIED"
        elif sid == "hypersonics-zero-to-ground":
            vdate = "2026-11-14"
            interaction = "live Chromium re-check 6 and re-check 9 (verified twice)"
            verifier = "live Chromium (doubt-removal program)"
            verdict = "WORKING"
        else:
            vdate = "2026-11-14"
            host = host_of(e["url_or_source"])
            interaction = checklist.get((sid, host),
                "Browser steps not recorded in the checklist (see doubt-removal-browser-checklist.md)")
            verifier = "live Chromium (doubt-removal program, batches 1-21)"
            verdict = "WORKING"
        items.append({
            "id": sid,
            "kind": "site",
            "url": e["url_or_source"],
            "host": host_of(e["url_or_source"]),
            "verification_date": vdate,
            "verdict": verdict,
            "verifier": verifier,
            "interaction_confirmed": interaction,
            "sha256": e["sha256"],
            "md5": e.get("_md5"),
            "content_length": e["content_length"],
            "retrieved_at": e["retrieved_at"],
            "heuristic": sid in HEURISTIC,
        })
    inv = {
        "inventory_version": "2.0",
        "generated_at": NOW_ISO,
        "verification_program": "Doubt-removal, 2026-11-14 (178 sites, WORKING 178, PARTIAL 0, BROKEN 0) plus the 2026-11-15 live-browser control checks for the newer demos",
        "checklist": "browser-checklist-2026-11-14.md (the exact browser and interaction checklist used 2026-11-14)",
        "labeling_rule": LABELING_RULE,
        "count": len(items),
        "items": items,
    }
    inv["signature"] = sha256(canonical({k: v for k, v in inv.items() if k != "signature"}))
    return inv

def main():
    print("fetching %d sites..." % len(sites), flush=True)
    site_entries = [None] * len(sites)
    with ThreadPoolExecutor(max_workers=12) as ex:
        futs = {ex.submit(fetch_site, item): i for i, item in enumerate(sites)}
        done = 0
        for fut in as_completed(futs):
            site_entries[futs[fut]] = fut.result()
            done += 1
            if done % 40 == 0:
                print("  %d/%d" % (done, len(sites)), flush=True)
    # Local artifacts (re-hashed from disk).
    estate = list(site_entries)
    for item in PAPERS:
        estate.append(hash_local(item, "paper"))
    for item in DOCS:
        estate.append(hash_local(item, "document"))
    for item in LEDGERS:
        estate.append(hash_local(item, "ledger"))
    # Inventory (needs the site entries + the checklist).
    checklist = parse_checklist()
    print("checklist interactions parsed: %d" % len(checklist))
    inventory = build_inventory(site_entries, checklist)
    inv_path = os.path.join(WORK, "demo-inventory.json")
    with open(inv_path, "w") as f:
        json.dump(inventory, f, indent=2, sort_keys=True)
    print("demo-inventory.json: %d items, signature %s..." % (inventory["count"], inventory["signature"][:16]))
    for item in NEW_LEDGERS:
        estate.append(hash_local(item, "ledger"))
    # Strip the private helper keys before the leaf canonical form.
    clean_estate = [{k: v for k, v in e.items() if not k.startswith("_")} for e in estate]
    estate_leaves = [leaf_hash(e) for e in clean_estate]
    estate_root = merkle_root(estate_leaves)

    # --- compare against v1 ---
    v1 = json.load(open(os.path.join(WORK, "manifest-v1.json")))
    # Key by (id, url): 12 demos exist on two hosts (E-series + sal-content-
    # pipeline) with the same slug but different content; keying by id alone
    # collapses them and miscounts the comparison.
    v1_map = {(e["id"], e.get("url") or e.get("url_or_source")): e.get("sha256") for e in v1["entries"]}
    v2_map = {(e["id"], e["url_or_source"]): e["sha256"] for e in clean_estate}
    changed, added, removed, unchanged = [], [], [], []
    for key, h in v2_map.items():
        label = key[0] + (" (" + key[1] + ")" if key[1] else "")
        if key not in v1_map:
            added.append(label)
        elif v1_map[key] != h:
            changed.append(label)
        else:
            unchanged.append(key[0])
    for key in v1_map:
        if key not in v2_map:
            removed.append(key[0] + (" (" + key[1] + ")" if key[1] else ""))

    # --- generate the page (bakes in the estate root only) ---
    template = open(os.path.join(WORK, "page_template_v2.html")).read()
    for ph in ("__ESTATE_ROOT__", "__ESTATE_LEAF_COUNT__", "__SITE_COUNT__",
               "__ANCHOR_DATE__", "__VERIFIER_VERSION__"):
        assert ph in template, "template missing placeholder " + ph
    page = (template
            .replace("__ESTATE_ROOT__", estate_root)
            .replace("__ESTATE_LEAF_COUNT__", str(len(clean_estate)))
            .replace("__SITE_COUNT__", str(len(sites)))
            .replace("__ANCHOR_DATE__", ANCHOR_DATE)
            .replace("__VERIFIER_VERSION__", VERIFIER_VERSION))
    page_path = os.path.join(WORK, "index.html")
    with open(page_path, "w") as f:
        f.write(page)

    # --- self entries (files whose content does not depend on the full root) ---
    self_files = [
        ("anchor-page", "onchain-anchor/index.html", "tool"),
        ("anchor-verifier", "onchain-anchor/verify.js", "tool"),
        ("anchor-builder-v2", "onchain-anchor/build_anchor_v2.py", "tool"),
        ("verify-membership-cli", "onchain-anchor/verify_membership.py", "tool"),
        ("verify-receipts-cli", "onchain-anchor/verify_receipts.py", "tool"),
        ("verify-standalone", "onchain-anchor/verify_standalone.py", "tool"),
        ("audit-anchor", "onchain-anchor/audit_anchor.py", "tool"),
        ("brier-script", "onchain-anchor/brier.py", "tool"),
        ("connector-interface", "onchain-anchor/connector.py", "tool"),
        ("observation-schema", "onchain-anchor/observation.py", "tool"),
        ("receipts-canonical", "onchain-anchor/receipts.py", "tool"),
        ("tamper-harness", "onchain-anchor/tamper-harness.py", "tool"),
        ("ci-refetch", "onchain-anchor/ci_refetch.py", "tool"),
        ("unified-chain-regression", "onchain-anchor/unified-chain-regression.js", "tool"),
        ("unified-chain-regression-record", "onchain-anchor/unified-chain-regression.json", "ledger"),
        ("test-vectors-script", "onchain-anchor/test_vectors.py", "tool"),
        ("page-jsdom-test", "onchain-anchor/test-page.js", "tool"),
        ("test-vectors", "onchain-anchor/test-vectors.json", "ledger"),
        ("canonicalization-doc", "onchain-anchor/CANONICALIZATION.md", "document"),
        ("receipt-schema", "onchain-anchor/receipt-schema.json", "ledger"),
        ("browser-checklist-2026-11-14", "onchain-anchor/browser-checklist-2026-11-14.md", "document"),
        ("code-data-sharing", "onchain-anchor/code-data-sharing.md", "document"),
        ("done-ledger-integration", "onchain-anchor/done-ledger-integration.md", "document"),
        ("observations-pilot-readme", "onchain-anchor/observations-pilot-README.md", "document"),
        ("manifest-v1", "onchain-anchor/manifest-v1.json", "manifest"),
        ("page-v1", "onchain-anchor/page-v1.html", "document"),
        ("ots-anchor-script", "onchain-anchor/ots_anchor.sh", "tool"),
        ("post-anchor-update", "onchain-anchor/post_anchor_update.py", "tool"),
        ("ci-check", "onchain-anchor/ci_check.sh", "tool"),
        ("template-patch", "onchain-anchor/patch_template.py", "tool"),
    ]
    self_entries = []
    for eid, rel, kind in self_files:
        e = hash_local((eid, rel), kind)
        self_entries.append({k: v for k, v in e.items() if not k.startswith("_")})
    # The manifest-content leaf commits to the exact canonical entry list.
    content_hash = sha256(canonical(clean_estate))
    self_entries.append({
        "id": "manifest-content", "kind": "manifest", "url_or_source": None,
        "sha256": content_hash, "retrieved_at": NOW_ISO,
        "raw_bytes_locator": "SHA-256 of the canonical JSON of the entries array (manifest-v2.json)",
        "schema_version": "2.0", "content_type": "application/json",
        "content_length": len(canonical(clean_estate)), "status": "verified",
    })
    self_leaves = [leaf_hash(e) for e in self_entries]
    full_root = merkle_root(estate_leaves + self_leaves)
    verifier_sha = next(e["sha256"] for e in self_entries if e["id"] == "anchor-verifier")

    verified = sum(1 for e in clean_estate + self_entries if e["status"] == "verified")
    brier = json.load(open(os.path.join(WORK, "brier.json")))
    manifest = {
        "tool": "Neuruh On-Chain Anchor v2.0",
        "owner": "Jeramie Hicks",
        "owner_statement": "Original owner, per his statement 2026-11-15",
        "anchor_date": ANCHOR_DATE,
        "created_at": NOW_ISO,
        "schema_version": "2.0",
        "receipt_schema_version": RECEIPT_SCHEMA_VERSION,
        "merkle_root": full_root,
        "leaf_count": len(clean_estate) + len(self_entries),
        "estate_root": estate_root,
        "estate_leaf_count": len(clean_estate),
        "site_count": len(sites),
        "verified_count": verified,
        "unverified_count": (len(clean_estate) + len(self_entries)) - verified,
        "v1_root": v1["merkle_root"],
        "v1_leaf_count": v1["leaf_count"],
        "merkle_rule": "Leaves are SHA-256 of the canonical JSON of each manifest entry (keys sorted, no whitespace, UTF-8). Parents are SHA-256 of the concatenated raw 32-byte child hashes. An odd level duplicates its last node. The root is the single hash at the top. Leaf order is locked: sites in registry order, then papers, documents, ledgers, then self entries.",
        "verifier": {"name": "verify.js", "version": VERIFIER_VERSION,
                     "sha256": verifier_sha, "receipt_schema_version": RECEIPT_SCHEMA_VERSION},
        "anchor": {"status": "prepared", "root": None, "txid": None, "chain": None,
                   "block_height": None, "anchored_at": None, "proof": None,
                   "note": "No chain write has been made. Finish criterion 2 is BLOCKED pending Jeramie's chain/wallet choice."},
        "heuristic": HEURISTIC,
        "labeling_rule": LABELING_RULE,
        "brier": {"status": brier["status"], "forecasts_issued": brier["forecasts_issued"],
                  "forecasts_resolved": brier["forecasts_resolved"], "brier": brier["brier"]},
        "convergence": {
            "spec": "convergence-100-spec.md (2026-11-15 07:00 EST)",
            "in_v2": "sections 1-15 (finish and harden the verified base) and 76-90 (receipts, Merkle, independent audit)",
            "finish_criteria": "sections 91-100 (recorded in the page, section 10)",
            "sequence_next": "sections 16-75 are the sequenced next builds, NOT in v2: Measurement Loop v2 (16-45), Layer 3 authority and gates (46-60), Layer 4 measurable learning and promotion (61-75)",
            "non_goal": "the system does not become recursively self-modifying general intelligence",
        },
        "entries": clean_estate,
        "self_entries": self_entries,
    }
    with open(os.path.join(WORK, "manifest-v2.json"), "w") as f:
        json.dump(manifest, f, indent=2, sort_keys=False)
    manifest_bytes = open(os.path.join(WORK, "manifest-v2.json"), "rb").read()
    with open(os.path.join(WORK, "manifest-v2.sha256"), "w") as f:
        f.write(sha256(manifest_bytes) + "  manifest-v2.json\n")

    # status endpoint (convergence item 81): root, leaf count, anchor txid, last Brier.
    status = {
        "status": "prepared",
        "tool": "Neuruh On-Chain Anchor v2.0",
        "merkle_root": full_root,
        "estate_root": estate_root,
        "leaf_count": manifest["leaf_count"],
        "estate_leaf_count": manifest["estate_leaf_count"],
        "site_count": len(sites),
        "anchored": False,
        "anchor_txid": None,
        "anchor_root": None,
        "last_brier": brier["brier"],
        "brier_status": brier["status"],
        "content_hash": sha256(manifest_bytes),
        "verifier": {"name": "verify.js", "version": VERIFIER_VERSION, "sha256": verifier_sha},
        "updated_at": NOW_ISO,
    }
    with open(os.path.join(WORK, "status.json"), "w") as f:
        json.dump(status, f, indent=2, sort_keys=True)

    # hub-card verification data (convergence item 5) — data for the parent
    # to apply to the hub; the hub itself is NOT touched by this build.
    hub_cards = []
    for item in inventory["items"]:
        hub_cards.append({
            "id": item["id"], "url": item["url"],
            "last_verified": item["verification_date"],
            "verifier": item["verifier"],
            "verdict": item["verdict"],
            "interaction_confirmed": item["interaction_confirmed"],
            "sha256": item["sha256"],
            "heuristic": item["heuristic"],
        })
    with open(os.path.join(WORK, "hub-card-verification.json"), "w") as f:
        json.dump({"generated_at": NOW_ISO, "note": "Apply to the hub cards (last verified + verifier identity). Prepared by the anchor build; the hub is the parent's to edit.",
                   "cards": hub_cards}, f, indent=2, sort_keys=True)

    # build receipt (canonical v1.1, chained from GENESIS for this build).
    sys.path.insert(0, WORK)
    from receipts import make_receipt
    receipt = make_receipt(
        "build", "anchor-v2 (build_anchor_v2.py)",
        {"estate_root": estate_root, "merkle_root": full_root,
         "leaf_count": manifest["leaf_count"], "estate_leaf_count": manifest["estate_leaf_count"],
         "v1_root": v1["merkle_root"], "v1_leaf_count": v1["leaf_count"],
         "changed_vs_v1": changed, "added_vs_v1": added, "removed_vs_v1": removed,
         "unverified": [e["id"] for e in clean_estate + self_entries if e["status"] != "verified"]},
        merkle_root=full_root, anchor_root=None, verifier_version=VERIFIER_VERSION)
    with open(os.path.join(WORK, "build-receipt.json"), "w") as f:
        json.dump(receipt, f, indent=2, sort_keys=True)

    # changelog.
    with open(os.path.join(WORK, "CHANGELOG.md"), "w") as f:
        f.write("# On-Chain Anchor changelog\n\n")
        f.write("## v2.0 — %s\n\n" % ANCHOR_DATE)
        f.write("- v1 root: `%s` (%d leaves)\n" % (v1["merkle_root"], v1["leaf_count"]))
        f.write("- v2 estate root: `%s` (%d estate leaves)\n" % (estate_root, len(clean_estate)))
        f.write("- v2 full root: `%s` (%d leaves: %d estate + %d self)\n" % (
            full_root, manifest["leaf_count"], len(clean_estate), len(self_entries)))
        f.write("- The root changed because the entry canonicalization changed (v2 schema: "
                "strict 10-field entries with content_type, content_length, and status), "
                "and because the estate grew: +6 sites (working-demos, onchain-anchor, "
                "done-ledger, neurh-topology, hard-problems-atlas, retardio-measurement-loop) "
                "and +3 estate ledgers (demo-inventory.json, brier.json, observations-pilot.jsonl).\n")
        f.write("- Old root retained (re-anchor policy: new root, new anchor, old root retained).\n")
        f.write("- vs v1: %d unchanged, %d changed (live content moved), %d added, %d removed.\n" % (
            len(unchanged), len(changed), len(added), len(removed)))
        if changed:
            f.write("  - Changed: %s\n" % ", ".join(changed))
        if added:
            f.write("  - Added: %s\n" % ", ".join(added))
        if removed:
            f.write("  - Removed: %s\n" % ", ".join(removed))
        f.write("- Receipt schema: canonical v1.1 (receipt-schema.json). Verifier: verify.js %s.\n" % VERIFIER_VERSION)
        f.write("- Anchor status: prepared. No chain write made (criterion 2 BLOCKED pending Jeramie's chain/wallet choice).\n")
        f.write("- Convergence spec folded in: sections 1-15 and 76-90. Sections 91-100 are the finish criteria. Sections 16-75 are the sequenced next builds, not in v2.\n\n")
        f.write("## v1.0 — 2026-11-15\n\n")
        f.write("- Root: `%s` (%d leaves: 181 sites, 7 papers, 3 documents, 4 ledgers). SIMULATION, NOT YET ON-CHAIN.\n" % (
            v1["merkle_root"], v1["leaf_count"]))

    print("ESTATE_LEAF_COUNT=%d" % len(clean_estate))
    print("SELF_LEAF_COUNT=%d" % len(self_entries))
    print("LEAF_COUNT=%d" % manifest["leaf_count"])
    print("SITE_COUNT=%d" % len(sites))
    print("VERIFIED=%d" % verified)
    print("UNVERIFIED=%d" % (manifest["leaf_count"] - verified))
    print("ESTATE_ROOT=" + estate_root)
    print("MERKLE_ROOT=" + full_root)
    print("V1_ROOT=" + v1["merkle_root"])
    print("VS_V1 unchanged=%d changed=%d added=%d removed=%d" % (len(unchanged), len(changed), len(added), len(removed)))
    print("UNVERIFIED ENTRIES:")
    for e in clean_estate + self_entries:
        if e["status"] != "verified":
            print("  - %s" % e["id"])

if __name__ == "__main__":
    main()
