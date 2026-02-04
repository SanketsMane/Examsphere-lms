import { prisma } from "../lib/db";

/**
 * Seed Subscription Plans
 * Author: Sanket
 */

async function main() {
  console.log("Seeding subscription plans...");

  const plans = [
    {
      name: "Starter",
      description: "Perfect for casual learners.",
      price: 19,
      interval: "month",
      features: ["2 Live Sessions per month", "Access to Basic Courses", "Basic Support"],
      isDefault: true,
    },
    {
      name: "Pro",
      description: "Our most popular plan for active students.",
      price: 49,
      interval: "month",
      features: ["10 Live Sessions per month", "All Premium Courses", "Priority Support", "Session Recordings"],
    },
    {
      name: "Unlimited",
      description: "For the dedicated scholar.",
      price: 99,
      interval: "month",
      features: ["Unlimited Live Sessions", "All Courses & Content", "24/7 VIP Support", "1-on-1 Mentorship Session"],
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log("Subscription plans seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
