import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DynamicWorkerExecutor } from "@cloudflare/codemode";
import { createMcpHandler } from "agents/mcp";
import { codeMcpServer } from "./codemode-server.js";
import { registerCollectionTools } from "./tools/collections.js";
import { registerDetectTools } from "./tools/detect.js";
import { registerProductTools } from "./tools/products.js";
import { registerRenderTools } from "./tools/render.js";
import { registerSearchTools } from "./tools/search.js";
import { registerThreeTools } from "./tools/three.js";

export interface Env {
  ASSETS: Fetcher;
  LOADER: WorkerLoader;
  MCP_LIMITER: RateLimit;
  ABUSE_KV: KVNamespace;
}

const DAILY_CEILING = 20_000;

async function checkDailyCeiling(env: Env): Promise<boolean> {
  const key = `count:${new Date().toISOString().slice(0, 10)}`;
  const current = parseInt((await env.ABUSE_KV.get(key)) ?? "0", 10);
  if (current >= DAILY_CEILING) return false;
  await env.ABUSE_KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 48 });
  return true;
}

interface ServerContext {
  /** Origin of the Worker request — used as the base URL for Static Assets. */
  origin: string;
  env: Env;
}

/**
 * Build a fresh McpServer per request. The data tool (get_products) registers
 * on baseServer and gets collapsed into a single `code` tool by codeMcpServer.
 * Render tools (render_products, get_cart_url) register on the returned
 * wrapper so they stay direct tool calls — required for MCP Apps widget
 * rendering and for the widget itself to call back into the server.
 */
async function createServer(context: ServerContext): Promise<McpServer> {
  const baseServer = new McpServer({
    name: "shopfront-ui-data",
    version: "1.0.0",
  });

  registerDetectTools(baseServer);
  registerProductTools(baseServer);
  registerCollectionTools(baseServer);
  registerSearchTools(baseServer);

  const executor = new DynamicWorkerExecutor({
    loader: context.env.LOADER,
    globalOutbound: null,
  });

  const server = await codeMcpServer({ server: baseServer, executor });
  registerRenderTools(server, {
    getAssetsBaseUrl: () => context.origin,
  });
  registerThreeTools(server, {
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

    // Prefer the MCP session ID — remote clients (claude.ai, Claude Desktop,
    // mobile) are brokered server-side by Anthropic, so cf-connecting-ip is
    // Anthropic's egress pool and ~useless for per-user bucketing. The session
    // ID is a per-client value set on initialize and required on every
    // subsequent request by the Streamable HTTP spec. Fall back to IP for the
    // initial request (which has no session yet) and for local/stdio clients.
    const sessionId = request.headers.get("mcp-session-id");
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const limiterKey = sessionId ? `session:${sessionId}` : `ip:${ip}`;
    const { success } = await env.MCP_LIMITER.limit({ key: limiterKey });
    if (!success) {
      return new Response("Rate limit exceeded. Try again in a minute.", {
        status: 429,
        headers: { "retry-after": "60" },
      });
    }

    if (!(await checkDailyCeiling(env))) {
      return new Response("Daily request ceiling reached.", { status: 429 });
    }

    console.log(`[mcp] ${request.method} ${url.pathname}`);

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
