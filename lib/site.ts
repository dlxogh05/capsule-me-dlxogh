export const SITE_NAME = "캡슐 미";
export const SITE_NAME_EN = "Capsule Me";
export const SITE_TAGLINE = "사진과 편지를 묻고, 열람일에 함께 열어요";
export const SITE_TITLE = "캡슐 미 — 지금을 묻어요";
export const SITE_DESCRIPTION =
  "사진과 편지를 타임캡슐에 묻고, 약속한 열람일에 함께 열어 보세요. 오늘의 하늘이 캡슐의 빛과 형태가 되고, 그날의 한마디로 기억을 남겨 둡니다.";

const FALLBACK_SITE_URL = "https://capsule-me-dlxogh.vercel.app";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;

  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function getMetadataBase() {
  return new URL(`${getSiteUrl()}/`);
}
