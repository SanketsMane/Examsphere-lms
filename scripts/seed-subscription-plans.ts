
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding subscription plans...");

    // 1. Basic Teacher Plan (Free)
    await prisma.subscriptionPlan.upsert({
        where: { name: "Basic Teacher Plan" },
        update: {},
        create: {
            name: "Basic Teacher Plan",
            description: "Standard access for verified teachers",
            price: 0,
            interval: "month",
            features: [
                "Standard Commission (~20%)",
                "Create Sessions",
                "Basic Profile Visibility"
            ],
            role: UserRole.TEACHER,
            isDefault: true,
            metadata: {
                commissionRate: 20,
                maxGroupSize: 6,
                canCreateCourses: false,
                storageLimit: 5368709120, // 5GB in bytes
                searchBoost: 1
            }
        }
    });

    // 2. Tutor Premium Plan (Paid)
    // Note: razorpayPlanId should be updated after creating the plan in Razorpay Dashboard
    await prisma.subscriptionPlan.upsert({
        where: { name: "Tutor Premium Plan" },
        update: {
             metadata: {
                commissionRate: 10,
                maxGroupSize: 12,
                canCreateCourses: true,
                storageLimit: 26843545600, // 25GB in bytes
                searchBoost: 10
            }
        },
        create: {
            name: "Tutor Premium Plan",
            description: "Premium features for serious tutors",
            price: 1899,
            interval: "month",
            features: [
                "Lower Commission (10%)",
                "Priority Search Ranking",
                "Create & Sell Courses",
                "Larger Group Classes (12 Students)",
                "25GB Storage",
                "Priority Support"
            ],
            role: UserRole.TEACHER,
            isDefault: false,
            metadata: {
                commissionRate: 10,
                maxGroupSize: 12,
                canCreateCourses: true,
                storageLimit: 26843545600, // 25GB in bytes
                searchBoost: 10
            }
        }
    });

    console.log("✅ Subscription plans seeded successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
