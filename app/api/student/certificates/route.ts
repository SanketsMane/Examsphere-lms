import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Fetch Student Certificates
 * Author: Sanket
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const certificates = await prisma.certificate.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        issuedAt: "desc"
      }
    });

    return NextResponse.json({
        status: "success",
        data: certificates
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
