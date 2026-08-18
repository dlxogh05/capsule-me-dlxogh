"use client";

import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/app/components/atmosphere";
import { KeywordRow, WeatherCapsule } from "@/components/weather-capsule";
import { formatWeatherLine } from "@/lib/capsule-aura";
import {
  daysUntilOpen,
  formatOpenDate,
  getCapsule,
  isCapsuleOpen,
  type CapsuleRecord,
} from "@/lib/capsules";
import { isDev } from "@/lib/dev";
import { getFirebaseAuth } from "@/lib/firebase";

type CapsuleItem = CapsuleRecord & { id: string };

function LockMark() {
  return (
    <svg aria-hidden="true" className="size-7" fill="none" viewBox="0 0 24 24">
      <rect
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        width="14"
        x="5"
        y="11"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CapsuleDetail({ id }: { id: string }) {
  const [capsule, setCapsule] = useState<CapsuleItem | null>(null);
  const [status, setStatus] = useState<"loading" | "missing" | "ready" | "denied">("loading");
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) {
          setStatus("denied");
          setCapsule(null);
        }
        return;
      }

      try {
        const next = await getCapsule(id);
        if (!cancelled) {
          setCapsule(next);
          setStatus(next ? "ready" : "missing");
        }
      } catch {
        if (!cancelled) {
          setStatus("denied");
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [id]);

  const open = capsule ? isCapsuleOpen(capsule.openDate) : false;
  const revealed = open || (isDev && peek);
  const cover = capsule?.photos[0]?.url;

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-8 md:px-8 md:py-12">
      <Atmosphere />
      <div className="mx-auto w-full max-w-5xl">
        <Link
          className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
          href="/"
        >
          Capsule Me
        </Link>

        {status === "loading" ? (
          <div className="mt-10 h-[28rem] animate-pulse rounded-[2rem] bg-white/70" />
        ) : null}

        {status === "denied" ? (
          <div className="rise mt-16 max-w-lg">
            <h1 className="font-serif text-4xl tracking-[-0.04em] text-ink md:text-5xl">
              로그인이 필요해요
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              이 캡슐은 묻은 사람만 열 수 있어요.
            </p>
            <Link
              className="mt-8 inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
              href="/"
            >
              홈으로
            </Link>
          </div>
        ) : null}

        {status === "missing" ? (
          <div className="rise mt-16 max-w-lg">
            <h1 className="font-serif text-4xl tracking-[-0.04em] text-ink md:text-5xl">
              캡슐을 찾지 못했어요
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              주소가 바뀌었거나 아직 묻히지 않은 캡슐이에요.
            </p>
          </div>
        ) : null}

        {status === "ready" && capsule ? (
          <article className="rise mt-8 grid items-start gap-8 md:mt-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-12">
            <div
              className="relative min-h-[22rem] overflow-hidden rounded-[2rem] md:min-h-[32rem]"
              style={{
                background: capsule.aura
                  ? `radial-gradient(80% 70% at 50% 22%, ${capsule.aura.glow}, ${capsule.aura.fill}40 55%, #ece7de)`
                  : "#ece7de",
              }}
            >
              {revealed && cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  src={cover}
                />
              ) : null}
              {!revealed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  {capsule.aura ? (
                    <WeatherCapsule aura={capsule.aura} size="lg" />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-full bg-white/12 text-ink">
                      <LockMark />
                    </span>
                  )}
                  <p className="mt-5 text-[11px] tracking-[0.2em] text-ink/50 uppercase">Sealed</p>
                  <p className="font-serif mt-3 text-4xl tracking-[-0.04em] text-ink">
                    {daysUntilOpen(capsule.openDate)}일 뒤에 열려요
                  </p>
                  <p className="mt-3 text-sm text-mute">
                    {formatOpenDate(capsule.openDate)}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-line bg-ink/4 p-1.5">
              <div className="rounded-[calc(2rem-0.375rem)] bg-white px-6 py-8 md:px-8 md:py-10">
                <p className="text-[11px] font-medium tracking-[0.2em] text-mute uppercase">
                  {open ? "Opened" : "Waiting"}
                </p>
                <h1 className="font-serif mt-3 text-[clamp(2.2rem,6vw,3.4rem)] leading-[0.95] tracking-[-0.04em] text-ink">
                  {capsule.recipient || "이름 없는 캡슐"}
                </h1>
                <p className="mt-4 text-sm text-mute">{formatOpenDate(capsule.openDate)}</p>
                {capsule.weather ? (
                  <p className="mt-2 text-sm text-mute">{formatWeatherLine(capsule.weather)}</p>
                ) : null}

                {capsule.aura ? (
                  <div className="mt-6">
                    <p className="font-serif text-2xl leading-snug tracking-[-0.03em] text-ink">
                      {capsule.aura.quote}
                    </p>
                    <div className="mt-4">
                      <KeywordRow keywords={capsule.aura.keywords} />
                    </div>
                  </div>
                ) : null}

                {revealed && capsule.letter ? (
                  <p className="mt-8 whitespace-pre-wrap text-[17px] leading-relaxed text-pretty text-ink/85">
                    {capsule.letter}
                  </p>
                ) : null}

                {!revealed ? (
                  <p className="mt-8 text-[15px] leading-relaxed text-mute">
                    편지는 열람일이 되어야 펼쳐져요. 그전까지는 키워드와 그날의 한마디만 보여 두었어요.
                  </p>
                ) : null}

                {isDev ? (
                  <button
                    className="mt-8 text-xs tracking-[0.14em] text-mute uppercase underline-offset-4 hover:text-ink hover:underline"
                    onClick={() => setPeek((current) => !current)}
                    type="button"
                  >
                    {peek ? "Dev peek off" : "Dev peek"}
                  </button>
                ) : null}
              </div>
            </div>

            {revealed && capsule.photos.length > 1 ? (
              <div className="flex flex-wrap gap-3 md:col-span-2">
                {capsule.photos.slice(1).map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-24 rounded-[1.25rem] object-cover md:size-32"
                    height={128}
                    key={photo.path}
                    src={photo.url}
                    width={128}
                  />
                ))}
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </main>
  );
}
