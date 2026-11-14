#!/usr/bin/env python3
"""Build concepts.json for the Vault Concept Explorer from the census master list.

Source: ~/workspace/neuruh-obsidian-vault/Master-Data-List.json (246 rows).
Every row is labeled source CENSUS. Nothing is invented: fields are copied
verbatim from the master list; vault_path is derived with the vault
generator's own slug rule (build_vault.py slug(): "/" -> " - ").
Collision flags come from the 15 collision-note names on the Vault Overview
page (2026-11-14); 4 of those 15 have no census row and are NOT added as
concepts, they are listed in the page footer only.
No tier field exists in the census data, so no tier is assigned here.
"""
import json
import os
import re

VAULT = os.path.expanduser("~/workspace/neuruh-obsidian-vault")
HERE = os.path.dirname(os.path.abspath(__file__))

CATEGORIES = {
    "CORE": ("01-Core-Architecture", "Core / Architecture"),
    "RE": ("02-Real-Estate-Land", "Real Estate / Land"),
    "BIZ": ("03-Business-Operator-AI", "Business / Operator AI"),
    "RES": ("04-Resale-Collectibles", "Resale / Collectibles / Equipment"),
    "CRE": ("05-Creator-IP-Media", "Creator / IP / Media"),
    "FND": ("06-Founder-Cognitive", "Founder / Cognitive"),
    "TAX": ("07-Tax-Finance-Validation", "Tax / Finance / Validation"),
    "DEF": ("08-Defense-Infrastructure-Edge", "Defense / Infrastructure / Edge"),
    "MTH": ("09-Methods-Frameworks", "Methods / Frameworks"),
    "EXT": ("10-Additional-Systems", "Additional Historical Systems"),
}

COLLISION_NOTES = [
    "A.G.E.N.T.", "ContextOS", "DecisionOS", "Demand Radar", "FounderOS",
    "HKRS", "Knowledge Genome", "L4", "N-Observer", "PMLA", "Pulsar",
    "QCM", "ReAuditor", "Reality Compiler", "SAL",
]


def slug(name):
    s = name.replace("/", " - ").replace("\\", "-")
    s = re.sub(r'[<>:"|?*]', "", s)
    s = s.replace("  ", " ").strip()
    return s


def main():
    with open(os.path.join(VAULT, "Master-Data-List.json"), encoding="utf-8") as f:
        rows = json.load(f)
    out = []
    missing_paths = []
    for r in rows:
        prefix = r["concept_id"].split("-")[0]
        folder, section = CATEGORIES[prefix]
        vault_path = folder + "/" + slug(r["canonical_name"]) + ".md"
        if not os.path.exists(os.path.join(VAULT, vault_path)):
            missing_paths.append(vault_path)
        raw_alias = r.get("aliases") or ""
        if isinstance(raw_alias, list):
            aliases = [str(a).strip() for a in raw_alias if str(a).strip()]
        else:
            aliases = [a.strip() for a in raw_alias.split(";") if a.strip()]
        out.append({
            "id": r["concept_id"],
            "name": r["canonical_name"],
            "aliases": aliases,
            "section": section,
            "folder": folder,
            "vault_path": vault_path,
            "classification": r.get("final_classification") or "UNKNOWN",
            "runtime": r.get("current_runtime") or "UNKNOWN",
            "owner": r.get("current_owner") or "UNKNOWN",
            "source_type": r.get("source_type") or "UNKNOWN",
            "source_refs": r.get("source_refs") or "",
            "conflicts": r.get("conflicts") or "",
            "collision": r["canonical_name"] in COLLISION_NOTES,
            "source": "CENSUS",
        })
    out.sort(key=lambda c: c["id"])
    with open(os.path.join(HERE, "concepts.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("rows:", len(out))
    print("missing vault paths:", len(missing_paths), missing_paths)
    print("collision rows:", sum(1 for c in out if c["collision"]))
    print("collision notes with no census row:",
          [n for n in COLLISION_NOTES if n not in {c["name"] for c in out}])
    from collections import Counter
    print("per section:", dict(Counter(c["section"] for c in out)))
    print("distinct classifications:", len({c["classification"] for c in out}))
    print("source_type census (R14B):",
          sum(1 for c in out if "R14B" in c["source_type"]))


if __name__ == "__main__":
    main()
