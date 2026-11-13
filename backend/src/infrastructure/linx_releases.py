"""Reads the latest Linx product versions (backend build + release date) from the
Linx Confluence release page (share.linx.com.br).

The page is fetched over HTTP, reduced to plain text and parsed with regex, so it
does not depend on Confluence's HTML/CSS structure. Results are cached in memory
for a short TTL to avoid hitting the page on every frontend refresh.
"""
from __future__ import annotations

import asyncio
import re
import time
import urllib.request
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import ClassVar

from src.logger import logger

DEFAULT_URL = "https://share.linx.com.br/pages/viewpage.action?pageId=304502307"
CACHE_TTL_SECONDS = 300
FETCH_TIMEOUT_SECONDS = 15
MAX_BODY_BYTES = 5 * 1024 * 1024
# How many characters after the product title we search for its versions/date.
SEARCH_WINDOW = 600

# (key, display name, regex for the title on the page)
PRODUCTS: list[tuple[str, str, re.Pattern[str]]] = [
    ("dms_web", "Linx DMS Web", re.compile(r"Linx\s+DMS\s+Web(?!\s*\()", re.IGNORECASE)),
    ("autoshop_web", "Linx Autoshop (web)", re.compile(r"Linx\s+Autoshop\s*\(\s*web\s*\)", re.IGNORECASE)),
]

_BACKEND_RE = re.compile(r"Backend\s*:?\s*(\d{8}\.\d+)", re.IGNORECASE)
_FRONTEND_RE = re.compile(r"Frontend[^\d]{0,60}?(\d{8}\.\d+)", re.IGNORECASE)
_DATE_RE = re.compile(r"\b(\d{2}/\d{2}/\d{4})\b")


@dataclass(frozen=True)
class ProductRelease:
    key: str
    product: str
    backend_version: str | None
    frontend_version: str | None
    release_date: str | None


class LinxReleasesError(Exception):
    """Raised when the release page cannot be fetched or parsed."""


class _TextExtractor(HTMLParser):
    _SKIP: ClassVar[frozenset[str]] = frozenset({"script", "style", "noscript"})

    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self._SKIP:
            self._skip_depth += 1
        self._parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in self._SKIP and self._skip_depth:
            self._skip_depth -= 1
        self._parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self._skip_depth:
            self._parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", "".join(self._parts).replace("\xa0", " ")).strip()


def html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    parser.close()
    return parser.text()


def parse_releases(html: str) -> list[ProductRelease]:
    """Extract product releases from the page HTML. Products not found get None fields."""
    text = html_to_text(html)
    title_positions = sorted(
        m.start() for _, _, pattern in PRODUCTS for m in pattern.finditer(text)
    )

    releases: list[ProductRelease] = []
    for key, name, pattern in PRODUCTS:
        found = ProductRelease(key, name, None, None, None)
        for match in pattern.finditer(text):
            start = match.end()
            # The block ends at the next product title (any product) or the window size.
            next_titles = [p for p in title_positions if p > match.start()]
            end = min([start + SEARCH_WINDOW, *next_titles])
            block = text[start:end]
            backend = _BACKEND_RE.search(block)
            if not backend:
                continue
            frontend = _FRONTEND_RE.search(block)
            date = _DATE_RE.search(block)
            found = ProductRelease(
                key=key,
                product=name,
                backend_version=backend.group(1),
                frontend_version=frontend.group(1) if frontend else None,
                release_date=date.group(1) if date else None,
            )
            break
        releases.append(found)
    return releases


def _download(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (ADMSQUAD release monitor)", "Accept": "text/html"},
    )
    with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT_SECONDS) as response:
        body: bytes = response.read(MAX_BODY_BYTES)
        charset = response.headers.get_content_charset() or "utf-8"
    return body.decode(charset, errors="replace")


class LinxReleasesService:
    def __init__(self, url: str = DEFAULT_URL, ttl: int = CACHE_TTL_SECONDS) -> None:
        self._url = url
        self._ttl = ttl
        self._lock = asyncio.Lock()
        self._cached: dict[str, object] | None = None
        self._cached_at = 0.0

    async def get(self) -> dict[str, object]:
        async with self._lock:
            now = time.time()
            if self._cached and now - self._cached_at < self._ttl:
                return self._cached
            try:
                html = await asyncio.to_thread(_download, self._url)
                releases = parse_releases(html)
                if not any(r.backend_version for r in releases):
                    raise LinxReleasesError("no product version found on page")
            except Exception as exc:  # network, decode or parse failure
                logger.error("linx_releases_fetch_failed", error=str(exc))
                if self._cached:
                    return {**self._cached, "stale": True}
                raise LinxReleasesError("could not read Linx release page") from exc

            self._cached = {
                "items": [asdict(r) for r in releases],
                "fetched_at": datetime.now(UTC).isoformat(timespec="seconds"),
                "source_url": self._url,
                "stale": False,
            }
            self._cached_at = now
            return self._cached


linx_releases_service = LinxReleasesService()
