import logging
import os
import time
import uuid
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# noqa: E402
from fastapi import Depends, FastAPI, HTTPException, Request  
from fastapi.exceptions import RequestValidationError  
from fastapi.middleware.cors import CORSMiddleware  
from fastapi.responses import JSONResponse  
import auth  
import db  
import generate 
from extract import ExtractionError, derive_title, extract_from_url, truncate 
from schemas import (MAX_INPUT_CHARS,MAX_REGENS,GenerateRequest,Post,RegenerateRequest,Run,RunSummary)

log = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    auth.configure(ALLOWED_ORIGINS)
    db.init()
    yield

app = FastAPI(title="Blog to Social Post Studio", lifespan=lifespan)

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if o.strip()
]

@app.middleware("http")
async def catch_unhandled(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        log.exception("unhandled error on %s", request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong on our end. Try again in a moment."},
        )

# a 15,000 character article is at most ~60 KB of UTF-8
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", 256_000))

# generating costs tokens, so it is metered per signed-in account
RATE_LIMIT_PER_HOUR = int(os.getenv("RATE_LIMIT_PER_HOUR", 10))
RATE_LIMIT_PER_DAY = int(os.getenv("RATE_LIMIT_PER_DAY", 40))
_hits: dict[str, deque[float]] = defaultdict(deque)

def _check_quota(user_id: str) -> None:
    message = _too_many(user_id)
    if message:
        log.warning("rate limited %s", user_id)
        raise HTTPException(429, message)

def _too_many(user_id: str) -> str | None:
    now = time.time()
    seen = _hits[user_id]
    while seen and now - seen[0] > 86_400:
        seen.popleft()
    if len(seen) >= RATE_LIMIT_PER_DAY:
        return "You have hit today's generation limit. Try again tomorrow."
    if sum(1 for t in seen if now - t < 3_600) >= RATE_LIMIT_PER_HOUR:
        return "You have hit this hour's generation limit. Try again in an hour."
    return None

# only a real model call spends the quota, so only that is counted
def _record(user_id: str) -> None:
    now = time.time()
    _hits[user_id].append(now)
    if len(_hits) > 10_000:
        for key in [k for k, v in _hits.items() if not v or now - v[-1] > 86_400]:
            del _hits[key]

@app.middleware("http")
async def guard(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": "That is far too much text to send at once."},
        )
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # set to something like https://.*\.vercel\.app$ to let previews through
    allow_origin_regex=os.getenv("ALLOWED_ORIGIN_REGEX") or None,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def bad_request(request: Request, exc: RequestValidationError) -> JSONResponse:
    log.warning("invalid request to %s: %s", request.url.path, exc)
    return JSONResponse(status_code=422, content={"detail": "That input was not something I can work with."})

def _post_model(record: dict) -> Post:
    return Post(
        platform=record["platform"],
        tone=record["tone"],
        payload=record["payload"],
        over_limit=record["over_limit"],
        regens_remaining=max(0, MAX_REGENS - record["regen_count"]),
    )

def _run_model(run: dict) -> Run:
    return Run(
        id=run["id"],
        title=run["title"],
        source_type=run["source_type"], # url or text
        source=run["source"],
        extracted_text=run["extracted_text"],
        truncated=run["truncated"],
        tone=run["tone"],
        created_at=run["created_at"],
        posts_by_tone={
            tone: {p: _post_model(rec) for p, rec in posts.items()}
            for tone, posts in db.posts_by_tone(run["id"]).items()
        },
    )

@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "model": generate.MODEL, "auth": auth.mode()}

@app.get("/api/runs", response_model=list[RunSummary])
async def get_runs(user: str = Depends(auth.current_user)) -> list[RunSummary]:
    return [RunSummary(**r) for r in db.list_runs(user)]

@app.get("/api/runs/{run_id}", response_model=Run)
async def get_run(run_id: str, user: str = Depends(auth.current_user)) -> Run:
    run = db.get_run(run_id, user)
    if run is None:
        raise HTTPException(404, "No such run.")
    return _run_model(run)

@app.delete("/api/runs/{run_id}")
async def remove_run(run_id: str, user: str = Depends(auth.current_user)) -> dict:
    if not db.delete_run(run_id, user):
        raise HTTPException(404, "No such run.")
    return {"deleted": run_id}

@app.post("/api/runs", response_model=Run)
async def create_run(req: GenerateRequest, user: str = Depends(auth.current_user)) -> Run:
    source = req.source.strip()
    if not source:
        raise HTTPException(422, "Give me a URL or some text to work with.")

    existing = db.find_run_by_source(user, req.source_type, source)
    if existing is not None and db.has_tone(existing["id"], req.tone):
        return _run_model(existing)

    _check_quota(user)

    if existing is not None:
        run_id, title, text = existing["id"], existing["title"], existing["extracted_text"]
    else:
        if req.source_type == "url":
            try:
                title, text, truncated = extract_from_url(source)
            except ExtractionError as exc:
                raise HTTPException(422, str(exc)) from exc
        else:
            if len(source) > MAX_INPUT_CHARS:
                raise HTTPException(
                    422,
                    f"That is {len(source):,} characters. The limit is {MAX_INPUT_CHARS:,} so the model is not overwhelmed.",
                )
            if len(source) < 100:
                raise HTTPException(422, "That is too short to build posts from.")
            text, truncated = truncate(source)
            title = derive_title(text)
        run_id = uuid.uuid4().hex[:12]

    _record(user)
    try:
        results = await generate.generate_all(title, text, req.tone)
    except generate.GenerationError as exc:
        raise HTTPException(exc.status, str(exc)) from exc

    if existing is None:
        db.insert_run(run_id, user, title, req.source_type, source, text, truncated, req.tone)
    for platform, (payload, over_limit) in results.items():
        db.upsert_post(run_id, platform, req.tone, payload, over_limit)

    run = db.get_run(run_id, user)
    assert run is not None
    return _run_model(run)

@app.post("/api/runs/{run_id}/regenerate", response_model=Post)
async def regenerate(run_id: str, req: RegenerateRequest, user: str = Depends(auth.current_user)) -> Post:
    run = db.get_run(run_id, user)
    if run is None:
        raise HTTPException(404, "No such run.")

    used = db.regen_count(run_id, req.platform, req.tone)
    if used >= MAX_REGENS:
        raise HTTPException(
            409,
            f"You have used all {MAX_REGENS} regenerations for {req.platform} at the "
            f"'{req.tone}' tone. Pick a different tone to start a fresh set.",
        )

    _check_quota(user)
    _record(user)
    try:
        payload, over_limit = await generate.generate_one(
            req.platform, run["title"], run["extracted_text"], req.tone
        )
    except generate.GenerationError as exc:
        raise HTTPException(exc.status, str(exc)) from exc

    db.upsert_post(run_id, req.platform, req.tone, payload, over_limit, bump_regen=True)

    record = db.get_post(run_id, req.platform, req.tone)
    assert record is not None
    return _post_model(record)
