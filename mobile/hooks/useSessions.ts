import { useQuery } from "@tanstack/react-query";
import { studentService } from "../services/studentService";
import { ApiResponse } from "../types";

/**
 * Domain Hook: Session Data
 * Sanket
 */
export function useSessions() {
  const sessionsQuery = useQuery<ApiResponse<any[]>>({
    queryKey: ["studentSessions"],
    queryFn: () => (studentService as any).getSessions(),
  });

  return {
    sessions: sessionsQuery.data?.data || [],
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.error,
    refetchSessions: sessionsQuery.refetch,
  };
}
