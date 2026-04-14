/**
 * Wraps a base McpServer's tools into a single `code` tool that executes
 * JavaScript in a Dynamic Worker sandbox. Each upstream tool becomes a typed
 * `codemode.*` method. Modelled on @cloudflare/codemode's codeMcpServer; the
 * upstream version hardcodes a generic description, so we replicate the
 * wiring to inject a project-specific prompt.
 */
import {
  sanitizeToolName,
  generateTypesFromJsonSchema,
  type DynamicWorkerExecutor,
} from "@cloudflare/codemode";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";

const CHARS_PER_TOKEN = 4;
const MAX_TOKENS = 6_000;
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN;

function truncateResponse(content: unknown): string {
  if (content === undefined) return "No result returned.";
  const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
  if (text.length <= MAX_CHARS) return text;
  return `${text.slice(0, MAX_CHARS)}\n\n--- TRUNCATED ---\nResponse was ~${Math.ceil(text.length / CHARS_PER_TOKEN).toLocaleString()} tokens (limit: ${MAX_TOKENS.toLocaleString()}). Use more specific queries to reduce response size.`;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function unwrapMcpResult(result: unknown): unknown {
  if (result == null || typeof result !== "object") return result;
  const r = result as Record<string, unknown>;
  if ("toolResult" in r) return r.toolResult;
  if (r.isError) {
    const content = r.content as Array<{ type: string; text?: string }> | undefined;
    const msg =
      (content ?? [])
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text)
        .join("\n") || "Tool call failed";
    throw new Error(msg);
  }
  if (r.structuredContent != null) return r.structuredContent;
  if (!Array.isArray(r.content)) return result;
  const content = r.content as Array<{ type: string; text?: string }>;
  if (content.length > 0 && content.every((c) => c.type === "text")) {
    const text = content.map((c) => c.text ?? "").join("\n");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return result;
}

const CODE_DESCRIPTION = `Execute JavaScript to browse a Shopify storefront and pick products. You have a full programming environment — use it to chain calls, filter, and compute in one round-trip.

## Available methods

{{types}}

## Writing code

Write an async arrow function in JavaScript that returns a structured object.
- Do NOT use TypeScript syntax — no type annotations, interfaces, or generics.
- Do NOT define named functions then call them — write the arrow function body directly.
- EXCEPTION: define the \`trim\` helper (below) inline — it keeps your return value small.

## Trim helper — use in every return

Raw Shopify products are heavy (long \`body_html\`, SKUs, timestamps, per-variant grams, multiple images). The object you return is read verbatim by the model as a tool result — untrimmed products waste tokens. Always \`.map(trim)\` before returning. This cuts size 10–20× with no rendering loss.

\`\`\`js
const trim = (p) => ({
  id: p.id, title: p.title, handle: p.handle, vendor: p.vendor,
  product_type: p.product_type, tags: p.tags,
  body_html: (p.body_html || "").replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 280),
  variants: p.variants.map(v => ({
    id: v.id, title: v.title,
    option1: v.option1, option2: v.option2, option3: v.option3,
    available: v.available, price: v.price,
  })),
  images: p.images.slice(0, 1).map(i => ({ src: i.src, width: i.width, height: i.height })),
  options: p.options,
});
\`\`\`

## Typical flow

The end goal is usually to call \`render_products\` (a separate, direct tool — not available here) with curated products. Inside \`code\`, pick the right method for the user's intent, then trim every product before returning.

### Intent: popular / featured / bestselling / curated

List collections, find one whose handle or title matches the intent, then fetch its products (order within a collection reflects whatever the merchant configured):

\`\`\`js
async () => {
  const url = "https://example.com";
  const collections = await codemode.get_collections({ shopify_url: url });
  const picked = collections.find(c => /best|popular|top|featured|staff|frontpage|home/i.test(c.handle + " " + c.title))
    ?? collections.find(c => c.products_count > 0);
  const products = await codemode.get_products_in_collection({ shopify_url: url, handle: picked.handle });
  return { products: products.slice(0, 5).map(trim) };
}
\`\`\`

### Intent: keyword search (user named a specific product, brand, or attribute)

Use predictive search first; fall back to browsing the catalogue if results are thin. \`search_products\` returns a LEAN shape (\`body\` not \`body_html\`, no \`options\`, variants lack \`option1/option2/option3\`) that \`render_products\` will reject — always re-fetch via \`get_products\` and filter by handle before trimming:

\`\`\`js
async () => {
  const url = "https://example.com";
  const q = "<user's keyword>";
  const hits = await codemode.search_products({ shopify_url: url, q });
  const handles = new Set(hits.map(h => h.handle));
  let full = (await codemode.get_products({ shopify_url: url })).filter(p => handles.has(p.handle));
  if (full.length === 0) {
    const re = new RegExp(q, "i");
    full = (await codemode.get_products({ shopify_url: url }))
      .filter(p => re.test(p.title + " " + p.body_html + " " + p.tags.join(" ")));
  }
  return { products: full.slice(0, 5).map(trim) };
}
\`\`\`

### Intent: browse & filter by category or tag

Use the catalogue with \`product_type\` or \`tag\` filters. These are case-insensitive exact matches — use the exact strings you see on the store (discover them via \`get_collections\` or a first unfiltered \`get_products\` call):

\`\`\`js
async () => {
  const products = await codemode.get_products({ shopify_url: "https://example.com", product_type: "<EXACT_TYPE>" });
  return { products: products.slice(0, 5).map(trim) };
}
\`\`\`

Then the model calls \`render_products\` directly with \`{ shopify_url, products, template: "minimal" }\`.

{{example}}`;

export async function codeMcpServer(options: {
  server: McpServer;
  executor: DynamicWorkerExecutor;
}): Promise<McpServer> {
  const { server, executor } = options;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "codemode-proxy", version: "1.0.0" });
  await client.connect(clientTransport);

  const { tools } = await client.listTools();

  const toolDescriptors: Record<
    string,
    { description?: string; inputSchema: Record<string, unknown> }
  > = {};
  for (const tool of tools) {
    toolDescriptors[tool.name] = {
      description: tool.description,
      inputSchema: tool.inputSchema,
    };
  }
  const types = generateTypesFromJsonSchema(toolDescriptors);

  const fns: Record<string, (args: unknown) => Promise<unknown>> = {};
  for (const tool of tools) {
    const toolName = tool.name;
    fns[toolName] = async (args: unknown) => {
      return unwrapMcpResult(
        await client.callTool({
          name: toolName,
          arguments: args as Record<string, unknown>,
        }),
      );
    };
  }

  const firstTool = tools[0];
  let example = "";
  if (firstTool) {
    const props = (firstTool.inputSchema.properties as Record<string, { type?: string }>) ?? {};
    const parts: string[] = [];
    for (const [key, prop] of Object.entries(props)) {
      if (prop.type === "number" || prop.type === "integer") parts.push(`${key}: 0`);
      else if (prop.type === "boolean") parts.push(`${key}: true`);
      else parts.push(`${key}: "..."`);
    }
    const args = parts.length > 0 ? `{ ${parts.join(", ")} }` : "{}";
    example = `Example: async () => { const r = await codemode.${sanitizeToolName(firstTool.name)}(${args}); return r; }`;
  }

  const description = CODE_DESCRIPTION.replace("{{types}}", () => types).replace(
    "{{example}}",
    () => example,
  );

  const codemodeServer = new McpServer({ name: "shopfront-ui", version: "1.0.0" });
  codemodeServer.registerTool(
    "code",
    {
      description,
      inputSchema: {
        code: z.string().describe("JavaScript async arrow function to execute"),
      },
    },
    async ({ code }) => {
      try {
        const result = await executor.execute(code, [{ name: "codemode", fns }]);
        if (result.error)
          return {
            content: [{ type: "text" as const, text: `Error: ${result.error}` }],
            isError: true,
          };
        return {
          content: [{ type: "text" as const, text: truncateResponse(result.result) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${formatError(error)}` }],
          isError: true,
        };
      }
    },
  );

  return codemodeServer;
}
