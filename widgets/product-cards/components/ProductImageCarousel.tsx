import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductImage } from "../types.js";

interface Props {
  images: ProductImage[];
  alt: string;
}

function useBlobImages(srcs: string[]): (string | null)[] {
  const [urls, setUrls] = useState<(string | null)[]>(() => srcs.map(() => null));
  const key = srcs.join("|");
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    void (async () => {
      const results = await Promise.all(
        srcs.map(async (src) => {
          try {
            const r = await fetch(src);
            const blob = await r.blob();
            const u = URL.createObjectURL(blob);
            created.push(u);
            return u;
          } catch {
            return null;
          }
        }),
      );
      if (!cancelled) setUrls(results);
    })();
    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
    // srcs is arbitrary; join-key keeps deps stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

export function ProductImageCarousel({ images, alt }: Props) {
  const srcs = images.map((i) => i.src);
  const blobUrls = useBlobImages(srcs);
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollToIndex = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex((prev) => (prev === i ? prev : i));
  }, []);

  if (images.length === 0) {
    return <div className="aspect-square w-full rounded-lg bg-stone-100 dark:bg-slate-700" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto rounded-lg bg-stone-100 [scrollbar-width:none] dark:bg-slate-700 [&::-webkit-scrollbar]:hidden"
      >
        {blobUrls.map((url, i) => (
          <div
            key={images[i]!.src}
            className="flex aspect-square w-full shrink-0 snap-center items-center justify-center p-3"
          >
            {url && (
              <img
                src={url}
                alt={alt}
                className="h-full w-full object-contain"
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {blobUrls.map((url, i) => (
            <button
              key={images[i]!.src}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={activeIndex === i}
              className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-stone-100 p-1 transition-colors dark:bg-slate-700 ${
                activeIndex === i
                  ? "border-brand dark:border-white"
                  : "border-stone-200 hover:border-stone-400 dark:border-slate-600 dark:hover:border-slate-400"
              }`}
            >
              {url && <img src={url} alt="" className="h-full w-full object-contain" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
