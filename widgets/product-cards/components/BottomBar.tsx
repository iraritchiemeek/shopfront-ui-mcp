export interface CartLineItem {
  productId: number;
  title: string;
  variantTitle: string;
  thumbnail: string | null;
  unitPrice: number;
  quantity: number;
}

interface Props {
  items: CartLineItem[];
  totalPrice: number;
  onChangeQuantity: (productId: number, next: number) => void;
  onCheckout: () => void;
}

function formatPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function BottomBar({ items, totalPrice, onChangeQuantity, onCheckout }: Props) {
  return (
    <div className="sticky bottom-0 mt-8 rounded-lg border border-stone-200 bg-white dark:border-slate-700 dark:bg-slate-800/60">
      <ul className="divide-y divide-stone-200 px-5 dark:divide-slate-700">
        {items.map((item) => {
          const showVariant = item.variantTitle && item.variantTitle !== "Default Title";
          return (
            <li key={item.productId} className="flex py-6">
              <div className="size-24 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100 dark:border-slate-700 dark:bg-slate-700">
                {item.thumbnail && (
                  <img src={item.thumbnail} alt="" className="size-full object-cover" />
                )}
              </div>

              <div className="ml-4 flex min-w-0 flex-1 flex-col">
                <div>
                  <div className="flex justify-between gap-4 text-base font-semibold tracking-tight text-brand dark:text-white">
                    <h3 className="truncate">{item.title}</h3>
                    <p className="ml-4 shrink-0 tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                  {showVariant && (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-slate-400">
                      {item.variantTitle}
                    </p>
                  )}
                </div>

                <div className="flex flex-1 items-end justify-between text-sm">
                  <div className="grid w-full max-w-16 grid-cols-1">
                    <select
                      aria-label={`Quantity, ${item.title}`}
                      value={item.quantity}
                      onChange={(e) =>
                        onChangeQuantity(item.productId, parseInt(e.target.value, 10))
                      }
                      className="col-start-1 row-start-1 cursor-pointer appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-sm font-medium text-brand outline-1 -outline-offset-1 outline-stone-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand dark:bg-white/5 dark:text-white dark:outline-white/10 dark:*:bg-slate-800 dark:focus-visible:outline-brand"
                    >
                      {Array.from({ length: Math.max(10, item.quantity) }, (_, i) => i + 1).map(
                        (n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ),
                      )}
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

                  <button
                    type="button"
                    onClick={() => onChangeQuantity(item.productId, 0)}
                    className="cursor-pointer bg-transparent p-0 text-sm font-medium text-stone-500 transition-colors hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-4 border-t border-stone-200 px-5 py-4 dark:border-slate-700">
        <span className="text-lg font-semibold tracking-tight text-brand dark:text-white">
          Total · {formatPrice(totalPrice)} NZD
        </span>
        <button
          type="button"
          onClick={onCheckout}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white leading-none transition-colors hover:bg-brand-hover"
        >
          <span>Checkout</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="size-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M4.25 10a.75.75 0 0 1 .75-.75h8.19l-2.97-2.97a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06l2.97-2.97H5a.75.75 0 0 1-.75-.75Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
