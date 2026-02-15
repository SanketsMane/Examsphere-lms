import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Fetch Student Subscription Plans
 * Author: Sanket
 */
export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        role: "STUDENT"
      },
      orderBy: {
        price: "asc"
      }
    });

    return NextResponse.json({
        status: "success",
        data: plans
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
