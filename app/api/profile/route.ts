import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  education: z.string().optional(),
});

/**
 * GET /api/profile
 * Get current user profile
 * Sanket
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        gender: true,
        country: true,
        education: true,
        emailVerified: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Update current user profile
 * Sanket
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = profileUpdateSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        gender: true,
        country: true,
        education: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
