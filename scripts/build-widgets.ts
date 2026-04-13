/**
 * Build script for MCP Apps widgets.
 *
 * For each widget under `widgets/<name>/`:
 *   1. Compiles Tailwind via `@tailwindcss/cli` against `style.css`
 *   2. Bundles `main.ts` via esbuild (browser target, ESM, minified)
 *   3. Appends both to `index.html` as inline `<style>` and `<script>` tags
 *   4. Writes `src/widgets/generated/<name>.html`
 *
 * The server imports these `.html` files as text modules (via wrangler `rules`).
 *
 * Run via `pnpm build:widgets`. Auto-runs from `predev` / `predeploy`.
 */
import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { readdir, stat } from "node:fs/promises";
import { build } from "esbuild";

const execFileP = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WIDGETS_DIR = join(ROOT, "widgets");
const OUT_DIR = join(ROOT, "src", "widgets", "generated");

/** Discover widget directories — any subdir of widgets/ that contains main.ts. */
async function discoverWidgets(): Promise<string[]> {
  const entries = await readdir(WIDGETS_DIR);
  const names: string[] = [];
  for (const entry of entries) {
    const mainPath = join(WIDGETS_DIR, entry, "main.ts");
    try {
      const s = await stat(mainPath);
      if (s.isFile()) names.push(entry);
    } catch {
      // Not a widget directory
    }
  }
  return names.sort();
}

async function buildCss(widgetDir: string): Promise<string> {
  const input = join(widgetDir, "style.css");
  const output = join(widgetDir, ".build.css");
  await execFileP(
    "pnpm",
    ["exec", "tailwindcss", "-i", input, "-o", output, "--minify"],
    { cwd: ROOT },
  );
  const css = await readFile(output, "utf8");
  await rm(output, { force: true });
  return css;
}

async function buildJs(widgetDir: string): Promise<string> {
  const result = await build({
    entryPoints: [join(widgetDir, "main.ts")],
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["es2022"],
    minify: true,
    write: false,
    logLevel: "error",
  });
  const file = result.outputFiles?.[0];
  if (!file) throw new Error("esbuild produced no output");
  return file.text;
}

async function buildWidget(name: string): Promise<void> {
  const widgetDir = join(WIDGETS_DIR, name);
  const template = await readFile(join(widgetDir, "index.html"), "utf8");

  const [css, js] = await Promise.all([buildCss(widgetDir), buildJs(widgetDir)]);

  const html = template + `<style>${css}</style><script type="module">${js}</script>`;

  const outFile = join(OUT_DIR, `${name}.html`);
  await writeFile(outFile, html, "utf8");
  // eslint-disable-next-line no-console
  console.log(`[build-widgets] ${name} → ${outFile} (${html.length} bytes)`);
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const names = await discoverWidgets();
  if (names.length === 0) {
    // eslint-disable-next-line no-console
    console.log("[build-widgets] No widgets found");
    return;
  }
  for (const name of names) await buildWidget(name);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
