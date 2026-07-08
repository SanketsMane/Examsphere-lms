import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { PublicChatbot } from "@/components/ai/PublicChatbot";

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

      {/* Floating AI assistant — visible on every public page */}
      <PublicChatbot />
    </div>
  );
}
