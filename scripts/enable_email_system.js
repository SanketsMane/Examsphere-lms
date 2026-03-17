const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.emailGlobalSettings.upsert({
      where: { id: 'default' },
      update: { isSystemEnabled: true },
      create: { id: 'default', isSystemEnabled: true }
    });
    console.log("Email System Enabled successfully in DB:", settings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
