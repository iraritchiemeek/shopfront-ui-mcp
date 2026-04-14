/**
 * Build each widget with Vite.
 *
 * Discovers widgets under widgets/<name>/main.tsx and invokes
 * `vite build --config vite.widgets.config.ts` with WIDGET=<name> per widget.
 * Builds run in parallel. `--watch` rebuilds on changes under widgets/.
 *
 * Run via `pnpm build:widgets`. Auto-runs from `predev` / `predeploy`.
 */
import { exec } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WIDGETS_DIR = join(ROOT, "widgets");
const OUT_DIR = join(ROOT, "public", "ui-apps");

async function discoverWidgets(): Promise<string[]> {
  const entries = await readdir(WIDGETS_DIR);
  const names: string[] = [];
  for (const entry of entries) {
    const mainPath = join(WIDGETS_DIR, entry, "main.tsx");
    try {
      const s = await stat(mainPath);
      if (s.isFile()) names.push(entry);
    } catch {
      // not a widget
    }
  }
  return names.sort();
}

function buildWidget(name: string): Promise<void> {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return Promise.reject(new Error(`Invalid widget name "${name}"`));
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const child = exec("pnpm exec vite build --config vite.widgets.config.ts", {
      cwd: ROOT,
      env: { ...process.env, WIDGET: name },
    });
    let stderr = "";
    child.stderr?.on("data", (d) => {
      stderr += d;
    });
    child.on("close", (code) => {
      if (code !== 0) {
        console.error(`[build-widgets] ${name} failed:\n${stderr}`);
        rejectPromise(new Error(`Build failed for ${name}`));
      } else {
        console.log(`[build-widgets] ✓ ${name}`);
        resolvePromise();
      }
    });
  });
}

async function buildAll(names: string[]): Promise<void> {
  await Promise.all(names.map(buildWidget));
}

async function watchMode(names: string[]): Promise<void> {
  await buildAll(names);
  console.log("[build-widgets] Initial build complete. Watching for changes…");

  const { default: chokidar } = await import("chokidar");

  let isBuilding = false;
  let pending = false;

  const rebuild = async (): Promise<void> => {
    if (isBuilding) {
      pending = true;
      return;
    }
    isBuilding = true;
    try {
      await buildAll(names);
    } catch (err) {
      console.error("[build-widgets] rebuild failed:", err);
    }
    isBuilding = false;
    if (pending) {
      pending = false;
      setTimeout(rebuild, 100);
    }
  };

  const watcher = chokidar.watch(join(WIDGETS_DIR, "**/*.{ts,tsx,css}"), {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });
  watcher.on("change", (path) => {
    console.log(`[build-widgets] changed: ${path}`);
    void rebuild();
  });
  watcher.on("add", (path) => {
    console.log(`[build-widgets] added: ${path}`);
    void rebuild();
  });

  const cleanup = (): void => {
    void watcher.close();
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

async function main(): Promise<void> {
  const isWatch = process.argv.includes("--watch");
  const names = await discoverWidgets();
  if (names.length === 0) {
    console.log("[build-widgets] No widgets found");
    return;
  }
  console.log(`[build-widgets] Discovered: ${names.join(", ")}`);

  if (existsSync(OUT_DIR)) {
    rmSync(OUT_DIR, { recursive: true });
  }

  if (isWatch) {
    await watchMode(names);
  } else {
    await buildAll(names);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
