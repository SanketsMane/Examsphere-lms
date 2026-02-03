import { notFound } from "next/navigation";
import AgoraVideoCall from "@/components/video/AgoraVideoCall";
import { getMeetingRoom } from "@/app/actions/video-call";

interface VideoCallPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function VideoCallPage({ params }: VideoCallPageProps) {
  try {
    const { sessionId } = await params;
    // Verify the session exists and user has access
    await getMeetingRoom(sessionId);

    return (
      <div className="h-screen w-screen bg-gray-900">
        <AgoraVideoCall
          sessionId={sessionId}
        />
      </div>
    );
  } catch (error) {
    console.error("Video call access error:", error);
    notFound();
  }
}