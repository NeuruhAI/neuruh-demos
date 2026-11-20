#!/usr/bin/env python3
"""Format supervised fine-tuning data from the corpus (train split only).

Two sources of pairs, both grounded, nothing hallucinated:
  1. Templated pairs generated from each train doc: "What is {title}?"
     answered by the doc summary/first text, and "What is the state of
     {title}?" answered by its recorded state plus notes.
  2. Hand-written canon pairs in canon_qa.json: identity, offers, honesty
     rules, and style, each sourced from a verified record. These are the
     only hand-written examples in the file.

Output: sft_train.jsonl with {instruction, input, output, source_doc}.
The eval split is never used here; eval pairs come from eval.py reading
corpus_docs.jsonl directly. Re-runnable.
"""
import argparse
import json
import os
import sys

BASE = os.path.expanduser("~/workspace/neuruh-slm")
CANON_QA = os.path.join(BASE, "canon_qa.json")
MAX_PAIRS_PER_DOC = 2
MAX_OUTPUT_CHARS = 900


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default=os.path.join(BASE, "corpus", "corpus_docs.jsonl"))
    ap.add_argument("--out", default=os.path.join(BASE, "sft_train.jsonl"))
    ap.add_argument("--max-docs", type=int, default=1000)
    args = ap.parse_args()

    pairs = []
    n_docs = 0
    with open(args.corpus, encoding="utf-8") as fh:
        for line in fh:
            doc = json.loads(line)
            if doc.get("split") != "train":
                continue
            n_docs += 1
            if n_docs > args.max_docs:
                continue
            title = doc["title"]
            text = doc["text"]
            summary = text[:MAX_OUTPUT_CHARS].rsplit(" ", 1)[0].strip()
            if len(summary) < 40:
                continue
            pairs.append({
                "instruction": f"What is {title}?",
                "input": "",
                "output": summary,
                "source_doc": doc["doc_id"],
            })
            state = doc.get("state")
            if state:
                pairs.append({
                    "instruction": f"What is the state of {title}?",
                    "input": "",
                    "output": f"Recorded state: {state}.",
                    "source_doc": doc["doc_id"],
                })

    canon = 0
    if os.path.exists(CANON_QA):
        with open(CANON_QA, encoding="utf-8") as fh:
            for item in json.load(fh):
                pairs.append({
                    "instruction": item["instruction"],
                    "input": "",
                    "output": item["output"],
                    "source_doc": item.get("source", "canon"),
                })
                canon += 1

    with open(args.out, "w", encoding="utf-8") as fh:
        for pair in pairs:
            fh.write(json.dumps(pair, ensure_ascii=False) + "\n")
    print(f"docs used: {n_docs}, templated pairs: {len(pairs) - canon}, canon pairs: {canon}, total: {len(pairs)}")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
