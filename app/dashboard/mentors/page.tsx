import { FindTeacherContent } from "@/components/mentors/FindTeacherContent";
import { prisma } from "@/lib/db";
import { getFeaturedMentors } from "@/app/data/marketing/get-marketing-data";
import { auth } from "@/lib/auth";
import { getCurrencyData } from "@/lib/currency";
import { headers } from "next/headers";

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
            user: true
        }
    });

    // Fetch Advertised Packages (Group Classes)
    const packages = await prisma.groupClass.findMany({
        where: { isAdvertised: true, status: "Scheduled" },
        include: { teacher: { include: { user: true } } },
        orderBy: { scheduledAt: 'asc' }
    });

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
        // @ts-ignore
        country: t.user.country || "Global",
        // @ts-ignore
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
