import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { registerProductTools } from "./tools/products.js";
import { registerRenderTools } from "./tools/render.js";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Env {}

interface ServerContext {
  /** Origin of the Worker request — used as the base URL for Static Assets. */
  origin: string;
}

function createServer(context: ServerContext): McpServer {
  const server = new McpServer({
    name: "rocket-coffee",
    version: "1.0.0",
  });

  registerProductTools(server);
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
      const server = createServer({ origin: url.origin });
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
