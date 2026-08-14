"use client";

import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/app/components/atmosphere";
import {
  daysUntilOpen,
  formatOpenDate,
  isCapsuleOpen,
  listMyCapsules,
  type CapsuleRecord,
} from "@/lib/capsules";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase";

function authErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "로그인에 실패했어요. 잠시 후 다시 시도해 주세요.";
  }

  switch (error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "로그인이 완료되지 않았어요. Google 창을 닫지 말고 계정을 선택한 뒤 권한을 허용해 주세요.";
    case "auth/unauthorized-domain":
      return "이 도메인은 Firebase 인증에 허용되어 있지 않아요. Authorized domains에 localhost가 있는지 확인해 주세요.";
    case "auth/popup-blocked":
      return "팝업이 차단되었어요. 브라우저에서 팝업을 허용해 주세요.";
    case "auth/operation-not-allowed":
      return "Firebase Console에서 Google 로그인이 활성화되어 있지 않아요.";
    default:
      return `로그인에 실패했어요. (${error.code})`;
  }
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsules, setCapsules] = useState<(CapsuleRecord & { id: string })[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      setUser(nextUser);
      setReady(true);
    });
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

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);

    try {
      await signInWithPopup(getFirebaseAuth(), googleProvider);
    } catch (caught) {
      setError(authErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

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
            {!ready ? (
              <p className="mt-10 text-sm text-mute">로그인 상태를 확인하고 있어요</p>
            ) : (
              <div className="mt-10 flex flex-col items-center gap-3">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-3 rounded-full border border-line bg-white px-6 py-3 text-sm font-medium text-ink shadow-[0_1px_2px_rgb(28_25_23/0.04)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#faf8f4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={pending}
                  onClick={handleGoogleSignIn}
                  type="button"
                >
                  <GoogleMark />
                  {pending ? "로그인 중..." : "Google로 계속하기"}
                </button>
                {error ? (
                  <p className="max-w-[20rem] text-sm leading-relaxed text-pretty text-[#9f2f2d]">
                    {error}
                  </p>
                ) : null}
              </div>
            )}
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

              return (
                <Link
                  className={`group rise relative overflow-hidden rounded-[1.75rem] border border-line bg-white shadow-[0_20px_50px_-32px_rgb(28_25_23/0.28)] transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 ${
                    featured ? "min-h-80 sm:col-span-2" : "min-h-64"
                  }`}
                  href={`/capsule/${capsule.id}`}
                  key={capsule.id}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className={`absolute inset-0 size-full object-cover transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] ${
                        open ? "" : "blur-[10px] scale-110"
                      }`}
                      src={cover}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#ece7de]" />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgb(28 25 23 / 0.72), rgb(28 25 23 / 0.12), transparent)",
                    }}
                  />
                  <div className="relative flex h-full min-h-64 flex-col justify-end p-6 text-white">
                    <span className="w-fit rounded-full bg-white/14 px-3 py-1 text-[11px] tracking-[0.14em] uppercase">
                      {open ? "열림" : `D-${daysUntilOpen(capsule.openDate)}`}
                    </span>
                    <h2 className="font-serif mt-3 text-3xl tracking-[-0.04em]">
                      {capsule.recipient || "이름 없는 캡슐"}
                    </h2>
                    <p className="mt-2 text-sm text-white/75">
                      {formatOpenDate(capsule.openDate)}
                    </p>
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
