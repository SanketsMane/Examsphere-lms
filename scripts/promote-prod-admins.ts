
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function promoteAdmins() {
    const users = [
        { email: "bksun170882@gmail.com", name: "Admin" },
        { email: "contactsanket1@gmail.com", name: "Sanket" }
    ];

    console.log("🔐 Promoting/Creating admin users...");

    for (const { email, name } of users) {
        try {
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (user) {
                const updatedUser = await prisma.user.update({
                    where: { email },
                    data: { role: "admin" }
                });
                console.log(`✅ Promoted existing user ${email} to admin.`);
            } else {
                const newUser = await prisma.user.create({
                    data: {
                        email,
                        name,
                        role: "admin",
                        emailVerified: true,
                    }
                });
                console.log(`✅ Created new admin user ${email}.`);
            }

        } catch (error) {
            console.error(`❌ Failed to process ${email}:`, error);
        }
    }

    await prisma.$disconnect();
}

promoteAdmins()
    .then(() => {
        console.log("🎉 Done!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Script failed:", error);
        process.exit(1);
    });
