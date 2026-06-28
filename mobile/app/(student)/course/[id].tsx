import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Share,
  Image,
  TextInput,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, 
  Share2, 
  PlayCircle, 
  Lock, 
  Timer, 
  Star,
  Users,
  CheckCircle2,
  FileText,
  Download,
  Heart,
  MessageSquare,
  Send
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useCourseDetails } from "../../../hooks/useCourses";
import { engagementService } from "../../../services/engagementService";
import { StarRating } from "../../../components/StarRating";
import { toast } from "sonner-native";
import * as Sharing from "expo-sharing";
import { offlineService } from "../../../services/offlineService";

export default function CourseDetails() {
  const { id: slug } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [showReviewInput, setShowReviewInput] = useState(false);

  const { data: courseResponse, isLoading, error } = useCourseDetails(slug as string);

  const course = courseResponse?.data;

  // Fetch Wishlist Status
  useEffect(() => {
    if (course?.id) {
      engagementService.checkWishlist(course.id).then((res: any) => {
        if (res.status === "success" && res.data) {
          setIsInWishlist(res.data.isInWishlist);
        }
      });
    }
  }, [course?.id]);

  // Fetch Reviews
  const { data: reviewsResponse } = useQuery({
    queryKey: ["course-reviews", course?.id],
    queryFn: () => engagementService.getCourseReviews(course?.id as string),
    enabled: !!course?.id,
  });

  const reviews = reviewsResponse?.data || [];

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this course: ${course?.title}!`,
        url: "https://examsphere.lms",
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!course?.id) return;
    
    // Optimistic Update
    const previousState = isInWishlist;
    setIsInWishlist(!isInWishlist);

    const res = await engagementService.toggleWishlist(course.id);
    if (res.status !== "success") {
      setIsInWishlist(previousState); // Revert on failure
      toast.error("Failed to update wishlist.");
    } else {
        toast.success(isInWishlist ? "Added to wishlist" : "Removed from wishlist");
    }
  };

  const calculateDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return `${diffDays} days ago`;
  };

  const submitReviewMutation = useMutation({
    mutationFn: (data: { courseId: string, rating: number, comment: string }) => 
      engagementService.submitReview(data.courseId, data.rating, data.comment),
    onSuccess: (res) => {
      if (res.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["course-reviews", course?.id] });
        setReviewText("");
        setShowReviewInput(false);
        toast.success("Review submitted!");
      } else {
        toast.error(res.message || "Failed to submit review.");
      }
    }
  });

  const [downloadedResources, setDownloadedResources] = useState<Record<string, boolean>>({});

  // Check Download Status
  useEffect(() => {
    const checkDownloads = async () => {
      if (course?.resources) {
        const status: Record<string, boolean> = {};
        for (const res of course.resources) {
           const isDl = await offlineService.isResourceDownloaded(res.id, res.fileUrl);
           status[res.id] = isDl;
        }
        setDownloadedResources(status);
      }
    };
    checkDownloads();
  }, [course]);

  const handleDownloadResource = async (resource: any) => {
      toast.info("Starting download...");
      const res = await offlineService.downloadResource(resource.fileUrl, resource.id, resource.fileUrl);
      if (res.status === "success") {
          toast.success("Download complete");
          setDownloadedResources(prev => ({...prev, [resource.id]: true}));
      } else {
          toast.error("Download failed");
      }
  };

  const handleOpenResource = async (resource: any) => {
      const uri = offlineService.getResourceUri(resource.id, resource.fileUrl);
      if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
      } else {
          toast.error("Sharing not available");
      }
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
       toast.error("Please enter a comment.");
       return;
    }
    if (course?.id) {
       submitReviewMutation.mutate({ courseId: course.id, rating, comment: reviewText });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4D9FFF" />
      </View>
    );
  }

  if (!course || error) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-muted-foreground text-center">Course not found or an error occurred.</Text>
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
        <Text className="text-background-foreground font-bold text-lg">Course Details</Text>
        <View className="flex-row">
            <TouchableOpacity 
            onPress={handleToggleWishlist}
            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center mr-3"
            >
            <Heart size={18} color={isInWishlist ? "#ef4444" : "#94a3b8"} fill={isInWishlist ? "#ef4444" : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity 
            onPress={handleShare}
            className="w-10 h-10 bg-card border border-border rounded-xl items-center justify-center"
            >
            <Share2 size={18} color="#94a3b8" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Course Intro */}
        <View className="w-full h-56 bg-slate-800 rounded-3xl mb-6 items-center justify-center overflow-hidden border border-border">
          {course.fileKey ? (
            <Image 
              source={{ uri: course.fileKey }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <>
              <PlayCircle size={64} color="#4D9FFF" strokeWidth={1} />
              <Text className="text-slate-500 mt-4 font-medium italic">Course Preview</Text>
            </>
          )}
        </View>

        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="px-3 py-1 bg-primary/10 rounded-full">
              <Text className="text-primary text-[10px] font-bold uppercase tracking-wider">{course.category}</Text>
            </View>
            <View className="flex-row items-center">
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text className="text-background-foreground text-sm font-bold ml-1">{course.averageRating?.toFixed(1) || "New"}</Text>
              <Text className="text-muted-foreground text-xs ml-1">({course.totalReviews || 0})</Text>
            </View>
          </View>
          
          <Text className="text-background-foreground text-3xl font-bold mb-4">{course.title}</Text>
          
          <View className="flex-row items-center space-x-6">
             <View className="flex-row items-center">
               <Timer size={16} color="#94a3b8" />
               <Text className="text-muted-foreground text-xs ml-2">{course.duration} mins</Text>
             </View>
             <View className="flex-row items-center ml-4">
               <Users size={16} color="#94a3b8" />
               <Text className="text-muted-foreground text-xs ml-2">{course.totalStudents || 0} Students</Text>
             </View>
          </View>
        </View>

        {/* Instructor */}
        <View className="flex-row items-center bg-card border border-border p-4 rounded-2xl mb-8">
          <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-4">
            <Text className="text-primary font-bold">{course.instructor?.name?.charAt(0) || "I"}</Text>
          </View>
          <View>
            <Text className="text-muted-foreground text-xs">Instructor</Text>
            <Text className="text-background-foreground font-bold">{course.instructor?.name || "Expert Instructor"}</Text>
          </View>
        </View>

        {/* Description */}
        <View className="mb-8">
          <Text className="text-background-foreground text-xl font-bold mb-3">Course Description</Text>
          <Text className="text-muted-foreground leading-6">
            {course.description || course.smallDescription}
          </Text>
        </View>

        {/* Resources Section - Already Added in Phase 7 */}
        {course.resources && course.resources.length > 0 && (
          <View className="mb-8">
            <Text className="text-background-foreground text-xl font-bold mb-4">Course Resources</Text>
            <View className="space-y-4">
              {course.resources.map((resource: any) => {
                const isDownloaded = downloadedResources[resource.id];
                return (
                <TouchableOpacity 
                  key={resource.id}
                  activeOpacity={0.7}
                  onPress={() => isDownloaded ? handleOpenResource(resource) : handleDownloadResource(resource)}
                  className="bg-card border border-border p-5 rounded-3xl flex-row items-center"
                >
                  <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center mr-4">
                    <FileText size={24} color="#4D9FFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-background-foreground font-bold">{resource.title}</Text>
                    <Text className="text-muted-foreground text-xs mt-1">
                      {resource.fileType?.toUpperCase() || "PDF"} • {Math.round((resource.size || 0) / 1024)} KB
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => isDownloaded ? handleOpenResource(resource) : handleDownloadResource(resource)}
                    className={`w-10 h-10 rounded-xl items-center justify-center ${isDownloaded ? 'bg-emerald-500/10' : 'bg-muted'}`}
                  >
                    {isDownloaded ? (
                       <CheckCircle2 size={18} color="#10B981" />
                    ) : (
                       <Download size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              )})}
            </View>
          </View>
        )}

        {/* Progress Analytics (Enrolled Only) */}
        {course.progress !== undefined && (
          <View className="mb-8 bg-card border border-border p-5 rounded-3xl">
            <Text className="text-background-foreground text-xl font-bold mb-4">Your Progress</Text>
            
            {/* Overall Progress */}
            <View className="mb-6">
               <View className="flex-row justify-between mb-2">
                 <Text className="text-muted-foreground font-medium">Overall Completion</Text>
                 <Text className="text-primary font-bold">{Math.round(course.progress)}%</Text>
               </View>
               <View className="h-2 bg-muted rounded-full overflow-hidden">
                 <View 
                   className="h-full bg-primary rounded-full" 
                   style={{ width: `${course.progress}%` }} 
                 />
               </View>
            </View>

            {/* Chapter Breakdown */}
            <View className="space-y-4">
               {course.chapters?.map((chapter: any) => {
                 const totalLessons = chapter.lessons.length;
                 const completedLessons = chapter.lessons.filter((l: any) => 
                    l.lessonProgress && l.lessonProgress.length > 0 && l.lessonProgress[0].completed
                 ).length;
                 const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

                 return (
                   <View key={chapter.id}>
                     <View className="flex-row justify-between mb-1">
                       <Text className="text-background-foreground text-sm font-semibold">{chapter.title}</Text>
                       <Text className="text-muted-foreground text-xs">{completedLessons}/{totalLessons}</Text>
                     </View>
                     <View className="h-1.5 bg-muted rounded-full overflow-hidden">
                       <View 
                         className="h-full bg-green-500 rounded-full" 
                         style={{ width: `${progress}%` }} 
                       />
                     </View>
                   </View>
                 );
               })}
            </View>
          </View>
        )}

        {/* Curriculum */}
        <View className="mb-8">
          <Text className="text-background-foreground text-xl font-bold mb-4">Curriculum</Text>
          
          {course.chapters && course.chapters.length > 0 ? (
            course.chapters.map((chapter: any) => (
              <View key={chapter.id} className="mb-6">
                <Text className="text-primary text-sm font-bold mb-3">{chapter.title}</Text>
                <View className="space-y-3">
                  {chapter.lessons.map((lesson: any) => {
                    const isLessonCompleted = lesson.lessonProgress && lesson.lessonProgress.length > 0 && lesson.lessonProgress[0].completed;
                    return (
                      <TouchableOpacity 
                        key={lesson.id}
                        activeOpacity={0.7}
                        className="bg-card border border-border p-4 rounded-2xl flex-row items-center mb-2"
                        onPress={() => router.push(`/(student)/course/lesson/${lesson.id}`)}
                      >
                        <View className="w-8 h-8 bg-muted rounded-full items-center justify-center mr-4">
                          {isLessonCompleted ? (
                            <CheckCircle2 size={16} color="#10B981" />
                          ) : (
                            <PlayCircle size={16} color="#4D9FFF" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-background-foreground text-sm font-semibold">{lesson.title}</Text>
                          <Text className="text-muted-foreground text-xs">{lesson.duration || 10} mins</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          ) : (
            <Text className="text-muted-foreground italic">No curriculum details available yet.</Text>
          )}
        </View>

        {/* Reviews Section */}
        <View className="pb-32">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-background-foreground text-xl font-bold">Reviews ({reviews.length})</Text>
            {course.progress !== undefined && (
               <TouchableOpacity onPress={() => setShowReviewInput(!showReviewInput)}>
                  <Text className="text-primary font-bold text-sm">Write a Review</Text>
               </TouchableOpacity>
            )}
          </View>

          {showReviewInput && (
            <View className="bg-card border border-border p-4 rounded-2xl mb-6">
               <Text className="text-background-foreground font-bold mb-2">Rate this course</Text>
               <View className="flex-row mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)} className="mr-2">
                       <Star size={24} color="#fbbf24" fill={star <= rating ? "#fbbf24" : "transparent"} />
                    </TouchableOpacity>
                  ))}
               </View>
               <TextInput 
                  className="bg-muted p-3 rounded-xl text-background-foreground h-24 mb-3"
                  placeholder="Share your experience..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  value={reviewText}
                  onChangeText={setReviewText}
               />
               <TouchableOpacity 
                 onPress={handleSubmitReview}
                 disabled={submitReviewMutation.isPending}
                 className="bg-primary py-3 rounded-xl items-center flex-row justify-center"
               >
                 {submitReviewMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                 ) : (
                    <>
                      <Send size={16} color="white" className="mr-2" />
                      <Text className="text-white font-bold">Submit Review</Text>
                    </>
                 )}
               </TouchableOpacity>
            </View>
          )}

          {reviews.length > 0 ? (
            reviews.map((review: any) => (
              <View key={review.id} className="bg-card border border-border p-4 rounded-2xl mb-4">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-3">
                    <Text className="text-primary font-bold text-xs">{review.reviewer?.name?.charAt(0) || "U"}</Text>
                  </View>
                  <View>
                    <Text className="text-background-foreground font-bold text-sm">{review.reviewer?.name || "Student"}</Text>
                    <View className="flex-row items-center">
                       <StarRating rating={review.rating} size={12} />
                       <Text className="text-muted-foreground text-[10px] ml-2">{calculateDaysAgo(review.createdAt)}</Text>
                    </View>
                  </View>
                </View>
                <Text className="text-muted-foreground text-sm leading-5">{review.comment}</Text>
              </View>
            ))
          ) : (
            <View className="items-center py-6 bg-muted/30 rounded-2xl">
              <MessageSquare size={32} color="#94a3b8" className="mb-2 opacity-50" />
              <Text className="text-muted-foreground font-medium">No reviews yet. Be the first!</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity 
          className="bg-primary w-full py-4 rounded-2xl items-center shadow-lg shadow-primary/40"
          activeOpacity={0.9}
        >
          <Text className="text-white text-lg font-bold">
            {course.progress !== undefined ? "Continue Learning" : `Enroll for ₹${course.price}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
