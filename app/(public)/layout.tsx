import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import Script from "next/script";

import { getSiteSettings } from "@/app/data/settings/get-site-settings";

export default async function LayoutPublic({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar settings={settings} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
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
    </div>
  );
}
