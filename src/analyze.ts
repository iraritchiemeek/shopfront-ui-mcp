/**
 * Extract brand design tokens from a Shopify storefront via the Browser
 * Rendering binding (@cloudflare/puppeteer).
 *
 * Renders the homepage in a headless browser, reads computed styles of
 * sensible elements (theme-color meta, body, a button-like element, header
 * logo), and distils them into a flat BrandTokens object. No vision model,
 * no heuristic scoring — if a signal is missing we fall back to sane
 * defaults rather than guessing.
 */
import { launch } from "@cloudflare/puppeteer";
import { normaliseStoreOrigin } from "./shopify.js";
import { DEFAULT_BRAND_TOKENS, type BrandTokens } from "../widgets/lib/brand.js";

interface RawSignals {
  themeColor: string | null;
  bodyBg: string;
  bodyFg: string;
  bodyFont: string;
  btnBg: string | null;
  btnFg: string | null;
  btnRadius: string | null;
  linkColor: string | null;
  logoSrc: string | null;
  siteName: string | null;
}

function isMeaningfulColor(value: string | null | undefined): value is string {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (v === "transparent" || v === "rgba(0, 0, 0, 0)") return false;
  return true;
}

function pick<T>(...candidates: (T | null | undefined)[]): T | undefined {
  for (const c of candidates) if (c != null) return c;
  return undefined;
}

function normaliseTokens(raw: RawSignals): BrandTokens {
  const primary = pick(
    isMeaningfulColor(raw.btnBg) ? raw.btnBg : null,
    raw.themeColor,
    isMeaningfulColor(raw.linkColor) ? raw.linkColor : null,
  );
  const accent = pick(
    isMeaningfulColor(raw.linkColor) ? raw.linkColor : null,
    raw.themeColor,
    primary,
  );
  return {
    primary: primary ?? DEFAULT_BRAND_TOKENS.primary,
    accent: accent ?? DEFAULT_BRAND_TOKENS.accent,
    bg: isMeaningfulColor(raw.bodyBg) ? raw.bodyBg : DEFAULT_BRAND_TOKENS.bg,
    fg: isMeaningfulColor(raw.bodyFg) ? raw.bodyFg : DEFAULT_BRAND_TOKENS.fg,
    muted: DEFAULT_BRAND_TOKENS.muted,
    font: raw.bodyFont?.trim() || DEFAULT_BRAND_TOKENS.font,
    radius: raw.btnRadius?.trim() || DEFAULT_BRAND_TOKENS.radius,
    logoUrl: raw.logoSrc ?? undefined,
    siteName: raw.siteName ?? undefined,
  };
}

export async function analyzeSite(storeUrl: string, browserBinding: Fetcher): Promise<BrandTokens> {
  const origin = normaliseStoreOrigin(storeUrl);
  const browser = await launch(browserBinding);
  try {
    const page = await browser.newPage();
    await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 20_000 });

    const raw: RawSignals = await page.evaluate(() => {
      const body = getComputedStyle(document.body);

      const btn = document.querySelector(
        "button[type=submit], .btn--primary, .button--primary, .Button--primary, button.btn, a.btn, button",
      );
      const btnStyle = btn ? getComputedStyle(btn) : null;

      const link = document.querySelector("a[href]");
      const linkStyle = link ? getComputedStyle(link) : null;

      const logo = document.querySelector(
        "header img, .logo img, a[aria-label*='logo' i] img, a[href='/'] img",
      ) as HTMLImageElement | null;

      const themeColor =
        document.querySelector('meta[name="theme-color"]')?.getAttribute("content")?.trim() ?? null;
      const siteName =
        document.querySelector('meta[property="og:site_name"]')?.getAttribute("content")?.trim() ??
        document.title?.trim() ??
        null;

      return {
        themeColor,
        bodyBg: body.backgroundColor,
        bodyFg: body.color,
        bodyFont: body.fontFamily,
        btnBg: btnStyle?.backgroundColor ?? null,
        btnFg: btnStyle?.color ?? null,
        btnRadius: btnStyle?.borderRadius ?? null,
        linkColor: linkStyle?.color ?? null,
        logoSrc: logo?.currentSrc || logo?.src || null,
        siteName,
      };
    });

    return normaliseTokens(raw);
  } finally {
    await browser.close();
  }
}
