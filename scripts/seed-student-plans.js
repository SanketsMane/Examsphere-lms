
const { PrismaClient, UserRole } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding student subscription plans...");

    // 1. Basic Student Plan (Free)
    await prisma.subscriptionPlan.upsert({
        where: { name: "Basic Student Plan" },
        update: {},
        create: {
            name: "Basic Student Plan",
            description: "Start your learning journey for free",
            price: 0,
            interval: "month",
            features: [
                "Access to Free Courses",
                "Join Public Live Sessions",
                "Basic Community Access"
            ],
            // Use UserRole.STUDENT if available, otherwise fallback or assume schema string match?
            // "STUDENT" is theenum value key.
            role: "STUDENT", 
            isDefault: true,
            metadata: {
                canViewRecordings: false,
                maxCourseEnrollments: 5,
                searchBoost: 1
            }
        }
    });

    // 2. Premium Student Plan (Paid)
    await prisma.subscriptionPlan.upsert({
        where: { name: "Pro Student Plan" },
        update: {
             metadata: {
                canViewRecordings: true,
                maxCourseEnrollments: 100,
                searchBoost: 10
            }
        },
        create: {
            name: "Pro Student Plan",
            description: "Unlock unlimited learning",
            price: 499,
            interval: "month",
            features: [
                "Unlimited Course Access",
                "View Session Recordings",
                "Priority Q&A",
                "Certificate of Completion",
                "Offline Downloads"
            ],
            role: "STUDENT", 
            isDefault: false,
            metadata: {
                canViewRecordings: true,
                maxCourseEnrollments: 100,
                searchBoost: 10
            }
        }
    });

    console.log("✅ Student subscription plans seeded successfully");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
