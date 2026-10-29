"""
Kabu MCP server entrypoint.
"""

import argparse

from fastmcp import FastMCP

from src.middleware import JapaneseEquityValidationMiddleware
from src.tools.news import search_news

mcp = FastMCP(
    "Kabu MCP",
    instructions=(
        "Tools accept Japanese listed equity company names or Japanese stock tickers only. "
        "Use a more specific name or ticker if a company name is ambiguous."
    ),
)
mcp.add_middleware(
    JapaneseEquityValidationMiddleware(
        tool_argument_map={"search_news": "query"},
    )
)
mcp.add_tool(search_news)


def main() -> None:
    """Run over stdio (local clients) or streamable HTTP (Docker/deployed)."""
    parser = argparse.ArgumentParser(description="Kabu MCP server")
    parser.add_argument("--transport", choices=["stdio", "streamable-http"], default="stdio")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind address (use 0.0.0.0 in containers)")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.transport == "streamable-http":
        mcp.run(transport="streamable-http", host=args.host, port=args.port)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
