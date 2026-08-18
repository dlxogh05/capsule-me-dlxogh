"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/app/components/atmosphere";
import { KeywordRow, WeatherCapsule } from "@/components/weather-capsule";
import { useSky } from "@/components/sky-provider";
import {
  daysUntilOpen,
  formatOpenDate,
  isCapsuleOpen,
  listMyCapsules,
  type CapsuleRecord,
} from "@/lib/capsules";
import { formatWeatherLine } from "@/lib/capsule-aura";
import { formatSkyLine, weatherSourceLabel } from "@/lib/live-sky";
import { getFirebaseAuth } from "@/lib/firebase";
import { fetchMakerCount, formatMakerCount } from "@/lib/stats";

function ArrowMark() {
  return (
    <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function HomeShell() {
  const sky = useSky();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsules, setCapsules] = useState<(CapsuleRecord & { id: string })[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [makerCountLabel, setMakerCountLabel] = useState("");

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchMakerCount().then((count) => {
      if (!cancelled) {
        setMakerCountLabel(formatMakerCount(count));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCapsules([]);
      setListStatus("idle");
      return;
    }

    let cancelled = false;
    setListStatus("loading");

    void listMyCapsules(user.uid)
      .then((next) => {
        if (!cancelled) {
          setCapsules(next);
          setListStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSignOut() {
    setError(null);
    setPending(true);

    try {
      await signOut(getFirebaseAuth());
    } catch {
      setError("로그아웃에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  if (!ready || !user) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-16 md:px-8">
        <Atmosphere />
        <div className="rise w-full max-w-md rounded-[2rem] border border-line bg-ink/4 p-1.5 shadow-[0_28px_80px_-36px_rgb(28_25_23/0.28)]">
          <section className="rounded-[calc(2rem-0.375rem)] bg-white px-8 py-14 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]">
            <p className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase">
              Time capsule
            </p>
            <h1 className="font-serif mt-5 text-[clamp(2.8rem,8vw,4.2rem)] leading-[0.92] tracking-[-0.04em] text-ink">
              캡슐 미
            </h1>
            <p className="mx-auto mt-5 max-w-[20rem] text-[15px] leading-relaxed text-pretty text-mute">
              사진과 편지를 묻고, 열람일에 함께 열어요
            </p>
            {sky ? (
              <div className="mx-auto mt-8 flex max-w-[18rem] flex-col items-center">
                <WeatherCapsule aura={sky.aura} size="sm" />
                <p className="mt-3 text-sm text-ink">{formatSkyLine(sky)}</p>
              </div>
            ) : null}
            {makerCountLabel ? (
              <p className="mt-8 text-sm leading-relaxed text-mute">{makerCountLabel}</p>
            ) : null}
            <Link
              className="group mt-10 inline-flex min-h-11 items-center justify-between gap-3 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2a2623] active:scale-[0.98]"
              href="/new"
            >
              캡슐 묻기
              <span className="flex size-7 items-center justify-center rounded-full bg-white/10">
                <ArrowMark />
              </span>
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-8 md:px-8 md:py-12">
      <Atmosphere />
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase">
              Capsule Me
            </p>
            <h1 className="font-serif mt-2 text-4xl tracking-[-0.04em] text-ink md:text-5xl">
              나의 캡슐
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="size-9 rounded-full object-cover"
                height={36}
                src={user.photoURL}
                width={36}
              />
            ) : null}
            <Link
              className="group inline-flex min-h-11 items-center justify-between gap-3 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2a2623] active:scale-[0.98]"
              href="/new"
            >
              캡슐 묻기
              <span className="flex size-7 items-center justify-center rounded-full bg-white/10">
                <ArrowMark />
              </span>
            </Link>
            <button
              className="text-sm text-mute underline-offset-4 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink hover:underline"
              disabled={pending}
              onClick={handleSignOut}
              type="button"
            >
              로그아웃
            </button>
          </div>
        </header>

        {error ? (
          <p className="mt-6 text-sm text-[#9f2f2d]">{error}</p>
        ) : null}

        {sky ? (
          <section className="mt-8 flex items-center gap-5 rounded-[1.75rem] border border-line bg-white/70 px-5 py-4 shadow-[0_20px_50px_-32px_rgb(28_25_23/0.18)]">
            <WeatherCapsule aura={sky.aura} className="shrink-0" size="sm" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-[0.18em] text-mute uppercase">
                지금 · {weatherSourceLabel(sky.weather.source)}
              </p>
              <p className="font-serif mt-1 text-2xl tracking-[-0.03em] text-ink">
                {sky.place} · {Math.round(sky.weather.temperature)}°
              </p>
              <p className="mt-1 text-sm text-mute">
                {sky.weather.condition} · 습도 {Math.round(sky.weather.humidity)}%
              </p>
              <p className="mt-2 text-[15px] leading-snug text-ink/80">
                {sky.aura.quote}
              </p>
            </div>
          </section>
        ) : null}

        {listStatus === "loading" ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                className="h-64 animate-pulse rounded-[1.75rem] bg-white/70"
                key={item}
              />
            ))}
          </div>
        ) : null}

        {listStatus === "error" ? (
          <p className="mt-10 text-sm text-[#9f2f2d]">
            캡슐을 불러오지 못했어요. Firestore 규칙과 로그인 상태를 확인해 주세요.
          </p>
        ) : null}

        {listStatus === "ready" && capsules.length === 0 ? (
          <div className="rise mt-16 max-w-lg">
            <p className="text-[11px] font-medium tracking-[0.2em] text-mute uppercase">
              Empty
            </p>
            <h2 className="font-serif mt-3 text-3xl tracking-[-0.04em] text-ink">
              아직 묻힌 캡슐이 없어요
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-mute">
              첫 편지와 사진을 담으면, 이곳에 카드로 모여요.
            </p>
          </div>
        ) : null}

        {listStatus === "ready" && capsules.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capsules.map((capsule, index) => {
              const open = isCapsuleOpen(capsule.openDate);
              const cover = capsule.photos[0]?.url;
              const featured = index === 0;
              const aura = capsule.aura;

              return (
                <Link
                  className={`group rise relative overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_20px_50px_-32px_rgb(28_25_23/0.28)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 ${
                    featured ? "min-h-80 sm:col-span-2" : "min-h-64"
                  }`}
                  href={`/capsule/${capsule.id}`}
                  key={capsule.id}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {open && cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="absolute inset-0 size-full object-cover transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                      src={cover}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: aura
                          ? `radial-gradient(80% 70% at 50% 18%, ${aura.glow}, ${aura.fill}33 58%, #f6f1e8)`
                          : "#ece7de",
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: open
                        ? "linear-gradient(to top, rgb(28 25 23 / 0.72), rgb(28 25 23 / 0.12), transparent)"
                        : "linear-gradient(to top, rgb(28 25 23 / 0.08), transparent 45%)",
                    }}
                  />
                  <div className={`relative flex h-full min-h-64 flex-col ${open ? "justify-end p-6 text-white" : "items-center justify-between px-6 py-6"}`}>
                    {aura && !open ? (
                      <WeatherCapsule aura={aura} size={featured ? "lg" : "md"} />
                    ) : null}
                    <div className={`w-full ${open ? "" : "text-center"}`}>
                      <span className={`w-fit rounded-full px-3 py-1 text-[11px] tracking-[0.14em] uppercase ${open ? "bg-white/14" : "bg-ink/8 text-ink/70"}`}>
                        {open ? "열림" : `D-${daysUntilOpen(capsule.openDate)}`}
                      </span>
                      <h2 className={`font-serif mt-3 tracking-[-0.04em] ${open ? "text-3xl" : "text-2xl text-ink"}`}>
                        {capsule.recipient || "이름 없는 캡슐"}
                      </h2>
                      {aura && !open ? (
                        <p className="font-serif mt-2 text-[17px] leading-snug text-ink/80">
                          {aura.quote}
                        </p>
                      ) : null}
                      {aura ? (
                        <div className={`mt-3 ${open ? "" : "flex justify-center"}`}>
                          <KeywordRow keywords={aura.keywords} tone={open ? "light" : "ink"} />
                        </div>
                      ) : null}
                      <p className={`mt-2 text-sm ${open ? "text-white/75" : "text-mute"}`}>
                        {capsule.weather ? formatWeatherLine(capsule.weather) : formatOpenDate(capsule.openDate)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}
