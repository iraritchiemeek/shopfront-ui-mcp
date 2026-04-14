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

const CODE_DESCRIPTION = `Execute JavaScript to browse a Shopify storefront, analyse its brand styling, and pick products. You have a full programming environment — use it to chain calls, filter, and compute in one round-trip.

## Available methods

{{types}}

## Writing code

Write an async arrow function in JavaScript that returns a structured object.
- Do NOT use TypeScript syntax — no type annotations, interfaces, or generics.
- Do NOT define named functions then call them — write the arrow function body directly.

## Typical flow

The end goal is usually to call \`render_products\` (a separate, direct tool — not available here) with curated products plus brand tokens. Inside \`code\`, gather the inputs:

\`\`\`js
async () => {
  const [tokens, products] = await Promise.all([
    codemode.analyze_site({ shopify_url: "https://example.com" }),
    codemode.get_products({ shopify_url: "https://example.com", product_type: "COFFEE" })
  ]);
  // Pick the specific product the user asked about and parse flavour notes.
  const product = products.find(p => p.title.toLowerCase().includes("rocket fuel"));
  return { tokens, products: product ? [product] : products.slice(0, 3) };
}
\`\`\`

Then the model calls \`render_products\` directly with \`{ shopify_url, products, tokens, template: "minimal" }\`.

## Efficiency rules

1. **One-shot**: fetch everything you need inside \`code\`, return the final shape.
2. **Parallel fetches**: \`Promise.all\` for independent calls (site analysis + product list).
3. **Filter in code**: narrow to the product the user asked about before returning.
4. **Tokens are small** — always include them so \`render_products\` can theme the cards.

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

  const codemodeServer = new McpServer({ name: "rocket-coffee", version: "1.0.0" });
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
