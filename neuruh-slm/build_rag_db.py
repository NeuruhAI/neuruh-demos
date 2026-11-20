#!/usr/bin/env python3
"""Build the RAG retrieval database from corpus.jsonl.

Creates a SQLite database with an FTS5 full-text index over the corpus
chunks. No GPU, no embeddings, no external service: plain SQLite FTS5
with BM25 ranking. Re-runnable: rebuilds the DB from scratch each run.

Usage: python3 build_rag_db.py [--corpus DIR] [--db PATH]
"""
import argparse
import json
import os
import sqlite3
import sys

DEFAULT_CORPUS = os.path.expanduser("~/workspace/neuruh-slm/corpus/corpus.jsonl")
DEFAULT_DB = os.path.expanduser("~/workspace/neuruh-slm/rag.db")

SCHEMA = """
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    chunk_id UNINDEXED,
    doc_id UNINDEXED,
    title,
    text,
    chapter UNINDEXED,
    type UNINDEXED,
    state UNINDEXED,
    live_url UNINDEXED,
    source UNINDEXED,
    split UNINDEXED,
    tokenize='unicode61 remove_diacritics 1'
);
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default=DEFAULT_CORPUS)
    ap.add_argument("--db", default=DEFAULT_DB)
    args = ap.parse_args()
    if os.path.exists(args.db):
        os.remove(args.db)
    con = sqlite3.connect(args.db)
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(SCHEMA)
    n = 0
    with open(args.corpus, encoding="utf-8") as fh:
        for line in fh:
            c = json.loads(line)
            con.execute(
                "INSERT INTO chunks_fts (chunk_id, doc_id, title, text, chapter, type, state, live_url, source, split) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (c["chunk_id"], c["doc_id"], c["title"], c["text"], c["chapter"],
                 c["type"], c["state"], c["live_url"], c["source"], c["split"]),
            )
            n += 1
    con.execute("INSERT INTO chunks_fts(chunks_fts) VALUES('optimize')")
    con.commit()
    total = con.execute("SELECT COUNT(*) FROM chunks_fts").fetchone()[0]
    con.close()
    print(f"indexed {n} chunks, db rows {total}, db {args.db}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
