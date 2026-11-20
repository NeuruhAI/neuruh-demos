#!/usr/bin/env python3
"""Merge a LoRA adapter into its base model and save the merged weights.

The merged model is the artifact that gets converted to GGUF for Ollama
(see RUNBOOK.md). Merging is done on CPU here; on the Mac it runs the
same way with MPS available.

Usage:
  python3 merge_and_export.py --base Qwen/Qwen2.5-0.5B --adapter runs/v1 --out merged/neuruh-v2
No em dashes anywhere in this file.
"""
import argparse
import os
import sys

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="Qwen/Qwen2.5-0.5B")
    ap.add_argument("--adapter", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    dtype = torch.bfloat16 if torch.backends.mps.is_available() or torch.cuda.is_available() else torch.float32
    tokenizer = AutoTokenizer.from_pretrained(args.base)
    model = AutoModelForCausalLM.from_pretrained(args.base, dtype=dtype)
    model = PeftModel.from_pretrained(model, args.adapter)
    merged = model.merge_and_unload()
    merged.save_pretrained(args.out)
    tokenizer.save_pretrained(args.out)
    print(f"merged model saved to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
