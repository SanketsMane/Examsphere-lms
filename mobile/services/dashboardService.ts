import { BaseService } from "./BaseService";
import { Course } from "../types";

export interface DashboardResponse {
  layout: any[];
  hero: {
    type: 'resume' | 'welcome';
    data: {
      courseId: string;
      courseTitle: string;
      lessonId: string;
      lessonTitle: string;
      progress: number;
      thumbnail?: string;
      slug: string;
      lastChapter?: string;
    } | null;
  };
  urgent: any[];
  stats: {
    streak: number;
    hoursLearned: number;
    completionRate: number;
  };
  recommendations: Course[];
}

export class DashboardService extends BaseService {
  static getDashboardData() {
    return this.get<DashboardResponse>("/api/student/dashboard");
  }
}

export const dashboardService = DashboardService;
