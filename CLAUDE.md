# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

- `pnpm dev` — local dev server via Wrangler
- `pnpm run deploy` — deploy to Cloudflare Workers (must be `run deploy`; `pnpm deploy` is reserved)
- `pnpm typecheck` — run `tsc --noEmit`
- `pnpm lint:quick` — fast oxlint check, run after every edit
- `pnpm lint` — full oxlint check
- `pnpm format` — auto-format with Prettier
- `pnpm format:check` — check formatting without writing
- `pnpm knip` — detect dead code and unused exports
- `pnpm check` — full suite: build widgets + typecheck + lint + format:check
- `pnpm test` — run all tests once
- `pnpm test:watch` — run tests in watch mode

## Architecture

Cloudflare Worker serving an MCP server for browsing and ordering from Rocket Coffee (rocketcoffee.co.nz), a Shopify store.

### Request flow

1. MCP client sends a request to the Worker
2. `createMcpHandler` (from `agents/mcp`) handles MCP Streamable HTTP transport
3. Tools are registered directly on `McpServer` — no codemode, no sandbox
4. `get_products` fetches the Shopify `/products.json` endpoint (public, no auth)
5. `render_products` passes curated product data to the product-cards widget
6. Widget handles cart flow autonomously via `get_cart_url`

### Data source

Shopify's public `/products.json` endpoint. No API key needed. ~40 products, fetched in full and filtered client-side.

### Cart URL

Shopify cart permalink: `https://rocketcoffee.co.nz/cart/VARIANT_ID:QTY,VARIANT_ID:QTY`. Opens checkout with items pre-loaded.

### MCP Apps widgets

Uses `@modelcontextprotocol/ext-apps` SDK. See the duffel-codemode-mcp CLAUDE.md for full MCP Apps documentation links.

**Widget layout rule:** No left padding on root — use `pr-6 py-6` on the root container.

**Data flow:** LLM calls `get_products` → filters/curates → calls `render_products` with product data → widget renders cards → user picks items → widget calls `get_cart_url` → displays checkout link.

Each widget = one tool + one `ui://rocket-coffee/<name>@vN` resource. Bump `@vN` on every UI change.

## Testing

Tests use `@cloudflare/vitest-pool-workers` with `cloudflareTest()`. Mock `globalThis.fetch` with `vi.fn<typeof fetch>()`.

## Key constraints

- `@modelcontextprotocol/sdk` is pinned to `1.28.0` to match the version `agents` bundles internally.
- `package.json` has `"type": "module"` — required for the vitest pool.

## Workflow Rules

1. **After every edit:** Run `pnpm lint:quick` to catch errors immediately.
2. **After every round of changes:** Run `pnpm typecheck` to verify type safety.
3. **Before committing:** Run `pnpm check` (build widgets + typecheck + lint + format:check).
4. **Scope discipline:** Touch the minimum files necessary. Do not refactor unrelated code.
5. **One concern per commit:** Separate functional changes from formatting/lint fixes.

## Code Patterns

### Tool registration

```ts
server.registerTool("my_tool", {
  description: "Detailed description.",
  inputSchema: {
    param: z.string().describe("What this param is"),
  },
}, async ({ param }) => {
  return { content: [{ type: "text" as const, text: "..." }] };
});
```

### Tool modules — wire from index.ts

```ts
// src/tools/mymodule.ts
export function registerMyTools(server: McpServer): void { ... }

// src/index.ts
import { registerMyTools } from "./tools/mymodule.js";
registerMyTools(server);
```
