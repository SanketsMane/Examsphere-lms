import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { teacherProfileSchema } from "@/lib/zodSchemas";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Teachers no longer set an hourly rate at signup. Treat a blank/null/NaN rate from an older
// client as "not set" instead of letting z.coerce turn it into 0 and fail validation.
function withoutBlankRate(body: any) {
  if (body && typeof body === "object") {
    const rate = body.hourlyRate;
    if (rate === "" || rate === null || (typeof rate === "number" && Number.isNaN(rate))) {
      const { hourlyRate: _omit, ...rest } = body;
      return rest;
    }
  }
  return body;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "teacher" && (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const profile = await prisma.teacherProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            liveSessions: true,
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Allow students to apply/register as teachers
    // Check for "user" role as well, just in case default is "user"
    if ((session.user as any).role !== "teacher" && (session.user as any).role !== "admin" && (session.user as any).role !== "student" && (session.user as any).role !== "user") {
      console.log("Access denied for role:", (session.user as any).role);
      return NextResponse.json({ error: `Access denied.Role: ${(session.user as any).role} ` }, { status: 403 });
    }

    const validatedData = teacherProfileSchema.parse(withoutBlankRate(await req.json()));

    // Check if profile already exists
    const existingProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await prisma.teacherProfile.update({
        where: { userId: session.user.id },
        data: validatedData,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
    } else {
      // Create new API profile AND update user role to teacher
      // using transaction to ensure consistency
      profile = await prisma.$transaction(async (tx) => {
        const newProfile = await tx.teacherProfile.create({
          data: {
            ...validatedData,
            qualifications: validatedData.qualifications || [], // Default for MySQL JSON - Author: Sanket
            certifications: validatedData.certifications || [], // Default for MySQL JSON - Author: Sanket
            userId: session.user.id,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

        // Auto-promote user to teacher role
        if ((session.user as any).role !== "teacher" && (session.user as any).role !== "admin") {
          await tx.user.update({
            where: { id: session.user.id },
            data: { role: "teacher" }
          });
        }

        // Notify Admins about new application
        const admins = await tx.user.findMany({
          where: { role: "admin" },
          select: { id: true }
        });

        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map(admin => ({
              userId: admin.id,
              title: "New Teacher Application",
              message: `${newProfile.user.name || session.user.email} has applied to become a teacher.`,
              type: "System",
            }))
          });
        }

        return newProfile;
      });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating teacher profile:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "teacher" && (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const validatedData = teacherProfileSchema.parse(withoutBlankRate(await req.json()));

    const profile = await prisma.teacherProfile.update({
      where: { userId: session.user.id },
      data: validatedData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}