/**
 * Renders schema.org structured data. Only describe what is visible on the page.
 * `<` is escaped so content (titles, FAQ answers) can never close the script tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://examsphere.online").replace(/\/$/, "");
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const ENTITY_DESCRIPTION =
  "ExamSphere is an online coaching platform for students preparing for JEE (Main & Advanced), NEET-UG, Foundation (Class 6–10) and MBBS exams, with live and recorded classes in English and Hindi.";

/** WebPage node tying a page into the site/organization graph. */
export function webPage(path: string, name: string, type: "WebPage" | "AboutPage" | "ContactPage" = "WebPage") {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en-IN",
  };
}

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
