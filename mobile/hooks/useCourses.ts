import { useQuery } from "@tanstack/react-query";
import { courseService } from "../services/courseService";
import { ApiResponse, Course } from "../types";

/**
 * Domain Hook: Course Data
 * Sanket
 */
export function useCourses() {
  const enrolledQuery = useQuery<ApiResponse<Course[]>>({
    queryKey: ["enrolledCourses"],
    queryFn: () => courseService.getEnrolledCourses(),
  });

  const exploreQuery = useQuery<ApiResponse<Course[]>>({
    queryKey: ["allCourses"],
    queryFn: () => courseService.getAllCourses(),
  });

  return {
    // Enrolled Courses
    enrolledCourses: enrolledQuery.data?.data || [],
    enrolledLoading: enrolledQuery.isLoading,
    enrolledError: enrolledQuery.error,
    refetchEnrolled: enrolledQuery.refetch,

    // Explore Courses
    exploreCourses: exploreQuery.data?.data || [],
    exploreLoading: exploreQuery.isLoading,
    exploreError: exploreQuery.error,
    refetchExplore: exploreQuery.refetch,
  };
}

export function useCourseDetails(slug: string) {
  return useQuery<ApiResponse<Course>>({
    queryKey: ["course", slug],
    queryFn: () => courseService.getCourseDetails(slug),
    enabled: !!slug,
  });
}
