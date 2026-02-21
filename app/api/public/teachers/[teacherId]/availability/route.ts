
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, parseISO, format, addMinutes, isBefore, isAfter } from "date-fns";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // ISO or YYYY-MM-DD
  timezone: z.string().optional().default("UTC"),
  duration: z.coerce.number().optional().default(60).refine(n => n > 0, "Duration must be positive"), // Slot duration in minutes
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> } // Updated for Next.js 15+ param handling
) {
  try {
    const { teacherId } = await params;
    const { searchParams } = new URL(req.url);
    const query = querySchema.safeParse({
      date: searchParams.get("date"),
      timezone: searchParams.get("timezone") || undefined,
      duration: searchParams.get("duration") || undefined,
    });

    if (!query.success) {
      return NextResponse.json({ error: "Invalid parameters", details: query.error.format() }, { status: 400 });
    }

    const { date, duration } = query.data;
    
    // Normalize date to start of day in query timezone (conceptually)
    // For simplicity, we'll treat the input date as the target day.
    const targetDate = new Date(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
    
    // Get day of week (0-6)
    const dayOfWeek = targetDate.getDay();

    // 1. Fetch Teacher's Availability for this day
    const availability = await prisma.sessionAvailability.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability || !availability.startTime || !availability.endTime) {
      return NextResponse.json({ slots: [] });
    }

    // 2. Fetch Existing Sessions (Bookings) for this day to exclude
    const existingSessions = await prisma.liveSession.findMany({
      where: {
        teacherId,
        status: {
            notIn: ["cancelled"] 
        }, 
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    // 3. Generate Slots
    // Parse start/end times from availability (e.g., "09:00", "17:00")
    const [startHour, startMinute] = availability.startTime.split(":").map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    if (isNaN(startHour) || isNaN(endHour)) {
        return NextResponse.json({ slots: [], warning: "Invalid availability times" });
    }

    let currentSlot = new Date(targetDate);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const shiftEnd = new Date(targetDate);
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    const availableSlots = [];
    let iterations = 0;
    const MAX_ITERATIONS = 100; // Safety cap - Author: Sanket

    // Loop through the day in 'duration' increments
    while (iterations < MAX_ITERATIONS && (isBefore(addMinutes(currentSlot, duration), shiftEnd) || currentSlot.getTime() === shiftEnd.getTime())) {
      iterations++;
      const slotEnd = addMinutes(currentSlot, duration);

      // Check if slot is in the past (allow a buffer, e.g. 30 min from now)
      if (isBefore(currentSlot, addMinutes(new Date(), 30))) { 
         currentSlot = slotEnd; 
         continue;
      }

      // Check for overlap with existing sessions
      const isBlocked = existingSessions.some((session) => {
        const sessionStart = new Date(session.scheduledAt);
        const sessionEnd = addMinutes(sessionStart, session.duration);
        
        // Simple overlap check: 
        // (SlotStart < SessionEnd) && (SlotEnd > SessionStart)
        return isBefore(currentSlot, sessionEnd) && isAfter(slotEnd, sessionStart);
      });

      if (!isBlocked) {
        availableSlots.push({
          id: currentSlot.toISOString(), // Use ISO string as ID for simple selection
          time: format(currentSlot, "HH:mm"), // 24h format for display/value
          label: format(currentSlot, "h:mm a"), // AM/PM for UI
          timestamp: currentSlot.toISOString()
        });
      }

      // Increment
      currentSlot = slotEnd;
    }

    return NextResponse.json({ slots: availableSlots });

  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
