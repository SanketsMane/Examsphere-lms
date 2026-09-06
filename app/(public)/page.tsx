import { getActiveBroadcasts } from "../actions/broadcasts";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { BroadcastBanner } from "@/components/marketing/BroadcastBanner";
import { HeroExamSphere } from "@/components/marketing/examsphere/HeroExamSphere";
import {
  ProgramCards,
  WhyChoose,
  QuoteAndTrust,
} from "@/components/marketing/examsphere/HomeSections";

export const dynamic = "force-dynamic";

/**
 * ExamSphere homepage — rebuilt to match the client's reference design.
 * Order: Hero → Program cards → Why Choose + stats → Quote banner + trust strip.
 *
 * The per-programme detail that used to live here as anchored sections now has its own
 * routes under /programs/<slug>, so the homepage stays short and each programme is
 * linkable and indexable on its own.
 * The old DB-driven marketing sections (FeaturedCourses, CategoriesGrid, PopularLanguages,
 * etc.) were removed per the client requirement — the dropdown + on-page sections are now the
 * primary way to access course info. See Client's_Requirements/02-PHASE-course-sections.md.
 */
export default async function Home() {
  const broadcasts = await getActiveBroadcasts();

  return (
    <AnimationWrapper className="min-h-screen bg-background">
      <BroadcastBanner broadcasts={broadcasts} />

      <HeroExamSphere />

      <ProgramCards />

      <WhyChoose />

      <QuoteAndTrust />
    </AnimationWrapper>
  );
}
