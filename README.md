# PoZt

Paste a blog URL or its text, get X, Instagram, LinkedIn and Reddit posts back, each rendered inside a mock-up of the platform it is going to.

## Tech Stack

Next.js frontend, FastAPI backend, Groq for generation, SQLite for history.

## Setup

```bash
python3 -m venv venv
./venv/bin/pip install -r backend/requirements.txt

cp backend/.env.example backend/.env   # then paste a key from console.groq.com/keys

cd frontend && npm install && cd ..
```

## Run

Two terminals, then open http://localhost:3000.

```bash
cd backend && ../venv/bin/uvicorn main:app --reload --port 8000
cd frontend && npm run dev
```

## Layout

| Piece | Where |
|---|---|
| Article extraction (trafilatura, BeautifulSoup fallback) | `backend/extract.py` |
| Groq calls, strict JSON schema | `backend/generate.py` |
| SQLite history and the regeneration budget | `backend/db.py` |
| REST endpoints | `backend/main.py` |
| Platform mock-ups | `frontend/src/components/previews/` |

## Config

`backend/.env` — `GROQ_API_KEY` (required), `GROQ_MODEL` (defaults to
`openai/gpt-oss-120b`; `openai/gpt-oss-20b` is the cheaper fallback).

`frontend/.env.local` — `NEXT_PUBLIC_API_BASE`, only if the backend is not on
port 8000.

## API

| Method | Path | |
|---|---|---|
| POST | `/api/runs` | `{source_type, source, tone}` → full run with all four posts |
| GET | `/api/runs` | history list |
| GET | `/api/runs/{id}` | one run |
| DELETE | `/api/runs/{id}` | remove a run |
| POST | `/api/runs/{id}/regenerate` | `{platform, tone}` → one regenerated post |
