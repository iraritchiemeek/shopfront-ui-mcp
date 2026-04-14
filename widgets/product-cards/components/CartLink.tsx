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
          <div className="mb-3 text-2xl font-bold tracking-tight text-brand">
            Cart ready!
          </div>
          <p className="mb-6 text-base font-medium text-brand">
            Click below to open Rocket Coffee with your items pre-loaded.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-brand px-8 py-4 text-base font-bold text-white no-underline transition-colors hover:bg-brand-hover"
          >
            Open Checkout →
          </a>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="mx-auto mt-4 block cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-stone-100 dark:hover:bg-slate-800"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
