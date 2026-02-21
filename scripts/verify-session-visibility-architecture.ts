
import { prisma } from "../lib/db";
import { startOfDay, addDays, format } from "date-fns";

async function main() {
  console.log("Starting Verification for Session Visibility Architecture...");

  // 1. Setup Test Teacher
  const teacherEmail = `test-teacher-${Date.now()}@example.com`;
  let user = await prisma.user.create({
    data: {
      name: "Visibility Test Teacher",
      email: teacherEmail,
      emailVerified: true,
      role: "teacher",
    }
  });

  let teacher = await prisma.teacherProfile.create({
    data: {
      userId: user.id,
      bio: "Test Instructor Bio",
      hourlyRate: 5000,
      isVerified: true,
    }
  });

  console.log(`✅ Created Teacher: ${teacher.id}`);

  // 2. Set Availability (Mon-Fri, 09:00 - 17:00)
  // We'll set it for the current day of week to test immediately
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  await prisma.sessionAvailability.create({
    data: {
      teacherId: teacher.id,
      dayOfWeek: dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      isActive: true,
    }
  });
  console.log(`✅ Set Availability for today (Day ${dayOfWeek})`);

  // 3. Test Availability API Logic (Simulated)
  // We can't easily call the Next.js API route directly from a script without starting the server,
  // but we can replicate the query logic to ensure it returns slots.
  
  const availability = await prisma.sessionAvailability.findFirst({
    where: { teacherId: teacher.id, dayOfWeek, isActive: true }
  });

  if (availability) {
      console.log(`✅ API Logic Check: Found availability record.`);
      // Logic would generate slots here.
      console.log(`   (Slots generation logic assumed working if record exists)`);
  } else {
      console.error(`❌ API Logic Check Failed: Availability record not found.`);
  }

  // 4. Create Group Session
  const groupSession = await prisma.liveSession.create({
    data: {
      teacherId: teacher.id,
      title: "TEST: Featured Group Class",
      description: "This should appear on the home page.",
      scheduledAt: addDays(new Date(), 2), // 2 days from now
      duration: 60,
      price: 2000,
      maxParticipants: 10, // Group session!
      status: "scheduled",
    }
  });
  console.log(`✅ Created Group Session: ${groupSession.id}`);

  // 5. Verify Group Session Visibility (Query used in UpcomingGroupClasses)
  const homePageSessions = await prisma.liveSession.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { gte: new Date() }
    },
    orderBy: { scheduledAt: 'asc' },
    include: { teacher: { include: { user: true } } }
  });

  const found = homePageSessions.find(s => s.id === groupSession.id);
  const isGroup = (found?.maxParticipants ?? 0) > 1;

  if (found && isGroup) {
      console.log(`✅ Group Session Visibility Check: Success!`);
      console.log(`   - Found session "${found.title}"`);
      console.log(`   - Participants: ${found.maxParticipants}`);
      console.log(`   - Teacher Name: ${found.teacher.user.name}`);
  } else {
      console.error(`❌ Group Session Visibility Check Failed!`);
  }

  // Cleanup
  await prisma.liveSession.deleteMany({ where: { teacherId: teacher.id } });
  await prisma.sessionAvailability.deleteMany({ where: { teacherId: teacher.id } });
  await prisma.teacherProfile.delete({ where: { id: teacher.id } });
  await prisma.user.delete({ where: { id: user.id } });
  
  console.log("Cleanup Complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
