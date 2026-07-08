import fs from "fs";
import path from "path";
import Link from "next/link";
import Image from "next/image";
import { Star, Rocket, GraduationCap, Users, BookOpen, Trophy } from "lucide-react";

/**
 * ExamSphere hero — matches the client's reference image.
 *
 * HERO IMAGE: the client wants the "boy + girl" student photo. Drop the real asset at
 * public/images/hero-students.(png|jpg|jpeg|webp|avif) and it appears automatically — no code
 * change needed. Until a file is present, an on-brand placeholder is shown.
 */

// Detect the hero image at request time so it "just works" once the file is added.
function findHeroImage(): string | null {
  const dir = path.join(process.cwd(), "public", "images");
  const candidates = [
    "hero-students.png",
    "hero-students.jpg",
    "hero-students.jpeg",
    "hero-students.webp",
    "hero-students.avif",
  ];
  for (const name of candidates) {
    try {
      if (fs.existsSync(path.join(dir, name))) return `/images/${name}`;
    } catch {
      /* ignore */
    }
  }
  return null;
}
export function HeroExamSphere() {
  return (
    <section className="relative overflow-hidden pt-14 pb-10 md:pt-16 md:pb-12">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          {/* Left copy */}
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-300">
              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
              Empowering Future Doctors &amp; Engineers
            </span>

            <h1 className="font-display font-extrabold leading-[1.06] tracking-tight text-navy-950 dark:text-white text-[38px] sm:text-5xl lg:text-[56px] mt-5 mb-5">
              Your Journey to <span className="text-orange-500">Success</span> Begins Here.
            </h1>

            <p className="text-lg text-ink-700 dark:text-muted-foreground max-w-xl mb-8">
              Expert guidance, smart strategies and personalized mentorship for{" "}
              <span className="font-semibold text-navy-900 dark:text-blue-200">
                JEE, NEET, Foundation and MBBS
              </span>
              .
            </p>

            <div className="flex flex-wrap gap-4 mb-9">
              <Link
                href="#jee"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm bg-navy-900 hover:bg-navy-950 text-white shadow-[var(--shadow-es-sm)] transition-all hover:-translate-y-0.5"
              >
                <Rocket className="h-4 w-4" /> Start Learning
              </Link>
              <Link
                href="#courses"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm bg-card border border-border text-navy-900 dark:text-white hover:border-navy-900 dark:hover:border-white transition-all hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" /> Explore Courses
              </Link>
            </div>

            <div className="flex flex-wrap gap-7">
              {[
                { icon: Users, label: "Expert Faculty" },
                { icon: BookOpen, label: "Structured Courses" },
                { icon: Trophy, label: "Proven Results" },
              ].map((q) => (
                <div key={q.label} className="flex items-center gap-2.5 text-sm font-semibold text-ink-700 dark:text-muted-foreground">
                  <span className="w-9 h-9 rounded-full bg-bg-soft dark:bg-muted flex items-center justify-center text-navy-900 dark:text-blue-200">
                    <q.icon className="h-4 w-4" />
                  </span>
                  {q.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right visual */}
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  const heroImage = findHeroImage();

  return (
    <div className="relative flex items-center justify-center min-h-[380px] md:min-h-[520px]">
      {heroImage ? (
        <div className="relative w-full max-w-[380px] md:max-w-[540px]">
          {/* The photo has a light background. In LIGHT mode we blend it into the hero with
              `multiply` so it reads as part of the section (no card, full image quality).
              In DARK mode multiply would erase it, so we show it normally on a soft rounded
              surface instead of a harsh white rectangle. */}
          <div className="hidden dark:block absolute inset-x-[3%] top-[2%] bottom-[1%] -z-10 rounded-[36px] bg-gradient-to-b from-white/90 to-slate-200/70" />
          <Image
            src={heroImage}
            alt="ExamSphere students — future doctors and engineers"
            width={1122}
            height={1402}
            priority
            sizes="(max-width: 768px) 380px, 540px"
            className="w-full h-auto object-contain select-none mix-blend-multiply dark:mix-blend-normal"
          />
        </div>
      ) : (
        <div className="relative z-[2] w-[290px] md:w-[360px] aspect-[3/3.4] rounded-[28px] overflow-hidden bg-gradient-to-b from-bg-soft-2 to-bg-soft dark:from-muted dark:to-muted/60 border border-border shadow-[var(--shadow-es-lg)] flex flex-col items-center justify-center text-center px-6">
          <div className="flex gap-4 mb-4">
            <GraduationCap className="h-14 w-14 text-navy-900 dark:text-blue-200" strokeWidth={1.4} />
            <Users className="h-14 w-14 text-orange-500" strokeWidth={1.4} />
          </div>
          <p className="font-display font-bold text-navy-950 dark:text-white text-lg">Hero image</p>
          <p className="text-xs text-ink-500 dark:text-muted-foreground mt-1 max-w-[210px]">
            Add the boy &amp; girl photo at
            <span className="font-mono"> public/images/hero-students.png</span> and it appears here
            automatically.
          </p>
        </div>
      )}
    </div>
  );
}
