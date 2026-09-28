
import { prisma } from "@/lib/db";
import { getEffectivePlan } from "./subscription";

const DEFAULT_TEACHER_LIMITS = { maxCourses: 3, maxGroups: 2 };

/** A negative limit in plan metadata means "unlimited". */
function isWithinLimit(used: number, limit: number) {
    return limit < 0 || used < limit;
}

/**
 * Single source of truth for teacher plan limits, used by the create actions and the
 * subscription usage screen so they can never disagree.
 *
 * Only an explicit numeric `maxCourses`/`maxGroups` in plan metadata overrides the
 * defaults. `canCreateCourses: false` on the free default plan used to turn into a
 * limit of 0, which meant no approved teacher could create a course without paying.
 */
export async function getTeacherPlanLimits(userId: string): Promise<{ maxCourses: number; maxGroups: number }> {
    const plan = await getEffectivePlan(userId, "TEACHER");
    const limits = { ...DEFAULT_TEACHER_LIMITS };
    const meta = (plan?.metadata ?? null) as any;
    if (meta) {
        if (typeof meta.maxCourses === "number") limits.maxCourses = meta.maxCourses;
        if (typeof meta.maxGroups === "number") limits.maxGroups = meta.maxGroups;
    }
    return limits;
}

/** Scheduled group classes owned by this user. GroupClass.teacherId is the TeacherProfile id. */
export async function countActiveGroupClasses(userId: string): Promise<number> {
    const profile = await prisma.teacherProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!profile) return 0;
    return prisma.groupClass.count({ where: { teacherId: profile.id, status: { in: ["Scheduled"] } } });
}

/**
 * Author: Sanket
 * Checks course creation limit for teachers, respecting plan expiration.
 */
export async function checkCourseLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const [limits, courseCount] = await Promise.all([
        getTeacherPlanLimits(userId),
        prisma.course.count({ where: { userId } })
    ]);

    return {
        allowed: isWithinLimit(courseCount, limits.maxCourses),
        limit: limits.maxCourses,
        used: courseCount
    };
}

/**
 * Author: Sanket
 * Checks group class limit for teachers, respecting plan expiration.
 */
export async function checkGroupClassLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const [limits, groupCount] = await Promise.all([
        getTeacherPlanLimits(userId),
        countActiveGroupClasses(userId)
    ]);

    return {
        allowed: isWithinLimit(groupCount, limits.maxGroups),
        limit: limits.maxGroups,
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
