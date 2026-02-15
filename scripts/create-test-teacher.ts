
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Creating Test Teacher ---');

    // 1. Find or create a user
    let user = await prisma.user.findFirst({
        where: { email: 'test-teacher@kidokool.xyz' }
    });

    if (!user) {
        console.log('Creating new user...');
        user = await prisma.user.create({
            data: {
                name: "Test Teacher",
                email: "test-teacher@kidokool.xyz",
                emailVerified: true,
                role: "teacher"
            }
        });
    }

    // 2. Create Teacher Profile
    const profile = await prisma.teacherProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            bio: "I am a test teacher",
            expertise: ["Testing"],
            hourlyRate: 50,
            isVerified: true,
            isApproved: true
        }
    });

    console.log(`✅ Teacher Profile Ready: ${profile.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
