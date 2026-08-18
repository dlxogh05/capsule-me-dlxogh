import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Instrument_Serif, Outfit } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Ga4PageViews } from "@/components/ga4";
import { DevPanel } from "@/components/dev-panel";
import { SkyProvider } from "@/components/sky-provider";
import { GA_MEASUREMENT_ID, isGaMeasurementId } from "@/lib/analytics";
import {
  getMetadataBase,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_EN,
  SITE_TAGLINE,
  SITE_TITLE,
} from "@/lib/site";
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

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#F3EFE8",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["타임캡슐", "캡슐 미", "편지", "사진", "Capsule Me"],
  authors: [{ name: SITE_NAME_EN }],
  creator: SITE_NAME_EN,
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: SITE_NAME_EN,
  url: siteUrl,
  description: SITE_TAGLINE,
  applicationCategory: "LifestyleApplication",
  inLanguage: "ko-KR",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={`${outfit.variable} ${instrument.variable}`} lang="ko">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          type="application/ld+json"
        />
        <SkyProvider>
          {children}
          {isGaMeasurementId(GA_MEASUREMENT_ID) ? (
            <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
          ) : null}
          <Suspense fallback={null}>
            <Ga4PageViews />
          </Suspense>
          {process.env.NODE_ENV === "development" ? <DevPanel /> : null}
        </SkyProvider>
      </body>
    </html>
  );
}
