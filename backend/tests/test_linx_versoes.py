"""Tests for the Linx release page parser and the /api/cx/linx-versoes endpoint."""
from unittest.mock import patch

import pytest
from fastapi import HTTPException

from src.api.routers import cx
from src.infrastructure import linx_releases
from src.infrastructure.linx_releases import LinxReleasesService, parse_releases

# Simplified copy of the Confluence table layout seen on the release page.
PAGE_HTML = """
<html><head><script>var x = "Linx DMS Web Backend 11111111.1";</script></head>
<body>
<h2>Produtos Principais:</h2>
<table>
 <tr>
  <td><p><strong>Linx DMS&nbsp; Web</strong></p>
      <p><span style="color:#aaa">Frontend Linx DMS</span></p><p><strong>20261111.26</strong></p>
      <p><span>Backend</span> <strong>20261111.40</strong></p></td>
  <td><time datetime="2026-11-12">12/11/2026</time></td>
 </tr>
</table>
<p>Outros produtos ...</p>
<table>
 <tr>
  <td><p><strong>Linx Autoshop (web)</strong></p>
      <p>Frontend Linx Autoshop <strong>20261109.10</strong></p>
      <p>Backend <strong>20261109.44</strong></p></td>
  <td><time>09/11/2026</time></td>
 </tr>
</table>
</body></html>
"""


def test_parse_releases_extracts_both_products() -> None:
    items = {r.key: r for r in parse_releases(PAGE_HTML)}

    dms = items["dms_web"]
    assert dms.product == "Linx DMS Web"
    assert dms.backend_version == "20261111.40"
    assert dms.frontend_version == "20261111.26"
    assert dms.release_date == "12/11/2026"

    autoshop = items["autoshop_web"]
    assert autoshop.product == "Linx Autoshop (web)"
    assert autoshop.backend_version == "20261109.44"
    assert autoshop.frontend_version == "20261109.10"
    assert autoshop.release_date == "09/11/2026"


def test_parse_skips_mentions_without_versions() -> None:
    html = "<p>Veja Linx DMS Web e Linx Autoshop (web) abaixo.</p>" + PAGE_HTML
    items = {r.key: r for r in parse_releases(html)}
    assert items["dms_web"].backend_version == "20261111.40"
    assert items["autoshop_web"].backend_version == "20261109.44"


def test_parse_missing_product_returns_none_fields() -> None:
    items = {r.key: r for r in parse_releases("<p>Linx DMS Web Backend 20260101.1 01/01/2026</p>")}
    assert items["dms_web"].backend_version == "20260101.1"
    assert items["autoshop_web"].backend_version is None
    assert items["autoshop_web"].release_date is None


@pytest.mark.asyncio
async def test_service_caches_result() -> None:
    service = LinxReleasesService(url="https://example.test", ttl=300)
    with patch.object(linx_releases, "_download", return_value=PAGE_HTML) as download:
        first = await service.get()
        second = await service.get()
    assert download.call_count == 1
    assert first is second
    assert first["stale"] is False
    assert len(first["items"]) == 2


@pytest.mark.asyncio
async def test_service_returns_stale_cache_on_failure() -> None:
    service = LinxReleasesService(url="https://example.test", ttl=0)
    with patch.object(linx_releases, "_download", return_value=PAGE_HTML):
        await service.get()
    with patch.object(linx_releases, "_download", side_effect=TimeoutError("timeout")):
        out = await service.get()
    assert out["stale"] is True
    assert out["items"][0]["backend_version"] == "20261111.40"


@pytest.mark.asyncio
async def test_endpoint_returns_generic_502_without_cache() -> None:
    service = LinxReleasesService(url="https://example.test")
    with (
        patch.object(cx, "linx_releases_service", service),
        patch.object(linx_releases, "_download", side_effect=OSError("secret internal detail")),
        pytest.raises(HTTPException) as exc,
    ):
        await cx.linx_versoes({})
    assert exc.value.status_code == 502
    assert "secret" not in str(exc.value.detail)


@pytest.mark.asyncio
async def test_page_without_versions_is_an_error() -> None:
    service = LinxReleasesService(url="https://example.test")
    with (
        patch.object(linx_releases, "_download", return_value="<html>login</html>"),
        pytest.raises(linx_releases.LinxReleasesError),
    ):
        await service.get()


@pytest.mark.asyncio
async def test_public_endpoint_needs_no_user_and_returns_items() -> None:
    service = LinxReleasesService(url="https://example.test")
    with (
        patch.object(cx, "linx_releases_service", service),
        patch.object(linx_releases, "_download", return_value=PAGE_HTML),
    ):
        out = await cx.linx_versoes_public()
    assert [i["key"] for i in out["items"]] == ["dms_web", "autoshop_web"]
    assert out["items"][1]["backend_version"] == "20261109.44"


@pytest.mark.asyncio
async def test_public_list_returns_linxwebver() -> None:
    from unittest.mock import AsyncMock, MagicMock

    result = MagicMock()
    result.keys.return_value = ["cod", "sistema", "linxwebver"]
    result.fetchall.return_value = [(1, "AUTOSHOP", "20261109.44")]
    session = MagicMock()
    session.execute = AsyncMock(return_value=result)

    out = await cx.list_atualizacoes_public(session)

    assert "linxwebver" in str(session.execute.await_args.args[0])
    assert out == [{"cod": 1, "sistema": "AUTOSHOP", "linxwebver": "20261109.44"}]
