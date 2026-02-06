
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Subscription Plans...');

  const plans = [
    // --- STUDENT PLANS ---
    {
      name: 'Basic Student (Free)',
      description: 'Start your learning journey with free demo classes.',
      price: 0,
      interval: 'month',
      role: 'STUDENT',
      features: ['3 Demo Classes (20 mins)', 'Limited Chat Access', 'No Recordings'],
      isDefault: true,
      metadata: {
        maxDemos: 3,
        demoDuration: 20,
        chat: 'limited',
        recordings: false
      }
    },
    {
      name: 'Pro Student (Monthly)',
      description: 'Serious learners: more demos, discounts, and full chat.',
      price: 699,
      interval: 'month',
      role: 'STUDENT',
      features: ['6 Demo Classes (30 mins)', '10% Discount on Classes', 'Full Platform Chat', '5GB Recording Storage', 'Study Notes'],
      isDefault: false,
      metadata: {
        maxDemos: 6,
        demoDuration: 30,
        discount: 10,
        chat: 'full',
        storage: 5 * 1024 * 1024 * 1024, // 5GB
        recordings: true
      }
    },
    {
      name: 'Pro Student (Yearly)',
      description: 'Yearly savings for Pro access.',
      price: 6999,
      interval: 'year',
      role: 'STUDENT',
      features: ['6 Demo Classes (30 mins)', '10% Discount on Classes', 'Full Platform Chat', '5GB Recording Storage', 'Study Notes'],
      isDefault: false,
      metadata: {
        maxDemos: 6,
        demoDuration: 30,
        discount: 10,
        chat: 'full',
        storage: 5 * 1024 * 1024 * 1024, // 5GB
        recordings: true
      }
    },
    {
      name: 'Premium Student (Monthly)',
      description: 'The ultimate learning experience with priority access.',
      price: 999,
      interval: 'month',
      role: 'STUDENT',
      features: ['10 Demo Classes (30 mins)', '20% Discount on Classes', 'Unlimited Subjects', '10GB Recording Storage', 'Priority Booking', 'Certificates'],
      isDefault: false,
      metadata: {
        maxDemos: 10,
        demoDuration: 30,
        discount: 20,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        priorityBooking: true,
        certificates: true
      }
    },
    {
      name: 'Premium Student (Yearly)',
      description: 'Best value for year-round learning.',
      price: 9999,
      interval: 'year',
      role: 'STUDENT',
      features: ['10 Demo Classes (30 mins)', '20% Discount on Classes', 'Unlimited Subjects', '10GB Recording Storage', 'Priority Booking', 'Certificates'],
      isDefault: false,
      metadata: {
        maxDemos: 10,
        demoDuration: 30,
        discount: 20,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        priorityBooking: true,
        certificates: true
      }
    },

    // --- TEACHER PLANS ---
    {
      name: 'Commission Teacher',
      description: 'Pay only when you earn. No upfront cost.',
      price: 0,
      interval: 'month',
      role: 'TEACHER',
      features: ['25% Platform Fee', 'Individual Classes Only', 'Standard Support'],
      isDefault: true,
      metadata: {
        commission: 25,
        maxGroupStudents: 0, // No group classes
        searchBoost: 0
      }
    },
    {
      name: 'Pro Teacher',
      description: 'Lower commissions and group classes.',
      price: 1299,
      interval: 'month',
      role: 'TEACHER',
      features: ['15% Platform Fee', 'Group Classes (Max 6)', '10GB Storage', 'Search Boost', 'Bi-Weekly Payouts'],
      isDefault: false,
      metadata: {
        commission: 15,
        maxGroupStudents: 6,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        searchBoost: 1,
        payoutCycle: 'bi-weekly'
      }
    },
    {
      name: 'Premium Teacher',
      description: 'Maximum earnings, course creation, and priority.',
      price: 1899,
      interval: 'month',
      role: 'TEACHER',
      features: ['10% Platform Fee', 'Group Classes (Max 12)', '25GB Storage', 'Create & Sell Courses', 'Highest Visibility'],
      isDefault: false,
      metadata: {
        commission: 10,
        maxGroupStudents: 12,
        storage: 25 * 1024 * 1024 * 1024, // 25GB
        searchBoost: 2,
        canCreateCourses: true,
        payoutCycle: 'bi-weekly'
      }
    }
  ];

  console.log('Cleaning up old plans...');
  const newPlanNames = plans.map(p => p.name);
  try {
    const deleted = await prisma.subscriptionPlan.deleteMany({
      where: {
        name: { notIn: newPlanNames }
      }
    });
    console.log(`Deleted ${deleted.count} old plans.`);
  } catch (e) {
    console.warn("Warning: Could not delete some old plans, likely due to active subscriptions.", e);
  }

  for (const plan of plans) {
    // Check if plan exists by name
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { name: plan.name }
    });

    if (existing) {
      console.log(`Updating existing plan: ${plan.name}`);
      await prisma.subscriptionPlan.update({
        where: { name: plan.name },
        data: {
          price: plan.price,
          interval: plan.interval,
          features: plan.features,
          metadata: plan.metadata,
          description: plan.description,
          role: plan.role as any
        }
      });
    } else {
      console.log(`Creating new plan: ${plan.name}`);
      await prisma.subscriptionPlan.create({
        data: {
            name: plan.name,
            price: plan.price,
            interval: plan.interval,
            features: plan.features,
            metadata: plan.metadata,
            description: plan.description,
            role: plan.role as any,
            isDefault: plan.isDefault
        }
      });
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
