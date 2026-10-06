import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNavigation } from "@/components/mobile/MobileNavigation";
import Script from "next/script";

// import { Noto_Sans } from "next/font/google";

// const notoSans = Noto_Sans({
//   subsets: ["latin"],
//   variable: "--font-noto-sans",
//   weight: ["300", "400", "500", "600", "700"],
// });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://examsphere.online";
const SITE_TITLE = "ExamSphere — JEE, NEET, Foundation & MBBS Preparation";
const SITE_DESCRIPTION =
  "Online coaching for JEE (Main & Advanced), NEET, Foundation (Class 6–10) and MBBS — live classes, structured practice, mock tests and mentorship. Browse courses and enroll online.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: "JEE, JEE Main, JEE Advanced, NEET, Foundation, Class 6-10, MBBS, online coaching, ExamSphere",
  authors: [{ name: "ExamSphere" }],
  creator: "ExamSphere",
  publisher: "ExamSphere",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "ExamSphere",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

import { getSiteSettings } from "@/app/actions/settings";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

/**
 * Author: Sanket
 */

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const favicon = settings?.favicon ? constructS3Url(settings.favicon) : "/favicon.ico";
  // iOS ignores .ico for home-screen icons, so fall back to a real PNG.
  const appleTouchIcon = settings?.favicon
    ? constructS3Url(settings.favicon)
    : "/apple-touch-icon.png";
  const siteName = settings?.siteName || "ExamSphere";

  return (
    <html lang="en-IN" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <head>
        <link rel="icon" href={favicon} />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`font-sans antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          // Bumped from the implicit "theme" key: the old default was dark, so returning
          // visitors had "dark" persisted and would never see the new light default.
          storageKey="examsphere-theme-v2"
          disableTransitionOnChange
        >
          <CurrencyProvider initialRates={settings?.currencyRates as Record<string, number>}>
            {/* Not <main>: each section layout (public, dashboard…) renders its own main landmark. */}
            <div className="min-h-screen pb-16 lg:pb-0">
              {children}
            </div>
          </CurrencyProvider>
          <MobileBottomNavigation />
          <Toaster closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
