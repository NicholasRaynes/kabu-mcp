"""News tool backed by yfinance's Search."""

import re
from datetime import datetime, timezone
from typing import Annotated, Any

import yfinance as yf
from fastmcp.exceptions import ToolError
from fastmcp.tools import tool
from mcp.types import ToolAnnotations
from pydantic import Field


def _publish_time(item: dict[str, Any]) -> str | None:
    ts = item.get("providerPublishTime")
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    return None


# Yahoo tags many loosely related articles, so over-fetch before filtering by headline.
_OVERFETCH = 50


def _fetch_news(query: str, limit: int, headline_only: bool) -> list[dict[str, Any]]:
    count = max(limit, _OVERFETCH) if headline_only else limit
    search = yf.Search(query, max_results=0, news_count=count, enable_fuzzy_query=True)
    items = search.news
    if headline_only:
        pattern = re.compile(rf"\b{re.escape(query.strip())}\b", re.IGNORECASE)
        items = [item for item in items if pattern.search(item.get("title") or "")]
    return [
        {
            "title": item.get("title"),
            "publisher": item.get("publisher"),
            "link": item.get("link"),
            "published_at": _publish_time(item),
            "related_tickers": item.get("relatedTickers", []),
        }
        for item in items[:limit]
    ]


@tool(
    annotations=ToolAnnotations(title="Search News", readOnlyHint=True, openWorldHint=True),
    tags={"news"},
    timeout=30.0,
)
def search_news(
    query: Annotated[
        str,
        Field(description="Company name or Japan stock ticker, e.g. 'Toyota' or '7203'.", min_length=1),
    ],
    limit: Annotated[int, Field(description="Maximum number of articles to return.", ge=1, le=10)] = 10,
    headline_only: Annotated[
        bool,
        Field(description="Only return articles whose headline contains the query (case-insensitive whole word)."),
    ] = True,
) -> list[dict[str, Any]]:
    """Search recent Yahoo Finance news for a company name or Japan stock ticker."""
    try:
        return _fetch_news(query, limit, headline_only)
    except Exception as exc:
        raise ToolError(f"Failed to fetch news for '{query}': {exc}") from exc
