import { useEffect, useMemo, useState } from "react";
import type { Product, Selection, Variant } from "../types.js";

interface Props {
  product: Product;
  selection: Selection | null;
  onChange: (next: Selection | null) => void;
}

function formatPrice(amount: string): string {
  const n = parseFloat(amount);
  return Number.isNaN(n) ? `$${amount}` : `$${n.toFixed(2)}`;
}

function findVariant(product: Product, values: string[]): Variant | undefined {
  return product.variants.find((v) => {
    if (v.option1 !== values[0]) return false;
    if (values[1] !== undefined && v.option2 !== values[1]) return false;
    if (values[2] !== undefined && v.option3 !== values[2]) return false;
    return true;
  });
}

/**
 * Fetch the image via fetch() and convert to a blob URL so it renders inside
 * Claude.ai's sandboxed iframe (which blocks remote img-src by default).
 */
function useBlobImage(src: string | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    let createdUrl: string | null = null;
    void (async () => {
      try {
        const r = await fetch(src);
        const blob = await r.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } catch {
        /* image will just be hidden */
      }
    })();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [src]);
  return blobUrl;
}

export function ProductCard({ product, selection, onChange }: Props) {
  // Default option values = first variant
  const firstVariant = product.variants[0]!;
  const defaultValues = useMemo(
    () =>
      [firstVariant.option1, firstVariant.option2, firstVariant.option3].filter(
        (v): v is string => v !== null,
      ),
    [firstVariant],
  );
  const [optionValues, setOptionValues] = useState<string[]>(defaultValues);

  const selectedVariant = findVariant(product, optionValues) ?? firstVariant;
  const qty = selection?.quantity ?? 0;

  const blobUrl = useBlobImage(product.images[0]?.src);

  const setQty = (next: number): void => {
    if (next <= 0) {
      onChange(null);
    } else {
      onChange({ variantId: selectedVariant.id, quantity: next });
    }
  };

  const handleOptionChange = (idx: number, value: string): void => {
    const next = [...optionValues];
    next[idx] = value;
    setOptionValues(next);
    if (qty > 0) {
      const variant = findVariant(product, next);
      if (variant) onChange({ variantId: variant.id, quantity: qty });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800/60 dark:shadow-none">
      <div className="flex gap-6 p-6">
        {blobUrl && (
          <img
            src={blobUrl}
            alt={product.title}
            className="h-60 w-60 flex-shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-xl leading-tight font-bold tracking-tight text-brand">
            {product.title}
          </h3>

          {product.flavor_notes && product.flavor_notes.length > 0 && (
            <p className="mt-2 text-base leading-relaxed font-medium text-brand">
              {product.flavor_notes.join(" · ")}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            {product.variants.length > 1 &&
              product.options.map((opt, idx) => (
                <select
                  key={opt.name}
                  value={optionValues[idx] ?? ""}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:ring-2 focus:ring-brand/50 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {opt.values.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              ))}

            <span className="text-xl font-bold text-brand tabular-nums">
              {formatPrice(selectedVariant.price)}
            </span>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={qty <= 0}
                onClick={() => setQty(qty - 1)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-lg font-bold text-brand transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 ${qty <= 0 ? "opacity-30" : "opacity-100"}`}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-7 text-center text-lg font-bold text-brand tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-brand text-lg font-bold text-white transition-colors hover:bg-brand-hover"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
