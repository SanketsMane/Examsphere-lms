import { useQuery } from "@tanstack/react-query";
import { dashboardService, DashboardResponse } from "../services/dashboardService";
import { ApiResponse } from "../types";

export function useDashboardData() {
  return useQuery<ApiResponse<DashboardResponse>>({
    queryKey: ["studentDashboard"],
    queryFn: () => dashboardService.getDashboardData(),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}
