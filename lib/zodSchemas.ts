import { z } from "zod";

export const courseLevels = ["Beginner", "Intermediate", "Advanced"] as const;

export const courseStatus = ["Draft", "Pending", "Published", "Archived"] as const;

export const courseCategories = [
  "Development",
  "Business",
  "Finance",
  "IT & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
  "Teaching & Academics",
  "Language Learning",
  "Photography",
  "Lifestyle",
] as const;

export const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Other",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" }),

  fileKey: z.string().min(1, { message: "File is required" }),

  price: z.coerce
    .number()
    .min(0, { message: "Price must be 0 or greater" }),

  duration: z.coerce
    .number()
    .min(1, { message: "Duration must be at least 1 hour" })
    .max(500, { message: "Duration must be at most 500 hours" }),

  level: z.enum(courseLevels, {
    message: "Level is required",
  }),
  category: z.string().min(1, {
    message: "Category is required",
  }),
  smallDescription: z
    .string()
    .min(3, { message: "Small Description must be at least 3 characters long" })
    .max(200, {
      message: "Small Description must be at most 200 characters long",
    }),

  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters long" }),

  status: z.enum(courseStatus, {
    message: "Status is required",
  }),

  // New marketplace fields
  language: z.enum(languages).optional(),
  tags: z.array(z.string()).optional(),
  prerequisites: z.string().optional(),
  learningOutcomes: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  discountPrice: z.coerce.number().optional(),
  discountExpiry: z.date().optional(),
});

// Teacher Profile Schema
export const teacherProfileSchema = z.object({
  bio: z.string().min(10, { message: "Bio must be at least 10 characters" }).max(1000, { message: "Bio must be less than 1000 characters" }),
  expertise: z.array(z.string()).min(1, { message: "At least one expertise area is required" }).max(10, { message: "Maximum 10 expertise areas allowed" }),
  languages: z.array(z.string()).min(1, { message: "At least one language is required" }),
  hourlyRate: z.coerce.number().int({ message: "Hourly rate must be a whole number" }).min(5, { message: "Hourly rate must be at least $5" }).optional(),
  experience: z.coerce.number().int({ message: "Experience must be a whole number" }).min(0, { message: "Years of experience must be 0 or greater" }).optional(),
  timezone: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

// Review Schema  
export const reviewSchema = z.object({
  rating: z.number().min(1, { message: "Rating must be at least 1" }).max(5, { message: "Rating must be at most 5" }),
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100, { message: "Title must be less than 100 characters" }).optional(),
  comment: z.string().min(10, { message: "Comment must be at least 10 characters" }).max(500, { message: "Comment must be less than 500 characters" }),
});

// Live Session Schema
export const liveSessionSchema = z.object({
  teacherId: z.string().min(1, { message: "Teacher is required" }),
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  subject: z.string().optional(),
  scheduledAt: z.date({ message: "Scheduled time is required" }),
  duration: z.coerce.number().min(15, { message: "Duration must be at least 15 minutes" }).max(480, { message: "Duration must be at most 8 hours" }),
  price: z.coerce.number().min(5, { message: "Price must be at least $5" }),
});

export const chapterSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  courseId: z.string().uuid({ message: "Invalid course id" }),
});

export const lessonSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" }),
  chapterId: z.string().uuid({ message: "Invalid chapter ID" }),
  courseId: z.string().uuid({ message: "Invalid course ID" }),
  description: z
    .string()
    .min(3, { message: "Description must be at least 3 characters long" })
    .optional(),

  videoKey: z.string().optional(),
  thumbnailKey: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
});

export type CourseSchemaType = z.infer<typeof courseSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
