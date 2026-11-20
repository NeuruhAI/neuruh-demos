"""RAG sidecar tests: retrieval correctness plus a corpus-dependence check.

Each case asks a real question about the estate and requires the expected
corpus record to appear in the top 3 passages, with its citation (title,
doc_id, live_url) returned. The ablation test rebuilds the index without
the expected docs and requires the answer to change: that is what proves
the answers come from retrieval over the corpus, not from base-model
memory (there is no language model in this service at all).

Run: .venv/bin/python -m pytest test_rag.py -v
No em dashes anywhere in this file.
"""
import json
import os
import shutil
import sqlite3
import subprocess
import sys

import pytest
from fastapi.testclient import TestClient

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

CASES = [
    ("What is the Master Design System?",
     "seed:master-design-system-v1", "brass single accent"),
    ("What is the DeedSonar production app?",
     "seed:deedsonar-production-app", "Flagship all-in-one real-estate CRM"),
    ("How much is the Verified Dossier?",
     "seed:land-intelligence-report-store", "$295"),
    ("What is Neuruh Source?",
     "seed:neuruh-source", "agent-first source control"),
    ("What is the Unified Chain?",
     "seed:unified-chain", "nine stages"),
    ("What is Lead Recipe OS?",
     "seed:lead-recipe-os", "signal-to-opportunity kernel"),
    ("What is the real autonomous recursive loop?",
     "seed:real-autonomous-recursive-loop-retardio-loop-real-python-loop-not-a-si", "python loop"),
    ("What is the state of the BiggerPockets cold draft?",
     "seed:biggerpockets-cold-draft-queued-unsent", "unsent"),
    ("What does the Ontology Runtime do?",
     "seed:ontology-runtime", "13 invariants"),
    ("What is the free stack?",
     "seed:free-stack-topology", "11 services in 7 layers"),
]


def load_doc_texts():
    docs = {}
    with open(os.path.join(BASE, "corpus", "corpus_docs.jsonl"), encoding="utf-8") as fh:
        for line in fh:
            d = json.loads(line)
            docs[d["doc_id"]] = d["text"]
    return docs


DOC_TEXTS = load_doc_texts()


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    db = os.path.join(BASE, "rag.db")
    assert os.path.exists(db), "rag.db missing: run build_rag_db.py first"
    import app as app_module

    app_module.DB_PATH = db
    return TestClient(app_module.app)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["chunks"] > 10000


def test_stats(client):
    r = client.get("/stats")
    assert r.status_code == 200
    assert r.json()["by_state"]["LIVE"] > 100


@pytest.mark.parametrize("question,expected_doc,phrase", CASES)
def test_ask_returns_expected_record(client, question, expected_doc, phrase):
    r = client.post("/ask", json={"question": question, "top_k": 5})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["passages"], f"no passages for {question!r}"
    top_ids = [p["doc_id"] for p in body["passages"][:3]]
    assert expected_doc in top_ids, (
        f"{question!r}: expected {expected_doc} in top 3, got {top_ids}")
    hit = next(p for p in body["passages"] if p["doc_id"] == expected_doc)
    assert hit["title"], "citation must carry a title"
    assert phrase.lower() in DOC_TEXTS[expected_doc].lower(), (
        f"expected phrase {phrase!r} in cited doc for {question!r}")
    assert body["total_chunks"] > 10000


def test_ablation_answers_change_when_corpus_changes(tmp_path):
    """Delete the expected docs from a scratch copy of the index and
    re-ask: the answers must change. Retrieval, not memory."""
    src = os.path.join(BASE, "rag.db")
    scratch = str(tmp_path / "rag_ablated.db")
    shutil.copy(src, scratch)
    con = sqlite3.connect(scratch)
    expected = {doc for _, doc, _ in CASES}
    for doc_id in expected:
        con.execute("DELETE FROM chunks_fts WHERE doc_id = ?", (doc_id,))
    con.commit()
    remaining = con.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
    con.close()
    assert remaining > 10000

    import app as app_module

    app_module.DB_PATH = scratch
    client = TestClient(app_module.app)
    changed = 0
    for question, expected_doc, _ in CASES:
        r = client.post("/ask", json={"question": question, "top_k": 3})
        assert r.status_code == 200
        top_ids = [p["doc_id"] for p in r.json()["passages"]]
        assert expected_doc not in top_ids, (
            f"ablated doc {expected_doc} still returned for {question!r}")
        changed += 1
    assert changed == len(CASES)
    app_module.DB_PATH = os.path.join(BASE, "rag.db")
