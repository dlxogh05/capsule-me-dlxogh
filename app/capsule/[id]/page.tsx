import type { Metadata } from "next";
import { CapsuleDetail } from "./capsule-detail";

export const metadata: Metadata = {
  title: "캡슐 열기",
  description: "묻어 둔 사진과 편지를 열람일에 다시 열어 보세요.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "캡슐 열기 | 캡슐 미",
    description: "묻어 둔 사진과 편지를 열람일에 다시 열어 보세요.",
  },
};

export default async function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CapsuleDetail id={id} />;
}
