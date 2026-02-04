"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";

// Note: bookLiveSession function removed - use /api/sessions/[id]/checkout instead (Author: Sanket)

export async function getAvailableTimeSlots(
  teacherId: string,
  date: string
): Promise<ApiResponse> {
  try {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return {
        status: "error",
        message: "Teacher not found",
      };
    }

    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Get existing sessions for the day
    const existingSessions = await prisma.liveSession.findMany({
      where: {
        teacherId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["scheduled", "in_progress"]
        }
      },
    });

    // Generate available time slots (9 AM to 6 PM)
    const timeSlots = [];
    for (let hour = 9; hour <= 18; hour++) {
      const timeSlot = new Date(selectedDate);
      timeSlot.setHours(hour, 0, 0, 0);

      // Check if slot is available
      const isBooked = existingSessions.some(session => {
        const sessionEnd = new Date(session.scheduledAt.getTime() + session.duration * 60000);
        return timeSlot >= session.scheduledAt && timeSlot < sessionEnd;
      });

      if (!isBooked) {
        timeSlots.push({
          time: timeSlot.toISOString(),
          label: timeSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          available: true
        });
      }
    }

    return {
      status: "success",
      data: timeSlots,
    };
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return {
      status: "error",
      message: "Failed to fetch available time slots",
    };
  }
}

export async function getTeacherProfile(teacherId: string): Promise<ApiResponse> {
  try {
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 10,
        }
      }
    });

    if (!teacher) {
      return {
        status: "error",
        message: "Teacher not found",
      };
    }

    return {
      status: "success",
      data: teacher,
    };
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    return {
      status: "error",
      message: "Failed to fetch teacher profile",
    };
  }
}