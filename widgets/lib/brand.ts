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

/**
 * Map BrandTokens to the CSS custom properties consumed by the widget's
 * Tailwind theme. Apply to a wrapper element via the `style` prop.
 */
export function tokensToCssVars(tokens: BrandTokens): Record<string, string> {
  return {
    "--rc-brand-primary": tokens.primary,
    "--rc-brand-primary-hover": tokens.primary,
    "--rc-brand-accent": tokens.accent,
    "--rc-brand-bg": tokens.bg,
    "--rc-brand-fg": tokens.fg,
    "--rc-brand-muted": tokens.muted,
    "--rc-brand-font": tokens.font,
    "--rc-brand-radius": tokens.radius,
  };
}
