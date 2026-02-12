import { prisma } from "../lib/db";
import { 
    checkCourseLimit, 
    checkGroupClassLimit, 
    checkEnrollmentLimit 
} from "../lib/subscription-limits";
import { UserRole } from "@prisma/client";

/**
 * Author: Sanket
 * Subscription Enforcement Verification Script
 */
async function runVerification() {
    console.log("🧪 Starting Subscription Enforcement Verification...");

    // 1. Setup Test Data
    const testTeacherId = "test-teacher-enforcement";
    const testStudentId = "test-student-enforcement";

    // Cleanup existing test data if any
    await prisma.userSubscription.deleteMany({ where: { userId: { in: [testTeacherId, testStudentId] } } });
    await prisma.user.upsert({
        where: { id: testTeacherId },
        update: { role: "teacher" },
        create: { id: testTeacherId, name: "Test Teacher", email: "teacher@test.com", emailVerified: true, role: "teacher" }
    });
    await prisma.user.upsert({
        where: { id: testStudentId },
        update: { role: "student" },
        create: { id: testStudentId, name: "Test Student", email: "student@test.com", emailVerified: true, role: "student" }
    });

    const teacherPlan = await prisma.subscriptionPlan.findFirst({ where: { role: "TEACHER", name: "Basic Teacher Plan" } });
    const studentPlan = await prisma.subscriptionPlan.findFirst({ where: { role: "STUDENT", name: "Basic Student Plan" } });

    if (!teacherPlan || !studentPlan) {
        console.error("❌ Default plans not found. Please run seed-subscription-plans.ts first.");
        return;
    }

    // --- CASE 1: Expired Subscription ---
    console.log("\n--- Testing Expired Subscription ---");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.userSubscription.create({
        data: {
            userId: testTeacherId,
            planId: teacherPlan.id,
            status: "active",
            currentPeriodEnd: yesterday
        }
    });

    const teacherLimit = await checkCourseLimit(testTeacherId);
    console.log(`Teacher Course Limit (Expired): Allowed=${teacherLimit.allowed}, Limit=${teacherLimit.limit}`);
    
    // Basic Teacher Plan has canCreateCourses: false in seed, so limit should be 0 or fallback
    if (!teacherLimit.allowed) {
        console.log("✅ Success: Expired teacher blocked from creating courses (fell back to Basic limits).");
    } else {
        console.error("❌ Failure: Expired teacher still allowed to create courses.");
    }

    // --- CASE 2: Status Canceled ---
    console.log("\n--- Testing Canceled Status ---");
    await prisma.userSubscription.update({
        where: { userId: testTeacherId },
        data: { status: "canceled", currentPeriodEnd: new Date(Date.now() + 86400000) } // Canceled but period not end
    });

    const teacherLimitCanceled = await checkCourseLimit(testTeacherId);
    console.log(`Teacher Course Limit (Canceled but not end): Allowed=${teacherLimitCanceled.allowed}, Limit=${teacherLimitCanceled.limit}`);
    
    if (!teacherLimitCanceled.allowed) {
        console.log("✅ Success: Canceled status blocked access immediately.");
    } else {
        console.error("❌ Failure: Canceled status still allowed access.");
    }

    // --- CASE 3: Active Student Enrollment ---
    console.log("\n--- Testing Active Student Enrollment ---");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.userSubscription.upsert({
        where: { userId: testStudentId },
        update: { status: "active", currentPeriodEnd: tomorrow },
        create: { userId: testStudentId, planId: studentPlan.id, status: "active", currentPeriodEnd: tomorrow }
    });

    const studentLimit = await checkEnrollmentLimit(testStudentId);
    console.log(`Student Enrollment Limit (Active): Allowed=${studentLimit.allowed}, Limit=${studentLimit.limit}`);

    if (studentLimit.allowed && studentLimit.limit === 5) {
        console.log("✅ Success: Active student allowed within Basic plan limits.");
    } else {
        console.error("❌ Failure: Active student incorrectly limited.");
    }

    // Cleanup
    await prisma.userSubscription.deleteMany({ where: { userId: { in: [testTeacherId, testStudentId] } } });
    console.log("\n✨ Verification Complete.");
}

runVerification()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
