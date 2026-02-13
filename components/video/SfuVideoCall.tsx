"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, PhoneOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SfuVideoCallProps {
  sessionId: string;
  onCallEnd?: () => void;
}

/**
 * SfuVideoCall Component - Created by Sanket
 * 
 * This component replaces AgoraVideoCall by embedding the custom tawktoosfu 
 * room in a secure iframe. It handles token generation via backend actions.
 */
export default function SfuVideoCall({ sessionId, onCallEnd }: SfuVideoCallProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meetingRoom, setMeetingRoom] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sfuUrl, setSfuUrl] = useState<string | null>(null);
  
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  // Load basic session info first
  useEffect(() => {
    const loadMeetingRoom = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/video-call?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setMeetingRoom(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load session details");
      } finally {
        setLoading(false);
      }
    };

    loadMeetingRoom();
  }, [sessionId]);

  // Request secure SFU URL from backend
  const handleJoinCall = async () => {
    if (!meetingRoom) return;
    try {
      setLoading(true);
      const uid = meetingRoom.isTeacher ? "teacher" : "student";
      const res = await fetch("/api/video-call", {
        method: "POST",
        body: JSON.stringify({ 
          action: "generateSfuUrl", 
          sessionId, 
          uid 
        }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Append initial media state to search params
      const url = new URL(data.url);
      url.searchParams.set("audio", isAudioOn ? "1" : "0");
      url.searchParams.set("video", isVideoOn ? "1" : "0");
      
      setSfuUrl(url.toString());
      setIsConnected(true);

      // Notify backend that session is in progress
      await fetch("/api/video-call", {
        method: "PATCH",
        body: JSON.stringify({ 
          sessionId, 
          status: "in_progress",
          meetingRoomId: meetingRoom.roomId,
          meetingProvider: "sfu"
        }),
      });

    } catch (err: any) {
      toast.error(err.message || "Could not connect to video server");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isConnected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
        <p className="text-gray-400 font-medium">Initializing secure video bridge...</p>
      </div>
    );
  }

  if (!meetingRoom) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
        <Card className="p-6 bg-gray-900 border-gray-800 text-center">
            <p className="text-red-400 mb-4">Session could not be verified.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  // Pre-join Lobby
  if (!isConnected) {
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center p-4">
         <Card className="w-full max-w-lg bg-gray-900 border-gray-800 shadow-2xl">
           <div className="p-8 space-y-8 text-center">
             <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                <ShieldCheck className="h-8 w-8 text-blue-500" />
             </div>
             
             <div className="space-y-2">
               <h1 className="text-2xl font-bold">{meetingRoom.sessionTitle}</h1>
               <p className="text-gray-400 text-sm italic">Secure SFU Provider: tawktoo.com</p>
             </div>
             
             <div className="flex justify-center gap-6 py-4">
                <Button 
                   size="icon" 
                   variant={isVideoOn ? "secondary" : "destructive"} 
                   className="h-16 w-16 rounded-full transition-all hover:scale-105"
                   onClick={() => setIsVideoOn(!isVideoOn)}
                >
                   {isVideoOn ? <Video className="h-8 w-8" /> : <VideoOff className="h-8 w-8" />}
                </Button>
                <Button 
                   size="icon" 
                   variant={isAudioOn ? "secondary" : "destructive"}
                   className="h-16 w-16 rounded-full transition-all hover:scale-105"
                   onClick={() => setIsAudioOn(!isAudioOn)}
                >
                   {isAudioOn ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
                </Button>
             </div>

             <div className="space-y-4">
                <Button 
                    size="lg" 
                    className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-500 text-white font-bold" 
                    onClick={handleJoinCall} 
                    disabled={loading}
                >
                    {loading ? "Preparing..." : "Join Secure Room"}
                </Button>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                    Authorized for {meetingRoom.isTeacher ? "Teacher" : "Student"} Access Only
                </p>
             </div>
           </div>
         </Card>
      </div>
    );
  }

  // Main Call Iframe
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <div className="flex-1 relative">
        <iframe 
          src={sfuUrl!} 
          className="absolute inset-0 w-full h-full border-0"
          allow="camera; microphone; display-capture; autoplay; encrypted-media; fullscreen"
          title="Video Call"
        />
      </div>
      <div className="h-16 bg-gray-950 border-t border-gray-800 flex items-center justify-between px-6">
         <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Live Session</span>
         </div>
         <Button 
            variant="destructive" 
            size="sm" 
            className="rounded-full px-6 font-bold hover:bg-red-500 transition-colors"
            onClick={() => {
              if (onCallEnd) onCallEnd();
              router.push("/dashboard/sessions");
            }}
         >
            <PhoneOff className="mr-2 h-4 w-4" /> End Call
         </Button>
      </div>
    </div>
  );
}
