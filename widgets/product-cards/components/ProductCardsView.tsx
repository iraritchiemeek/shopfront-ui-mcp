import { useCallback, useMemo, useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import type { Payload, Product, Selection } from "../types.js";
import { ProductCard } from "./ProductCard.js";
import { BottomBar } from "./BottomBar.js";
import { CartLink } from "./CartLink.js";

interface Props {
  data: Payload;
  app: App | null;
}

export function ProductCardsView({ data, app }: Props) {
  const { products: rawProducts, title, shopify_url } = data;
  const products = useMemo(() => rawProducts.filter((p) => p.variants.length > 0), [rawProducts]);
  const [selections, setSelections] = useState<Map<number, Selection>>(new Map());
  const [cartUrl, setCartUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const setSelection = useCallback((productId: number, next: Selection | null) => {
    setSelections((prev) => {
      const map = new Map(prev);
      if (next === null || next.quantity <= 0) {
        map.delete(productId);
      } else {
        map.set(productId, next);
      }
      return map;
    });
  }, []);

  const totals = useMemo(() => {
    let items = 0;
    let price = 0;
    for (const p of products) {
      const sel = selections.get(p.id);
      if (!sel) continue;
      const v = p.variants.find((x) => x.id === sel.variantId);
      if (v) {
        items += sel.quantity;
        price += parseFloat(v.price) * sel.quantity;
      }
    }
    return { items, price };
  }, [products, selections]);

  const generateCart = useCallback(async () => {
    const items: { variant_id: number; quantity: number }[] = [];
    for (const sel of selections.values()) {
      if (sel.quantity > 0) {
        items.push({ variant_id: sel.variantId, quantity: sel.quantity });
      }
    }
    if (items.length === 0 || !app) return;

    setIsGenerating(true);
    setCartError(null);
    try {
      const result = (await app.callServerTool({
        name: "get_cart_url",
        arguments: { shopify_url, items },
      })) as { structuredContent?: { cart_url?: string }; isError?: boolean };

      const url = result?.structuredContent?.cart_url;
      if (!url || result.isError) {
        setCartError("Failed to generate cart URL.");
      } else {
        setCartUrl(url);
      }
    } catch (err) {
      setCartError(`Failed to generate cart link: ${(err as Error).message ?? "unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  }, [app, selections, shopify_url]);

  if (cartUrl) {
    return <CartLink url={cartUrl} />;
  }

  return (
    <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 font-sans antialiased dark:border-slate-700 dark:bg-slate-900/40">
      <div className="max-w-3xl p-8">
        {title && (
          <h2 className="mb-6 text-base font-bold tracking-widest text-brand uppercase">{title}</h2>
        )}

        {products.length === 0 ? (
          <StatusBanner message="No products to display." />
        ) : (
          <div className="flex flex-col gap-6">
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                selection={selections.get(product.id) ?? null}
                onChange={(next) => setSelection(product.id, next)}
              />
            ))}
          </div>
        )}

        {cartError && (
          <div className="mt-4">
            <StatusBanner message={cartError} tone="error" />
          </div>
        )}

        {totals.items > 0 && (
          <BottomBar
            totalItems={totals.items}
            totalPrice={totals.price}
            onGenerate={generateCart}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  );
}

function StatusBanner({ message, tone = "info" }: { message: string; tone?: "info" | "error" }) {
  const cls =
    tone === "error"
      ? "rounded-xl border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
      : "rounded-xl border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-500 dark:text-slate-400";
  return <div className={cls}>{message}</div>;
}
