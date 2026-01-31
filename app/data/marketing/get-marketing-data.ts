import { prisma } from "@/lib/db";
import { Review, Category } from "@prisma/client";

export type FeaturedReview = {
    id: string;
    reviewerName: string;
    reviewerImage: string;
    reviewerRole: string; // "Student" or "Teacher"
    rating: number;
    title: string;
    comment: string;
};

export type FeaturedCategory = {
    id: string;
    label: string;
    icon?: string; // We might need to map this on frontend if string
    count: number;
    slug: string;
    color?: string; // We can return a tailored color or random
    parentId?: string | null;
};

export async function getFeaturedReviews(): Promise<FeaturedReview[]> {
    const reviews = await prisma.review.findMany({
        where: { rating: { gte: 4 } }, // Only 4+ stars
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
            reviewer: {
                select: {
                    name: true,
                    image: true,
                    role: true
                }
            }
        }
    });

    return reviews.map(r => ({
        id: r.id,
        reviewerName: r.reviewer.name,
        reviewerImage: r.reviewer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reviewer.name || "Reviewer")}&background=random`,
        reviewerRole: r.reviewer.role === 'teacher' ? 'Instructor' : 'Student',
        rating: r.rating,
        title: r.title || "Review",
        comment: r.comment || ""
    }));
}

export async function getTopCategories(): Promise<FeaturedCategory[]> {
    // Basic implementation: fetch categories and count courses
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { courses: true }
            }
        },
        take: 10
    });

    // Map to frontend expectation
    return categories.map(c => ({
        id: c.id,
        label: c.name,
        count: c._count.courses,
        slug: c.slug,
        icon: c.icon || undefined,
        parentId: c.parentId
    }));
}

export type FeaturedMentor = {
    id: string;
    name: string;
    role: string;
    image: string;
    rating: number;
    students: string;
    color: string;
};

export async function getFeaturedMentors(): Promise<FeaturedMentor[]> {
    const teachers = await prisma.teacherProfile.findMany({
        where: {
            isVerified: true,
            isApproved: true
        },
        take: 5,
        orderBy: { rating: 'desc' },
        include: { user: true }
    });

    const colors = [
        "from-blue-500/10 to-indigo-500/10 border-blue-100 dark:border-blue-900/20",
        "from-red-500/10 to-pink-500/10 border-red-100 dark:border-red-900/20",
        "from-amber-500/10 to-yellow-500/10 border-amber-100 dark:border-amber-900/20",
        "from-emerald-500/10 to-green-500/10 border-emerald-100 dark:border-emerald-900/20",
        "from-purple-500/10 to-violet-500/10 border-purple-100 dark:border-purple-900/20",
    ];

    return teachers.map((t, idx) => ({
        id: t.id,
        name: t.user.name || "Instructor",
        role: t.expertise[0] || "Expert Instructor",
        image: t.user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.user.name || "Instructor")}&background=random&color=fff&size=128`,
        rating: t.rating || 5.0,
        students: `${t.totalStudents}+`,
        color: colors[idx % colors.length]
    }));
}

export async function getAllCategories(): Promise<FeaturedCategory[]> {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { courses: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return categories.map(c => ({
        id: c.id,
        label: c.name,
        count: c._count.courses,
        slug: c.slug,
        icon: c.icon || undefined,
        parentId: c.parentId
    }));
}
