/** Shared helpers for widgets. */

/** Create an element with optional class name and text content. */
export function el(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

/** Apply light/dark theme to the document root. */
export function applyTheme(theme: string): void {
  document.documentElement.style.colorScheme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Render a status / error banner in the root element. */
export function renderStatus(message: string, tone: "info" | "error" = "info"): void {
  const root = document.getElementById("root");
  if (!root) return;
  root.className = "max-w-2xl pr-6 py-6";
  root.textContent = "";
  const cls =
    tone === "error"
      ? "rounded-xl border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
      : "rounded-xl border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-500 dark:text-slate-400";
  root.appendChild(el("div", cls, message));
}
