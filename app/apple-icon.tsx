import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 96,
            height: 124,
            borderRadius: 999,
            background: "#1C1917",
          }}
        />
      </div>
    ),
    size,
  );
}
