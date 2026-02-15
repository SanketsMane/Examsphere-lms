import { BaseService } from "./BaseService";
import { ApiResponse, Exam } from "../types";

/**
 * Real Exam (Quiz) Service
 * Sanket
 */

export class ExamService extends BaseService {
  static async getExams(): Promise<ApiResponse<Exam[]>> {
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

  static getQuizDetails(quizId: string) {
    return this.get<any>(`/api/quiz/${quizId}`);
  }

  static submitAttempt(quizId: string, responses: any[]) {
    return this.post<any>(`/api/quiz/${quizId}/attempts`, {
      quizId,
      responses
    });
  }

  static startAttempt(quizId: string) {
    return this.post<any>(`/api/quiz/${quizId}/attempts`, {
      quizId,
      responses: []
    });
  }
}

export const examService = ExamService;
