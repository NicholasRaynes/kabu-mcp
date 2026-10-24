# Kabu MCP

**Kabu MCP** (株 MCP) is a [Model Context Protocol](https://modelcontextprotocol.io) server that gives LLM clients, such as Claude Desktop, Cursor, or custom agents, deep context on Japanese equities: price data, stock metrics, market overviews, and financial analysis. It is built for investors from retail beginners to experienced analysts.

> Status: early scaffold. Tools and resources are not yet defined.

## Monorepo layout

```
kabu-mcp/
├── apps/
│   ├── web/                   # Next.js site (placeholder) + Dockerfile
│   └── mcp-server/            # Python FastMCP backend + Dockerfile
│       ├── src/
│       │   ├── server.py      # FastMCP entrypoint (stdio / streamable HTTP)
│       │   └── tools/         # Tools (to be defined)
│       └── requirements.txt
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Deploy with Docker

Build and run both services from the repo root (requires Docker):

```bash
git clone https://github.com/<your-org>/kabu-mcp.git
cd kabu-mcp
docker compose up --build -d
```

- Website: http://localhost:3000
- MCP server (streamable HTTP): http://localhost:8000/mcp

Stop with `docker compose down`. To run a single service: `docker compose up --build mcp-server`.

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