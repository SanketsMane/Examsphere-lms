import { prisma } from "../lib/db";
import { hash } from "bcryptjs";

async function repair() {
  console.log("🛠️ Repairing accounts for Better Auth...");
  const hashedPassword = await hash("password123", 10);
  
  const users = await prisma.user.findMany();
  for (const user of users) {
    console.log(`Processing user: ${user.email}`);
    await prisma.account.upsert({
      where: { id: `account-${user.id}` }, // Synthetic ID for seed
      update: { password: hashedPassword },
      create: {
        id: `account-${user.id}`,
        userId: user.id,
        accountId: user.email,
        providerId: "email",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Account created for ${user.email}`);
  }
}

repair().finally(() => prisma.$disconnect());
