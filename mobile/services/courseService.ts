import { BaseService } from "./BaseService";
import { ApiResponse, Course } from "../types";
import { storage } from "../utils/storage";

/**
 * Real Course Service
 * Sanket
 */

export class CourseService extends BaseService {
  static async getEnrolledCourses(): Promise<ApiResponse<Course[]>> {
    try {
      const response = await this.get<any[]>("/api/student/courses");
      if (response.status === "error") {
        // Fallback to cache if error
        const cached = await storage.getCachedApi<Course[]>("enrolled_courses");
        if (cached) return { status: "success", data: cached };
        return response;
      }

      // Map enrollment structure to Course structure
      const courses = (response.data || []).map((item: any) => ({
        ...item.Course,
        chapters: item.Course.chapter,
        instructor: item.Course.user,
        enrolledAt: item.createdAt,
      }));
      
      await storage.cacheApi("enrolled_courses", courses, 1);
      return { status: "success", data: courses };
    } catch (error: any) {
      const cached = await storage.getCachedApi<Course[]>("enrolled_courses");
      if (cached) return { status: "success", data: cached };
      return { status: "error", message: error.message };
    }
  }

  static async getAllCourses(): Promise<ApiResponse<Course[]>> {
    try {
      const response = await this.get<any>("/api/public/courses");
      if (response.status === "error") {
        const cached = await storage.getCachedApi<Course[]>("all_courses");
        if (cached) return { status: "success", data: cached };
        return response;
      }

      const courses = (response.data.courses || []).map((item: any) => ({
        ...item,
        chapters: item.chapter,
        instructor: item.user,
      }));
      
      await storage.cacheApi("all_courses", courses, 6);
      return { status: "success", data: courses };
    } catch (error: any) {
      const cached = await storage.getCachedApi<Course[]>("all_courses");
      if (cached) return { status: "success", data: cached };
      return { status: "error", message: error.message };
    }
  }

  static getCourseDetails(slug: string) {
    return this.get<Course>(`/api/courses/${slug}`);
  }

  static getLessonDetails(lessonId: string) {
    return this.get<any>(`/api/courses/lessons/${lessonId}`);
  }

  static updateLessonProgress(
    slug: string, 
    chapterId: string, 
    lessonId: string, 
    isCompleted: boolean
  ) {
    return this.put<any>(
      `/api/courses/${slug}/chapters/${chapterId}/lessons/${lessonId}/progress`, 
      { isCompleted }
    );
  }
}

export const courseService = CourseService;
