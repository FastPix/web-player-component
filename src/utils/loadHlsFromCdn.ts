/**
 * Loads hls.js from jsDelivr once per page. Keeps the player bundle small; integrators
 * only include the FastPix script — HLS is fetched automatically.
 *
 * Pin: @1 resolves to latest 1.x on the CDN (align with package.json major).
 */
const HLS_MIN_URL = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
const SCRIPT_MARK = "data-fp-hls-loader";

let loadPromise: Promise<void> | null = null;

export function loadHlsFromCdn(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  const w = window as unknown as { Hls?: unknown };
  if (w.Hls) {
    return Promise.resolve();
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const attach = (el: HTMLScriptElement) => {
      el.addEventListener("load", () => resolve(), { once: true });
      el.addEventListener(
        "error",
        () => {
          loadPromise = null;
          reject(new Error("Failed to load hls.js from CDN"));
        },
        { once: true }
      );
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[${SCRIPT_MARK}]`
    );
    if (existing) {
      if ((window as unknown as { Hls?: unknown }).Hls) {
        resolve();
        return;
      }
      attach(existing);
      return;
    }

    const s = document.createElement("script");
    s.src = HLS_MIN_URL;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute(SCRIPT_MARK, "1");
    attach(s);
    (document.head ?? document.documentElement).appendChild(s);
  });

  return loadPromise;
}

export function getHlsConstructor(): new (config?: unknown) => unknown {
  const w = window as unknown as { Hls?: new (config?: unknown) => unknown };
  const H = w.Hls;
  if (!H) {
    throw new Error("Hls is not available; call loadHlsFromCdn() first");
  }
  return H;
}
