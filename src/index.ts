import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DynamicWorkerExecutor } from "@cloudflare/codemode";
import { createMcpHandler } from "agents/mcp";
import { codeMcpServer } from "./codemode-server.js";
import { registerAnalyzeTools } from "./tools/analyze.js";
import { registerProductTools } from "./tools/products.js";
import { registerRenderTools } from "./tools/render.js";

export interface Env {
  ASSETS: Fetcher;
  BROWSER: Fetcher;
  LOADER: WorkerLoader;
}

interface ServerContext {
  /** Origin of the Worker request — used as the base URL for Static Assets. */
  origin: string;
  env: Env;
}

/**
 * Build a fresh McpServer per request. Data tools (analyze_site, get_products)
 * register on baseServer and get collapsed into a single `code` tool by
 * codeMcpServer. Render tools (render_products, get_cart_url) register on the
 * returned wrapper so they stay direct tool calls — required for MCP Apps
 * widget rendering and for the widget itself to call back into the server.
 */
async function createServer(context: ServerContext): Promise<McpServer> {
  const baseServer = new McpServer({
    name: "rocket-coffee-data",
    version: "1.0.0",
  });

  registerAnalyzeTools(baseServer, { browser: context.env.BROWSER });
  registerProductTools(baseServer);

  const executor = new DynamicWorkerExecutor({
    loader: context.env.LOADER,
    globalOutbound: null,
  });

  const server = await codeMcpServer({ server: baseServer, executor });
  registerRenderTools(server, {
    getAssetsBaseUrl: () => context.origin,
  });
  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/mcp")) {
      return new Response("Not found", { status: 404 });
    }

    // Log JSON-RPC method for wrangler tail debugging
    let methodLabel = request.method;
    try {
      const clone = request.clone();
      const body = await clone.text();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed)) {
              methodLabel = `batch: ${parsed.map((p: { method?: string }) => p?.method).join(", ")}`;
            } else if (parsed.method) {
              methodLabel = parsed.method;
              if (parsed.method === "resources/read" && parsed.params?.uri) {
                methodLabel += ` uri=${parsed.params.uri}`;
              }
              if (parsed.method === "tools/call" && parsed.params?.name) {
                methodLabel += ` name=${parsed.params.name}`;
              }
            }
          }
        } catch {
          /* not JSON */
        }
      }
    } catch {
      /* clone failed */
    }
    console.log(`[mcp] ${request.method} ${url.pathname} — ${methodLabel}`);

    try {
      const server = await createServer({ origin: url.origin, env });
      return await createMcpHandler(server)(request, env, ctx);
    } catch (err) {
      const message = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      console.error("[mcp] exception:", message);
      return new Response("Internal server error", {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
    }
  },
};
