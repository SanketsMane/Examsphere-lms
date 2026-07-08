import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Quote,
  Users,
  PlayCircle,
  FileText,
  BarChart3,
  UserCheck,
  MessageCircle,
  ClipboardList,
  ShieldCheck,
  Clock,
  Wallet,
  Gauge,
  Globe,
} from "lucide-react";
import { PROGRAM_CARDS, type CourseAccent } from "@/app/(public)/_data/courses-content";

const cardAccent: Record<CourseAccent, { grad: string; icon: string; check: string; btn: string }> = {
  navy: {
    grad: "from-[#F5F8FF] to-white dark:from-navy-900/30 dark:to-transparent",
    icon: "bg-navy-900",
    check: "text-navy-700 dark:text-blue-300",
    btn: "bg-navy-900 hover:bg-navy-950 text-white",
  },
  orange: {
    grad: "from-[#FFF4EA] to-white dark:from-orange-500/15 dark:to-transparent",
    icon: "bg-orange-500",
    check: "text-orange-600 dark:text-orange-300",
    btn: "bg-orange-500 hover:bg-orange-600 text-white",
  },
  green: {
    grad: "from-[#EDFAF4] to-white dark:from-es-green-600/15 dark:to-transparent",
    icon: "bg-es-green-600",
    check: "text-es-green-600 dark:text-emerald-300",
    btn: "bg-es-green-600 hover:bg-es-green-700 text-white",
  },
};

/* ============================ PROGRAM CARDS ============================ */
export function ProgramCards() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROGRAM_CARDS.map((card) => {
            const a = cardAccent[card.accent];
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`rounded-3xl p-8 border border-border shadow-[var(--shadow-es-sm)] bg-gradient-to-b ${a.grad} transition-all hover:-translate-y-2 hover:shadow-[var(--shadow-es-lg)]`}
              >
                <div className={`w-16 h-16 rounded-full ${a.icon} text-white flex items-center justify-center mb-5`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-extrabold text-navy-950 dark:text-white">
                  {card.title}
                </h3>
                {card.subtitle && (
                  <div className="text-sm font-bold text-navy-700 dark:text-blue-300 mt-0.5 mb-4">
                    {card.subtitle}
                  </div>
                )}
                <ul className={`space-y-2.5 mb-6 ${card.subtitle ? "" : "mt-4"}`}>
                  {card.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm font-medium text-ink-700 dark:text-muted-foreground">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${a.check}`} />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={card.href}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 ${a.btn}`}
                >
                  Explore Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================ WHY CHOOSE + STATS ============================ */
const whyFeatures = [
  { icon: Users, label: "Expert Faculty" },
  { icon: PlayCircle, label: "Live & Recorded Classes" },
  { icon: FileText, label: "Daily Practice Questions" },
  { icon: BarChart3, label: "AI-Powered Performance Analysis" },
  { icon: UserCheck, label: "Personalized Mentorship" },
  { icon: MessageCircle, label: "Doubt Support" },
  { icon: ClipboardList, label: "Mock Tests & PYQ Papers" },
];

export function WhyChoose() {
  return (
    <section className="py-16 md:py-20 bg-bg-soft dark:bg-muted/30">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-11">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-navy-950 dark:text-white">
            Why Choose <span className="text-navy-900 dark:text-blue-300">Exam</span>
            <span className="text-orange-500">Sphere</span>?
          </h2>
          <p className="text-ink-700 dark:text-muted-foreground mt-3">
            Everything you need to learn, practice and excel in your dream exam.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {whyFeatures.map((f) => (
            <div
              key={f.label}
              className="bg-card border border-border rounded-2xl p-5 text-center transition-all hover:-translate-y-1.5 hover:shadow-[var(--shadow-es-md)]"
            >
              <div className="w-12 h-12 rounded-xl bg-bg-soft-2 dark:bg-muted text-navy-900 dark:text-blue-200 flex items-center justify-center mx-auto mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <p className="font-bold text-sm text-ink-900 dark:text-foreground leading-snug">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ QUOTE BANNER + TRUST STRIP ============================ */
const trustItems = [
  { icon: ShieldCheck, label: "Safe & Secure Learning Environment" },
  { icon: Clock, label: "Accessible Anytime, Anywhere" },
  { icon: Wallet, label: "Affordable Fee Structure" },
  { icon: Gauge, label: "Regular Tests & Performance Tracking" },
  { icon: Globe, label: "Trusted by Students Across India" },
];

export function QuoteAndTrust() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl px-8 py-12 md:px-16 md:py-14 bg-gradient-to-br from-navy-950 to-navy-700 text-white">
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,.5) 1px, transparent 1.5px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div className="relative z-[2] max-w-3xl">
            <Quote className="h-7 w-7 text-orange-500 mb-4" />
            <p className="font-display text-xl md:text-2xl font-semibold leading-relaxed">
              At ExamSphere, we don&apos;t just teach — we mentor, guide and inspire.
            </p>
            <p className="text-orange-500 font-extrabold text-lg mt-3.5">Your dream. Our mission.</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-6 pt-10">
          {trustItems.map((t) => (
            <div key={t.label} className="flex items-center gap-3 text-sm font-semibold text-ink-700 dark:text-muted-foreground flex-1 min-w-[180px]">
              <t.icon className="h-5 w-5 text-navy-900 dark:text-blue-200 shrink-0" />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
