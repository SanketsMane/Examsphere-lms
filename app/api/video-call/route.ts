import { NextRequest, NextResponse } from "next/server";
import {
  getMeetingRoom,
  generateAgoraToken,
  updateSessionStatus,
  generateAgoraRtmToken,
  generateSfuJoinUrl,
} from "@/app/actions/video-call";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Video call endpoints.
 *
 * SECURITY: the POST handler mints Agora RTC/RTM tokens and SFU join URLs.
 * getMeetingRoom() and updateSessionStatus() authenticate internally, but
 * generateAgoraToken(), generateAgoraRtmToken() and generateSfuJoinUrl() do
 * not — so POST previously issued a join credential for ANY channel or session
 * to an unauthenticated caller. Anyone could have joined a paid live class, or
 * disrupted one in progress. It only returned an empty token because Agora
 * credentials are not configured yet; it would have minted real ones the moment
 * they were.
 *
 * Every branch below now requires a signed-in user who is a participant of the
 * session, using the same teacher-or-student rule getMeetingRoom() already
 * enforces.
 */

async function requireSessionParticipant(sessionId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const liveSession = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      studentId: true,
      teacher: { select: { userId: true } },
    },
  });

  if (!liveSession) {
    return { error: "Session not found", status: 404 as const };
  }

  const isTeacher = liveSession.teacher?.userId === session.user.id;
  const isStudent = liveSession.studentId === session.user.id;

  if (!isTeacher && !isStudent) {
    return { error: "You do not have access to this session", status: 403 as const };
  }

  return { userId: session.user.id, isTeacher, isStudent };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // getMeetingRoom authenticates and authorizes internally.
    const meetingRoom = await getMeetingRoom(sessionId);
    return NextResponse.json(meetingRoom);
  } catch (error) {
    console.error("Error getting meeting room:", error);
    return NextResponse.json({ error: "Failed to get meeting room" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, channelName, uid } = await request.json();

    // Every action here hands back a credential for joining a call, so all of
    // them are gated on the caller actually being in that session.
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const access = await requireSessionParticipant(sessionId);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (action === "generateSfuUrl") {
      const sfuData = await generateSfuJoinUrl({
        sessionId,
        name: uid || "User",
        // Presenter rights are derived from the database, not from the client.
        // This was `uid === "teacher"`, so any caller could claim to be the
        // presenter simply by sending that string.
        isPresenter: access.isTeacher,
      });
      return NextResponse.json(sfuData);
    }

    if (action === "generateToken") {
      if (!channelName) {
        return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
      }
      const token = await generateAgoraToken(channelName, uid);
      return NextResponse.json({ token });
    }

    if (action === "generateRtmToken") {
      const token = await generateAgoraRtmToken(uid);
      return NextResponse.json({ token });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in video call API:", error);
    return NextResponse.json({ error: "Failed to process video call request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, status, meetingRoomId, meetingProvider } = await request.json();
    // updateSessionStatus authenticates and authorizes internally.
    await updateSessionStatus(sessionId, status, meetingRoomId, meetingProvider);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session status:", error);
    return NextResponse.json({ error: "Failed to update session status" }, { status: 500 });
  }
}
