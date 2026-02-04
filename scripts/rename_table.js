const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Checking for table rename requirement...");
  try {
    // Attempt to rename LiveSession to live_sessions
    await prisma.$executeRawUnsafe('ALTER TABLE "LiveSession" RENAME TO "live_sessions";');
    console.log("✅ Successfully renamed table 'LiveSession' to 'live_sessions'");
  } catch (e) {
    // Ignore error if table doesn't exist or already renamed
    if (e.message.includes('does not exist') || e.message.includes('already exists')) {
        console.log("ℹ️ Table 'LiveSession' does not exist or 'live_sessions' already exists. Skipping rename.");
    } else {
        console.error("⚠️ Warning during rename attempt:", e.message);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
