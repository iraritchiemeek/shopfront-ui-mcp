# Shopify MCP Server

A Cloudflare Worker that exposes **any Shopify storefront** as an MCP (Model Context Protocol) server, combining two newer MCP primitives:

- **[Code Mode](https://developers.cloudflare.com/agents/model-context-protocol/codemode/)** — data tools are collapsed into a single `code` tool. The LLM writes JavaScript that chains typed `codemode.*` calls, which execute in an isolated V8 sandbox. One round-trip, no raw catalogue dump in context.
- **[MCP Apps](https://github.com/modelcontextprotocol/ext-apps)** — results render as an interactive **product-cards widget** inside the chat. The user picks variants, the widget calls back into the server for a Shopify cart permalink, and the user lands on the merchant's real checkout.

No merchant install, no API key. Point it at any Shopify store that exposes the public `/products.json` endpoint (the vast majority do).

Rocket Coffee (`rocketcoffee.co.nz`) is the reference store used in development and Storybook.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v10+)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or the [Claude desktop app](https://claude.ai/download)

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/iraritchiemeek/shopfront-ui-mcp
cd shopfront-ui-mcp
pnpm install
```

### 2. Run the dev server

```bash
pnpm dev
```

This builds the widget assets and starts a local Wrangler dev server (default: `http://localhost:8787`). Widget JS/CSS is served from Workers Static Assets at `/ui-apps/product-cards/`.

No credentials or secrets are needed — the server only talks to public Shopify endpoints.

## Connecting to Claude

### Claude Code (CLI)

Add the server to your project's `.mcp.json` file:

```json
{
  "mcpServers": {
    "shopify": {
      "type": "url",
      "url": "http://localhost:8787/mcp"
    }
  }
}
```

### Claude Desktop App

The Claude desktop app connects to remote MCP servers via **custom connectors**, which route through Anthropic's cloud — so the server must be publicly reachable. For the desktop app you'll need to [deploy to Cloudflare](#deploying-to-cloudflare) first; `http://localhost:8787` will not work.

Once deployed:

1. Open **Settings > Connectors** (or **Customize > Connectors**).
2. Click **Add custom connector**.
3. Enter your deployed URL with `/mcp` appended, e.g. `https://shopfront-ui-mcp.<your-subdomain>.workers.dev/mcp`.
4. Click **Add**, then **Connect**.

Note: custom connectors require a paid Claude plan (Pro, Max, Team, or Enterprise). Free accounts are limited to a single connector.

## Deploying to Cloudflare

The Worker can be deployed as a remote MCP server. Because it only reads public Shopify data and does not hold credentials, it can be deployed as-is with no secrets.

### 1. Log in to Cloudflare

```bash
pnpm wrangler login
```

### 2. Create the abuse-prevention KV namespace

```bash
pnpm wrangler kv namespace create ABUSE_KV
```

Paste the printed `id` into `wrangler.jsonc` under `kv_namespaces` (replacing `REPLACE_WITH_KV_ID`).

The Worker enforces two limits: 60 requests/minute per IP (via the Workers rate-limiting binding) and a 20,000 requests/day global ceiling (via KV). Tune in `wrangler.jsonc` and `src/index.ts` if needed.

### 3. Deploy

```bash
pnpm run deploy
```

(`pnpm run deploy` — not `pnpm deploy`; the bare form is reserved by pnpm.)

Wrangler prints the deployed URL, e.g. `https://shopfront-ui-mcp.<your-subdomain>.workers.dev`. Use this URL with `/mcp` appended when connecting from [Claude Code](#claude-code-cli) or the [Claude desktop app](#claude-desktop-app).

## Available Tools

The server exposes one `code` tool (Code Mode) for data access and two direct MCP tools for rendering and checkout.

### `code` — typed Shopify methods inside a sandbox

The LLM writes JavaScript using these typed `codemode.*` methods. All methods take a `shopify_url` so one server works across stores.

| Method                                   | Description                                                  |
| ---------------------------------------- | ------------------------------------------------------------ |
| `codemode.get_products(...)`             | Full catalogue via `/products.json`, with optional `product_type` and `tag` filters |
| `codemode.get_collections(...)`          | List collections (categories, bestsellers, sale, etc.)       |
| `codemode.get_products_in_collection(...)` | Products within a named collection, by handle              |
| `codemode.search_products(...)`          | Keyword search via the storefront's predictive search (lean shape, capped at 10) |

### Render tools (direct MCP calls)

| Tool              | Description                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `render_products` | Renders curated products as an interactive card widget inside the chat      |
| `get_cart_url`    | Called by the widget when the user confirms a selection; returns a Shopify cart permalink |

### End-to-end flow

1. Model calls `code` with an async arrow: picks the right data method, trims fields, returns `{ products }`.
2. Model calls `render_products` with `{ shopify_url, products, template }` — the widget mounts in the chat.
3. User picks variants and quantities; widget calls `get_cart_url` back into the server.
4. Widget shows a "Copy link" button to the Shopify cart permalink — the user lands on the merchant's real checkout.

## Development

```bash
pnpm dev                 # Local dev server (auto-builds widgets first)
pnpm run deploy          # Deploy to Cloudflare Workers
pnpm typecheck           # tsc --noEmit
pnpm lint:quick          # Fast oxlint check
pnpm check               # Full suite: build widgets + typecheck + lint + format:check
pnpm test                # Run tests once
pnpm test:watch          # Watch mode
pnpm build:widgets       # Build all widgets (Vite)
pnpm storybook           # Storybook at http://localhost:6006
pnpm knip                # Detect dead code
```

Widget source lives in `widgets/product-cards/` and is built per-widget by `scripts/build-widgets.ts` into `public/ui-apps/<widget>/`, which Wrangler serves via Static Assets. See `CLAUDE.md` for the deeper architecture notes.
