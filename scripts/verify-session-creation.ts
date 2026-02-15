
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Replicating the schema from the API route for testing
const createSessionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  subject: z.string().min(2),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  duration: z.number().min(15).max(480), // 15 mins to 8 hours
  price: z.number().min(0, "Price cannot be negative"), // Allow 0, check logic below
  timezone: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().nullable().optional(),
  isFreeTrialEligible: z.boolean().optional().default(false),
}).refine((data) => {
  // If not a free trial, enforce minimum price
  if (!data.isFreeTrialEligible && data.price < 50) {
    return false;
  }
  return true;
}, {
  message: "Minimum price is 50 cents for paid sessions",
  path: ["price"],
});

async function main() {
  console.log('--- Verifying Session Creation Logic ---');

  // Test 1: Zod Schema Validation
  console.log('\n1. Testing Validation Schema:');

  const paidSessionValid = {
    title: "Paid Session",
    subject: "Math",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    duration: 60,
    price: 500,
    timezone: "Asia/Kolkata",
    isFreeTrialEligible: false
  };

  const freeSessionValid = {
    title: "Free Trial Session",
    subject: "Math",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    duration: 60,
    price: 0,
    timezone: "Asia/Kolkata",
    isFreeTrialEligible: true
  };

  const freeSessionInvalid = {
    title: "Invalid Free Session",
    subject: "Math",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    duration: 60,
    price: 0,
    timezone: "Asia/Kolkata",
    isFreeTrialEligible: false // Should fail because price is 0 but not marked as free trial
  };

  const parsingPaid = createSessionSchema.safeParse(paidSessionValid);
  console.log(`- Paid Session Valid: ${parsingPaid.success ? '✅ Passed' : '❌ Failed'}`);

  const parsingFree = createSessionSchema.safeParse(freeSessionValid);
  console.log(`- Free Trial Session Valid: ${parsingFree.success ? '✅ Passed' : '❌ Failed'}`);

  const parsingInvalid = createSessionSchema.safeParse(freeSessionInvalid);
  console.log(`- Invalid Free Session (Standard, Price 0) Valid: ${!parsingInvalid.success ? '✅ Correctly Rejected' : '❌ Incorrectly Accepted'}`);
  
  if (!parsingInvalid.success) {
      console.log(`  Error: ${parsingInvalid.error.issues[0].message}`);
  }

  // Test 2: Database Creation (requires a teacher)
  console.log('\n2. Testing Database Insertion:');
  
  const teacher = await prisma.teacherProfile.findFirst({
      include: { user: true }
  });

  if (!teacher) {
      console.log('⚠️ No teacher profile found. Skipping DB insertion test.');
      return;
  }

  console.log(`Using teacher: ${teacher.user.name} (${teacher.id})`);

  try {
      console.log('Attempting to create Free Trial Session in DB...');
      const session = await prisma.liveSession.create({
          data: {
              teacherId: teacher.id,
              title: "TEST: Free Trial Session",
              description: "Automated test session",
              subject: "Testing",
              scheduledAt: new Date(Date.now() + 86400000), // Next 24h
              duration: 30,
              price: 0,
              timezone: "UTC",
              status: "scheduled",
              isFreeTrialEligible: true
          }
      });
      console.log(`✅ Successfully created session ID: ${session.id}`);
      console.log(`   Price: ${session.price}`);
      console.log(`   Is Free Trial: ${session.isFreeTrialEligible}`);

      // Cleanup
      await prisma.liveSession.delete({ where: { id: session.id } });
      console.log('✅ Cleaned up test session.');

  } catch (error) {
      console.error('❌ Failed to create session in DB:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
