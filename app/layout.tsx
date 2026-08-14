import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import { FirebaseAnalytics } from "@/components/firebase-analytics";
import { DevPanel } from "@/components/dev-panel";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "캡슐 미",
  description: "사진과 편지를 묻고, 열람일에 함께 열어요",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={`${outfit.variable} ${instrument.variable}`} lang="ko">
      <body>
        {children}
        <FirebaseAnalytics />
        {process.env.NODE_ENV === "development" ? <DevPanel /> : null}
      </body>
    </html>
  );
}
