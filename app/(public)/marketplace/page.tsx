import { prisma } from "@/lib/db";
import { FindTeacherContent, TeacherWithProfile } from "@/components/mentors/FindTeacherContent";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const teachersData = await prisma.teacherProfile.findMany({
    include: {
      user: true,
    }
  });

  const teachers: TeacherWithProfile[] = teachersData.map(t => ({
    id: t.userId,
    name: t.user.name || "Unknown",
    image: t.user.image || "",
    headline: "Professional Mentor", // Schema doesn't have headline
    rating: t.rating || 0,
    reviewCount: t.totalReviews || 0,
    hourlyRate: t.hourlyRate || 0,
    teaches: t.expertise || [],
    speaks: t.languages || [],
    description: t.bio || "",
    // @ts-ignore
    country: t.user.country || "Global",
    // @ts-ignore
    gender: t.user.gender || "Not Specified",
    experience: t.experience || 0,
    isVerified: t.isVerified || false,
    availability: t.availability || {},
  }));

  const allCategoriesData = await prisma.expertise.findMany({
    where: { isActive: true },
    select: { name: true }
  });
  const allCategories = allCategoriesData.map(c => c.name);

  // Mock featured mentors for now or select top rated
  const featuredMentors: any[] = []; 

  return <FindTeacherContent teachers={teachers} featuredMentors={featuredMentors} categories={allCategories} />;
}
