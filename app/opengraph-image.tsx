import { ImageResponse } from "next/og";

export const alt = "캡슐 미 — 사진과 편지를 묻고, 열람일에 함께 열어요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadKoreanFont() {
  const response = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/alternative/Pretendard-Medium.ttf",
  );

  if (!response.ok) {
    return null;
  }

  return response.arrayBuffer();
}

export default async function OpenGraphImage() {
  const font = await loadKoreanFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3EFE8",
          color: "#1C1917",
          fontFamily: font ? "Pretendard" : "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 64,
            padding: "0 96px",
          }}
        >
          <div
            style={{
              width: 168,
              height: 220,
              borderRadius: 999,
              background: "#1C1917",
              boxShadow: "0 28px 80px rgba(28, 25, 23, 0.28)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#78716C",
              }}
            >
              Capsule Me
            </div>
            <div
              style={{
                fontSize: 84,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                fontWeight: 500,
              }}
            >
              캡슐 미
            </div>
            <div
              style={{
                maxWidth: 640,
                fontSize: 28,
                lineHeight: 1.45,
                color: "#78716C",
              }}
            >
              사진과 편지를 묻고, 열람일에 함께 열어요
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [
            {
              name: "Pretendard",
              data: font,
              style: "normal",
              weight: 500,
            },
          ]
        : undefined,
    },
  );
}
