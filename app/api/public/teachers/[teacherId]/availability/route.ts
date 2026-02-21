
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, parseISO, format, addMinutes, isBefore, isAfter } from "date-fns";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // ISO or YYYY-MM-DD
  timezone: z.string().optional().default("UTC"),
  duration: z.coerce.number().optional().default(60), // Slot duration in minutes
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
      timezone: searchParams.get("timezone"),
      duration: searchParams.get("duration"),
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

    if (!availability) {
      return NextResponse.json({ slots: [] });
    }

    // 2. Fetch Existing Sessions (Bookings) for this day to exclude
    const existingSessions = await prisma.liveSession.findMany({
      where: {
        teacherId,
        status: {
            notIn: ["cancelled", "completed"] // Filter out cancelled/completed if needed, but usually 'scheduled' blocks time. 
            // Actually 'completed' blocks time too for the past. 
            // 'cancelled' might free up time.
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

    let currentSlot = new Date(targetDate);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const shiftEnd = new Date(targetDate);
    shiftEnd.setHours(endHour, endMinute, 0, 0);

    const availableSlots = [];

    // Loop through the day in 'duration' increments
    while (isBefore(addMinutes(currentSlot, duration), shiftEnd) || currentSlot.getTime() === shiftEnd.getTime()) {
      const slotEnd = addMinutes(currentSlot, duration);

      // Check if slot is in the past (allow a buffer, e.g. 1 hour from now)
      if (isBefore(currentSlot, addMinutes(new Date(), 30))) { // 30 min buffer
         currentSlot = addMinutes(currentSlot, 30); // Move by 30 mins or duration? Usually fixed slots.
         // Let's increment by duration (e.g. 60 mins)
         // But if availability is 9-5, we usually want 9:00, 10:00, etc.
         // If we skip, we skip to next slot.
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
      // If we want fixed intervals (e.g. every hour), increment by duration.
      // If we want flexible, we might increment by 30 mins. 
      // Let's assume hourly slots for now or matched to duration.
      currentSlot = slotEnd;
    }

    return NextResponse.json({ slots: availableSlots });

  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
