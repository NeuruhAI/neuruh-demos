#!/usr/bin/env python3
"""Neuruh SLM RAG sidecar API.

Local FastAPI service over the SQLite FTS5 corpus index. Retrieval only:
it finds the passages that match the question and returns them with their
source record cited. It does not generate text and it does not use a
language model. That is the point: every statement in an answer traces
to a corpus record, and changing the corpus changes the answers.

Endpoints:
  GET  /health  -> status, chunk count, db path
  GET  /stats   -> counts by chapter, type, state
  POST /ask     -> {question, top_k, state, chapter} -> ranked passages

Run: uvicorn app:app --port 8472  (from ~/workspace/neuruh-slm, venv on)
No em dashes anywhere in this file.
"""
import os
import re
import sqlite3
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = os.environ.get("NEURUH_RAG_DB", str(BASE_DIR / "rag.db"))

app = FastAPI(title="Neuruh RAG Sidecar", version="1.0.0")


def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def fts_query(question):
    """Turn a question into an FTS5 MATCH expression: quoted phrases for
    multiword runs, prefix terms for single words, OR-joined."""
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9\-']*", question.lower())
    words = [w.strip("-'") for w in words if len(w.strip("-'")) > 1]
    stop = {"what", "who", "when", "where", "which", "does", "does", "the",
            "and", "for", "how", "why", "with", "from", "about", "tell",
            "give", "list", "show", "is", "are", "was", "were", "does", "do"}
    terms = [w for w in words if w not in stop]
    if not terms:
        terms = words
    if not terms:
        return None
    parts = []
    for t in terms[:12]:
        safe = t.replace('"', "")
        parts.append(f'"{safe}"*')
    return " OR ".join(parts)


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=500)
    top_k: int = Field(default=5, ge=1, le=20)
    state: str | None = None
    chapter: str | None = None


class Passage(BaseModel):
    chunk_id: str
    doc_id: str
    title: str
    chapter: str | None
    type: str | None
    state: str | None
    live_url: str | None
    source: str
    score: float
    snippet: str


class AskResponse(BaseModel):
    question: str
    passages: list[Passage]
    total_chunks: int


@app.get("/health")
def health():
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="rag db not built yet")
    con = get_db()
    n = con.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
    con.close()
    return {"status": "ok", "chunks": n, "db": DB_PATH}


@app.get("/stats")
def stats():
    con = get_db()
    by_state = dict(con.execute(
        "SELECT state, COUNT(*) FROM chunks_fts GROUP BY state").fetchall())
    by_type = dict(con.execute(
        "SELECT type, COUNT(*) FROM chunks_fts GROUP BY type").fetchall())
    by_chapter = dict(con.execute(
        "SELECT chapter, COUNT(*) FROM chunks_fts GROUP BY chapter ORDER BY 2 DESC LIMIT 19").fetchall())
    con.close()
    return {"by_state": by_state, "by_type": by_type, "by_chapter": by_chapter}


def title_terms(title):
    return set(re.findall(r"[a-z0-9][a-z0-9\-']*", (title or "").lower()))


def title_bonus(question_terms, title):
    """Boost passages whose TITLE contains the question terms. For
    definitional questions (What is X?) the title is the strongest
    signal: a doc titled X answers "What is X?" better than a long doc
    that merely mentions X fifty times. BM25 alone ranks the long doc
    first, so the title bonus corrects it. Bonus is negative because
    BM25 scores are negative and lower is better."""
    if not question_terms:
        return 0.0
    t = title_terms(title)
    if all(term in t for term in question_terms):
        return -8.0
    longest = max(question_terms, key=len)
    if longest in t:
        return -4.0
    return 0.0


@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    match = fts_query(req.question)
    if match is None:
        raise HTTPException(status_code=400, detail="question has no searchable terms")
    filters = []
    params = [match]
    if req.state:
        filters.append("state = ?")
        params.append(req.state)
    if req.chapter:
        filters.append("chapter = ?")
        params.append(req.chapter)
    where = " AND ".join(["chunks_fts MATCH ?"] + filters)
    sql = (
        "SELECT chunk_id, doc_id, title, chapter, type, state, live_url, source, "
        "bm25(chunks_fts) AS score, "
        "snippet(chunks_fts, 3, '[', ']', ' ... ', 120) AS snippet "
        f"FROM chunks_fts WHERE {where} ORDER BY score LIMIT 50"
    )
    con = get_db()
    rows = con.execute(sql, params).fetchall()
    total = con.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
    con.close()
    terms = [w for w in re.findall(r"[a-z0-9][a-z0-9\-']*", req.question.lower())
             if w not in {"what", "who", "when", "where", "which", "does",
                          "the", "and", "for", "how", "why", "with", "from",
                          "about", "tell", "give", "list", "show", "is",
                          "are", "was", "were", "do"} and len(w) > 1]
    ranked = sorted(
        rows,
        key=lambda r: float(r["score"]) + title_bonus(terms, r["title"]),
    )
    seen_docs = set()
    deduped = []
    for r in ranked:
        if r["doc_id"] in seen_docs:
            continue
        seen_docs.add(r["doc_id"])
        deduped.append(r)
        if len(deduped) >= req.top_k:
            break
    ranked = deduped
    passages = [
        Passage(
            chunk_id=r["chunk_id"], doc_id=r["doc_id"], title=r["title"],
            chapter=r["chapter"], type=r["type"], state=r["state"],
            live_url=r["live_url"], source=r["source"],
            score=round(float(r["score"]), 3), snippet=r["snippet"],
        )
        for r in ranked
    ]
    return AskResponse(question=req.question, passages=passages, total_chunks=total)
