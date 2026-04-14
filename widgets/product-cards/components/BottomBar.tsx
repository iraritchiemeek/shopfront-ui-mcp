interface Props {
  totalItems: number;
  totalPrice: number;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function BottomBar({ totalItems, totalPrice, onGenerate, isGenerating }: Props) {
  const itemLabel = totalItems === 1 ? "item" : "items";
  return (
    <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 rounded-xl bg-white px-6 py-5 shadow-lg dark:bg-slate-800 dark:shadow-none">
      <span className="text-lg font-bold text-brand">
        {totalItems} {itemLabel} · ${totalPrice.toFixed(2)} NZD
      </span>
      <button
        type="button"
        disabled={isGenerating}
        onClick={onGenerate}
        className="cursor-pointer rounded-lg bg-brand px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {isGenerating ? "Generating…" : "Generate Cart Link"}
      </button>
    </div>
  );
}
