import { BaseService } from "./BaseService";
import { ApiResponse, Course, Exam } from "../types";

/**
 * Student API Service
 * Sanket
 */

export interface StudentStats {
  enrolledCourses: number;
  completedLessons: number;
  upcomingExams: number;
  upcomingSessions: number;
  overallProgress: number;
}

export class StudentService extends BaseService {
  static getDashboardStats() {
    return this.get<StudentStats>("/api/student/stats");
  }

  static getEnrolledCourses() {
    return this.get<Course[]>("/api/student/courses");
  }

  static async getExamSchedule(): Promise<ApiResponse<Exam[]>> {
    const response = await this.get<any[]>("/api/quiz");
    if (response.status === "error") return response;

    const exams: Exam[] = (response.data || []).map((quiz: any) => ({
      id: quiz.id,
      title: quiz.title,
      courseTitle: quiz.course?.title || "General",
      duration: quiz.timeLimit || 60,
      totalMarks: 100,
      date: new Date(quiz.createdAt).toLocaleDateString(),
      time: new Date(quiz.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: quiz._count?.attempts > 0 ? "completed" : "upcoming",
    }));

    return { status: "success", data: exams };
  }

  static getCertificates() {
    return this.get<any[]>("/api/student/certificates");
  }

  static getSessions() {
    return this.get<any[]>("/api/student/sessions");
  }

  static getGroups() {
    return this.get<any[]>("/api/student/groups");
  }

  static async updateProfileImage(uri: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    } as any);

    return this.post("/api/student/profile/image", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  static updateProfile(data: Partial<any>) {
    return this.put("/api/student/profile", data);
  }
}

export const studentService = StudentService;
