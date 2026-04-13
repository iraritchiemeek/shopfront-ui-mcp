import type { App } from "@modelcontextprotocol/ext-apps";

/** Passed to every widget's render function. */
export interface WidgetContext {
  /** MCP Apps SDK instance — use for callServerTool, sendMessage, etc. */
  app: App;
  /** Raw arguments from the ontoolinput event. */
  args: Record<string, unknown>;
}
