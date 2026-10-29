"""Resolve identifiers to Japanese listed equities using Yahoo Finance."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

import yfinance as yf


_TICKER_PATTERN = re.compile(r"^\d{3}[0-9A-Z](?:\.T)?$", re.IGNORECASE)


class EquityValidationError(ValueError):
    """The input is not a valid, unambiguous Japanese listed equity."""


class EquityValidationUnavailable(RuntimeError):
    """The upstream lookup could not verify the equity."""


@dataclass(frozen=True)
class JapaneseEquity:
    symbol: str
    name: str


def _normalize(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def _verified_equity(symbol: str) -> JapaneseEquity:
    info = yf.Ticker(symbol).get_info()
    if _normalize(str(info.get("country") or "")) not in {"japan", "日本"}:
        raise EquityValidationError("Ticker is not a verified Japanese listed equity.")
    if str(info.get("quoteType") or "").upper() != "EQUITY":
        raise EquityValidationError("Ticker is not a verified Japanese listed equity.")
    return JapaneseEquity(
        symbol=symbol,
        name=str(info.get("longName") or info.get("shortName") or symbol),
    )


def resolve_japanese_equity(value: str) -> JapaneseEquity:
    """Resolve a Japanese stock code or company-name match; reject ambiguity."""
    query = value.strip()
    if not query or len(query) > 100:
        raise EquityValidationError("Provide a company name or Japanese stock ticker (up to 100 characters).")

    try:
        if _TICKER_PATTERN.fullmatch(query):
            symbol = query.upper().removesuffix(".T") + ".T"
            return _verified_equity(symbol)

        normalized = _normalize(query)
        quotes = yf.Search(query, max_results=20, news_count=0).quotes
        matches = {
            quote["symbol"]
            for quote in quotes
            if quote.get("quoteType") == "EQUITY"
            and str(quote.get("symbol", "")).upper().endswith(".T")
            and any(
                isinstance(name, str)
                and (_normalize(name).startswith(normalized) or normalized.startswith(_normalize(name)))
                for name in (quote.get("shortname"), quote.get("longname"))
            )
        }
        if not matches:
            raise EquityValidationError("No matching Japanese listed equity was found. Try its full name or ticker.")
        if len(matches) != 1:
            raise EquityValidationError("Company name is ambiguous. Provide a more specific name or ticker.")
        return _verified_equity(next(iter(matches)))
    except EquityValidationError:
        raise
    except Exception as exc:
        raise EquityValidationUnavailable("Japanese equity lookup is temporarily unavailable.") from exc
