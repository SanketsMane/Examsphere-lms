import { NextRequest, NextResponse } from "next/server";
import { getMeetingRoom, generateAgoraToken, updateSessionStatus, generateAgoraRtmToken, generateSfuJoinUrl } from "@/app/actions/video-call";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const meetingRoom = await getMeetingRoom(sessionId);
    return NextResponse.json(meetingRoom);
  } catch (error) {
    console.error("Error getting meeting room:", error);
    return NextResponse.json(
      { error: "Failed to get meeting room" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, sessionId, channelName, uid } = await request.json();
    
    if (action === "generateSfuUrl") {
      if (!sessionId) {
        return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
      }
      const sfuData = await generateSfuJoinUrl({ 
        sessionId, 
        name: uid || "User",
        isPresenter: uid === "teacher" 
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
    return NextResponse.json(
      { error: "Failed to process video call request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, status, meetingRoomId, meetingProvider } = await request.json();
    await updateSessionStatus(sessionId, status, meetingRoomId, meetingProvider);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session status:", error);
    return NextResponse.json(
      { error: "Failed to update session status" },
      { status: 500 }
    );
  }
}