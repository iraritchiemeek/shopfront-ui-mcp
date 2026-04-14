/**
 * Brand design tokens extracted from an arbitrary Shopify storefront.
 *
 * Shared between the server (analyze_site tool writes them) and the widget
 * (reads them to theme the card via CSS variables). Colors are always CSS
 * color strings — whatever `getComputedStyle` returned (rgb/rgba/hex are all
 * valid). `font` is a font-family stack. `radius` is a CSS length.
 */
export interface BrandTokens {
  primary: string;
  accent: string;
  bg: string;
  fg: string;
  muted: string;
  font: string;
  radius: string;
  logoUrl?: string;
  siteName?: string;
}

export const DEFAULT_BRAND_TOKENS: BrandTokens = {
  primary: "#111111",
  accent: "#c0392b",
  bg: "#ffffff",
  fg: "#111111",
  muted: "#6b6b6b",
  font: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  radius: "8px",
};
