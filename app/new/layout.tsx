import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "캡슐 묻기",
  description:
    "받는 사람, 편지, 열람일, 사진을 담아 타임캡슐로 남겨 두세요. 오늘의 날씨가 캡슐의 빛과 형태가 됩니다.",
  alternates: {
    canonical: "/new",
  },
  openGraph: {
    title: "캡슐 묻기 | 캡슐 미",
    description:
      "받는 사람, 편지, 열람일, 사진을 담아 타임캡슐로 남겨 두세요. 오늘의 날씨가 캡슐의 빛과 형태가 됩니다.",
    url: "/new",
  },
};

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
