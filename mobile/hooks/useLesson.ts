import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseService } from "../services/courseService";
import { ApiResponse } from "../types";
import { toast } from "sonner-native";

/**
 * Domain Hook: Lesson Data & Progress
 * Sanket
 */
export function useLesson(lessonId: string) {
  const queryClient = useQueryClient();

  const lessonQuery = useQuery<ApiResponse<any>>({
    queryKey: ["lesson", lessonId],
    queryFn: () => courseService.getLessonDetails(lessonId),
    enabled: !!lessonId,
  });

  const progressMutation = useMutation({
    mutationFn: ({ slug, chapterId, lessonId, isCompleted }: { 
      slug: string, 
      chapterId: string, 
      lessonId: string, 
      isCompleted: boolean 
    }) => courseService.updateLessonProgress(slug, chapterId, lessonId, isCompleted),
    onSuccess: (response, variables) => {
      if (response.status === "success") {
        queryClient.invalidateQueries({ queryKey: ["lesson", variables.lessonId] });
        queryClient.invalidateQueries({ queryKey: ["course", variables.slug] });
        toast.success(variables.isCompleted ? "Lesson completed!" : "Marked as incomplete");
      } else {
        toast.error(response.message || "Failed to update progress");
      }
    },
    onError: () => {
      toast.error("Network error: Failed to update progress");
    }
  });

  return {
    lesson: lessonQuery.data?.data,
    loading: lessonQuery.isLoading,
    error: lessonQuery.error,
    refetch: lessonQuery.refetch,
    updateProgress: progressMutation.mutate,
    isUpdatingProgress: progressMutation.isPending,
  };
}
