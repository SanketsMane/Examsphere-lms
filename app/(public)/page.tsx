import { getActiveBroadcasts } from "../actions/broadcasts";
import { getSessionWithRole } from "../data/auth/require-roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import { TestimonialsSectionV2 } from "@/components/ui/testimonial-v2";
import { Logos3 } from "@/components/ui/logos3";
import { FadeIn } from "@/components/ui/fade-in";

import {
  ArrowRight, BookOpen, Users, TrendingUp, Award, Play, Star,
  Calendar, Clock, Eye, User, CheckIcon, Globe, Shield, Zap,
  Video, MessageSquare, Trophy, Target, Lightbulb, Headphones,
  FileText, BarChart3, Smartphone, Laptop, Tablet, CheckCircle2
} from "lucide-react";
import { prisma } from "@/lib/db";
import { CategoryCard } from "@/components/ui/category-card";
import { SectionHeading } from "@/components/ui/section-heading";
import HeroSection from "@/components/ui/hero-section-9";
import { ServicesSection } from "@/components/marketing/ServicesSection";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { AnimationWrapper } from "@/components/ui/animation-wrapper";
import { CategoriesGrid } from "@/components/marketing/CategoriesGrid";
import { PopularLanguages } from "@/components/marketing/PopularLanguages";
import { FeaturedCourses } from "@/components/marketing/FeaturedCourses";
import { StatsBar } from "@/components/marketing/StatsBar";
import { VibeCard } from "@/components/marketing/vibe-card";
import { BroadcastBanner } from "@/components/marketing/BroadcastBanner";
import { UpcomingGroupClasses } from "@/components/marketing/UpcomingGroupClasses";
import { getFeaturedCourses } from "../data/courses/get-featured-courses";
import { getTopCategories } from "../data/marketing/get-marketing-data";

const features = [
  {
    icon: Video,
    title: "Live Interactive Sessions",
    description: "Join real-time classes with expert instructors, ask questions, and collaborate with peers worldwide."
  },
  {
    icon: BookOpen,
    title: "Comprehensive Course Library",
    description: "Access our growing library of courses across programming, business, design, and more."
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Learning Assistant",
    description: "Get personalized recommendations and instant help with our intelligent tutoring system."
  },
  {
    icon: Trophy,
    title: "Certification & Badges",
    description: "Earn industry-recognized certificates and digital badges to showcase your achievements."
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Track your learning journey with detailed analytics and performance insights."
  },
  {
    icon: Globe,
    title: "Global Community",
    description: "Connect with learners worldwide, join study groups, and participate in coding challenges."
  }
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSessionWithRole();

  // ... (existing checks)

  // Fetch Real Data
  const broadcasts = await getActiveBroadcasts();
  const courseCount = await prisma.course.count({ where: { status: 'Published' } });
  const studentCount = await prisma.user.count({ where: { role: 'student' } });
  const instructorCount = await prisma.teacherProfile.count({ where: { isVerified: true } });

  const featuredCourses = await getFeaturedCourses();
  const categories = await getTopCategories();
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 9
  });

  const stats = [
    { icon: BookOpen, label: "Total Courses", value: `${courseCount}+` },
    { icon: Users, label: "Active Students", value: `${studentCount}+` },
    { icon: Award, label: "Expert Instructors", value: `${instructorCount}+` },
  ];

  return (
    <AnimationWrapper className="min-h-screen bg-background font-sans">
      {/* --- BROADCAST BANNER --- */}
      <BroadcastBanner broadcasts={broadcasts} />
      
      {/* ... Hero Section ... */}
      
      {/* ... Hero Section ... */}
      <HeroSection
        title={
          <>
            A smarter way to Learn <br /> <span className="text-primary">and grow</span>
          </>
        }
        subtitle="Kidokool is here for you with various courses & materials from skilled tutors all around the world."
        actions={[
          {
            text: 'Join the Class',
            href: '/register',
            variant: 'default' as const,
          },
          {
            text: 'Browse Tutors',
            href: '/find-teacher',
            variant: 'outline' as const,
          },
        ]}
        stats={[
          {
            value: '6400',
            label: 'Active students',
            icon: <Users className="h-5 w-5 text-muted-foreground" />,
          },
          {
            value: '4,5K',
            label: 'Tutors',
            icon: <Award className="h-5 w-5 text-muted-foreground" />, // Using Award instead of Briefcase if Briefcase not imported, using existing import
          },
          {
            value: 'Resources',
            label: '',
            icon: <BookOpen className="h-5 w-5 text-muted-foreground" />, // Using BookOpen as LinkIcon equivalent
          },
        ]}
        images={[
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop',
          'https://plus.unsplash.com/premium_photo-1663054774427-55adfb2be76f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGVvcGxlfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900?q=80&w=2070&auto=format&fit=crop',
        ]}
      />

      {/* ... Stats Bar ... */}
      <StatsBar />

      {/* ... Vibe Card ... */}
      <VibeCard />

      {/* ... Features ... */}
      <FeaturesGrid />

      <UpcomingGroupClasses />

      <FeaturedCourses courses={featuredCourses} />

      <CategoriesGrid categories={categories} />

      <PopularLanguages />

      <ServicesSection />

      {/* --- REVIEWS --- */}
      <TestimonialsSectionV2 testimonials={testimonials} />



      {/* --- DUAL CTA --- */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Student CTA */}
            <div className="relative overflow-hidden rounded-2xl bg-secondary dark:bg-card p-12 flex flex-col justify-center items-start group hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10">
                <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-6">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Student</h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Access thousands of courses from industry experts and start your journey today.
                </p>
                <Link href="/register" className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
                  Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors" />
            </div>

            {/* Teacher CTA */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-12 flex flex-col justify-center items-start group hover:shadow-2xl transition-all duration-500">
              <div className="relative z-10">
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-white mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Teacher</h3>
                <p className="text-gray-300 mb-8 text-lg">
                  Share your knowledge, inspire students, and earn money by teaching what you love.
                </p>
                <Link href="/register/teacher" className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-gray-100 transition-colors">
                  Become a Teacher <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
            </div>
          </div>
        </div>
      </section>


    </AnimationWrapper>
  );
}