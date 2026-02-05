
import { prisma } from "@/lib/db";

export async function checkCourseLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const [subscription, courseCount] = await Promise.all([
        prisma.userSubscription.findUnique({
            where: { userId },
            include: { plan: true }
        }),
        prisma.course.count({ where: { userId } })
    ]);

    // Default limit (e.g. for free tier if no plan found, though everyone should have a plan)
    // Assuming "Basic Teacher Plan" has limit 3 if not specified in metadata.
    let maxCourses = 3; 

    if (subscription && subscription.plan) {
        const plan = subscription.plan as any;
        if (plan.metadata) {
            const meta = plan.metadata;
            if (typeof meta.maxCourses === 'number') {
                maxCourses = meta.maxCourses;
            }
        }
    }

    // Check if subscription is active or valid
    if (subscription && subscription.status !== 'active' && subscription.status !== 'trialing' && subscription.plan.price > 0) {
        // If paid plan but not active, maybe fallback to free limits?
        // For strictness, if status is 'past_due' or 'canceled', we might still honor the period if currentPeriodEnd > now.
        // But let's assume 'active' is required for paid limits.
        // If invalid, fallback to default (Free) limit.
         maxCourses = 3; // Hardcoded fallback for now
    }
    
    // Allow if used < max
    return {
        allowed: courseCount < maxCourses,
        limit: maxCourses,
        used: courseCount
    };
}

export async function checkGroupClassLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
     // Similar logic for group classes
     const [subscription, groupCount] = await Promise.all([
        prisma.userSubscription.findUnique({
            where: { userId },
            include: { plan: true }
        }),
        prisma.groupClass.count({ where: { teacherId: userId, status: { in: ["Scheduled"] } } })
    ]);

    let maxGroups = 2; // Default

    if (subscription && subscription.plan) {
        const plan = subscription.plan as any;
        if (plan.metadata) {
            const meta = plan.metadata;
            if (typeof meta.maxGroups === 'number') {
                maxGroups = meta.maxGroups;
            }
        }
    }

    return {
        allowed: groupCount < maxGroups,
        limit: maxGroups,
        used: groupCount
    };
}

export async function checkEnrollmentLimit(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
    const [subscription, enrollmentCount] = await Promise.all([
        prisma.userSubscription.findUnique({
            where: { userId },
            include: { plan: true }
        }),
        prisma.enrollment.count({ where: { userId, status: "Active" } })
    ]);

    let maxEnrollments = 5; // Default for Free Student

    if (subscription && subscription.plan) {
        const plan = subscription.plan as any;
        if (plan.metadata) {
            const meta = plan.metadata;
            if (typeof meta.maxCourseEnrollments === 'number') {
                maxEnrollments = meta.maxCourseEnrollments;
            }
        }
    }

    return {
        allowed: enrollmentCount < maxEnrollments,
        limit: maxEnrollments,
        used: enrollmentCount
    };
}
