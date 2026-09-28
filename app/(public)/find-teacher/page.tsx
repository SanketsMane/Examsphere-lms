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
    title: "Find a Mentor | ExamSphere",
    description: "Book 1-on-1 sessions with ExamSphere-approved mentors for JEE, NEET, Foundation (Class 6–10) and MBBS.",
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
            // Only what the public card shows — never the whole user row (email, phone…).
            user: {
                select: {
                    name: true,
                    image: true,
                    subscription: {
                        select: { status: true, plan: { select: { metadata: true } } }
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
        include: { teacher: { include: { user: { select: { name: true, image: true } } } } },
        orderBy: { scheduledAt: 'asc' }
    });

    const featuredMentors = await getFeaturedMentors();

    const formattedTeachers = teachers.map(t => ({
        id: t.id,
        name: t.user.name || "Mentor",
        image: constructS3Url(t.user.image || "") || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name || "Mentor")}&background=random&color=fff&size=128`,
        headline: t.bio ? t.bio.substring(0, 50) + "..." : "ExamSphere Mentor",
        // No reviews yet means no rating — don't invent a 5.0.
        rating: t.rating || 0,
        reviewCount: t.totalReviews,
        hourlyRate: t.hourlyRate || 0,
        teaches: (t.expertise as string[] | null) ?? [],
        speaks: (t.languages as string[] | null) ?? [],
        description: t.bio || "No description available.",
        country: "",
        gender: "",
        experience: t.experience || 0,
        isVerified: t.isVerified,
        availability: t.availability || {},
        // Internal sorting flags (not sent to client usually, but helpful if we used client side sort)
        // We will sort the array here.
        searchBoost: t.user.subscription?.status === "active" &&
            (t.user.subscription.plan?.metadata as any)?.searchBoost === true
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
