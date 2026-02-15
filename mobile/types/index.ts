/**
 * Shared Type Definitions
 * Sanket
 */

export type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: "ADMIN" | "STUDENT" | "TEACHER";
  bio?: string;
  gender?: string;
  country?: string;
  education?: string;
  phone?: string;
  address?: string;
};

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: number;
};

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  videoUrl?: string;
  position: number;
  isCompleted?: boolean;
  lessonProgress?: { completed: boolean }[];
}

export interface Chapter {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  smallDescription: string;
  fileKey: string;
  price: number;
  duration: number;
  level: CourseLevel;
  category: string;
  averageRating?: number;
  totalReviews?: number;
  totalStudents?: number;
  instructor?: {
    name: string;
    image?: string;
  };
  chapters?: Chapter[];
  resources?: Resource[];
  progress?: number;
  enrolledAt?: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType?: string;
  size?: number;
}

export interface Exam {
  id: string;
  title: string;
  courseTitle: string;
  duration: number;
  totalMarks: number;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "ongoing";
  result?: string;
}
