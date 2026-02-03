import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

// Generate Agora token
export async function generateAgoraToken(channelName: string, userId: string) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID; // Usually public ID is needed for client? No, server uses App ID + Cert.
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.warn("Agora credentials missing in .env");
    // Return mock for development if missing
    return {
      token: "mock-token",
      channelName,
      userId,
      appId: appId || "mock-app-id"
    };
  }

  // Dynamic import to avoid build issues if package missing/server-only
  const { RtcTokenBuilder, RtcRole } = await import('agora-access-token');

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channelName,
    userId,
    role,
    privilegeExpiredTs
  );

  return {
    token,
    channelName,
    userId,
    appId,
  };
}

// Generate Agora RTM token
export async function generateAgoraRtmToken(userId: string) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    console.warn("Agora credentials missing in .env");
    return {
      token: "mock-rtm-token",
      userId,
      appId: appId || "mock-app-id"
    };
  }

  // Dynamic import to avoid build issues
  const { RtmTokenBuilder, RtmRole } = await import('agora-access-token');

  const role = RtmRole.Rtm_User;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtmTokenBuilder.buildToken(
    appId,
    appCertificate,
    userId,
    role,
    privilegeExpiredTs
  );

  return {
    token,
    userId,
    appId,
  };
}

// Get available video conferencing providers
export async function getVideoProviders() {
  return [
    {
      id: "agora",
      name: "Agora",
      description: "Real-time video and voice communication",
      available: true,
      features: ["HD Video", "Screen Share", "Recording", "Chat"],
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Professional video meetings",
      available: false, // Would need Zoom SDK integration
      features: ["HD Video", "Screen Share", "Recording", "Breakout Rooms"],
    },
    {
      id: "webrtc",
      name: "WebRTC",
      description: "Browser-based video calling",
      available: true,
      features: ["Peer-to-peer", "No downloads", "Low latency"],
    },
  ];
}