import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";

// Generate a unique meeting room for a live session


// Get meeting room details for a session
export async function getMeetingRoom(sessionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      teacher: {
        include: { user: true }
      },
      student: true,
    },
  });

  if (!liveSession) {
    throw new Error("Session not found");
  }

  // Check if user is either the teacher or student
  const isTeacher = liveSession.teacher.userId === session.user.id;
  const isStudent = liveSession.studentId === session.user.id;

  if (!isTeacher && !isStudent) {
    throw new Error("Unauthorized to access this session");
  }

  return {
    sessionId: liveSession.id,
    roomId: `room_${sessionId}`,
    isTeacher,
    isStudent,
    teacherName: liveSession.teacher.user.name,
    studentName: liveSession.student?.name || "Student",
    sessionTitle: liveSession.title || "Live Session",
    scheduledTime: liveSession.scheduledAt,
    duration: liveSession.duration,
    status: liveSession.status,
  };
}

// Update session status when meeting starts/ends
export async function updateSessionStatus(
  sessionId: string, 
  status: "in_progress" | "completed",
  meetingRoomId?: string,
  meetingProvider?: string
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: { teacher: true },
  });

  if (!liveSession) {
    throw new Error("Session not found");
  }

  // Check if user is either the teacher or student
  const isTeacher = liveSession.teacher.userId === session.user.id;
  const isStudent = liveSession.studentId === session.user.id;

  if (!isTeacher && !isStudent) {
    throw new Error("Unauthorized to access this session");
  }

  const data: any = {
    status,
    ...(status === "in_progress" && { actualStartTime: new Date() }),
    ...(status === "completed" && { actualEndTime: new Date() }),
  };

  if (meetingRoomId) data.meetingRoomId = meetingRoomId;
  if (meetingProvider) data.meetingProvider = meetingProvider;

  await prisma.liveSession.update({
    where: { id: sessionId },
    data,
  });

  revalidatePath("/dashboard/sessions");
  return { success: true };
}


import { tawkTooClient } from "@/lib/video/tawktoo";

// Generate SFU (mediasoup) join URL
// Updated to use TawkToo API - Author: Sanket
export async function generateSfuJoinUrl(data: {
  room: string;
  name: string;
  isPresenter: boolean;
  audio?: boolean;
  video?: boolean;
  chat?: boolean;
}) {
  try {
    console.log("Initializing TawkToo meeting for room:", data.room);
    
    // Call the external API to create a meeting
    const meeting = await tawkTooClient.createMeeting({
      topic: data.room,
      duration: 60, // Default duration
      // We can pass other fields if the API supports them
    });

    console.log("TawkToo meeting created:", meeting);

    // Return the join URL from the API response
    return { url: meeting.meeting }; 

  } catch (err: any) {
    console.error("Failed to create TawkToo meeting:", err);
    
    // Fallback or re-throw
    // For now, re-throwing so the UI sees the error (likely 403 Forbidden)
    throw new Error("Video service authentication failed. Please check API credentials.");
  }
}

// Generate Agora token (Deprecated - switching to SFU)
export async function generateAgoraToken(channelName: string, userId: string) {
  // ... (existing implementation)
}

// Generate Agora RTM token (Deprecated - switching to SFU)
export async function generateAgoraRtmToken(userId: string) {
  // ... (existing implementation)
}

// Get available video conferencing providers
export async function getVideoProviders() {
  return [
    {
      id: "sfu",
      name: "Tawktoo SFU",
      description: "High-performance mediasoup video conferencing",
      available: true,
      features: ["HD Video", "Low Latency", "Screen Share", "Recording", "Chat"],
      isDefault: true
    },
    {
      id: "agora",
      name: "Agora (Legacy)",
      description: "Fallback video communication",
      available: true,
      features: ["HD Video", "Screen Share", "Recording", "Chat"],
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Professional video meetings",
      available: false,
      features: ["HD Video", "Screen Share", "Recording", "Breakout Rooms"],
    }
  ];
}