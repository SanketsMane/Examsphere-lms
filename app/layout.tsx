import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "KIDOKOOL - Professional Learning Management System",
  description: "World-class learning management platform with live tutoring, interactive courses, and comprehensive analytics",
  keywords: "LMS, learning management system, online courses, live tutoring, education platform",
  authors: [{ name: "KIDOKOOL Team" }],
  creator: "KIDOKOOL",
  publisher: "KIDOKOOL",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kidokool.com",
    siteName: "KIDOKOOL",
    title: "KIDOKOOL - Professional Learning Management System",
    description: "World-class learning management platform with live tutoring, interactive courses, and comprehensive analytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "KIDOKOOL - Professional Learning Management System",
    description: "World-class learning management platform with live tutoring, interactive courses, and comprehensive analytics",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { getSiteSettings } from "@/app/actions/settings";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";

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
  const favicon = settings?.favicon || "/favicon.ico";
  const siteName = settings?.siteName || "KIDOKOOL";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{`${siteName} - Professional Learning Management System`}</title>
        <link rel="icon" href={favicon} />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <link rel="apple-touch-icon" href={favicon} />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`font-sans antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider initialRates={settings?.currencyRates as Record<string, number>}>
            <main className="min-h-screen pb-16 lg:pb-0">
              {children}
            </main>
          </CurrencyProvider>
          <MobileBottomNavigation />
          <Toaster closeButton position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
