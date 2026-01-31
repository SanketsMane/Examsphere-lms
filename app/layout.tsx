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

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KIDOKOOL" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
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
          <main className="min-h-screen pb-16 lg:pb-0">
            {children}
          </main>
          <MobileBottomNavigation />
          <Toaster closeButton position="bottom-center" />
          <Script id="tawk-chat" strategy="afterInteractive">
            {`
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/697e80264d7a741c35709d80/1jgb296ea';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
              })();
            `}
          </Script>
        </ThemeProvider>
      </body>
    </html>
  );
}
