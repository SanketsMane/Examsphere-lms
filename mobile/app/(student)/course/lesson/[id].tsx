import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  CheckCircle,
  Menu,
  FileText
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { useLesson } from "../../../../hooks/useLesson";
import { toast } from "sonner-native";
import { offlineService } from "../../../../services/offlineService";

// Helper component for Video because useVideoPlayer is a hook
const VideoPlayer = ({ uri, className }: { uri: string, className?: string }) => {
  const player = useVideoPlayer(uri, player => {
    player.play();
  });

  return (
    <VideoView 
      player={player} 
      style={{ width: "100%", height: "100%" }} 
      contentFit="contain"
      allowsFullscreen 
      allowsPictureInPicture
    />
  );
};

export default function LessonPlayer() {
  const { id: lessonId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { lesson, loading: isLoading, error, updateProgress, isUpdatingProgress } = useLesson(lessonId as string);

  const isCompleted = lesson?.lessonProgress?.[0]?.completed || false;

  const [isOffline, setIsOffline] = useState(false);
  const [localVideoUri, setLocalVideoUri] = useState<string | null>(null);

  useEffect(() => {
    const checkOffline = async () => {
      if (lesson?.id) {
        const downloaded = await offlineService.isVideoDownloaded(lesson.id);
        setIsOffline(downloaded);
        if (downloaded) {
          setLocalVideoUri(offlineService.getVideoUri(lesson.id));
        }
      }
    };
    checkOffline();
  }, [lesson?.id]);

  const handleDownloadVideo = async () => {
    if (!lesson?.videoUrl && !lesson?.videoKey) return;
    toast.info("Downloading video...");
    
    // In real app, videoUrl might be signed or need specific handling
    const url = lesson.videoKey || lesson.videoUrl;
    const res = await offlineService.downloadVideo(url, lesson.id);
    
    if (res.status === "success" && res.data) {
      toast.success("Video downloaded for offline viewing!");
      setIsOffline(true);
      setLocalVideoUri(res.data);
    } else {
      toast.error("Failed to download video.");
    }
  };

  const deleteOfflineVideo = async () => {
    if (!lesson?.id) return;
    await offlineService.deleteOfflineContent(`video_${lesson.id}.mp4`);
    setIsOffline(false);
    setLocalVideoUri(null);
    toast.success("Removed from downloads");
  };

  const toggleCompletion = () => {
    updateProgress({
      slug: lesson.Chapter.Course.slug,
      chapterId: lesson.Chapter.id,
      lessonId: lesson.id,
      isCompleted: !isCompleted
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4D9FFF" />
      </View>
    );
  }

  if (!lesson || error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-muted-foreground text-center">Lesson not found.</Text>
        <TouchableOpacity 
          className="mt-4 bg-primary px-6 py-2 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Navbar */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-background-foreground font-bold text-lg flex-1 text-center truncate px-4">
          Lesson Player
        </Text>
        <TouchableOpacity className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center">
          <Menu size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Video Player Placeholder */}
        {/* Video Player */}
        <View className="w-full aspect-video bg-black items-center justify-center">
           {localVideoUri || lesson.videoKey || lesson.videoUrl ? (
              <VideoPlayer 
                uri={localVideoUri || lesson.videoKey || lesson.videoUrl} 
                className="w-full h-full"
              />
           ) : (
             <View className="items-center">
                <FileText size={48} color="#94a3b8" />
                <Text className="text-muted-foreground mt-4">No video available for this lesson</Text>
             </View>
           )}
        </View>

        <View className="p-6">
          <View className="flex-row items-center justify-between mb-4">
             <View className="flex-row space-x-2">
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-primary text-[10px] font-bold uppercase tracking-widest">
                    {lesson.Chapter.Course.title.substring(0, 15)}...
                  </Text>
                </View>
                {/* Download Button */}
                {(lesson.videoKey || lesson.videoUrl) && (
                  <TouchableOpacity 
                    onPress={isOffline ? deleteOfflineVideo : handleDownloadVideo}
                    className={`px-3 py-1 rounded-full flex-row items-center space-x-1 ${isOffline ? 'bg-emerald-500/20' : 'bg-muted'}`}
                  >
                     {isOffline ? (
                       <>
                        <CheckCircle size={10} color="#10B981" />
                        <Text className="text-[10px] font-bold text-emerald-500">Saved</Text>
                       </>
                     ) : (
                       <Text className="text-[10px] font-bold text-muted-foreground">Download</Text>
                     )}
                  </TouchableOpacity>
                )}
             </View>

             <TouchableOpacity 
               disabled={isUpdatingProgress}
               className={`flex-row items-center space-x-2 px-4 py-1.5 rounded-full ${isCompleted ? 'bg-emerald-500/20' : 'bg-muted'}`}
               onPress={toggleCompletion}
             >
                {isUpdatingProgress ? (
                  <ActivityIndicator size="small" color="#4D9FFF" />
                ) : (
                  <>
                    <CheckCircle size={14} color={isCompleted ? "#10B981" : "#94a3b8"} />
                    <Text className={`text-xs font-bold ${isCompleted ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {isCompleted ? "Completed" : "Mark as Done"}
                    </Text>
                  </>
                )}
             </TouchableOpacity>
          </View>

          <Text className="text-background-foreground text-2xl font-bold mb-4">
             {lesson.title}
          </Text>

          <View className="border-t border-border pt-6 mt-2">
            <Text className="text-background-foreground text-lg font-bold mb-3">Lesson Description</Text>
            <Text className="text-muted-foreground leading-6 mb-4">
              {lesson.description || "No description available for this lesson."}
            </Text>
          </View>

          {/* Resources Placeholder */}
          <View className="bg-card border border-border p-5 rounded-3xl mt-8">
            <Text className="text-background-foreground font-bold mb-4">Lesson Resources</Text>
            <Text className="text-muted-foreground text-sm italic">No resources attached to this lesson.</Text>
          </View>
        </View>
        <View className="h-20" />
      </ScrollView>

      {/* Navigation Controls */}
      <View className="bg-card border-t border-border flex-row items-center justify-between px-6 py-5">
        <TouchableOpacity 
          className="flex-row items-center py-2"
          onPress={() => router.back()}
        >
           <ChevronLeft size={20} color="#94a3b8" />
           <Text className="text-muted-foreground font-bold ml-2">Back to Course</Text>
        </TouchableOpacity>
        
        {lesson?.nextLessonId ? (
          <TouchableOpacity 
            className="flex-row items-center bg-primary px-6 py-3 rounded-2xl shadow-lg shadow-primary/30"
            activeOpacity={0.8}
            onPress={() => router.push(`/(student)/course/lesson/${lesson.nextLessonId}`)}
          >
             <Text className="text-white font-bold mr-2">Next Lesson</Text>
             <ChevronRight size={18} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            className="flex-row items-center bg-emerald-500 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/30"
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
             <Text className="text-white font-bold mr-2">Finish Course</Text>
             <CheckCircle size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
