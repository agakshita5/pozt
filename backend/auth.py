# who is calling: a verified Clerk user id, or nothing

import logging
import os
import jwt
from fastapi import HTTPException, Request

log = logging.getLogger(__name__)

CLERK_ISSUER = (os.getenv("CLERK_ISSUER") or "").rstrip("/")
# only for running locally without a Clerk account; refuses to be the default
DEV_BYPASS = os.getenv("AUTH_DEV_BYPASS") == "1"
DEV_USER = "local-dev-user"

_jwks: jwt.PyJWKClient | None = None

def configure() -> None:
    # called at startup so a misconfigured server fails to boot rather than quietly serving everyone's history to everyone
    global _jwks
    if CLERK_ISSUER:
        _jwks = jwt.PyJWKClient(f"{CLERK_ISSUER}/.well-known/jwks.json", cache_keys=True)
        log.info("auth: verifying Clerk tokens issued by %s", CLERK_ISSUER)
    elif DEV_BYPASS:
        log.warning("auth: AUTH_DEV_BYPASS is on, every request is %r", DEV_USER)
    else:
        raise RuntimeError(
            "Set CLERK_ISSUER to your Clerk frontend API URL "
            "(https://<slug>.clerk.accounts.dev), or AUTH_DEV_BYPASS=1 to run "
            "locally without accounts. Refusing to start unauthenticated."
        )

def _token(request: Request) -> str:
    header = request.headers.get("authorization") or ""
    scheme, _, value = header.partition(" ")
    if scheme.lower() != "bearer" or not value.strip():
        raise HTTPException(401, "Please sign in to use this.")
    return value.strip()

async def current_user(request: Request) -> str:
    if _jwks is None:
        return DEV_USER

    token = _token(request)
    try:
        key = _jwks.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False, "require": ["exp", "sub", "iss"]},
        )
    except jwt.PyJWTError as exc:
        log.warning("rejected token: %s", exc)
        raise HTTPException(401, "Your session has expired. Sign in again.") from exc

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(401, "Your session has expired. Sign in again.")
    return user_id
