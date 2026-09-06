import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROGRAMS, getProgram } from "@/app/(public)/_data/programs-content";
import { ProgramDetail } from "@/components/marketing/examsphere/ProgramDetail";

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

  return <ProgramDetail program={program} />;
}
