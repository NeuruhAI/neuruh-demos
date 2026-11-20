#!/usr/bin/env python3
"""Neuruh SLM corpus builder (v1, 2026-11-20).

Builds a clean training/retrieval corpus (JSONL) from three sources:
  A. the Retardio Library seed index (1,104 records, Nov 19 audit),
  B. the Obsidian vault markdown notes (original vault, not the build dir),
  C. full text behind seed records' local_path files (.md/.txt/.html, <2 MB).

Rules, all stated here so a re-run reproduces the same corpus:
  - One doc per seed record; local_path full text is appended when the file
    exists and is readable text. Records with no usable text are excluded.
  - One doc per vault .md file, except the 13-Seed-Library layer (it is a
    mechanical copy of the seed index, so including it would duplicate A),
    .obsidian internals, and _build scripts.
  - Dedup: normalized-content hash first; a vault doc whose body is a
    near-duplicate of a seed doc (same title, casefolded) is dropped, and
    a vault file that is already a seed record's local_path target is
    skipped outright (it is already in the corpus inside that seed doc).
  - Per-doc cap: no doc contributes more than 200,000 characters, so a
    handful of megabyte file-listing inventories cannot dominate the
    corpus. The cap is applied after the secret scan, never before it.
  - Secrets: any doc matching a secret pattern (API keys, tokens, private
    key blocks, Bearer values) is EXCLUDED and counted, never included.
  - Chunking: docs are split on paragraph boundaries into chunks of at
    most 1200 characters. Each chunk carries its doc metadata.
  - Train/eval split is at the DOC level (hash of doc_id, 5% eval) so no
    doc leaks chunks across the split.
  - Token estimate: words x 1.33 fallback; exact Qwen2.5 tokenizer count
    when transformers is importable.

Re-runnable: `python3 build_corpus.py [--out DIR] [--tokenizer NAME]`.
Outputs: corpus_docs.jsonl, corpus.jsonl, corpus_stats.json,
corpus_exclusions.json. No em dashes anywhere in this file or its outputs.
"""
import argparse
import hashlib
import json
import os
import re
import sys
from html.parser import HTMLParser

SEED_INDEX = os.path.expanduser("~/workspace/retardio-library/seed-index.json")
VAULT_DIR = os.path.expanduser("~/workspace/neuruh-obsidian-vault")
WORKSPACE = os.path.expanduser("~/workspace")

MAX_CHUNK = 1200
EVAL_FRACTION = 0.05
MAX_LOCAL_BYTES = 2_000_000
MAX_DOC_CHARS = 200_000

SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{16,}"),
    re.compile(r"sk_live_[A-Za-z0-9]{8,}"),
    re.compile(r"sk_test_[A-Za-z0-9]{8,}"),
    re.compile(r"pk_live_[A-Za-z0-9]{8,}"),
    re.compile(r"pk_test_[A-Za-z0-9]{8,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"Bearer [A-Za-z0-9_\-.]{20,}"),
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
    re.compile(r"[A-Za-z0-9_]*?(?:api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9_\-./+]{16,}['\"]", re.I),
]


class TextExtractor(HTMLParser):
    """Visible-text extractor: drops script/style, keeps body text."""

    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "noscript"):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self.skip:
            self.skip -= 1
        if tag in ("p", "div", "section", "article", "h1", "h2", "h3", "h4", "li", "tr"):
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

    def text(self):
        raw = "".join(self.parts)
        return re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n\n", raw)).strip()


def strip_frontmatter(text):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4 :].lstrip()
    return text


def clean_text(text):
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def looks_secret(text):
    return any(p.search(text) for p in SECRET_PATTERNS)


def norm_hash(text):
    norm = re.sub(r"\s+", " ", text.lower()).strip()
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()[:16]


def extract_local_text(path):
    """Return (text, kind) for a readable local file, or (None, reason)."""
    try:
        size = os.path.getsize(path)
    except OSError:
        return None, "missing"
    if size > MAX_LOCAL_BYTES:
        return None, "too-large"
    ext = os.path.splitext(path)[1].lower().strip("`")
    try:
        with open(path, "rb") as fh:
            raw = fh.read()
    except OSError:
        return None, "unreadable"
    if ext in (".md", ".txt", ".py", ".js", ".sh", ".csv"):
        text = raw.decode("utf-8", errors="ignore")
        return clean_text(strip_frontmatter(text)), "text"
    if ext == ".html":
        parser = TextExtractor()
        try:
            parser.feed(raw.decode("utf-8", errors="ignore"))
        except Exception:
            return None, "html-parse-failed"
        return clean_text(parser.text()), "html"
    return None, "unsupported-ext-" + (ext or "none")


def chunk_doc(text, max_chars=MAX_CHUNK):
    """Split on paragraph boundaries into chunks of at most max_chars."""
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    current = ""
    for para in paras:
        if len(current) + len(para) + 2 <= max_chars:
            current = (current + "\n\n" + para).strip() if current else para
        else:
            if current:
                chunks.append(current)
            while len(para) > max_chars:
                cut = para.rfind(" ", 0, max_chars)
                cut = cut if cut > max_chars // 2 else max_chars
                chunks.append(para[:cut].strip())
                para = para[cut:].strip()
            current = para
    if current:
        chunks.append(current)
    return chunks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.expanduser("~/workspace/neuruh-slm/corpus"))
    ap.add_argument("--tokenizer", default="Qwen/Qwen2.5-0.5B")
    ap.add_argument("--no-tokenizer", action="store_true")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    with open(SEED_INDEX, encoding="utf-8") as fh:
        seed = json.load(fh)
    records = seed if isinstance(seed, list) else seed.get("records", [])

    docs = []
    exclusions = []
    stats = {
        "seed_records": len(records),
        "seed_docs": 0,
        "seed_expanded_local": 0,
        "seed_local_missing": 0,
        "seed_local_unsupported": 0,
        "vault_files_seen": 0,
        "vault_docs": 0,
        "vault_skipped_seed_library": 0,
        "vault_skipped_seed_local": 0,
        "vault_skipped_short": 0,
        "vault_skipped_duplicate": 0,
        "excluded_secret": 0,
        "excluded_empty": 0,
    }

    seed_titles = set()
    seen_hashes = set()
    seed_local_files = set()
    for rec in records:
        lp = (rec.get("local_path") or "").replace("`", "").strip()
        if lp:
            seed_local_files.add(os.path.normpath(os.path.expanduser(lp)))

    for rec in records:
        parts = []
        title = (rec.get("title") or "").strip()
        for key in ("summary", "seed_notes", "notes"):
            val = (rec.get(key) or "").strip()
            if val:
                parts.append(val)
        text = clean_text("\n\n".join(parts))
        expanded = False
        local_path = (rec.get("local_path") or "").replace("`", "").strip()
        if local_path:
            full = os.path.expanduser(local_path)
            if os.path.isfile(full):
                full_text, kind = extract_local_text(full)
                if full_text and len(full_text) > 100:
                    text = clean_text(text + "\n\n" + full_text) if text else full_text
                    expanded = True
                    stats["seed_expanded_local"] += 1
                else:
                    stats["seed_local_unsupported"] += 1
            else:
                stats["seed_local_missing"] += 1
        if not text or len(text) < 50:
            exclusions.append({"id": rec.get("id"), "source": "seed", "reason": "empty-or-too-short"})
            stats["excluded_empty"] += 1
            continue
        if looks_secret(text):
            exclusions.append({"id": rec.get("id"), "source": "seed", "reason": "secret-pattern"})
            stats["excluded_secret"] += 1
            continue
        if len(text) > MAX_DOC_CHARS:
            text = text[:MAX_DOC_CHARS] + "\n\n[truncated at 200,000 chars]"
        h = norm_hash(text)
        if h in seen_hashes:
            exclusions.append({"id": rec.get("id"), "source": "seed", "reason": "duplicate"})
            continue
        seen_hashes.add(h)
        seed_titles.add(title.casefold())
        docs.append({
            "doc_id": "seed:" + str(rec.get("id")),
            "title": title,
            "chapter": rec.get("chapter"),
            "type": rec.get("type"),
            "state": rec.get("state"),
            "live_url": rec.get("live_url"),
            "source": "seed-index",
            "expanded_local": expanded,
            "text": text,
        })
        stats["seed_docs"] += 1

    for root, dirs, files in os.walk(VAULT_DIR):
        dirs[:] = sorted(d for d in dirs if d not in (".obsidian", "_build", "node_modules"))
        for fname in sorted(files):
            if not fname.endswith(".md"):
                continue
            full = os.path.join(root, fname)
            rel = os.path.relpath(full, VAULT_DIR)
            stats["vault_files_seen"] += 1
            if rel.startswith("13-Seed-Library"):
                stats["vault_skipped_seed_library"] += 1
                continue
            if os.path.normpath(full) in seed_local_files:
                stats["vault_skipped_seed_local"] += 1
                continue
            try:
                with open(full, encoding="utf-8", errors="ignore") as fh:
                    raw = fh.read()
            except OSError:
                continue
            text = clean_text(strip_frontmatter(raw))
            if len(text) < 200:
                stats["vault_skipped_short"] += 1
                continue
            if looks_secret(text):
                exclusions.append({"id": rel, "source": "vault", "reason": "secret-pattern"})
                stats["excluded_secret"] += 1
                continue
            if len(text) > MAX_DOC_CHARS:
                text = text[:MAX_DOC_CHARS] + "\n\n[truncated at 200,000 chars]"
            title = ""
            for line in text.split("\n"):
                if line.startswith("# "):
                    title = line[2:].strip()
                    break
            if not title:
                title = os.path.splitext(fname)[0].replace("-", " ")
            h = norm_hash(text)
            if h in seen_hashes or title.casefold() in seed_titles:
                stats["vault_skipped_duplicate"] += 1
                continue
            seen_hashes.add(h)
            docs.append({
                "doc_id": "vault:" + rel,
                "title": title,
                "chapter": rel.split("/")[0],
                "type": "vault-note",
                "state": None,
                "live_url": None,
                "source": "obsidian-vault",
                "expanded_local": False,
                "text": text,
            })
            stats["vault_docs"] += 1

    # Doc-level train/eval split: deterministic, 5% eval.
    chunks = []
    total_chars = 0
    total_words = 0
    for doc in docs:
        split = "eval" if int(hashlib.sha256(doc["doc_id"].encode()).hexdigest(), 16) % 20 == 0 else "train"
        doc["split"] = split
        total_chars += len(doc["text"])
        total_words += len(doc["text"].split())
        body = "TITLE: " + doc["title"] + "\n\n" + doc["text"]
        for i, piece in enumerate(chunk_doc(body)):
            chunks.append({
                "chunk_id": doc["doc_id"] + "#c" + str(i),
                "doc_id": doc["doc_id"],
                "title": doc["title"],
                "chapter": doc["chapter"],
                "type": doc["type"],
                "state": doc["state"],
                "live_url": doc["live_url"],
                "source": doc["source"],
                "split": split,
                "text": piece,
            })

    stats["docs_total"] = len(docs)
    stats["docs_train"] = sum(1 for d in docs if d["split"] == "train")
    stats["docs_eval"] = sum(1 for d in docs if d["split"] == "eval")
    stats["chunks_total"] = len(chunks)
    stats["chunks_train"] = sum(1 for c in chunks if c["split"] == "train")
    stats["chunks_eval"] = sum(1 for c in chunks if c["split"] == "eval")
    stats["total_chars"] = total_chars
    stats["total_words"] = total_words
    stats["token_estimate_words_x_1_33"] = int(total_words * 1.33)
    stats["tokenizer"] = None
    stats["tokens_exact"] = None
    if not args.no_tokenizer:
        try:
            from transformers import AutoTokenizer

            tok = AutoTokenizer.from_pretrained(args.tokenizer)
            n = 0
            for doc in docs:
                n += len(tok(doc["text"])["input_ids"])
            stats["tokenizer"] = args.tokenizer
            stats["tokens_exact"] = n
        except Exception as exc:  # noqa: BLE001 - tokenizer is optional
            stats["tokenizer_error"] = str(exc)[:200]

    with open(os.path.join(args.out, "corpus_docs.jsonl"), "w", encoding="utf-8") as fh:
        for doc in docs:
            fh.write(json.dumps(doc, ensure_ascii=False) + "\n")
    with open(os.path.join(args.out, "corpus.jsonl"), "w", encoding="utf-8") as fh:
        for chunk in chunks:
            fh.write(json.dumps(chunk, ensure_ascii=False) + "\n")
    with open(os.path.join(args.out, "corpus_stats.json"), "w", encoding="utf-8") as fh:
        json.dump(stats, fh, indent=2)
    with open(os.path.join(args.out, "corpus_exclusions.json"), "w", encoding="utf-8") as fh:
        json.dump(exclusions, fh, indent=2)

    print(json.dumps(stats, indent=2))
    print("exclusions:", len(exclusions))
    return 0


if __name__ == "__main__":
    sys.exit(main())
