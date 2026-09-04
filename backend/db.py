import hashlib
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(os.getenv("DB_PATH") or Path(__file__).parent / "data" / "app.db")

SCHEMA = """
    CREATE TABLE IF NOT EXISTS runs (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    source_type    TEXT NOT NULL,
    source         TEXT NOT NULL,
    source_hash    TEXT NOT NULL UNIQUE,
    extracted_text TEXT NOT NULL,
    truncated      INTEGER NOT NULL DEFAULT 0,
    tone           TEXT NOT NULL,
    created_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
    run_id      TEXT NOT NULL,
    platform    TEXT NOT NULL,
    tone        TEXT NOT NULL,
    payload     TEXT NOT NULL,
    over_limit  TEXT NOT NULL DEFAULT '[]',
    regen_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (run_id, platform, tone),
    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );
"""

EXPECTED_RUN_COLUMNS = {
    "id", "title", "source_type", "source", "source_hash",
    "extracted_text", "truncated", "tone", "created_at",
}

def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init() -> None:
    with connect() as conn:
        # tells which columns currently exist in the runs table
        existing = {r["name"] for r in conn.execute("PRAGMA table_info(runs)").fetchall()}
        if existing and existing != EXPECTED_RUN_COLUMNS:
            conn.executescript("DROP TABLE IF EXISTS posts; DROP TABLE IF EXISTS runs;")
        conn.executescript(SCHEMA)

def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

# identity of an article, so the same input maps back to the same run
def source_hash(source_type: str, source: str) -> str:
    normalized = source.strip()
    if source_type == "url":
        normalized = normalized.rstrip("/").lower()
    else:
        normalized = " ".join(normalized.split())
    return hashlib.sha256(f"{source_type}:{normalized}".encode()).hexdigest()

# RUNS table

def insert_run(run_id: str, title: str, source_type: str, source: str, extracted_text: str, truncated: bool, tone: str) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO runs (id, title, source_type, source, source_hash, extracted_text, truncated, tone, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (run_id, title, source_type, source, source_hash(source_type, source), extracted_text, int(truncated), tone, now()),
        )

def find_run_by_source(source_type: str, source: str) -> dict | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM runs WHERE source_hash = ?",
            (source_hash(source_type, source),),
        ).fetchone()
    return _hydrate_run(row) if row else None

def list_runs() -> list[dict]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT id, title, source_type, tone, created_at FROM runs ORDER BY created_at DESC, rowid DESC"
        ).fetchall()
    return [dict(r) for r in rows]

def get_run(run_id: str) -> dict | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    return _hydrate_run(row) if row else None

def delete_run(run_id: str) -> bool:
    with connect() as conn:
        conn.execute("DELETE FROM posts WHERE run_id = ?", (run_id,))
        cur = conn.execute("DELETE FROM runs WHERE id = ?", (run_id,))
    return cur.rowcount > 0

def _hydrate_run(row: sqlite3.Row) -> dict:
    run = dict(row)
    run["truncated"] = bool(run["truncated"])
    return run

# POSTS table

def upsert_post(run_id: str, platform: str, tone: str, payload: dict, over_limit: list[str], *, bump_regen: bool = False) -> None:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO posts (run_id, platform, tone, payload, over_limit, regen_count)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (run_id, platform, tone) DO UPDATE SET
              payload     = excluded.payload,
              over_limit  = excluded.over_limit,
              regen_count = regen_count + ?
            """,
            (run_id, platform, tone, json.dumps(payload), json.dumps(over_limit), int(bump_regen), int(bump_regen)),
        )

def get_post(run_id: str, platform: str, tone: str) -> dict | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM posts WHERE run_id = ? AND platform = ? AND tone = ?",
            (run_id, platform, tone),
        ).fetchone()
    return _hydrate_post(row) if row else None

def posts_by_tone(run_id: str) -> dict[str, dict[str, dict]]:
    # every post this run holds, grouped tone -> platform
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM posts WHERE run_id = ?", (run_id,)
        ).fetchall()

    grouped: dict[str, dict[str, dict]] = {}
    for row in rows:
        grouped.setdefault(row["tone"], {})[row["platform"]] = _hydrate_post(row)
    return grouped

def has_tone(run_id: str, tone: str) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT 1 FROM posts WHERE run_id = ? AND tone = ? LIMIT 1",
            (run_id, tone),
        ).fetchone()
    return row is not None

def regen_count(run_id: str, platform: str, tone: str) -> int:
    with connect() as conn:
        row = conn.execute(
            "SELECT regen_count FROM posts WHERE run_id = ? AND platform = ? AND tone = ?",
            (run_id, platform, tone),
        ).fetchone()
    return row["regen_count"] if row else 0

def _hydrate_post(row: sqlite3.Row) -> dict:
    return {
        "platform": row["platform"],
        "tone": row["tone"],
        "payload": json.loads(row["payload"]),
        "over_limit": json.loads(row["over_limit"]),
        "regen_count": row["regen_count"],
    }
