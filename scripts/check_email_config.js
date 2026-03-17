const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.emailGlobalSettings.findUnique({
      where: { id: 'default' }
    });
    console.log("Email System Enabled:", settings ? settings.isSystemEnabled : "Not Found (Default to true)");

    const provider = await prisma.emailProvider.findFirst({
      where: { isActive: true },
      orderBy: { isDefault: 'desc' }
    });
    console.log("Active Provider Type:", provider ? provider.type : "None found in DB");
    if (provider) {
      console.log("Provider Config (sanitized):", {
        host: provider.config.host,
        port: provider.config.port,
        secure: provider.config.secure,
        user: provider.config.user ? "PRESENT" : "MISSING",
        pass: provider.config.pass ? "PRESENT" : "MISSING",
      });
    }

    const templates = await prisma.emailTemplate.findMany({
       select: { slug: true, isActive: true }
    });
    console.log("Email Templates Status:", templates);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
