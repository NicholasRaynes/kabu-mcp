# Kabu MCP

**Kabu MCP** (株 MCP) is a [Model Context Protocol](https://modelcontextprotocol.io) server that gives LLM clients, such as Claude Desktop, Cursor, or custom agents, deep context on Japanese equities: price data, stock metrics, market overviews, and financial analysis. It is built for investors from retail beginners to experienced analysts.

> Status: early scaffold. Tools and resources are not yet defined.

## Monorepo layout

```
kabu-mcp/
├── apps/
│   ├── auth-web/              # Vite + React sign-in and OAuth consent pages
│   └── mcp-server/            # Python FastMCP backend + Dockerfile
│       ├── src/
│       │   ├── server.py      # FastMCP entrypoint (streamable HTTP only)
│       │   └── tools/         # Tools (to be defined)
│       └── requirements.txt
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Authentication

Over HTTP the server requires a Supabase-issued OAuth token. Supabase's OAuth Server acts as the authorization server (email/password accounts); `apps/auth-web` hosts the login and consent pages. MCP clients discover this automatically and open a browser window to sign in.

Setup: create a `.env` in the repo root (untracked) with `SUPABASE_PROJECT_URL`, `SUPABASE_JWT_ALGORITHM`, `BASE_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. There are no fallback values. In Supabase, enable the OAuth Server with Authorization Path `/oauth/consent`, Site URL set to the auth web app origin, and dynamic OAuth apps allowed.

## Deploy with Docker

Build and run the server and auth web app from the repo root (requires Docker and a populated `.env`):

```bash
git clone https://github.com/<your-org>/kabu-mcp.git
cd kabu-mcp
docker compose up --build -d
```

MCP server (streamable HTTP): http://localhost:8000/mcp
Auth web app: http://localhost:3000

Stop with `docker compose down`.

## Connect to Claude Desktop

With the containers running, bridge Claude Desktop to the HTTP endpoint using [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) (requires Node.js).

Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "kabu-mcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:8000/mcp"]
    }
  }
}
```

Restart Claude Desktop to load the server.

## License

See [LICENSE](LICENSE).

## Disclaimer

Kabu MCP is for informational purposes only and is not investment advice.