import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { FadeIn } from "@/components/ui/fade-in";
import { Calendar, Clock, Award, Globe, Video, CheckCircle2 } from "lucide-react";
import { BookingWidget } from "./_components/booking-widget";
import { ReportTeacherButton } from "./_components/report-button";
import { SaveTutorButton } from "./_components/save-tutor-button";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ teacherId: string }>;
}

export default async function TeacherProfilePage({ params }: PageProps) {
    const { teacherId } = await params;

    const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: teacherId },
        include: {
            // Public page: only the fields shown, never the full user row (email, phone…).
            user: { select: { id: true, name: true, image: true } },
        }
    });

    // Unapproved applicants must not have a public profile.
    if (!teacherProfile || !teacherProfile.isApproved) {
        return notFound();
    }

    // 2. Check current user (for booking)
    const session = await getSessionWithRole();

    const isSaved = session?.user ? !!(await prisma.studentSavedTutor.findUnique({
        where: {
            studentId_tutorId: {
                studentId: session.user.id,
                tutorId: teacherProfile.user.id
            }
        }
    })) : false;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header Profile */}
            <div className="bg-secondary/30 border-b border-border">
                <div className="container mx-auto px-6 py-12 md:py-16">
                    <FadeIn>
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <img
                                src={teacherProfile.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacherProfile.user.name}`}
                                alt={teacherProfile.user.name}
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-lg"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl md:text-4xl font-bold">{teacherProfile.user.name}</h1>
                                    {teacherProfile.isVerified && (
                                        <CheckCircle2 className="text-green-500 w-6 h-6" />
                                    )}
                                </div>
                                <p className="text-xl text-primary font-medium mb-4">{teacherProfile.expertise.join(", ")}</p>
                                <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                                    {teacherProfile.bio}
                                </p>

                                <div className="flex gap-6 mt-6 text-sm font-medium text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        <span>{teacherProfile.totalReviews} Reviews</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        <span>{teacherProfile.languages.join(", ") || "English"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Video className="w-4 h-4" />
                                        <span>1-on-1 Sessions</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
                {/* Main Content: Details, Reviews */}
                <div className="md:col-span-2 space-y-10">
                    <section>
                        <h2 className="text-2xl font-bold mb-4">About Me</h2>
                        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                            <p>{teacherProfile.bio || "No biography provided."}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">Expertise</h2>
                        <div className="flex flex-wrap gap-2">
                            {teacherProfile.expertise.map(skill => (
                                <span key={skill} className="px-4 py-2 bg-secondary rounded-lg font-medium">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Reviews Placeholder - Could reuse Testimonials section logic here later */}
                </div>

                {/* Sidebar: Booking Widget */}
                <div className="relative">
                    <div className="sticky top-24 space-y-4">
                        <BookingWidget
                            teacherId={teacherProfile.user.id}
                            teacherProfileId={teacherProfile.id}
                            hourlyRate={teacherProfile.hourlyRate || 0}
                            userName={teacherProfile.user.name}
                        />
                        <ReportTeacherButton
                            teacherId={teacherProfile.user.id}
                            teacherName={teacherProfile.user.name}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
