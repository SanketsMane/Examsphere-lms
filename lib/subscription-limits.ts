
import { prisma } from "@/lib/db";
import { getEffectivePlan } from "./subscription";

/**
 * Author: Sanket
 * Checks course creation limit for teachers, respecting plan expiration.
 */
export async function checkCourseLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const [plan, courseCount] = await Promise.all([
        getEffectivePlan(userId, "TEACHER"),
        prisma.course.count({ where: { userId } })
    ]);

    // Default fallback limits if plan fetching fails (should not happen with default plan in DB)
    let maxCourses = 3; 

    if (plan && plan.metadata) {
        const meta = plan.metadata as any;
        if (typeof meta.maxCourses === 'number') {
            maxCourses = meta.maxCourses;
        } else if (meta.canCreateCourses === false) {
             maxCourses = 0; // Explicitly blocked on Basic plan according to seed
        }
    }

    return {
        allowed: courseCount < maxCourses,
        limit: maxCourses,
        used: courseCount
    };
}

/**
 * Author: Sanket
 * Checks group class limit for teachers, respecting plan expiration.
 */
export async function checkGroupClassLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
     const [plan, groupCount] = await Promise.all([
        getEffectivePlan(userId, "TEACHER"),
        prisma.groupClass.count({ where: { teacherId: userId, status: { in: ["Scheduled"] } } })
    ]);

    let maxGroups = 2; // Default fallback

    if (plan && plan.metadata) {
        const meta = plan.metadata as any;
        if (typeof meta.maxGroups === 'number') {
            maxGroups = meta.maxGroups;
        } else if (plan.name === "Basic Teacher Plan") {
            maxGroups = 2; // Hardcoded default for free tier
        }
    }

    return {
        allowed: groupCount < maxGroups,
        limit: maxGroups,
        used: groupCount
    };
}

/**
 * Author: Sanket
 * Checks enrollment limit for students, respecting plan expiration.
 */
export async function checkEnrollmentLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const [plan, enrollmentCount] = await Promise.all([
        getEffectivePlan(userId, "STUDENT"),
        prisma.enrollment.count({ where: { userId, status: "Active" } })
    ]);

    let maxEnrollments = 5; // Default for Free Student

    if (plan && plan.metadata) {
        const meta = plan.metadata as any;
        if (typeof meta.maxCourseEnrollments === 'number') {
            maxEnrollments = meta.maxCourseEnrollments;
        }
    }

    return {
        allowed: enrollmentCount < maxEnrollments,
        limit: maxEnrollments,
        used: enrollmentCount
    };
}
