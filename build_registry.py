#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(".")
SKIP = {".git", "node_modules", ".venv", "__pycache__", "os"}
HUB_SLUGS = {
    "working-demos", "everything-built-here", "master-map",
    "neurh-hub", "neuruh-command-center", "neuruh-nexus", "the-ecosystem"
}
DOC_SLUGS = {
    "drive-pull", "distribution-library", "neuruh-codex", "agent-first-docs",
    "ask-the-brain", "vault-overview", "reference-library", "aaas-system-canon"
}
MEDIA_SLUGS = {"newstyle-gallery", "component-library-gallery"}


def classify(slug: str, files: list[Path]) -> str:
    if slug in HUB_SLUGS:
        return "HUB_INDEX"
    if slug in DOC_SLUGS or slug.endswith("-master") or slug.endswith("-report"):
        return "CORPUS_DOC"
    if slug in MEDIA_SLUGS:
        return "MEDIA_ASSET"
    has_js = any(f.suffix == ".js" and "test" not in f.name for f in files)
    has_test = any("test" in f.name and f.suffix == ".js" for f in files)
    if re.match(r"^e\d+-", slug) or (has_js and has_test):
        return "ENGINE"
    if any(k in slug for k in ("swarm", "ncell", "governance", "crucible", "agent-first", "onchain", "done-ledger", "unified-chain")):
        return "GOVERNANCE_SIM"
    return "LAB"


def main() -> None:
    modules = []
    for d in sorted(p for p in ROOT.iterdir() if p.is_dir() and p.name not in SKIP and not p.name.startswith(".")):
        index_html = d / "index.html"
        if not index_html.exists():
            continue
        files = [p for p in d.rglob("*") if p.is_file()]
        text = index_html.read_text(errors="ignore")
        title_m = re.search(r"<title>(.*?)</title>", text, re.S | re.I)
        title = re.sub(r"\s+", " ", title_m.group(1)).strip() if title_m else d.name
        has_receipts = ("GENESIS" in text) or any("GENESIS" in f.read_text(errors="ignore") for f in files if f.suffix == ".js")
        has_tests = any("test" in f.name and f.suffix in {".js", ".py"} for f in files)
        modules.append({
            "slug": d.name,
            "title": title,
            "path": f"../{d.name}/",
            "category": classify(d.name, files),
            "file_count": len(files),
            "total_bytes": sum(f.stat().st_size for f in files),
            "receipts": has_receipts,
            "tests": has_tests,
        })

    summary = {}
    for m in modules:
        summary[m["category"]] = summary.get(m["category"], 0) + 1

    out = {"schema": "neuruh-registry.v1", "total_modules": len(modules), "by_category": summary, "modules": modules}
    Path("system-registry.json").write_text(json.dumps(out, indent=2))
    print(json.dumps({"total_modules": len(modules), "by_category": summary}, indent=2))


if __name__ == "__main__":
    main()
