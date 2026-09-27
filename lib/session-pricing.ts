import "server-only";

import { prisma } from "@/lib/db";

/**
 * Price of a 1-on-1 session in whole rupees, or null when the teacher hasn't set one.
 *
 * Teachers set rates on /teacher/pricing (TeacherPricing rows). hourlyRate was removed
 * from signup and is kept only as a legacy fallback. Returning null — instead of the old
 * `hourlyRate || 0` — stops unpriced teachers from being booked for free.
 */
export async function getOneOnOneSessionPrice(
  teacherProfileId: string,
  durationMinutes: number
): Promise<number | null> {
  const type = durationMinutes <= 30 ? "THIRTY_MIN" : "SIXTY_MIN";

  const [pricing, profile] = await Promise.all([
    prisma.teacherPricing.findUnique({
      where: { teacherId_type: { teacherId: teacherProfileId, type } },
      select: { price: true, isActive: true },
    }),
    prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      select: { hourlyRate: true },
    }),
  ]);

  if (pricing?.isActive && Number.isInteger(pricing.price) && pricing.price > 0) {
    return pricing.price;
  }

  const hourly = profile?.hourlyRate ?? 0;
  if (hourly > 0) {
    return durationMinutes <= 30 ? Math.round(hourly / 2) : hourly;
  }

  return null;
}

export const SESSION_PRICE_NOT_SET_MESSAGE =
  "This teacher hasn't set a price for 1-on-1 sessions yet, so they can't be booked right now.";
