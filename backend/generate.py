# turn extracted blog text into platform-shaped posts via Groq

import asyncio
import json
import logging
import os
import re
import groq
from pydantic import ValidationError
from schemas import PLATFORM_MODEL, PLATFORMS, Bundle, Platform, Tone

log = logging.getLogger(__name__)

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

_client: groq.AsyncGroq | None = None

class GenerationError(Exception):
    def __init__(self, message: str, status: int = 502, detail: str = "") -> None:
        super().__init__(message)
        self.status = status
        if detail:
            log.error("%s | %s", message, detail)

def client() -> groq.AsyncGroq:
    global _client
    if _client is None:
        if not os.getenv("GROQ_API_KEY"):
            raise GenerationError(
                "Post generation is unavailable right now. Try again shortly.",
                status=503,
                detail="GROQ_API_KEY is not set",
            )
        _client = groq.AsyncGroq()
    return _client


TONE_GUIDANCE: dict[str, str] = {
    "professional": "Measured and credible. Plain language, no hype, no exclamation marks.",
    "casual": "Conversational and warm, like explaining it to a friend over coffee.",
    "punchy": "Short, high-energy sentences. Strong verbs. Every line earns its place.",
    "technical": "Precise and detail-forward. Keep the specifics, numbers and trade-offs.",
}

BASE_RULES = """\
You rewrite blog articles into native-feeling social posts.

Hard rules:
- Write only from the article. Never invent statistics, quotes, names or claims.
- No em-dashes. No "in today's fast-paced world" style filler openers.
- No meta-commentary about the article ("this post explains..."). Speak the ideas directly.
- Do not include the source URL unless the article text itself contains it.
- Return only the JSON object the schema asks for.
"""

PLATFORM_SYSTEM: dict[str, str] = {
    "x": BASE_RULES
        + """
            Platform: X (Twitter).
            - Produce a thread of 4 to 7 tweets.
            - HARD LIMIT: each tweet must be 280 characters or fewer. Count carefully.
            - Tweet 1 is the hook and must stand alone as a reason to read on.
            - Do not number the tweets. No "1/7", no "(cont.)".
            - Line breaks inside a tweet are fine and encouraged for rhythm.
            - The last tweet carries the takeaway; hashtags go in the separate field, not inline.
        """,
    "instagram": BASE_RULES
        + """
            Platform: Instagram.
            - One caption, 2200 characters maximum, ideally 600 to 1200.
            - The first 125 characters appear before the "more" fold, so front-load the hook.
            - Use short paragraphs separated by blank lines. A few emoji are welcome as section markers.
            - End with a question or call to action that invites comments.
            - Hashtags go in the separate field, not inside the caption.
        """,
    "linkedin": BASE_RULES
        + """
            Platform: LinkedIn.
            - One post, 3000 characters maximum, ideally 900 to 1800.
            - Line 1 is a standalone hook; line 2 is blank. LinkedIn folds after ~3 lines.
            - Short paragraphs, one idea each, separated by blank lines.
            - Concrete and specific beats inspirational. No "I'm humbled to announce".
            - Close with a question that invites a professional reply.
            - Hashtags go in the separate field, not inside the body.
        """,
    "reddit": BASE_RULES
        + """
            Platform: Reddit.
            - Title: 300 characters maximum, plain and descriptive. No clickbait, no emoji, no hashtags.
            - Body: Markdown self-post. Headers, bullet lists and code blocks are fine.
            - Reddit is allergic to marketing voice. Write as a practitioner sharing findings,
            acknowledge trade-offs and limitations, and invite disagreement.
            - Suggest 2 to 4 real, topically appropriate subreddits by name.
        """,
}

def build_prompt(title: str, text: str, tone: Tone) -> str:
    return (
        f"Tone: {tone}. {TONE_GUIDANCE[tone]}\n\n"
        f"Article title: {title or '(none given)'}\n\n"
        f"Article text:\n\"\"\"\n{text}\n\"\"\""
    )

_DASH_FIXES = [
    ("\u2011", "-"),  # non-breaking hyphen
    ("\u2010", "-"),  # unicode hyphen
    ("\u2212", "-"),  # minus sign
]

def _clean(value: str) -> str:
    for bad, good in _DASH_FIXES:
        value = value.replace(bad, good)
    # a dash between digits is a range, so keep it a dash
    value = re.sub(r"(\d)\s*[\u2014\u2013]\s*(\d)", r"\1-\2", value)
    # between words it reads fine as a comma
    value = re.sub(r"([^\W\d_])\s*[\u2014\u2013]\s*([^\W\d_])", r"\1, \2", value)
    # anything left over (start of line, before punctuation) becomes a plain dash
    value = re.sub(r"[\u2014\u2013]", "-", value)
    return value

def clean_payload(payload: dict) -> dict:
    return {
        key: [_clean(v) for v in value]
        if isinstance(value, list)
        else _clean(value)
        if isinstance(value, str)
        else value
        for key, value in payload.items()
    }


LIMITS: dict[str, list[tuple[str, int]]] = {
    "x": [("tweets", 280)],
    "instagram": [("caption", 2200)],
    "linkedin": [("body", 3000)],
    "reddit": [("title", 300), ("body", 40000)],
}

def validate_lengths(platform: str, payload: dict) -> list[str]:
    over: list[str] = []
    for field, limit in LIMITS[platform]:
        value = payload.get(field)
        if isinstance(value, str) and len(value) > limit:
            over.append(field)
        elif isinstance(value, list) and any(len(v) > limit for v in value):
            over.append(field)
    return over

BUNDLE_SYSTEM = (BASE_RULES
    + """
        You are writing one set of posts for four platforms at once. Each platform gets
        its own voice; do not paraphrase the same sentences across all four.
    """
    + "\n".join(
        f"### {p}\n" + PLATFORM_SYSTEM[p].split("Platform:", 1)[1].split("\n", 1)[1]
        for p in PLATFORMS
    )
)

def _retry_after(exc: groq.APIStatusError) -> float:
    # seconds to wait, from Groq's rate-limit reset header. 0 if not worth waiting
    headers = dict(getattr(exc.response, "headers", {}) or {})
    raw = headers.get("x-ratelimit-reset-tokens") or headers.get("retry-after") or ""
    match = re.match(r"(?:(\d+)m)?([\d.]+)s?$", raw.strip())
    if not match:
        return 0.0
    minutes = float(match.group(1) or 0)
    seconds = float(match.group(2) or 0)
    return minutes * 60 + seconds

async def _call(*, system: str, prompt: str, schema_name: str, schema: dict, effort: str) -> str:
    for attempt in range(2):
        try:
            resp = await client().chat.completions.create(
                model=MODEL,
                temperature=0.8,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": schema_name,
                        "strict": True,
                        "schema": schema,
                    },
                },
                extra_body={"reasoning_effort": effort},
            )
        except groq.RateLimitError as exc:
            wait = _retry_after(exc)
            if attempt == 0 and 0 < wait <= 25:
                await asyncio.sleep(wait + 1)
                continue
            raise GenerationError(
                "This article just used up the per-minute token limit. "
                f"Try again in about {max(int(wait), 30)} seconds.",
                status=429,
                detail=f"rate limited, reset in {wait}s",
            ) from exc
        except groq.AuthenticationError as exc:
            raise GenerationError(
                "Post generation is unavailable right now. Try again shortly.",
                status=503,
                detail="the API key was rejected",
            ) from exc

        return resp.choices[0].message.content or ""

    raise GenerationError("The generator did not respond. Try again in a moment.")

async def generate_all(title: str, text: str, tone: Tone) -> dict[str, tuple[dict, list[str]]]:
    content = await _call(
        system=BUNDLE_SYSTEM,
        prompt=build_prompt(title, text, tone),
        schema_name="bundle",
        schema=Bundle.model_json_schema(),
        # Low reasoning effort: the four formats are tightly specified, and reasoning tokens come out of the same per-minute budget.
        effort="low",
    )

    try:
        bundle = Bundle.model_validate_json(content)
    except (ValidationError, json.JSONDecodeError) as exc:
        raise GenerationError(
            "The generator returned an unusable response. Try again.",
            detail=f"bundle JSON invalid: {exc} | raw: {content[:300]}",
        ) from exc

    dumped = {p: clean_payload(v) for p, v in bundle.model_dump().items()}
    return {p: (dumped[p], validate_lengths(p, dumped[p])) for p in PLATFORMS}

async def generate_one(platform: Platform, title: str, text: str, tone: Tone) -> tuple[dict, list[str]]:
    model_cls = PLATFORM_MODEL[platform]

    content = await _call(
        system=PLATFORM_SYSTEM[platform],
        prompt=build_prompt(title, text, tone),
        schema_name=platform,
        schema=model_cls.model_json_schema(),
        effort="medium",
    )

    try:
        payload = model_cls.model_validate_json(content).model_dump()
    except (ValidationError, json.JSONDecodeError) as exc:
        raise GenerationError(
            "The generator returned an unusable response. Try again.",
            detail=f"{platform} JSON invalid: {exc} | raw: {content[:300]}",
        ) from exc

    payload = clean_payload(payload)
    return payload, validate_lengths(platform, payload)
