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

    </div>
  );
}
