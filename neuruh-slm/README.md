# Neuruh SLM Program

Build our own small language model. Ordered 2026-11-20 by Jeramie Hicks.
The open-weight inventory page links out to his other pages because no
real weights exist yet. This program creates them.

## What exists now (2026-11-20)

- **Corpus** (`corpus/`): 2,302 docs, 40,919 chunks, 16,084,968 tokens
  (exact Qwen2.5 tokenizer count), from the 1,117-record library plus the
  Obsidian vault plus full text behind local paths. Train 2,180 docs,
  eval 122 docs. Built by `build_corpus.py`, re-runnable.
- **RAG sidecar** (`app.py`, `rag.db`): FastAPI + SQLite FTS5, retrieval
  only, no language model. 13 pytest tests pass, including a 10-question
  ground-truth set and an ablation test proving answers change when the
  corpus changes. This is the usable system that powers Obsidian "ask
  questions" right now.
- **Fine-tune pipeline** (`train_lora.py`, `format_sft.py`, `eval.py`,
  `merge_and_export.py`): LoRA on Qwen2.5-0.5B, 2,012 SFT pairs, eval
  harness on held-out corpus docs. Proven by a CPU smoke run here (see
  `runs/smoke/train_receipt.json`); the real run happens on the Mac.
- **Modelfile** (`Modelfile`): Neuruh Core v2, Ollama Modelfile, same
  three-part SYSTEM anatomy as the v1.0 tutorial (OPERATING DOCTRINE,
  TRIGGER LEXICON, OUTPUT POLICY), base model now named: Qwen2.5-0.5B.
- **Mac run-book** (`RUNBOOK.md`): exact commands to train, evaluate,
  merge, quantize, run in Ollama, and publish the weights.

## What does NOT exist yet

No trained model. No weights. No full training run has been done here
or anywhere. Open-source publication happens after weights exist on
Jeramie's Mac. Full pretraining is impossible on $0 compute. Full
fine-tuning of a 3B model is not realistic on 8 GB of RAM.

## Quick start (this machine, RAG only)

```bash
python3 build_corpus.py
python3 build_rag_db.py
.venv/bin/uvicorn app:app --port 8472
curl -X POST localhost:8472/ask -H 'Content-Type: application/json' \
  -d '{"question": "What is the Master Design System?"}'
```

## Quick start (Mac, training)

See RUNBOOK.md. One line: `python3 train_lora.py --sft sft_train.jsonl
--out runs/v1 --epochs 2 --max-len 512`.

## Layout

- `build_corpus.py` - corpus builder (seed index + vault + local paths)
- `corpus/` - corpus.jsonl, corpus_docs.jsonl, corpus_stats.json,
  corpus_exclusions.json
- `build_rag_db.py` - SQLite FTS5 index builder
- `app.py` - RAG sidecar API (FastAPI)
- `rag.db` - the built index (97 MB)
- `test_rag.py` - RAG tests (13 passed)
- `format_sft.py` - SFT pair formatter
- `canon_qa.json` - 12 hand-written canon Q&A pairs
- `sft_train.jsonl` - 2,012 training pairs
- `train_lora.py` - LoRA trainer
- `eval.py` - held-out eval harness
- `merge_and_export.py` - merge adapter into base
- `runs/smoke/` - CPU smoke run receipt and adapter
- `Modelfile` - Neuruh Core v2 Ollama Modelfile
- `RUNBOOK.md` - Mac run-book
- `index.html` - live program page (deployed to neuruh-demos/neuruh-slm/)
