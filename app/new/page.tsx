"use client";

import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  buryCapsule,
  formatOpenDate,
  type BuriedCapsule,
  type BuryProgress,
} from "@/lib/capsules";
import { getFirebaseAuth } from "@/lib/firebase";

function buryErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "저장 권한이 없어요. Firestore가 켜져 있는지, 로그인 상태인지 확인해 주세요.";
    }
    if (error.code.startsWith("storage/")) {
      return "사진을 올리지 못했어요. Storage 규칙을 확인해 주세요.";
    }
  }

  return "캡슐을 묻지 못했어요. 잠시 후 다시 시도해 주세요.";
}

function CheckMark() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
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

export default function NewCapsulePage() {
  const [user, setUser] = useState<User | null>(null);
  const [recipient, setRecipient] = useState("");
  const [letter, setLetter] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<BuryProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buried, setBuried] = useState<BuriedCapsule | null>(null);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), setUser);
  }, []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [files]);

  function resetForm() {
    setRecipient("");
    setLetter("");
    setOpenDate("");
    setFiles([]);
    setError(null);
    setProgress(null);
    setBuried(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      alert("로그인 먼저!");
      return;
    }

    if (pending) {
      return;
    }

    setError(null);
    setPending(true);
    setProgress(
      files.length > 0
        ? { phase: "photos", current: 0, total: files.length }
        : { phase: "document" },
    );

    try {
      const result = await buryCapsule({
        uid: user.uid,
        recipient: recipient.trim(),
        letter: letter.trim(),
        openDate,
        files,
        onProgress: setProgress,
      });

      console.log({
        capsuleId: result.id,
        photos: result.photos,
      });
      setBuried(result);
    } catch (caught) {
      console.error(caught);
      setError(buryErrorMessage(caught));
    } finally {
      setPending(false);
      setProgress(null);
    }
  }

  const progressLabel =
    progress?.phase === "photos"
      ? progress.current === 0
        ? "업로드되는 중"
        : `사진 올리는 중  ${progress.current} / ${progress.total}`
      : "캡슐을 저장하는 중";

  const progressRatio =
    progress?.phase === "photos" && progress.total > 0
      ? Math.min(progress.current / progress.total, 1)
      : progress?.phase === "document"
        ? 1
        : 0.12;

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-canvas px-4 py-10 md:px-8 md:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 50% at 8% 0%, rgb(214 196 168 / 0.45), transparent 58%), radial-gradient(50% 40% at 100% 100%, rgb(196 186 168 / 0.28), transparent 55%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-5xl items-start gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-16">
        <header className="rise pt-4 md:sticky md:top-16 md:pt-10">
          <Link
            className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
            href="/"
          >
            Capsule Me
          </Link>
          <h1 className="font-serif mt-6 max-w-[12ch] text-[clamp(2.75rem,8vw,4.75rem)] leading-[0.92] tracking-[-0.04em] text-ink">
            {buried ? "묻어 두었어요" : "지금을 묻어요"}
          </h1>
          <p className="mt-6 max-w-[22rem] text-[15px] leading-relaxed text-pretty text-mute">
            {buried
              ? "편지와 사진이 캡슐에 담겼어요. 열람일이 오면 다시 열어 볼 수 있어요."
              : "받는 사람, 편지, 열람일, 그리고 사진을 담아 타임캡슐로 남겨 두세요."}
          </p>
        </header>

        <div className="rise w-full" style={{ animationDelay: "90ms" }}>
          <div className="rounded-[2rem] border border-line bg-ink/4 p-1.5 shadow-[0_28px_80px_-36px_rgb(28_25_23/0.28)]">
            <section className="rounded-[calc(2rem-0.375rem)] bg-white px-6 py-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.9)] md:px-8 md:py-10">
              {buried ? (
                <div className="flex flex-col gap-7">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#edf3ec] text-[#346538]">
                    <CheckMark />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.2em] text-mute uppercase">
                      Buried
                    </p>
                    <h2 className="mt-2 text-2xl font-medium tracking-tight text-ink">
                      {buried.recipient || "이름 없는 캡슐"}
                    </h2>
                    <p className="mt-2 text-sm text-mute">
                      {formatOpenDate(buried.openDate)}
                    </p>
                  </div>
                  {buried.letter ? (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-pretty text-ink/80">
                      {buried.letter}
                    </p>
                  ) : null}
                  {buried.photos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {buried.photos.map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          className="size-[4.5rem] rounded-full object-cover"
                          height={72}
                          key={photo.path}
                          src={photo.url}
                          width={72}
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3">
                    <Link
                      className="group inline-flex min-h-11 w-full items-center justify-between rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2a2623] active:scale-[0.98]"
                      href={`/capsule/${buried.id}`}
                    >
                      캡슐 열어보기
                      <span className="flex size-8 items-center justify-center rounded-full bg-white/10 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                        <ArrowMark />
                      </span>
                    </Link>
                    <button
                      className="min-h-11 text-sm text-mute underline-offset-4 transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink hover:underline"
                      onClick={resetForm}
                      type="button"
                    >
                      하나 더 묻기
                    </button>
                  </div>
                </div>
              ) : (
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                  <fieldset className="flex flex-col gap-6 disabled:opacity-55" disabled={pending}>
                    <label className="flex flex-col gap-2 text-[13px] font-medium text-ink/80">
                      받는 사람
                      <input
                        className="min-h-11 rounded-2xl border border-line bg-[#faf8f4] px-4 py-3 text-base font-normal text-ink outline-none transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-ink/25 focus:bg-white"
                        maxLength={80}
                        onChange={(event) => setRecipient(event.target.value)}
                        type="text"
                        value={recipient}
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-[13px] font-medium text-ink/80">
                      편지
                      <textarea
                        className="min-h-40 resize-y rounded-2xl border border-line bg-[#faf8f4] px-4 py-3 text-base font-normal leading-relaxed text-ink outline-none transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-ink/25 focus:bg-white"
                        maxLength={5000}
                        onChange={(event) => setLetter(event.target.value)}
                        value={letter}
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-[13px] font-medium text-ink/80">
                      열람일
                      <input
                        className="min-h-11 rounded-2xl border border-line bg-[#faf8f4] px-4 py-3 text-base font-normal text-ink outline-none transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:border-ink/25 focus:bg-white"
                        onChange={(event) => setOpenDate(event.target.value)}
                        type="date"
                        value={openDate}
                      />
                    </label>

                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-2 text-[13px] font-medium text-ink/80">
                        사진
                        <input
                          accept="image/*"
                          className="text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                          multiple
                          onChange={(event) => {
                            setFiles(Array.from(event.target.files ?? []).slice(0, 10));
                          }}
                          type="file"
                        />
                      </label>
                      {previews.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {previews.map((src) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt=""
                              className="size-16 rounded-full object-cover"
                              height={64}
                              key={src}
                              src={src}
                              width={64}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </fieldset>

                  {error ? (
                    <p className="text-sm leading-relaxed text-pretty text-[#9f2f2d]">
                      {error}
                    </p>
                  ) : null}

                  <button
                    className="group inline-flex min-h-11 w-full items-center justify-between rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2a2623] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={pending}
                    type="submit"
                  >
                    {pending ? "업로드되는 중" : "캡슐 묻기"}
                    <span className="flex size-8 items-center justify-center rounded-full bg-white/10">
                      {pending ? (
                        <span className="pulse-soft size-2 rounded-full bg-white" />
                      ) : (
                        <ArrowMark />
                      )}
                    </span>
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>

      {pending ? (
        <div
          aria-busy="true"
          aria-live="polite"
          className="fixed inset-0 z-20 flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm"
          role="status"
        >
          <div className="w-full max-w-sm rounded-[2rem] border border-white/20 bg-white/92 p-1.5 shadow-[0_24px_80px_-24px_rgb(28_25_23/0.45)]">
            <div className="rounded-[calc(2rem-0.375rem)] bg-white px-7 py-8">
              <p className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase">
                Uploading
              </p>
              <p className="mt-3 text-xl font-medium tracking-tight text-ink">
                업로드되는 중
              </p>
              <p className="mt-2 text-sm text-mute">{progressLabel}</p>
              <div className="mt-6 h-1 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="relative h-full overflow-hidden rounded-full bg-ink transition-[transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ transform: `scaleX(${Math.max(progressRatio, 0.08)})`, transformOrigin: "left center" }}
                >
                  <span className="shimmer-bar absolute inset-y-0 left-0 w-1/2 bg-white/35" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
