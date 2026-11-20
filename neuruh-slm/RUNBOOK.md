# Neuruh SLM Mac Run-Book
# Train the Neuruh Core v2 LoRA adapter on Jeramie's M1 Mac (8 GB RAM),
# merge it, quantize it, run it in Ollama, and publish the weights.
# Everything below runs on the Mac. Nothing here needs a GPU, a cloud
# account, or any spend. Total time for the full run: roughly 1 to 3 hours
# on an M1, most of it training. No em dashes anywhere in this file.

## 0. What you need on the Mac
- macOS with Apple Silicon (M1, 8 GB RAM)
- Homebrew (https://brew.sh)
- About 10 GB free disk (base model, adapter, merged model, GGUF, Ollama)
- A Hugging Face account, only for publishing at the end (step 6)

## 1. Install the tools
```bash
brew install ollama python@3.12 git
python3.12 -m venv ~/neuruh-slm-venv
source ~/neuruh-slm-venv/bin/activate
pip install --upgrade pip
pip install torch transformers peft accelerate
```

## 2. Get the program files and the corpus
Copy the whole `neuruh-slm` program folder from the build machine to
the Mac (zip it and download it, the same way as the Obsidian vault).
It contains the scripts, the Modelfile, the run-book, and the corpus
(`corpus/corpus.jsonl` and `corpus/corpus_docs.jsonl`, 16,084,968
tokens). The corpus is NOT published to a public URL: it contains the
full text of internal vault notes, and publishing it is Jeramie's call,
not a default. The scripts are also published with the live program
page if you prefer to fetch them:
```bash
cd ~/neuruh-slm
curl -sL https://neuruhai.github.io/neuruh-demos/neuruh-slm/train_lora.py \
  -o train_lora.py
curl -sL https://neuruhai.github.io/neuruh-demos/neuruh-slm/eval.py \
  -o eval.py
curl -sL https://neuruhai.github.io/neuruh-demos/neuruh-slm/merge_and_export.py \
  -o merge_and_export.py
curl -sL https://neuruhai.github.io/neuruh-demos/neuruh-slm/format_sft.py \
  -o format_sft.py
curl -sL https://neuruhai.github.io/neuruh-demos/neuruh-slm/canon_qa.json \
  -o canon_qa.json
curl -sL https://neuruhai.github.io/neuruh-demos/neuruh-slm/Modelfile \
  -o Modelfile
```

## 3. Build the SFT data (from the corpus)
```bash
python3 format_sft.py --corpus corpus/corpus_docs.jsonl --out sft_train.jsonl
```
Expected: about 2,000 templated pairs plus 12 hand-written canon pairs.

## 4. Train the LoRA adapter (the real run)
```bash
python3 train_lora.py --sft sft_train.jsonl --out runs/v1 --epochs 2 --max-len 512
```
What this does: loads Qwen/Qwen2.5-0.5B, attaches LoRA (r=8, alpha=16,
q_proj and v_proj only), trains on MPS. Expected: about 540,000 trainable
parameters out of about 494,000,000 total (0.11 percent). Memory use is
about 2 to 3 GB, which fits the M1 8 GB. If macOS reports memory pressure,
re-run with --max-len 256.
If the run fails on download, check the network and re-run: the model
download resumes from the Hugging Face cache.

## 5. Evaluate the adapter against the base model
```bash
python3 eval.py --base Qwen/Qwen2.5-0.5B --adapter runs/v1 --limit 20 --out eval_adapter.json
python3 eval.py --base Qwen/Qwen2.5-0.5B --base-only --limit 20 --out eval_base.json
```
Read both mean keyword recall numbers. The adapter score should be
clearly above the base score. If it is not, the adapter did not learn
from the corpus: check the training loss in runs/v1/train_receipt.json
first, then raise epochs to 3 and re-run step 4.

## 6. Merge, quantize, and run in Ollama
```bash
python3 merge_and_export.py --base Qwen/Qwen2.5-0.5B --adapter runs/v1 --out merged/neuruh-v2
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp && cmake -B build -DGGML_METAL=ON && cmake --build build -j
cd ~/neuruh-slm
./llama.cpp/build/bin/llama-convert-hf-to-gguf.py merged/neuruh-v2 \
  --outfile neuruh-v2-f16.gguf --outtype f16
./llama.cpp/build/bin/llama-quantize neuruh-v2-f16.gguf \
  neuruh-v2-q4_k_m.gguf Q4_K_M
ollama create neuruh/v2.0 -f Modelfile
ollama run neuruh/v2.0
```
Ask it: "What is Neuruh?" and "What does Neuruh sell?" The answers must
match the canon pairs in canon_qa.json. If they do not, the adapter did
not survive the merge: re-check step 5 first.

## 7. Publish the weights (open source)
Only after the model runs correctly in Ollama on the Mac:
```bash
pip install huggingface_hub
huggingface-cli login
# Creates the repo and uploads the adapter plus the GGUF:
huggingface-cli repo create NeuruhAI/neuruh-core-v2 --type model
huggingface-cli upload NeuruhAI/neuruh-core-v2 runs/v1 ./adapter
huggingface-cli upload NeuruhAI/neuruh-core-v2 ./neuruh-v2-q4_k_m.gguf .
```
Then attach the same GGUF file to a GitHub release in NeuruhAI/neuruh-slm
(or the repo that holds this program) so the weights are reachable from
both places. Do not paste tokens into chat; `huggingface-cli login`
stores the token locally.

## 8. What NOT to do
- Do not run full fine-tuning (all parameters) of any model on this Mac.
  Full AdamW fine-tuning of the 0.5B model needs about 8 GB of optimizer
  state alone. It does not fit 8 GB of unified memory.
- Do not train the 3B model on this Mac. LoRA on Qwen2.5-3B needs about
  8 GB for the base weights alone plus activations. It does not fit.
- Do not publish anything until step 6 passes on the Mac. No weights
  exist until then, and no weights means nothing to open source.
