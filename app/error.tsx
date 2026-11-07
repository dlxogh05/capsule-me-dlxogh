"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <a
          className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
          href="/"
        >
          Capsule Me
        </a>

        <div className="rise mt-16 max-w-lg">
          <h1 className="font-serif text-4xl tracking-[-0.04em] text-ink md:text-5xl">
            잠깐 문제가 생겼어요
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-mute">
            묻어 둔 캡슐은 그대로 있어요. 다시 시도하면 대부분 열립니다.
          </p>
          {error.digest ? (
            <p className="mt-2 text-[13px] text-mute">오류 번호 {error.digest}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
              onClick={reset}
              type="button"
            >
              다시 시도
            </button>
            <a
              className="inline-flex min-h-11 items-center rounded-full border border-line px-5 py-3 text-sm font-medium text-ink"
              href="/"
            >
              홈으로
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
