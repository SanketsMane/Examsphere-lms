"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Settings,
  MessageCircle,
  Users,
  Circle,
  StopCircle,
  Grid3x3,
  Crown,
  Shield,
  PenTool,
} from "lucide-react";

import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
} from "agora-rtc-react";

import AgoraRTM from "agora-rtm-sdk";
import { formatDistanceToNow } from "date-fns";
import { CollaborativeWhiteboard } from "@/components/whiteboard/CollaborativeWhiteboard";
import { startRecording, stopRecording } from "@/lib/video/recording-service";

const agoraClient = typeof window !== 'undefined' ? AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }) : null;

interface AgoraVideoCallProps {
  sessionId: string;
  onCallEnd?: () => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  senderName: string;
  timestamp: number;
}

interface VideoParticipant {
  uid: string;
  name: string;
  image?: string;
  role: string;
}

export default function AgoraVideoCall(props: AgoraVideoCallProps) {
  if (!agoraClient) return null;

  return (
    <AgoraRTCProvider client={agoraClient}>
      <VideoCallContent {...props} />
    </AgoraRTCProvider>
  );
}

function VideoCallContent({ sessionId, onCallEnd }: AgoraVideoCallProps) {
  const router = useRouter();
  // --- STATE ---
  const [meetingRoom, setMeetingRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [shouldJoin, setShouldJoin] = useState(false);
  
  // Agora Config
  const [rtcConfig, setRtcConfig] = useState<{ appId: string; channel: string; token: string; uid: string } | null>(null);
  const [rtmClient, setRtmClient] = useState<any>(null);
  const [rtmChannel, setRtmChannel] = useState<any>(null);

  // Recording State
  const [recordingMetadata, setRecordingMetadata] = useState<{ resourceId: string; sid: string } | null>(null);

  // Device State
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  
  // Media Controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // UI State
  const [layout, setLayout] = useState<'grid' | 'speaker'>('grid');
  const [showChat, setShowChat] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // --- AGORA HOOKS ---
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(!loading && isConnected, { microphoneId: selectedMicrophone });
  const { localCameraTrack } = useLocalCameraTrack(!loading && isConnected, { cameraId: selectedCamera });
  // Used for screen sharing track
  const [screenTrack, setScreenTrack] = useState<any>(null);

  const remoteUsers = useRemoteUsers();

  // Ensure tracks respect state
  useEffect(() => {
    if (localCameraTrack) localCameraTrack.setEnabled(isVideoOn);
  }, [isVideoOn, localCameraTrack]);

  useEffect(() => {
    if (localMicrophoneTrack) localMicrophoneTrack.setEnabled(isAudioOn);
  }, [isAudioOn, localMicrophoneTrack]);

  // Join Hook
  useJoin({
    appid: rtcConfig?.appId || "",
    channel: rtcConfig?.channel || "",
    token: rtcConfig?.token || null,
    uid: rtcConfig?.uid || null,
  }, shouldJoin && !!rtcConfig);

  // Publish Hook - Don't publish screenTrack here automatically as we control it manually or substitute logic needed?
  // Actually, usePublish accepts tracks.
  const tracksToPublish = [localMicrophoneTrack, localCameraTrack, screenTrack].filter(Boolean);
  usePublish(tracksToPublish);


  // --- INITIALIZATION ---
  useEffect(() => {
    loadMeetingRoom();
    enumerateDevices();
    return () => {
      leaveRtm();
    };
  }, [sessionId]);

  const enumerateDevices = async () => {
    try {
      const devices = await AgoraRTC.getDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));
      setMicrophones(devices.filter(d => d.kind === 'audioinput'));
      
      const cam = devices.find(d => d.kind === 'videoinput');
      if (cam) setSelectedCamera(cam.deviceId);
      
      const mic = devices.find(d => d.kind === 'audioinput');
      if (mic) setSelectedMicrophone(mic.deviceId);
    } catch (e) {
      console.error("Error enumerating devices", e);
    }
  };

  const loadMeetingRoom = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/video-call?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMeetingRoom(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- JOIN LOGIC ---
  const handleJoinCall = async () => {
    if (!meetingRoom) return;
    try {
      // 1. Get RTC Token
      const uid = meetingRoom.isTeacher ? "teacher" : "student";
      const tokenRes = await fetch("/api/video-call", {
        method: "POST",
        body: JSON.stringify({ action: "generateToken", channelName: meetingRoom.roomId, uid }),
        headers: { "Content-Type": "application/json" }
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error);
      
      setRtcConfig({
        appId: tokenData.token.appId,
        channel: tokenData.token.channelName,
        token: tokenData.token.token,
        uid: uid
      });

      // 2. Initialize RTM
      await initRtm(uid, meetingRoom.roomId);

      // 3. Start Call
      setIsConnected(true);
      setShouldJoin(true);
      
      // Update Status
      await fetch("/api/video-call", {
        method: "PATCH",
        body: JSON.stringify({ 
          sessionId, 
          status: "in_progress",
          meetingRoomId: meetingRoom.roomId,
          meetingProvider: "agora"
        }),
      });

      // 4. Start Recording (Teachers only)
      if (meetingRoom.isTeacher) {
        const recording = await startRecording(sessionId, meetingRoom.roomId);
        if (recording.success && recording.resourceId && recording.sid) {
          setRecordingMetadata({ resourceId: recording.resourceId, sid: recording.sid });
          toast.success("Session recording started");
        } else {
          console.error("Recording failed to start", recording.error);
        }
      }

    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to join call");
    }
  };

  // --- SCREEN SHARE ---
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop
      if (screenTrack) {
        screenTrack.close();
        setScreenTrack(null);
      }
      setIsScreenSharing(false);
      // Re-enable camera if it was on? 
      // Actually Agora allows publishing both. But usually you want to replace camera or show alongside.
      // Current usePublish array includes both.
    } else {
      // Start
      try {
        const track = await AgoraRTC.createScreenVideoTrack({}, "auto");
        if (Array.isArray(track)) {
           setScreenTrack(track[0]);
           track[0].on("track-ended", () => {
              setScreenTrack(null);
              setIsScreenSharing(false);
           });
        } else {
           setScreenTrack(track);
           track.on("track-ended", () => {
              setScreenTrack(null);
              setIsScreenSharing(false);
           });
        }
        setIsScreenSharing(true);
        // Optionally disable camera to save bandwidth or avoid confusion
        // setIsVideoOn(false); 
      } catch (e) {
        console.error(e);
        toast.error("Failed to share screen");
      }
    }
  };


  // --- RTM CHAT ---
  const initRtm = async (uid: string, channelName: string) => {
    try {
      // Get RTM Token
      const res = await fetch("/api/video-call", {
        method: "POST",
        body: JSON.stringify({ action: "generateRtmToken", uid }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      const rtmToken = data.token.token;
      const appId = data.token.appId;

      // Initialize RTM (SDK v2)
      // @ts-ignore - Ignore type check for RTM constructor as types might be tricky with default import
      const client = new AgoraRTM.RTM(appId, uid);
      
      await client.login({ token: rtmToken });
      await client.subscribe(channelName);

      client.addEventListener('message', (event: any) => {
         // event.message is the payload
         // event.publisher is the sender
         const msgText = event.message; 
         
         const newMsg: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            userId: event.publisher,
            text: typeof msgText === 'string' ? msgText : JSON.stringify(msgText),
            senderName: event.publisher === "teacher" ? meetingRoom.teacherName : meetingRoom.studentName,
            timestamp: Date.now()
         };
         setMessages(prev => [...prev, newMsg]);
         if (!showChat) setUnreadCount(prev => prev + 1);
      });

      setRtmClient(client);
      setRtmChannel(channelName);
    } catch (e) {
      console.error("RTM Init Error", e);
      toast.error("Msg system failed to connect");
    }
  };

  const leaveRtm = async () => {
    if (rtmClient) {
        try {
            if (rtmChannel) await rtmClient.unsubscribe(rtmChannel);
            await rtmClient.logout();
        } catch (e) {
            console.error("Error leaving RTM", e);
        }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !rtmClient || !rtmChannel) return;
    
    try {
       await rtmClient.publish(rtmChannel, newMessage, { customType: "STRING" });
       
       // Add local message
       const uid = meetingRoom.isTeacher ? "teacher" : "student";
       const newMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          userId: uid,
          text: newMessage,
          senderName: "You",
          timestamp: Date.now()
       };
       setMessages(prev => [...prev, newMsg]);
       setNewMessage("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    }
  };

  // --- RENDER ---
  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950 text-white">Loading session...</div>;
  if (!meetingRoom) return <div className="h-screen flex items-center justify-center bg-gray-950 text-white">Session not found</div>;

  const currentRole = meetingRoom.isTeacher ? "Teacher" : "Student";
  const otherName = meetingRoom.isTeacher ? meetingRoom.studentName : meetingRoom.teacherName;

  if (!isConnected) {
    // PRE-JOIN SCREEN
    return (
      <div className="h-screen bg-gray-950 text-white flex items-center justify-center p-4">
         <Card className="w-full max-w-xl bg-gray-900 border-gray-800">
           <div className="p-8 space-y-8 text-center">
             <div>
               <h1 className="text-2xl font-bold">{meetingRoom.sessionTitle}</h1>
               <p className="text-gray-400">with {otherName}</p>
             </div>
             
             <div className="flex justify-center gap-6">
                <Button 
                   size="icon" 
                   variant={isVideoOn ? "secondary" : "destructive"} 
                   className="h-16 w-16 rounded-full"
                   onClick={() => setIsVideoOn(!isVideoOn)}
                >
                   {isVideoOn ? <Video className="h-8 w-8" /> : <VideoOff className="h-8 w-8" />}
                </Button>
                <Button 
                   size="icon" 
                   variant={isAudioOn ? "secondary" : "destructive"}
                   className="h-16 w-16 rounded-full"
                   onClick={() => setIsAudioOn(!isAudioOn)}
                >
                   {isAudioOn ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
                </Button>
             </div>

             <Button size="lg" className="w-full text-lg h-14" onClick={handleJoinCall}>
               Join Session
             </Button>
           </div>
         </Card>
      </div>
    );
  }

  // IN-CALL SCREEN
  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden text-white">
      {/* HEADER */}
      <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-10">
         <div className="flex items-center gap-4">
           <h2 className="font-semibold truncate max-w-[200px]">{meetingRoom.sessionTitle}</h2>
           <Badge variant="outline" className="text-green-400 border-green-400">Live</Badge>
         </div>
         <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={layout === 'grid' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    onClick={() => {
                      const newLayout = layout === 'grid' ? 'speaker' : 'grid';
                      setLayout(newLayout);
                      toast.info(`Switched to ${newLayout} view`);
                    }}
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{layout === 'grid' ? 'Switch to Speaker View' : 'Switch to Gallery View'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
         </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* VIDEO GRID */}
        <div className={`flex-1 p-4 grid gap-4 overflow-y-auto ${
           showWhiteboard ? 'hidden' : 
           (layout === 'grid' ? 
           (remoteUsers.length === 0 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2') : 
           'grid-cols-1') 
        }`}>
           {/* LOCAL USER */}
           <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[300px]">
              {isVideoOn ? (
                 <LocalVideoTrack track={localCameraTrack} play className="w-full h-full object-cover" />
              ) : (
                 <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="h-20 w-20">
                       <AvatarFallback>{currentRole[0]}</AvatarFallback>
                    </Avatar>
                 </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs backdrop-blur-sm">
                 You {isScreenSharing && "(Sharing Screen)"}
              </div>
           </div>

           {/* REMOTE USERS */}
           {remoteUsers.map(user => (
              <div key={user.uid} className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-800 min-h-[300px]">
                 <RemoteUser user={user} className="w-full h-full object-cover" />
                 <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs backdrop-blur-sm">
                    {user.uid === 'teacher' ? 'Teacher' : user.uid === 'student' ? 'Student' : user.uid}
                 </div>
              </div>
           ))}
           
           {/* SCREEN SHARE PREVIEW (If Local) is handled by publishing a track, but Agora LocalVideoTrack only handles camera track usually? 
               Wait, LocalVideoTrack accepts any ILocalVideoTrack. screenTrack is ILocalVideoTrack. 
               We should display it locally too so we know what we are sharing.
           */}
           {isScreenSharing && screenTrack && (
              <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-indigo-900 min-h-[300px]">
                 <LocalVideoTrack track={screenTrack} play className="w-full h-full object-fit" />
                 <div className="absolute bottom-2 left-2 bg-indigo-600 px-2 py-1 rounded text-xs">
                    Your Screen
                 </div>
              </div>
           )}
        </div>



        {/* WHITEBOARD */}
        {showWhiteboard && (
           <div className="flex-1 bg-white relative">
              <CollaborativeWhiteboard 
                 whiteboardId={sessionId} 
                 width={window.innerWidth - (showChat ? 320 : 0)} 
                 height={window.innerHeight - 64 - 80} // header - footer
              />
           </div>
        )}

        {/* CHAT SIDEBAR */}
        {showChat && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
             <div className="p-4 border-b border-gray-800 font-semibold">Chat</div>
             <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.senderName === 'You' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                           msg.senderName === 'You' ? 'bg-blue-600' : 'bg-gray-800'
                        }`}>
                           <p className="font-bold text-xs mb-1 opacity-70">{msg.senderName}</p>
                           {msg.text}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">
                           {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                        </span>
                     </div>
                  ))}
                </div>
             </ScrollArea>
             <div className="p-4 border-t border-gray-800">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                   <Input 
                      value={newMessage} 
                      onChange={e => setNewMessage(e.target.value)} 
                      placeholder="Type a message..."
                      className="bg-gray-800 border-gray-700" 
                   />
                   <Button type="submit" size="sm">Send</Button>
                </form>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <footer className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-4">
         <Button 
            variant={isAudioOn ? "secondary" : "destructive"} 
            size="icon" 
            className="rounded-full h-12 w-12"
            onClick={() => setIsAudioOn(!isAudioOn)}
         >
            {isAudioOn ? <Mic /> : <MicOff />}
         </Button>

         <Button 
            variant={isVideoOn ? "secondary" : "destructive"} 
            size="icon" 
            className="rounded-full h-12 w-12"
            onClick={() => setIsVideoOn(!isVideoOn)}
         >
            {isVideoOn ? <Video /> : <VideoOff />}
         </Button>

         <Button 
            variant={isScreenSharing ? "default" : "secondary"} 
            size="icon" 
            className={`rounded-full h-12 w-12 ${isScreenSharing ? 'bg-indigo-600' : ''}`}
            onClick={toggleScreenShare}
         >
             {isScreenSharing ? <ScreenShareOff /> : <ScreenShare />}
         </Button>

          <Button
             variant={showWhiteboard ? "default" : "secondary"}
             size="icon"
             className={`rounded-full h-12 w-12 ${showWhiteboard ? 'bg-orange-600' : ''}`}
             onClick={() => setShowWhiteboard(!showWhiteboard)}
          >
             <PenTool className="h-5 w-5" />
          </Button>

          <Button
             variant={showChat ? "default" : "secondary"}
            size="icon"
            className="rounded-full h-12 w-12 relative"
            onClick={() => { setShowChat(!showChat); setUnreadCount(0); }}
         >
            <MessageCircle />
            {unreadCount > 0 && (
               <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full">{unreadCount}</Badge>
            )}
         </Button>

         <Button 
            variant="destructive" 
            size="lg" 
            className="rounded-full px-8"
             onClick={() => {
                if (onCallEnd) onCallEnd();
                // Redirect to dashboard sessions list
                router.push("/dashboard/sessions"); 
             }}
         >
            <PhoneOff className="mr-2 h-5 w-5" /> End
         </Button>
      </footer>
    </div>
  );
}
