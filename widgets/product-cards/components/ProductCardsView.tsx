import { useCallback, useMemo, useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps/react";
import type { Payload, Product, Selection } from "../types.js";
import { ProductCard } from "./ProductCard.js";
import { BottomBar, type CartLineItem } from "./BottomBar.js";
import { buildCartUrl } from "../../lib/shopifyUrls.js";
import { productViews } from "../views.js";

interface Props {
  data: Payload;
  app: App | null;
  openLink?: (url: string) => void;
}

export function ProductCardsView({ data, app: _app, openLink }: Props) {
  const handleOpenLink = useCallback(
    (url: string) => {
      if (openLink) {
        openLink(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [openLink],
  );
  const { products: rawProducts, title, shopify_url, currency } = data;
  const products = useMemo(() => rawProducts.filter((p) => p.variants.length > 0), [rawProducts]);
  const [selections, setSelections] = useState<Map<number, Selection>>(new Map());

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

  const setQuantity = useCallback((productId: number, next: number) => {
    setSelections((prev) => {
      const map = new Map(prev);
      const current = map.get(productId);
      if (!current) return prev;
      if (next <= 0) {
        map.delete(productId);
      } else {
        map.set(productId, { ...current, quantity: next });
      }
      return map;
    });
  }, []);

  const lineItems = useMemo<CartLineItem[]>(() => {
    const items: CartLineItem[] = [];
    const views = products.flatMap((p) =>
      productViews(p, {
        siblingTitle: (parent, s) => s.title ?? `${parent.title} · ${s.swatch.label}`,
      }),
    );
    for (const v of views) {
      const sel = selections.get(v.id);
      if (!sel) continue;
      const variant = v.variants.find((x) => x.id === sel.variantId);
      if (!variant) continue;
      items.push({
        productId: v.id,
        title: v.title,
        variantTitle: variant.title,
        thumbnail: v.images[0]?.src ?? null,
        unitPrice: parseFloat(variant.price),
        quantity: sel.quantity,
      });
    }
    return items;
  }, [products, selections]);

  const totalPrice = useMemo(
    () => lineItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [lineItems],
  );

  const cartUrl = useMemo(() => {
    const items = Array.from(selections.values()).filter((s) => s.quantity > 0);
    if (items.length === 0) return null;
    return buildCartUrl(shopify_url, items);
  }, [selections, shopify_url]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 font-sans antialiased dark:border-slate-700 dark:bg-slate-900/40">
      <div className="px-4 py-8">
        {title && (
          <h2 className="mb-6 text-base font-bold tracking-widest text-brand uppercase">{title}</h2>
        )}

        {products.length === 0 ? (
          <StatusBanner message="No products to display." />
        ) : (
          <div className="flex flex-col gap-4">
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                shopifyUrl={shopify_url}
                currency={currency}
                selections={selections}
                onSelectionChange={setSelection}
                onOpenLink={handleOpenLink}
              />
            ))}
          </div>
        )}

        {lineItems.length > 0 && cartUrl && (
          <BottomBar
            items={lineItems}
            totalPrice={totalPrice}
            currency={currency}
            onChangeQuantity={setQuantity}
            onCheckout={() => handleOpenLink(cartUrl)}
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
