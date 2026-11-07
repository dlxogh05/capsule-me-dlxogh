import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-canvas px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          className="text-[11px] font-medium tracking-[0.22em] text-mute uppercase transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-ink"
          href="/"
        >
          Capsule Me
        </Link>

        <div className="rise mt-16 max-w-lg">
          <h1 className="font-serif text-4xl tracking-[-0.04em] text-ink md:text-5xl">
            없는 주소예요
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-mute">
            링크가 바뀌었거나 잘못 입력된 주소예요. 캡슐을 찾고 있었다면 받은
            링크를 다시 확인해 주세요.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
            href="/"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
