"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics";

export function Ga4PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstPath = useRef(true);

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }

    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}
