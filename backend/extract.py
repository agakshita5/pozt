# pull readable article text out of a blog URL

import ipaddress
import logging
import socket
from urllib.parse import urlparse

import httpx
import trafilatura
from bs4 import BeautifulSoup
from schemas import MAX_INPUT_CHARS

log = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0 Safari/537.36"
)

MAX_REDIRECTS = 5
MAX_BYTES = 4_000_000

class ExtractionError(Exception):
    """The URL could not be fetched or held no readable article text."""

def _require_public(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ExtractionError("Only http and https links can be read.")
    host = parsed.hostname
    if not host:
        raise ExtractionError("That does not look like a valid URL.")
    try:
        addresses = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        log.warning("could not resolve %s: %s", host, exc)
        raise ExtractionError(
            "Could not reach that URL. Check the link, or paste the article text instead."
        ) from exc
    for info in addresses:
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            log.warning("blocked non-public address %s for %s", ip, url)
            raise ExtractionError("That URL points to a private address, so it cannot be read.")

def _fetch(url: str) -> str:
    with httpx.Client(
        follow_redirects=False, timeout=20.0, headers={"User-Agent": USER_AGENT}
    ) as client:
        for _ in range(MAX_REDIRECTS + 1):
            _require_public(url)
            try:
                with client.stream("GET", url) as resp:
                    if resp.is_redirect and resp.next_request is not None:
                        url = str(resp.next_request.url)
                        continue
                    resp.raise_for_status()
                    chunks: list[bytes] = []
                    total = 0
                    for chunk in resp.iter_bytes():
                        total += len(chunk)
                        if total > MAX_BYTES:
                            raise ExtractionError("That page is too large to read.")
                        chunks.append(chunk)
                    return b"".join(chunks).decode(resp.encoding or "utf-8", "replace")
            except httpx.HTTPStatusError as exc:
                raise ExtractionError(
                    f"The site returned {exc.response.status_code} for that URL."
                ) from exc
            except httpx.HTTPError as exc:
                log.warning("fetch failed for %s: %s", url, exc)
                raise ExtractionError(
                    "Could not reach that URL. Check the link, or paste the article text instead."
                ) from exc
    raise ExtractionError("That URL redirected too many times.")

def _soup_fallback(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else ""
    article = soup.find("article") or soup.find("main") or soup.body
    if article is None:
        return title, ""

    paragraphs = [p.get_text(" ", strip=True) for p in article.find_all("p")]
    text = "\n\n".join(p for p in paragraphs if len(p) > 40)
    return title, text

def truncate(text: str) -> tuple[str, bool]:
    # cap text at MAX_INPUT_CHARS
    if len(text) <= MAX_INPUT_CHARS:
        return text, False
    cut = text[:MAX_INPUT_CHARS]
    space = cut.rfind(" ")
    if space > MAX_INPUT_CHARS - 200:
        cut = cut[:space]
    return cut.rstrip(), True

def extract_from_url(url: str) -> tuple[str, str, bool]:
    # return (title, text, truncated) for a blog URL

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    html = _fetch(url)

    text = trafilatura.extract(html, include_comments=False, include_tables=False) or ""
    meta = trafilatura.extract_metadata(html)
    title = (meta.title if meta else "") or ""

    if len(text) < 200:
        fallback_title, fallback_text = _soup_fallback(html)
        if len(fallback_text) > len(text):
            text = fallback_text
        title = title or fallback_title

    text = text.strip()
    if len(text) < 100:
        raise ExtractionError(
            "No readable article text found at that URL. It may be paywalled, "
            "rendered entirely in JavaScript, or not an article. Paste the text instead."
        )

    text, truncated = truncate(text)
    return title.strip() or derive_title(text), text, truncated

def derive_title(text: str) -> str:
    # title from the opening line, for pasted text and title-less pages
    first = next((ln.strip() for ln in text.splitlines() if ln.strip()), "Untitled")
    first = first.lstrip("# ").strip()
    return first[:80] + ("..." if len(first) > 80 else "")
