import { useEffect, useState } from "react";

export function useBlobImages(srcs: string[]): (string | null)[] {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}
