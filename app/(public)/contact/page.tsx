import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { getSiteSettings } from "@/app/data/settings/get-site-settings";
import { PROGRAMS } from "@/app/(public)/_data/programs-content";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | ExamSphere",
  description:
    "Get in touch with the ExamSphere team about JEE, NEET, Foundation and MBBS programmes — batch timings, fees and admissions.",
  alternates: { canonical: "/contact" },
};

// Same fallbacks the footer uses, so both stay consistent until Site Settings are filled in.
const FALLBACK = {
  phone: "+91 00000 00000",
  email: "support@examsphere.online",
  address: "India",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  const phone = settings?.contactPhone?.trim() || FALLBACK.phone;
  const email = settings?.contactEmail?.trim() || FALLBACK.email;
  const address = settings?.contactAddress?.trim() || FALLBACK.address;

  const programs = PROGRAMS.map((p) => ({ slug: p.slug, label: p.navLabel }));

  const cards = [
    {
      icon: Phone,
      label: "Call us",
      value: phone,
      href: `tel:${phone.replace(/[^+\d]/g, "")}`,
      hint: "Speak to our admissions team",
    },
    {
      icon: Mail,
      label: "Email us",
      value: email,
      href: `mailto:${email}`,
      hint: "We reply within one working day",
    },
    {
      icon: MapPin,
      label: "Visit us",
      value: address,
      href: null,
      hint: "Our office location",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-bg-soft dark:bg-muted/30">
        <div className="max-w-[1240px] mx-auto px-6 py-14 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-navy-900 dark:hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <li className="font-semibold text-ink-900 dark:text-foreground">Contact</li>
            </ol>
          </nav>

          <h1 className="font-display text-[34px] sm:text-4xl lg:text-[46px] font-extrabold leading-[1.1] tracking-tight text-navy-950 dark:text-white max-w-3xl">
            Talk to our admissions team.
          </h1>
          <p className="mt-4 text-lg text-ink-700 dark:text-muted-foreground max-w-2xl">
            Questions about batches, fees, syllabus or which programme fits your target exam?
            Send us a message and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="max-w-[1240px] mx-auto px-6 pt-12 md:pt-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {cards.map((c) => {
            const Icon = c.icon;
            const inner = (
              <>
                <span className="w-11 h-11 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center mb-4 text-navy-700 dark:text-blue-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-muted-foreground">
                  {c.label}
                </div>
                <div className="font-bold text-ink-900 dark:text-foreground mt-1 break-words">
                  {c.value}
                </div>
                <div className="text-sm text-ink-700 dark:text-muted-foreground mt-1.5">{c.hint}</div>
              </>
            );

            return c.href ? (
              <a
                key={c.label}
                href={c.href}
                className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-es-lg)]"
              >
                {inner}
              </a>
            ) : (
              <div
                key={c.label}
                className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* Form + aside */}
      <section className="max-w-[1240px] mx-auto px-6 py-12 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
          <div className="bg-card border border-border rounded-3xl p-7 md:p-8 shadow-[var(--shadow-es-sm)]">
            <h2 className="font-display text-xl font-extrabold text-navy-950 dark:text-white">
              Send us a message
            </h2>
            <p className="text-sm text-ink-700 dark:text-muted-foreground mt-2 mb-6">
              Fields marked <span className="text-orange-500">*</span> are required.
            </p>
            <ContactForm programs={programs} />
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center text-navy-700 dark:text-blue-300">
                  <Clock className="h-[18px] w-[18px]" />
                </span>
                <h2 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                  Office Hours
                </h2>
              </div>
              {(
                [
                  ["Monday – Saturday", "9:00 AM – 7:00 PM"],
                  ["Sunday", "10:00 AM – 2:00 PM"],
                ] as const
              ).map(([d, t], i, arr) => (
                <div
                  key={d}
                  className={`flex justify-between items-center gap-4 py-2.5 text-sm ${
                    i < arr.length - 1 ? "border-b border-dashed border-border" : ""
                  }`}
                >
                  <span className="text-ink-500 dark:text-muted-foreground font-semibold">{d}</span>
                  <span className="text-ink-900 dark:text-foreground font-bold text-right">{t}</span>
                </div>
              ))}
              <p className="text-xs text-ink-500 dark:text-muted-foreground mt-3">
                Enquiries sent outside these hours are answered the next working day.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center text-orange-500">
                  <GraduationCap className="h-[18px] w-[18px]" />
                </span>
                <h2 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                  Explore Programs
                </h2>
              </div>
              <p className="text-sm text-ink-700 dark:text-muted-foreground mb-4">
                Not sure what to ask? Browse the programme pages first.
              </p>
              <ul className="space-y-1.5">
                {PROGRAMS.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/programs/${p.slug}`}
                      className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-700 dark:text-foreground hover:text-navy-900 dark:hover:text-white py-1.5 transition-colors"
                    >
                      {p.navLabel}
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-navy-950 text-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <MessageSquare className="h-[18px] w-[18px]" />
                </span>
                <h2 className="font-display font-extrabold text-lg">Prefer to chat?</h2>
              </div>
              <p className="text-sm text-slate-300">
                Use the assistant at the bottom-right of any page for a quick answer without
                filling in the form.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
