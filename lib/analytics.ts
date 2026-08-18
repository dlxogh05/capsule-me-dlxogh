export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ?? "";

export function isGaMeasurementId(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value);
}

type GtagParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params?: GtagParams) {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.gtag !== "function") {
    return;
  }

  if (params) {
    window.gtag("event", name, params);
    return;
  }

  window.gtag("event", name);
}

export function trackPageView(path: string) {
  trackEvent("page_view", {
    page_path: path,
    page_title: typeof document === "undefined" ? undefined : document.title,
    page_location: typeof window === "undefined" ? undefined : window.location.href,
  });
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
