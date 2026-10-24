"""Kabu MCP server entrypoint.

  * stdio (default):  python src/server.py
  * streamable HTTP:  python src/server.py --transport streamable-http
  * MCP inspector:    mcp dev src/server.py
"""

import argparse

from fastmcp import FastMCP

mcp = FastMCP("Kabu MCP")


def main() -> None:
    parser = argparse.ArgumentParser(description="Kabu MCP server")
    parser.add_argument("--transport", choices=["stdio", "streamable-http"], default="stdio")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.transport == "streamable-http":
        mcp.run(transport="streamable-http", host=args.host, port=args.port)
    else:
        mcp.run()


if __name__ == "__main__":
    main()
