"""
Kabu MCP server entrypoint.
"""

import argparse
import os

from fastmcp import FastMCP
from fastmcp.server.auth.providers.supabase import SupabaseProvider

from src.middleware import JapaneseEquityValidationMiddleware
from src.tools.company_profile import get_company_profile
from src.tools.news import search_news

# Scopes advertised in protected-resource metadata and in the 401 challenge. They must match,
# otherwise VS Code sees a scope change and restarts the auth flow repeatedly. Not enforced on tokens.
OAUTH_SCOPES = ["openid", "email", "profile", "offline_access"]


class KabuSupabaseProvider(SupabaseProvider):
    def get_challenge_scopes(self, required_scopes: list[str] | None = None) -> list[str]:
        return list(OAUTH_SCOPES) if required_scopes is None else required_scopes


auth = KabuSupabaseProvider(
    project_url=os.environ["SUPABASE_PROJECT_URL"],
    base_url=os.environ["BASE_URL"],
    algorithm=os.environ["SUPABASE_JWT_ALGORITHM"],  # type: ignore[arg-type]
    scopes_supported=OAUTH_SCOPES,
)

mcp = FastMCP(
    "Kabu MCP",
    instructions=(
        "Tools accept Japanese listed equity company names or Japanese stock tickers only. "
        "Use a more specific name or ticker if a company name is ambiguous."
    ),
    auth=auth,
)
mcp.add_middleware(
    JapaneseEquityValidationMiddleware(
        tool_argument_map={
            "search_news": "query",
            "get_company_profile": "query",
        },
    )
)
mcp.add_tool(search_news)
mcp.add_tool(get_company_profile)


def main() -> None:
    """Run over streamable HTTP only (stdio is intentionally unsupported)."""
    parser = argparse.ArgumentParser(description="Kabu MCP server (streamable HTTP only)")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind address (use 0.0.0.0 in containers)")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    mcp.run(transport="streamable-http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
