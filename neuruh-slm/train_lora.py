#!/usr/bin/env python3
"""LoRA fine-tune for the Neuruh SLM.

Trains a LoRA adapter on top of a base model (default Qwen/Qwen2.5-0.5B)
using transformers + peft. Why transformers+peft and not unsloth: unsloth
is optimized for CUDA GPUs and buys nothing on Apple Silicon or CPU;
transformers+peft is the portable standard and runs on MPS and CPU.

Modes:
  --smoke    tiny CPU smoke run: 3 steps, 16 examples, seq 128. Proves the
             pipeline executes end to end. This is a smoke run, not a
             training run, and its output adapter is not a trained model.
  --dry-run  build everything (load model, attach LoRA, tokenize data),
             train 0 steps, save the config. Proves the wiring without
             any optimizer steps.
  (default)  full run: all SFT examples, configurable epochs/steps.

Hardware notes are in RUNBOOK.md. On this VM (CPU only, ~6 GB RAM) only
--smoke and --dry-run are realistic. The real run happens on Jeramie's
M1 Mac, where MPS is used automatically when available.

Usage:
  python3 train_lora.py --sft sft_train.jsonl --out runs/smoke --smoke
  python3 train_lora.py --sft sft_train.jsonl --out runs/v1 --epochs 2
No em dashes anywhere in this file.
"""
import argparse
import json
import os
import sys

import torch
from peft import LoraConfig, get_peft_model
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)

DEFAULT_MODEL = "Qwen/Qwen2.5-0.5B"
PROMPT_TEMPLATE = "### Instruction:\n{instruction}\n\n### Response:\n{output}"


def load_sft(path, limit=None):
    rows = []
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            rows.append(json.loads(line))
    if limit:
        rows = rows[:limit]
    return rows


def build_dataset(tokenizer, rows, max_len):
    import torch as _t

    class SFTDataset(_t.utils.data.Dataset):
        def __init__(self, rows):
            self.rows = rows

        def __len__(self):
            return len(self.rows)

        def __getitem__(self, i):
            r = self.rows[i]
            text = PROMPT_TEMPLATE.format(instruction=r["instruction"], output=r["output"])
            ids = tokenizer(text, truncation=True, max_length=max_len)["input_ids"]
            return {"input_ids": ids, "labels": list(ids)}

    return SFTDataset(rows)


class Collator:
    def __init__(self, pad_id):
        self.pad_id = pad_id

    def __call__(self, batch):
        maxlen = max(len(b["input_ids"]) for b in batch)
        input_ids, labels, attn = [], [], []
        for b in batch:
            ids = b["input_ids"]
            pad = maxlen - len(ids)
            input_ids.append(ids + [self.pad_id] * pad)
            labels.append(b["labels"] + [-100] * pad)
            attn.append([1] * len(ids) + [0] * pad)
        return {
            "input_ids": torch.tensor(input_ids, dtype=torch.long),
            "labels": torch.tensor(labels, dtype=torch.long),
            "attention_mask": torch.tensor(attn, dtype=torch.long),
        }


def pick_device():
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--sft", default=os.path.expanduser("~/workspace/neuruh-slm/sft_train.jsonl"))
    ap.add_argument("--out", required=True)
    ap.add_argument("--smoke", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--epochs", type=float, default=2.0)
    ap.add_argument("--max-steps", type=int, default=-1)
    ap.add_argument("--max-len", type=int, default=512)
    ap.add_argument("--lr", type=float, default=2e-4)
    ap.add_argument("--lora-r", type=int, default=8)
    ap.add_argument("--lora-alpha", type=int, default=16)
    ap.add_argument("--limit", type=int, default=None)
    args = ap.parse_args()

    if args.smoke:
        args.max_steps = 3
        args.limit = 16
        args.max_len = 128
        args.epochs = 1.0
    if args.dry_run:
        args.max_steps = 0

    device = pick_device()
    print(f"device: {device}, model: {args.model}")
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    dtype = torch.bfloat16 if device in ("cuda", "mps") else torch.float32
    model = AutoModelForCausalLM.from_pretrained(args.model, dtype=dtype)
    model.config.use_cache = False

    lora = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "v_proj"],
    )
    model = get_peft_model(model, lora)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"trainable params: {trainable:,} of {total:,} ({100.0 * trainable / total:.3f}%)")

    rows = load_sft(args.sft, limit=args.limit)
    print(f"sft examples: {len(rows)}")
    dataset = build_dataset(tokenizer, rows, args.max_len)

    targs = TrainingArguments(
        output_dir=args.out,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        num_train_epochs=args.epochs,
        max_steps=args.max_steps,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        logging_steps=1,
        save_strategy="no",
        bf16=(device in ("cuda", "mps")),
        report_to=[],
        seed=42,
    )
    trainer = Trainer(
        model=model,
        args=targs,
        train_dataset=dataset,
        data_collator=Collator(tokenizer.pad_token_id),
    )
    result = trainer.train()
    print(f"train loss: {result.training_loss}")
    model.save_pretrained(args.out)
    tokenizer.save_pretrained(args.out)
    with open(os.path.join(args.out, "train_receipt.json"), "w", encoding="utf-8") as fh:
        json.dump({
            "model": args.model,
            "device": device,
            "smoke": args.smoke,
            "dry_run": args.dry_run,
            "examples": len(rows),
            "max_steps": args.max_steps,
            "epochs": args.epochs,
            "trainable_params": trainable,
            "total_params": total,
            "train_loss": result.training_loss,
        }, fh, indent=2)
    print(f"adapter saved to {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
