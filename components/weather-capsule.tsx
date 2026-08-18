"use client";

import type { CapsuleAura } from "@/lib/capsule-aura";

const SIZES = {
  xs: "h-11 w-9",
  sm: "h-24 w-20",
  md: "h-40 w-32",
  lg: "h-56 w-44",
} as const;

function CapsuleBody({ aura }: { aura: CapsuleAura }) {
  const { shape, fill, accent } = aura;

  if (shape === "drop") {
    return (
      <path
        d="M100 22C100 22 42 108 42 152c0 34 26 62 58 62s58-28 58-62C158 108 100 22 100 22Z"
        fill={fill}
        stroke={accent}
        strokeWidth="3"
      />
    );
  }

  if (shape === "crystal") {
    return (
      <path
        d="M100 18 148 78 124 214 76 214 52 78Z"
        fill={fill}
        stroke={accent}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    );
  }

  if (shape === "cloud") {
    return (
      <path
        d="M62 128c-18 2-32 18-32 36 0 20 16 36 38 36h84c22 0 40-16 40-38 0-18-12-32-28-36 2-10 2-20-4-30-10-18-36-26-56-14-8-16-28-24-46-16-14 6-22 20-22 36 8-6 18-10 26-10Z"
        fill={fill}
        stroke={accent}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    );
  }

  if (shape === "petal") {
    return (
      <g>
        <ellipse cx="100" cy="78" rx="28" ry="48" fill={fill} stroke={accent} strokeWidth="2.5" />
        <ellipse cx="100" cy="78" rx="28" ry="48" fill={fill} stroke={accent} strokeWidth="2.5" transform="rotate(72 100 120)" />
        <ellipse cx="100" cy="78" rx="28" ry="48" fill={fill} stroke={accent} strokeWidth="2.5" transform="rotate(144 100 120)" />
        <ellipse cx="100" cy="78" rx="28" ry="48" fill={fill} stroke={accent} strokeWidth="2.5" transform="rotate(216 100 120)" />
        <ellipse cx="100" cy="78" rx="28" ry="48" fill={fill} stroke={accent} strokeWidth="2.5" transform="rotate(288 100 120)" />
        <circle cx="100" cy="120" r="34" fill={accent} />
      </g>
    );
  }

  if (shape === "shard") {
    return (
      <path
        d="M108 16 168 86 138 222 62 208 32 96Z"
        fill={fill}
        stroke={accent}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    );
  }

  return (
    <rect
      x="58"
      y="22"
      width="84"
      height="196"
      rx="42"
      fill={fill}
      stroke={accent}
      strokeWidth="3"
    />
  );
}

export function WeatherCapsule({
  aura,
  size = "md",
  className = "",
}: {
  aura: CapsuleAura;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const highlight =
    aura.shape === "cloud"
      ? "M78 132c18-22 52-18 62 4"
      : aura.shape === "drop"
        ? "M78 86c10-22 34-34 48-18"
        : aura.shape === "crystal" || aura.shape === "shard"
          ? "M86 56c12-16 28-18 40-6"
          : "M78 64c8-18 28-26 42-12";

  return (
    <div className={`capsule-float ${SIZES[size]} ${className}`.trim()} style={{ filter: `drop-shadow(0 18px 28px ${aura.glow}aa)` }}>
      <svg aria-hidden="true" className="size-full overflow-visible" viewBox="0 0 200 240">
        <ellipse cx="100" cy="226" rx="46" ry="8" fill={aura.accent} opacity="0.22" />
        <CapsuleBody aura={aura} />
        <path
          d={highlight}
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeOpacity="0.55"
          strokeWidth="7"
        />
      </svg>
    </div>
  );
}

export function KeywordRow({
  keywords,
  tone = "ink",
}: {
  keywords: string[];
  tone?: "ink" | "light";
}) {
  if (keywords.length === 0) {
    return null;
  }

  const chip =
    tone === "light"
      ? "bg-white/14 text-white/90"
      : "bg-ink/6 text-ink/80";

  return (
    <ul className="flex flex-wrap gap-1.5">
      {keywords.map((keyword) => (
        <li
          className={`rounded-full px-2.5 py-1 text-[11px] tracking-[0.04em] ${chip}`}
          key={keyword}
        >
          {keyword}
        </li>
      ))}
    </ul>
  );
}
