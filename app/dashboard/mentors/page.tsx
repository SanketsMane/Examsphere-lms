import { FindTeacherContent } from "@/components/mentors/FindTeacherContent";
import { prisma } from "@/lib/db";
import { getFeaturedMentors } from "@/app/data/marketing/get-marketing-data";
import { auth } from "@/lib/auth";
import { getCurrencyData } from "@/lib/currency";
import { headers } from "next/headers";
import Link from "next/link";
import { UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardMentorsPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    // @ts-ignore
    const userCountry = session?.user?.country;
    const currencyData = getCurrencyData(userCountry);

    const teachers = await prisma.teacherProfile.findMany({
        where: {
            isVerified: true,
            isApproved: true
        },
        include: {
            // Only what the card renders; never ship emails/phones to the client
            user: { select: { name: true, image: true, country: true, gender: true } }
        }
    });

    // Fetch Advertised Packages (Group Classes)
    const packages = await prisma.groupClass.findMany({
        where: { isAdvertised: true, status: "Scheduled" },
        include: { teacher: { include: { user: { select: { name: true, image: true } } } } },
        orderBy: { scheduledAt: 'asc' }
    });

    if (teachers.length === 0 && packages.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Find a Mentor</h1>
                    <p className="text-muted-foreground">
                        Book 1-on-1 guidance from verified JEE, NEET and Foundation mentors.
                    </p>
                </div>
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 bg-primary/5 rounded-full mb-4">
                            <UserSearch className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold mb-1">Mentors are being onboarded</h2>
                        <p className="text-muted-foreground max-w-md">
                            We&apos;re verifying our first JEE and NEET mentors. Meanwhile, keep learning with your
                            courses or ask ExamSphere AI your doubts.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center mt-6">
                            <Button asChild>
                                <Link href="/dashboard/browse">Browse Courses</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/dashboard/ai">Ask ExamSphere AI</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const featuredMentors = await getFeaturedMentors();

    const formattedTeachers = teachers.map(t => ({
        id: t.id,
        name: t.user.name || "Instructor",
        image: t.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name || "Instructor")}&background=random&color=fff&size=128`,
        headline: t.bio ? t.bio.substring(0, 50) + "..." : "Expert Instructor",
        rating: t.rating || 5.0,
        reviewCount: t.totalReviews,
        hourlyRate: t.hourlyRate || 0,
        teaches: t.expertise,
        speaks: t.languages,
        description: t.bio || "No description available.",
        country: t.user.country || "Global",
        gender: t.user.gender || "Not Specified",
        experience: t.experience || 0,
        isVerified: t.isVerified,
        availability: t.availability || {}
    }));

    const categories = await prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: { children: { where: { isActive: true } } },
        orderBy: { displayOrder: 'asc' }
    });

    const languages = await prisma.language.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { name: 'asc' }
    });

    return <FindTeacherContent 
        teachers={formattedTeachers} 
        packages={packages as any} 
        featuredMentors={featuredMentors} 
        categories={categories as any}
        allLanguages={languages.map(l => l.name)}
        currency={currencyData}
    />;
}
