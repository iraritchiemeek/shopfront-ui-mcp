import { useEffect, useMemo, useRef, useState } from "react";
import type { Product, Selection, Variant } from "../types.js";
import { ProductImageCarousel } from "./ProductImageCarousel.js";
import { buildProductUrl } from "../../lib/shopifyUrls.js";
import { formatPrice } from "../../lib/formatPrice.js";
import { productViews, type ProductView } from "../views.js";

interface Props {
  product: Product;
  shopifyUrl: string;
  currency?: string;
  selections: ReadonlyMap<number, Selection>;
  onSelectionChange: (productId: number, next: Selection | null) => void;
  onOpenLink: (url: string) => void;
}

function findVariant(variants: Variant[], values: string[]): Variant | undefined {
  return variants.find((v) => {
    if (v.option1 !== values[0]) return false;
    if (values[1] !== undefined && v.option2 !== values[1]) return false;
    if (values[2] !== undefined && v.option3 !== values[2]) return false;
    return true;
  });
}

function defaultOptionValues(variant: Variant): string[] {
  return [variant.option1, variant.option2, variant.option3].filter((v): v is string => v !== null);
}

export function ProductCard({
  product,
  shopifyUrl,
  currency,
  selections,
  onSelectionChange,
  onOpenLink,
}: Props) {
  const views = useMemo<ProductView[]>(() => productViews(product), [product]);

  const [activeIdx, setActiveIdx] = useState(0);
  const active = views[activeIdx] ?? views[0]!;
  const showSwatches = views.length > 1 && views.every((v) => v.swatch);

  // Option values are scoped per active view. Initialise lazily from each view's first variant.
  const [optionValuesByIdx, setOptionValuesByIdx] = useState<Map<number, string[]>>(new Map());
  const optionValues = optionValuesByIdx.get(activeIdx) ?? defaultOptionValues(active.variants[0]!);

  const selectedVariant = findVariant(active.variants, optionValues) ?? active.variants[0]!;
  const selection = selections.get(active.id) ?? null;
  const qty = selection?.quantity ?? 0;

  const setQty = (next: number): void => {
    if (next <= 0) {
      onSelectionChange(active.id, null);
    } else {
      onSelectionChange(active.id, { variantId: selectedVariant.id, quantity: next });
    }
  };

  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const handleAdd = (): void => {
    setQty(qty + 1);
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1200);
  };

  const handleOptionChange = (idx: number, value: string): void => {
    const next = [...optionValues];
    next[idx] = value;
    setOptionValuesByIdx((prev) => new Map(prev).set(activeIdx, next));
    if (qty > 0) {
      const variant = findVariant(active.variants, next);
      if (variant) onSelectionChange(active.id, { variantId: variant.id, quantity: qty });
    }
  };

  return (
    <div className="@container overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-4 @xl:grid-cols-12 @xl:gap-y-8 @xl:p-6 @2xl:gap-x-8">
        <div className="@xl:col-span-5 @xl:self-center">
          <ProductImageCarousel key={active.id} images={active.images} alt={active.title} />
        </div>

        <div className="flex flex-col @xl:col-span-7">
          <h2 className="text-xl font-semibold tracking-tight text-brand leading-tight @xl:pr-6">
            {active.title}
          </h2>

          <p className="mt-2 text-lg font-semibold text-brand tabular-nums">
            {formatPrice(selectedVariant.price, currency)}
          </p>

          {product.subtext && (
            <p className="mt-3 text-sm/6 text-stone-600 dark:text-slate-400">{product.subtext}</p>
          )}

          <p className="mt-3">
            <button
              type="button"
              onClick={() => onOpenLink(buildProductUrl(shopifyUrl, active.handle))}
              className="group inline-flex cursor-pointer items-center gap-1 bg-transparent p-0 text-sm font-medium text-brand underline-offset-4 hover:underline dark:text-white"
            >
              View full details
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 10a.75.75 0 0 1 .75-.75h8.19l-2.97-2.97a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06l2.97-2.97H5a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </p>

          {showSwatches && (
            <div className="mt-6">
              <span className="block text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-slate-400">
                Colour
                {active.swatch && (
                  <span className="ml-2 font-medium normal-case tracking-normal text-brand dark:text-white">
                    {active.swatch.label}
                  </span>
                )}
              </span>
              <fieldset aria-label="Colour" className="mt-2">
                <div className="flex flex-wrap items-center gap-3">
                  {views.map((v, i) => {
                    if (!v.swatch) return null;
                    const checked = activeIdx === i;
                    return (
                      <label
                        key={v.id}
                        title={v.swatch.label}
                        className="flex cursor-pointer rounded-full outline -outline-offset-1 outline-black/10 dark:outline-white/20"
                      >
                        <input
                          type="radio"
                          name={`product-${product.id}-finish`}
                          value={String(v.id)}
                          checked={checked}
                          onChange={() => setActiveIdx(i)}
                          aria-label={v.swatch.label}
                          style={{ backgroundColor: v.swatch.color }}
                          className="size-8 appearance-none rounded-full forced-color-adjust-none checked:outline-2 checked:outline-offset-2 checked:outline-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand dark:checked:outline-white dark:focus-visible:outline-white"
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {active.variants.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {active.options.map((opt, idx) => {
                const id = `option-${active.id}-${idx}`;
                const selectedVal = optionValues[idx] ?? "";
                return (
                  <div key={opt.name} className="min-w-[8rem] flex-1 @xl:max-w-[16rem]">
                    <label
                      htmlFor={id}
                      className="block text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-slate-400"
                    >
                      {opt.name}
                    </label>
                    <div className="mt-2 grid grid-cols-1">
                      <select
                        id={id}
                        value={selectedVal}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="col-start-1 row-start-1 w-full cursor-pointer appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-sm font-medium text-brand outline-1 -outline-offset-1 outline-stone-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-slate-800 dark:focus-visible:outline-brand"
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
            <button
              type="button"
              onClick={handleAdd}
              className="relative flex w-full cursor-pointer items-center justify-center rounded-md bg-brand px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-hover focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:outline-none"
            >
              <span
                className={`transition-opacity duration-200 ${justAdded ? "opacity-0" : "opacity-100"}`}
              >
                Add to cart
              </span>
              <span
                aria-hidden={!justAdded}
                className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200 ${justAdded ? "opacity-100" : "opacity-0"}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a.75.75 0 0 1 .006 1.06l-7.5 7.59a.75.75 0 0 1-1.07.002L3.29 9.09a.75.75 0 1 1 1.06-1.06l4.283 4.28 6.97-7.05a.75.75 0 0 1 1.06.03Z"
                    clipRule="evenodd"
                  />
                </svg>
                Added
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
