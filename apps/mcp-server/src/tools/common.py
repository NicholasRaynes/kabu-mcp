"""Shared definitions for read-only Yahoo Finance tools."""

from typing import Annotated, Any

from fastmcp import Context
from fastmcp.exceptions import ToolError
from pydantic import Field


JapaneseEquityIdentifier = Annotated[
    str,
    Field(
        description="Company name or Japan stock ticker, e.g. 'Toyota' or '7203'.",
        min_length=1,
    ),
]


async def get_validated_equity(context: Context) -> dict[str, Any]:
    """Return the equity data resolved by request middleware."""
    equity = await context.get_state("japanese_equity")
    if not isinstance(equity, dict):
        raise ToolError("Validated company data is unavailable. Please try again.")
    return equity
