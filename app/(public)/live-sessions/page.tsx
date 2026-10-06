import { FadeIn } from "@/components/ui/fade-in";
import { Video, Users } from "lucide-react";
import type { Metadata } from "next";
import { getAllSessions } from "@/app/data/live-session/get-all-sessions";
import { LiveSessionFeatures } from "@/components/marketing/live-session-features";
import { LiveSessionsClient } from "./_components/LiveSessionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/live-sessions" },
  title: "Live Sessions | ExamSphere",
  description: "Live classes and doubt-solving sessions for JEE, NEET, Foundation (Class 6–10) and MBBS students.",
};

export default async function LiveSessionsPage() {
  // Only used for the hero counts; the grid below fetches its own pages.
  const sessions = await getAllSessions();
  const now = new Date();
  // "Live Now" only when a scheduled session has actually started and not yet ended.
  const isLiveNow = sessions.some((s) => {
    if (!s.scheduledAt) return false;
    const start = new Date(s.scheduledAt).getTime();
    return start <= now.getTime() && now.getTime() < start + (s.duration || 60) * 60_000;
  });
  const stats = [
    { icon: Video, label: sessions.length === 1 ? "Session Scheduled" : "Sessions Scheduled", value: sessions.length },
    { icon: Users, label: "Mentors", value: new Set(sessions.map((s) => s.teacherId)).size },
  ].filter((stat) => stat.value > 0);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Clean Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-black py-20 lg:py-28 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <FadeIn>
            {isLiveNow && (
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 mb-6 mx-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>Live Now</span>
              </div>
            )}
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 text-[#011E21] dark:text-white">
              Interactive <span className="text-primary">Live Sessions</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Join live classes and doubt-solving sessions for JEE, NEET, Foundation and MBBS, and ask your questions in real time.
            </p>

            {stats.length > 0 && (
            <div className="flex justify-center gap-12 pt-8 border-t border-gray-100 dark:border-gray-800 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-[#011E21] dark:text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                    <stat.icon className="w-3.5 h-3.5" />
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Features Grid */}
      <LiveSessionFeatures />

      {/* Upcoming Sessions Grid - Powered by Client Component */}
      <section id="upcoming" className="py-24 container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#011E21] dark:text-white">Upcoming Sessions</h2>
          <p className="text-muted-foreground text-lg">Book your spot before they fill up</p>
        </div>

        <LiveSessionsClient />
      </section>
    </div>
  );
}