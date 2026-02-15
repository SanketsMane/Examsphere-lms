import { useQuery } from "@tanstack/react-query";
import { examService } from "../services/examService";
import { ApiResponse, Exam } from "../types";

/**
 * Domain Hook: Exam Data
 * Sanket
 */
export function useExams() {
  const examsQuery = useQuery<ApiResponse<Exam[]>>({
    queryKey: ["exams"],
    queryFn: () => examService.getExams(),
  });

  return {
    exams: examsQuery.data?.data || [],
    upcomingExams: (examsQuery.data?.data || [])
      .filter(e => e.status === "upcoming")
      .slice(0, 3),
    loading: examsQuery.isLoading,
    error: examsQuery.error,
    refetch: examsQuery.refetch,
  };
}
