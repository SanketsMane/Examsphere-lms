
import { prisma } from "../lib/db";

async function main() {
  console.log("Starting verification of session fixes...");

  // 1. Verify Teacher Profile exists (reuse test teacher)
  const teacher = await prisma.teacherProfile.findFirst({
    include: { user: true }
  });

  if (!teacher) {
    console.error("No teacher profile found. Run create-test-teacher.ts first.");
    return;
  }

  console.log(`Found teacher: ${teacher.user.name} (${teacher.id})`);

  // 2. Simulate "Specific Session" creation (mocking API behavior)
  console.log("\nTesting Specific Session Creation...");
  const specificSession = await prisma.liveSession.create({
    data: {
      teacherId: teacher.id,
      title: "TEST: Specific Session",
      subject: "Testing",
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      duration: 60,
      price: 1000,
      status: "scheduled",
      isFreeTrialEligible: false
    }
  });
  console.log(`✅ Created specific session: ${specificSession.id}`);

  // 3. Simulate "Recurring Session" -> Template Creation (mocking Server Action behavior)
  console.log("\nTesting Template Creation (Recurring)...");
  // This mimics what the Server Action does
  const template = await prisma.sessionTemplate.create({
    data: {
      teacherId: teacher.id,
      title: "TEST: Recurring Template",
      subject: "Testing",
      duration: 45,
      price: 500,
      recurrenceType: "WEEKLY", // Simulating the logic we expect
      startTime: "10:00"
    }
  });
  console.log(`✅ Created session template: ${template.id}`);

  // 4. Verify Visibility: Check if specific session is found by the query used in Profile Page
  console.log("\nVerifying Profile Page Query...");
  const upcomingSessions = await prisma.liveSession.findMany({
    where: {
      teacherId: teacher.id,
      status: 'scheduled',
      scheduledAt: {
        gte: new Date()
      }
    },
    orderBy: {
      scheduledAt: 'asc'
    },
    take: 3
  });

  if (upcomingSessions.length > 0) {
      console.log(`✅ Found ${upcomingSessions.length} upcoming sessions for profile.`);
      console.log(`   - First: ${upcomingSessions[0].title}`);
  } else {
      console.error("❌ No upcoming sessions found! Visibility check failed.");
  }

  console.log("\nVerification Complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
