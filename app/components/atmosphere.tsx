"use client";

import { useSky } from "@/components/sky-provider";

export function Atmosphere() {
  const sky = useSky();
  const glow = sky?.aura.glow ?? "#d6c4a8";
  const fill = sky?.aura.fill ?? "#c4baa8";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 transition-[background] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        background: `radial-gradient(70% 50% at 8% 0%, ${glow}73, transparent 58%), radial-gradient(50% 40% at 100% 100%, ${fill}47, transparent 55%)`,
      }}
    />
  );
}
