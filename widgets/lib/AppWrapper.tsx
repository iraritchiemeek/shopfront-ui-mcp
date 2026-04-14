/**
 * AppWrapper — MCP host connection + loading/error/cancelled state boilerplate.
 *
 * Renders children as a render prop once data has arrived. Adapted from PostHog's
 * AppWrapper pattern; PostHog logo and fullscreen toggle stripped for v1.
 */
import type { ReactElement, ReactNode } from "react";
import {
  useToolResult,
  type UseToolResultOptions,
  type UseToolResultReturn,
} from "./useToolResult.js";

export interface AppWrapperProps<T> extends UseToolResultOptions {
  children: (result: UseToolResultReturn<T>) => ReactNode;
}

function Spinner(): ReactElement {
  return (
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
  );
}

export function AppWrapper<T>({
  children,
  ...options
}: AppWrapperProps<T>): ReactElement {
  const toolResult = useToolResult<T>(options);
  const { data, isConnected, error, isCancelled, containerDimensions } = toolResult;

  const hasContent = !error && !isCancelled && isConnected && data;

  const rootStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    ...(containerDimensions?.height != null
      ? { height: containerDimensions.height }
      : containerDimensions?.maxHeight != null
        ? { maxHeight: containerDimensions.maxHeight }
        : { minHeight: "100%" }),
  };

  if (!hasContent) {
    return (
      <div
        style={{
          ...rootStyle,
          ...(containerDimensions?.height == null ? { minHeight: 200 } : {}),
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
        }}
      >
        {!error && !isCancelled && <Spinner />}
        {isCancelled && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Tool call was cancelled
          </span>
        )}
        {error && !isCancelled && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </span>
        )}
      </div>
    );
  }

  return <div style={rootStyle}>{children(toolResult)}</div>;
}
