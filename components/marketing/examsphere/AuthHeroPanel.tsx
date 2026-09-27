import Link from "next/link";
import Image from "next/image";

/**
 * Left-hand visual for the login and signup pages.
 *
 * Uses the same student cutout as the homepage hero (HeroExamSphere) so the auth pages look like
 * part of ExamSphere. Keep it free of numeric claims, testimonials and sample names — the client
 * asked for only genuine ExamSphere information here (BUG-0004).
 */
export function AuthHeroPanel({ heading }: { heading: React.ReactNode }) {
  return (
    <div className="hidden lg:flex flex-col relative bg-navy-950 text-white p-12 overflow-hidden">
      <div
        aria-hidden
        className="absolute -right-24 bottom-0 w-[640px] h-[640px] rounded-full blur-3xl opacity-40
                   bg-[radial-gradient(closest-side,rgba(147,197,253,0.55),transparent)]"
      />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <span className="text-2xl font-bold tracking-tight">ExamSphere</span>
        </Link>
        <h1 className="font-display text-4xl font-extrabold tracking-tight leading-tight max-w-lg">
          {heading}
        </h1>
        <p className="mt-4 text-lg text-zinc-300 max-w-md">
          Expert guidance and personalised mentorship for{" "}
          <span className="font-semibold text-white">JEE, NEET, Foundation and MBBS</span>.
        </p>
      </div>

      <div className="relative z-10 flex-1 flex items-end justify-center mt-8">
        <Image
          src="/images/hero-students.webp"
          alt="ExamSphere students — future doctors and engineers"
          width={1181}
          height={1280}
          priority
          sizes="(min-width: 1024px) 460px, 0px"
          className="w-full max-w-[460px] h-auto object-contain select-none drop-shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
        />
      </div>
    </div>
  );
}
