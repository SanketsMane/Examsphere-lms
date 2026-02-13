import { FindTeacherContent } from "@/components/mentors/FindTeacherContent";
import { prisma } from "@/lib/db";
import { getFeaturedMentors } from "@/app/data/marketing/get-marketing-data";
import { auth } from "@/lib/auth";
import { getCurrencyData } from "@/lib/currency";
import { headers } from "next/headers";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Find Expert Tutors - KIDOKOOL",
    description: "Connect with verified tutors for personalized 1-on-1 learning sessions. Master any subject with expert guidance.",
};

export default async function FindTeacherPage() {
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
            user: {
                include: {
                    teacherProfile: true, // Redundant but harmless, explicit
                    subscription: {
                         where: { status: "active" },
                         include: { plan: true }
                    }
                }
            }
        }
    });

    // Fetch Advertised Packages (Group Classes)
    const packages = await prisma.groupClass.findMany({
        where: { 
            isAdvertised: true, 
            status: "Scheduled",
            scheduledAt: { gt: new Date() } // Only future classes
        },
        include: { teacher: { include: { user: true } } },
        orderBy: { scheduledAt: 'asc' }
    });

    const featuredMentors = await getFeaturedMentors();

    const formattedTeachers = teachers.map(t => ({
        id: t.id,
        name: t.user.name || "Instructor",
        image: constructS3Url(t.user.image || "") || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name || "Instructor")}&background=random&color=fff&size=128`,
        headline: t.bio ? t.bio.substring(0, 50) + "..." : "Expert Instructor",
        rating: t.rating || 5.0,
        reviewCount: t.totalReviews,
        hourlyRate: t.hourlyRate || 0,
        teaches: t.expertise,
        speaks: t.languages,
        description: t.bio || "No description available.",
        // @ts-ignore
        country: t.user.country || "Global",
        // @ts-ignore
        gender: t.user.gender || "Not Specified",
        experience: t.experience || 0,
        isVerified: t.isVerified,
        availability: t.availability || {},
        // Internal sorting flags (not sent to client usually, but helpful if we used client side sort)
        // We will sort the array here.
        searchBoost: (t.user as any).subscription?.plan?.metadata?.searchBoost === true
    }));

    // Sort: Boosted first, then by rating, then by review count
    formattedTeachers.sort((a, b) => {
        if (a.searchBoost && !b.searchBoost) return -1;
        if (!a.searchBoost && b.searchBoost) return 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
    });

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
