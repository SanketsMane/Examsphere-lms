import { ReactNode } from "react";
import { Navbar } from "./_components/Navbar";
import { Footer } from "./_components/Footer";
import { PublicChatbot } from "@/components/ai/PublicChatbot";

import { getSiteSettings } from "@/app/data/settings/get-site-settings";
import { getContactDetails } from "@/app/data/settings/get-contact-details";
import { ENTITY_DESCRIPTION, JsonLd, ORG_ID, SITE_URL, WEBSITE_ID } from "@/components/seo/JsonLd";

export default async function LayoutPublic({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  const contact = await getContactDetails();

  // Who ExamSphere is, for search engines and AI answers. sameAs lists only the profiles an
  // admin has actually entered in Settings.
  const organization = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": ORG_ID,
    name: "ExamSphere",
    // Spelling people also search for; the other "ExamSphere"s are different organizations.
    alternateName: "Exam Sphere",
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    description: ENTITY_DESCRIPTION,
    knowsAbout: ["JEE Main", "JEE Advanced", "NEET-UG", "Foundation (Class 6–10)", "MBBS"],
    email: contact.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "admissions",
      email: contact.email,
      ...(contact.phone ? { telephone: contact.phone } : {}),
    },
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.socials.length ? { sameAs: contact.socials.map((s) => s.href) } : {}),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "ExamSphere",
    alternateName: "Exam Sphere",
    url: `${SITE_URL}/`,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={[organization, website]} />
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
