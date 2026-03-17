import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "contactsanket1@gmail.com";
  
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User with email ${email} not found`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email})`);
  console.log(`Current role: ${user.role}`);

  // Update role to admin
  const updated = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`✓ Role updated to: ${updated.role}`);
  console.log(`User ${updated.email} is now an admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
