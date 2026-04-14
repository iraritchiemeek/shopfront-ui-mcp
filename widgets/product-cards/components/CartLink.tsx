import { useState } from "react";

interface Props {
  url: string;
}

export function CartLink({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 font-sans antialiased dark:border-slate-700 dark:bg-slate-900/40">
      <div className="max-w-3xl p-6">
        <div className="rounded-xl bg-white p-10 text-center shadow-sm dark:bg-slate-800/60 dark:shadow-none">
          <div className="mb-3 text-2xl font-bold tracking-tight text-brand">Cart ready!</div>
          <p className="mb-6 text-base font-medium text-brand">
            Copy the checkout link below and open it in your browser to complete your order.
          </p>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-block cursor-pointer rounded-lg bg-brand px-8 py-4 text-base font-bold text-white no-underline transition-colors hover:bg-brand-hover"
          >
            {copied ? "Copied!" : "Copy checkout link"}
          </button>
          <div className="mt-4 break-all text-xs text-stone-500 dark:text-slate-400">{url}</div>
        </div>
      </div>
    </div>
  );
}
