"""Company profile tool backed by validated Yahoo Finance data."""

from typing import Any

from fastmcp import Context
from fastmcp.tools import tool
from mcp.types import ToolAnnotations

from src.tools.common import (
    JapaneseEquityIdentifier,
    get_validated_equity,
)


_PROFILE_FIELDS = {
    "country": "country",
    "exchange": "exchange",
    "currency": "currency",
    "sector": "sector",
    "industry": "industry",
    "website": "website",
    "city": "city",
    "state": "state",
    "employees": "fullTimeEmployees",
    "business_summary": "longBusinessSummary",
}


def _is_profile_value(value: Any) -> bool:
    return isinstance(value, (str, int, float)) and not isinstance(value, bool) and value != ""


@tool(
    annotations=ToolAnnotations(title="Get Company Profile", readOnlyHint=True, openWorldHint=True),
    tags={"company"},
    timeout=30.0,
)
async def get_company_profile(
    query: JapaneseEquityIdentifier,
    context: Context,
) -> dict[str, Any]:
    """Return available company details for a Japanese listed equity."""
    equity = await get_validated_equity(context)
    info = equity.get("info")
    info = info if isinstance(info, dict) else {}

    profile: dict[str, Any] = {
        "requested_identifier": query,
        "symbol": equity.get("symbol"),
        "name": equity.get("name"),
        "source_url": f"https://finance.yahoo.com/quote/{equity.get('symbol', '')}",
    }
    for output_key, source_key in _PROFILE_FIELDS.items():
        value = info.get(source_key)
        if _is_profile_value(value):
            profile[output_key] = value
    return profile