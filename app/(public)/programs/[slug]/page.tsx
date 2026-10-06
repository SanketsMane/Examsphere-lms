import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROGRAMS, getProgram } from "@/app/(public)/_data/programs-content";
import { ProgramDetail } from "@/components/marketing/examsphere/ProgramDetail";
import { JsonLd, ORG_ID, SITE_URL, breadcrumbList, faqPage } from "@/components/seo/JsonLd";

/** Programme content is static, so every page can be prerendered at build time. */
export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

/** Anything not in PROGRAMS should 404 rather than render an empty shell. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = getProgram(slug);

  if (!program) {
    return { title: "Program Not Found | ExamSphere" };
  }

  const title = `${program.title} | ExamSphere`;
  const description = program.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/programs/${program.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/programs/${program.slug}`,
      siteName: "ExamSphere",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = getProgram(slug);

  if (!program) notFound();

  // Everything below is already visible on the page: title, description, mode, language, FAQs.
  const course = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.title,
    description: program.description,
    url: `${SITE_URL}/programs/${program.slug}`,
    provider: { "@id": ORG_ID },
    educationalLevel: program.details.level,
    inLanguage: program.details.language.includes("Hindi") ? ["en", "hi"] : ["en"],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      description: `${program.details.mode} classes, ${program.details.duration}`,
    },
    teaches: program.curriculum.map((m) => m.title),
  };

  return (
    <>
      <JsonLd
        data={[
          course,
          breadcrumbList([
            { name: "Home", path: "/" },
            { name: "Programs", path: "/programs" },
            { name: program.navLabel, path: `/programs/${program.slug}` },
          ]),
          ...(program.faqs.length ? [faqPage(program.faqs)] : []),
        ]}
      />
      <ProgramDetail program={program} />
    </>
  );
}
