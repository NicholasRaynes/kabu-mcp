"""Cross-tool request validation for Japanese equity identifiers."""

import asyncio
from collections.abc import Callable

from fastmcp.exceptions import ToolError
from fastmcp.server.middleware import Middleware, MiddlewareContext

from src.japanese_equity_validation import (
    EquityValidationError,
    EquityValidationUnavailable,
    JapaneseEquity,
    resolve_japanese_equity,
)


class JapaneseEquityValidationMiddleware(Middleware):
    """Validate each tool's configured Japanese-equity argument."""

    def __init__(
        self,
        tool_argument_map: dict[str, str],
        resolver: Callable[[str], JapaneseEquity] = resolve_japanese_equity,
        validation_timeout: float = 10.0,
    ) -> None:
        self.tool_argument_map = tool_argument_map
        self.resolver = resolver
        self.validation_timeout = validation_timeout

    async def on_call_tool(self, context: MiddlewareContext, call_next):
        argument_name = self.tool_argument_map.get(context.message.name)
        if argument_name is None:
            raise ToolError("Tool is not configured with a Japanese-equity validation policy.")

        value = (context.message.arguments or {}).get(argument_name)
        if not isinstance(value, str):
            raise ToolError("Provide a Japanese equity company name or stock ticker.")

        try:
            equity = await asyncio.wait_for(
                asyncio.to_thread(self.resolver, value),
                timeout=self.validation_timeout,
            )
        except (EquityValidationError, EquityValidationUnavailable) as exc:
            raise ToolError(str(exc)) from exc
        except TimeoutError as exc:
            raise ToolError("Japanese equity lookup timed out. Please try again.") from exc
        except Exception as exc:
            raise ToolError("Japanese equity lookup is temporarily unavailable.") from exc

        if ctx := context.fastmcp_context:
            ctx.set_state("japanese_equity", {"symbol": equity.symbol, "name": equity.name})

        return await call_next(context)