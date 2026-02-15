import { useQuery } from "@tanstack/react-query";
import { studentService, StudentStats } from "../services/studentService";
import { ApiResponse } from "../types";

/**
 * Domain Hook: Student Data
 * Sanket
 */
export function useStudent() {
  const statsQuery = useQuery<ApiResponse<StudentStats>>({
    queryKey: ["studentStats"],
    queryFn: () => studentService.getDashboardStats(),
  });

  const certificatesQuery = useQuery<ApiResponse<any[]>>({
    queryKey: ["certificates"],
    queryFn: () => studentService.getCertificates(),
  });

  return {
    // Stats
    stats: statsQuery.data?.data || {
      enrolledCourses: 0,
      completedLessons: 0,
      upcomingExams: 0,
      upcomingSessions: 0,
      overallProgress: 0,
    } as StudentStats,
    statsLoading: statsQuery.isLoading,
    statsError: statsQuery.error,
    refetchStats: statsQuery.refetch,

    // Certificates
    certificates: certificatesQuery.data?.data || [],
    certificatesLoading: certificatesQuery.isLoading,
    certificatesError: certificatesQuery.error,
    refetchCertificates: certificatesQuery.refetch,
  };
}
