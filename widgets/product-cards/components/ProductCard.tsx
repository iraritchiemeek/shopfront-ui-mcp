import { useMemo, useState } from "react";
import type { Product, Selection, Variant } from "../types.js";
import { ProductImageCarousel } from "./ProductImageCarousel.js";

interface Props {
  product: Product;
  shopifyUrl: string;
  selection: Selection | null;
  onChange: (next: Selection | null) => void;
  onOpenLink: (url: string) => void;
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

function buildProductUrl(shopifyUrl: string, handle: string): string {
  try {
    const u = new URL(shopifyUrl);
    return `${u.origin}/products/${handle}`;
  } catch {
    return `${shopifyUrl.replace(/\/$/, "")}/products/${handle}`;
  }
}

export function ProductCard({ product, shopifyUrl, selection, onChange, onOpenLink }: Props) {
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
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-4 sm:grid-cols-12 sm:gap-y-8 sm:p-6 lg:gap-x-8">
        <div className="sm:col-span-5">
          <ProductImageCarousel images={product.images} alt={product.title} />
        </div>

        <div className="flex flex-col sm:col-span-7">
          <h2 className="text-xl font-bold text-brand sm:pr-6">{product.title}</h2>

          <p className="mt-3 text-xl text-brand tabular-nums">
            {formatPrice(selectedVariant.price)}
          </p>

          {product.subtext && (
            <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">{product.subtext}</p>
          )}

          {product.variants.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-4">
              {product.options.map((opt, idx) => {
                const id = `option-${product.id}-${idx}`;
                return (
                  <div key={opt.name} className="w-full sm:w-48">
                    <label
                      htmlFor={id}
                      className="block text-sm/6 font-medium text-brand dark:text-white"
                    >
                      {opt.name}
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                      <select
                        id={id}
                        value={optionValues[idx] ?? ""}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-brand outline-1 -outline-offset-1 outline-stone-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-slate-800 dark:focus-visible:outline-brand"
                      >
                        {opt.values.map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                      <svg
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        aria-hidden="true"
                        className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-stone-500 sm:size-4 dark:text-slate-400"
                      >
                        <path
                          d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                          fillRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-6">
            {qty === 0 ? (
              <button
                type="button"
                onClick={() => setQty(1)}
                className="flex w-full items-center justify-center rounded-md bg-brand px-8 py-3 text-base font-medium text-white transition-colors hover:bg-brand-hover focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:outline-none"
              >
                Add to cart
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 p-1.5 dark:border-slate-600 dark:bg-slate-700">
                <button
                  type="button"
                  onClick={() => setQty(qty - 1)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-white text-lg font-semibold text-brand transition-colors hover:bg-stone-100 dark:bg-slate-800 dark:hover:bg-slate-600"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="text-sm font-medium text-brand tabular-nums">
                  {qty} in cart
                </span>
                <button
                  type="button"
                  onClick={() => setQty(qty + 1)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-brand text-lg font-semibold text-white transition-colors hover:bg-brand-hover"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            <p className="mt-3 text-center">
              <button
                type="button"
                onClick={() => onOpenLink(buildProductUrl(shopifyUrl, product.handle))}
                className="cursor-pointer bg-transparent p-0 text-sm font-medium text-brand underline-offset-4 hover:underline dark:text-white"
              >
                View full details
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
