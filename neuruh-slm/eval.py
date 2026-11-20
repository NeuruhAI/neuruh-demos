#!/usr/bin/env python3
"""Eval harness for the Neuruh SLM.

Builds held-out Q&A pairs from the corpus EVAL split (docs the trainer
never saw), generates answers greedily from the base model plus the LoRA
adapter, and scores keyword recall: the fraction of the expected answer's
content words that appear in the generated text.

This is a proxy metric, not a benchmark. It answers one question only:
did training on the corpus move the model toward the corpus answers?
A score near the base-model score means no learning; a score clearly
above it means the adapter is pulling answers from the training data.

Usage:
  python3 eval.py --base Qwen/Qwen2.5-0.5B --adapter runs/v1 --limit 20
  python3 eval.py --base Qwen/Qwen2.5-0.5B --adapter runs/v1 --base-only
No em dashes anywhere in this file.
"""
import argparse
import json
import os
import re
import sys

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

STOP = set("the a an and or of to in on for is are was were what who when where which does do is it its this that with from about as by at be been has have had".split())


def content_words(text):
    words = re.findall(r"[a-z0-9][a-z0-9\-']*", text.lower())
    return {w.strip("-'") for w in words if w not in STOP and len(w) > 2}


def build_eval_pairs(corpus_docs, limit):
    pairs = []
    with open(corpus_docs, encoding="utf-8") as fh:
        for line in fh:
            doc = json.loads(line)
            if doc.get("split") != "eval":
                continue
            text = doc["text"]
            summary = text[:600].rsplit(" ", 1)[0].strip()
            if len(summary) < 40:
                continue
            pairs.append({
                "instruction": f"What is {doc['title']}?",
                "expected": summary,
                "doc_id": doc["doc_id"],
            })
            if len(pairs) >= limit:
                break
    return pairs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="Qwen/Qwen2.5-0.5B")
    ap.add_argument("--adapter", default=None)
    ap.add_argument("--base-only", action="store_true")
    ap.add_argument("--corpus", default=os.path.expanduser("~/workspace/neuruh-slm/corpus/corpus_docs.jsonl"))
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--max-new-tokens", type=int, default=80)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    device = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
    dtype = torch.bfloat16 if device in ("cuda", "mps") else torch.float32
    tokenizer = AutoTokenizer.from_pretrained(args.base)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained(args.base, dtype=dtype)
    if args.adapter and not args.base_only:
        model = PeftModel.from_pretrained(model, args.adapter)
        print(f"adapter loaded: {args.adapter}")
    model.to(device)
    model.eval()

    pairs = build_eval_pairs(args.corpus, args.limit)
    print(f"eval pairs: {len(pairs)}")
    results = []
    total = 0.0
    for pair in pairs:
        prompt = f"### Instruction:\n{pair['instruction']}\n\n### Response:\n"
        ids = tokenizer(prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            out = model.generate(**ids, max_new_tokens=args.max_new_tokens,
                                 do_sample=False, pad_token_id=tokenizer.pad_token_id)
        gen = tokenizer.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()
        expected_words = content_words(pair["expected"])
        gen_words = content_words(gen)
        score = len(expected_words & gen_words) / max(1, len(expected_words))
        total += score
        results.append({"instruction": pair["instruction"], "doc_id": pair["doc_id"],
                        "score": round(score, 3), "generated": gen[:400]})
        print(f"{score:.3f}  {pair['instruction']}")
    mean = total / max(1, len(results))
    print(f"mean keyword recall: {mean:.3f} over {len(results)} pairs")
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump({"mean_keyword_recall": round(mean, 3), "n": len(results),
                       "base": args.base, "adapter": args.adapter,
                       "base_only": args.base_only, "results": results}, fh, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
