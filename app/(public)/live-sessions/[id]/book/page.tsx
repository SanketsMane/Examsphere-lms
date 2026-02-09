import { notFound, redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { BookingPageClient } from "./_components/BookingPageClient";

export const dynamic = "force-dynamic";

async function getSession(id: string) {
  const session = await db.groupClass.findUnique({
    where: { id },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      },
      _count: {
        select: {
          enrollments: {
            where: { status: 'Active' }
          }
        }
      }
    }
  });

  if (!session) {
    notFound();
  }

  return session;
}

export default async function BookSessionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  // Require authentication
  const sessionAuth = await auth.api.getSession({ headers: await headers() });

  if (!sessionAuth?.user) {
    redirect(`/login?redirect=/live-sessions/${params.id}/book`);
  }

  const session = await getSession(params.id);

  // Check if session is available
  if (session.status !== 'Scheduled') {
    redirect(`/live-sessions/${params.id}`);
  }

  // Check if already booked
  const existingBooking = await db.groupEnrollment.findFirst({
    where: {
      classId: session.id,
      studentId: sessionAuth.user.id,
      status: { in: ['Active', 'Pending'] }
    }
  });

  if (existingBooking) {
    redirect(`/dashboard/groups`);
  }

  // Check if session is full
  if (session.maxStudents && session._count.enrollments >= session.maxStudents) {
    redirect(`/live-sessions/${params.id}`);
  }

  return <BookingPageClient session={session as any} />;
}
