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
| Clerk token verification | `backend/auth.py` |
| Platform mock-ups | `frontend/src/components/previews/` |

## Config

`backend/.env` — `GROQ_API_KEY` and `CLERK_ISSUER` are required; the server
refuses to start without the second unless `AUTH_DEV_BYPASS=1`. `GROQ_MODEL`
defaults to `openai/gpt-oss-120b` (`openai/gpt-oss-20b` is the cheaper
fallback). Rate limits, body size and `DB_PATH` are in `.env.example`.

`frontend/.env.local` — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY` are required; `NEXT_PUBLIC_API_BASE` only if the backend is
not on port 8000.

Clerk gates `/studio` only, so the landing page stays open to anyone with the
link. History is scoped to the verified user id, and generation is measured per
account.

## API

| Method | Path | |
|---|---|---|
| POST | `/api/runs` | `{source_type, source, tone}` → full run with all four posts |
| GET | `/api/runs` | history list |
| GET | `/api/runs/{id}` | one run |
| DELETE | `/api/runs/{id}` | remove a run |
| POST | `/api/runs/{id}/regenerate` | `{platform, tone}` → one regenerated post |
