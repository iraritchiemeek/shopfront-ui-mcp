/**
 * Shared hook for MCP UI Apps — handles connection, tool-result plumbing,
 * host styling, and cancellation state.
 *
 * Adapted from PostHog's useToolResult; trimmed to the ext-apps 1.5.0 event-handler API
 * (setters like `app.ontoolresult` rather than `setNotificationHandler`).
 */
import { useCallback, useEffect, useState } from "react";
import { type App, useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";

export interface UseToolResultOptions {
  /** App name reported to the host. */
  appName: string;
  /** App version. Defaults to "1.0.0". */
  appVersion?: string;
}

export interface ContainerDimensions {
  height?: number;
  maxHeight?: number;
  width?: number;
  maxWidth?: number;
}

export interface UseToolResultReturn<T> {
  data: T | null;
  isConnected: boolean;
  error: Error | null;
  isCancelled: boolean;
  app: App | null;
  /** Open a URL via the host (falls back to window.open). */
  openLink: (url: string) => void;
  containerDimensions: ContainerDimensions | null;
  /** Re-read container dimensions from the current host context. */
  refreshContainerDimensions: () => void;
}

function extractContainerDimensions(
  ctx: Record<string, unknown> | undefined | null,
): ContainerDimensions | null {
  const dims = ctx?.containerDimensions as Record<string, unknown> | undefined;
  if (!dims) return null;
  const result: ContainerDimensions = {};
  if (typeof dims.height === "number") result.height = dims.height;
  if (typeof dims.maxHeight === "number") result.maxHeight = dims.maxHeight;
  if (typeof dims.width === "number") result.width = dims.width;
  if (typeof dims.maxWidth === "number") result.maxWidth = dims.maxWidth;
  return result;
}

export function useToolResult<T = unknown>({
  appName,
  appVersion = "1.0.0",
}: UseToolResultOptions): UseToolResultReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [parseError, setParseError] = useState<Error | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState<ContainerDimensions | null>(null);

  const {
    app,
    isConnected,
    error: connectionError,
  } = useApp({
    appInfo: { name: appName, version: appVersion },
    capabilities: {},
    onAppCreated: (appInstance) => {
      appInstance.ontoolcancelled = () => {
        setIsCancelled(true);
      };

      appInstance.onhostcontextchanged = (ctx) => {
        setContainerDimensions(
          extractContainerDimensions(ctx as unknown as Record<string, unknown>),
        );
      };

      appInstance.ontoolresult = (params) => {
        try {
          const structured = params.structuredContent;
          if (structured !== undefined && structured !== null) {
            setData(structured as T);
            setParseError(null);
          } else {
            setParseError(new Error("Tool result had no structuredContent"));
          }
        } catch (e) {
          setParseError(e instanceof Error ? e : new Error(String(e)));
        }
      };
    },
  });

  useHostStyles(app, app?.getHostContext());

  // Capture initial container dimensions once connected
  useEffect(() => {
    if (isConnected && app) {
      const ctx = app.getHostContext();
      setContainerDimensions(extractContainerDimensions(ctx as unknown as Record<string, unknown>));
    }
  }, [isConnected, app]);

  const openLink = useCallback(
    (url: string) => {
      if (app) {
        void app.openLink({ url });
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [app],
  );

  const refreshContainerDimensions = useCallback(() => {
    if (!app) return;
    const ctx = app.getHostContext();
    setContainerDimensions(extractContainerDimensions(ctx as unknown as Record<string, unknown>));
  }, [app]);

  const error = connectionError ?? parseError;

  return {
    data,
    isConnected,
    error,
    isCancelled,
    app,
    openLink,
    containerDimensions,
    refreshContainerDimensions,
  };
}
