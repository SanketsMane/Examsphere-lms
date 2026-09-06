import { z } from "zod";
import { MAX_COURSE_PRICE } from "@/lib/money";

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

/**
 * Course input validation.
 *
 * SECURITY: `status` and `isFeatured` are deliberately NOT part of the schema a
 * teacher may submit. They were previously accepted from the client and spread
 * straight into `prisma.course.create()`, which let a teacher publish a course
 * without admin approval and mark their own course as featured. Those two fields
 * are now decided server-side; only `adminCourseSchema` accepts them.
 */
const courseBaseShape = {
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),

  description: z
    .string()
    .trim()
    .min(3, { message: "Description must be at least 3 characters long" })
    .max(20000, { message: "Description is too long" }),

  // Required: the DB column is NOT NULL and a course with no thumbnail renders
  // a broken image everywhere it is listed.
  fileKey: z
    .string()
    .trim()
    .min(1, { message: "Please upload a course thumbnail" }),

  // Whole rupees. `.int()` matters because the column is an INT — a decimal here
  // used to reach Prisma and fail with an opaque error.
  price: z.coerce
    .number()
    .int({ message: "Price must be a whole number (no paise)" })
    .min(0, { message: "Price must be 0 or greater" })
    .max(MAX_COURSE_PRICE, {
      message: `Price must be at most ${MAX_COURSE_PRICE.toLocaleString("en-IN")}`,
    }),

  duration: z.coerce
    .number()
    .int({ message: "Duration must be a whole number of hours" })
    .min(1, { message: "Duration must be at least 1 hour" })
    .max(500, { message: "Duration must be at most 500 hours" }),

  level: z.enum(courseLevels, { message: "Level is required" }),

  // Categories are DB-driven (the Category table) with a built-in fallback list, so
  // this cannot be a static enum. The value is bounded here and then checked against
  // the allowed set server-side in `assertValidCategory()`.
  category: z
    .string()
    .trim()
    .min(1, { message: "Please choose a category" })
    .max(100, { message: "Category name is too long" }),

  smallDescription: z
    .string()
    .trim()
    .min(3, { message: "Small Description must be at least 3 characters long" })
    .max(200, { message: "Small Description must be at most 200 characters long" }),

  // Lowercase, URL-safe. MySQL's default collation is case-insensitive, so
  // "My-Course" and "my-course" collide on the unique index; normalising here
  // makes that impossible rather than surfacing as a duplicate-key error.
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, { message: "Slug must be at least 3 characters long" })
    .max(120, { message: "Slug must be at most 120 characters long" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug may only contain lowercase letters, numbers and single hyphens",
    }),

  language: z.enum(languages).optional(),
  tags: z.array(z.string().trim().min(1)).max(20, { message: "At most 20 tags" }).optional(),
  prerequisites: z.string().trim().max(2000).optional(),
  learningOutcomes: z
    .array(z.string().trim().min(1))
    .max(20, { message: "At most 20 learning outcomes" })
    .optional(),

  discountPrice: z.coerce
    .number()
    .int({ message: "Discount price must be a whole number" })
    .min(0, { message: "Discount price cannot be negative" })
    .max(MAX_COURSE_PRICE)
    .optional(),

  discountExpiry: z.coerce.date().optional(),
};

/** A discount must actually be a discount, and must not already be expired. */
const withDiscountRules = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data: any, ctx: z.RefinementCtx) => {
    if (data.discountPrice !== undefined && data.discountPrice !== null) {
      if (data.discountPrice >= data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["discountPrice"],
          message: "Discount price must be lower than the regular price",
        });
      }
    }
    if (data.discountExpiry && data.discountExpiry.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountExpiry"],
        message: "Discount expiry must be in the future",
      });
    }
    if (data.discountExpiry && data.discountPrice === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountPrice"],
        message: "Set a discount price, or remove the expiry date",
      });
    }
  });

/** What a teacher may submit. No status, no isFeatured — both are server-decided. */
export const teacherCourseSchema = withDiscountRules(z.object(courseBaseShape));

/**
 * Editing an existing course. Includes `status` because the edit screen doubles as
 * "submit for review": a teacher choosing "Published" is downgraded to "Pending"
 * server-side (see editCourse). `isFeatured` stays admin-only.
 */
export const courseEditSchema = withDiscountRules(
  z.object({
    ...courseBaseShape,
    status: z.enum(courseStatus, { message: "Status is required" }),
  })
);

/** Admins additionally control publication state and featured placement. */
export const adminCourseSchema = withDiscountRules(
  z.object({
    ...courseBaseShape,
    status: z.enum(courseStatus, { message: "Status is required" }),
    isFeatured: z.boolean().default(false),
  })
);

/**
 * Kept as the shared shape for forms and existing imports. Equivalent to the
 * teacher schema — the privileged fields live only on `adminCourseSchema`.
 */
export const courseSchema = teacherCourseSchema;

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
export type TeacherCourseSchemaType = z.infer<typeof teacherCourseSchema>;
export type AdminCourseSchemaType = z.infer<typeof adminCourseSchema>;
export type CourseEditSchemaType = z.infer<typeof courseEditSchema>;
export type ChapterSchemaType = z.infer<typeof chapterSchema>;
export type LessonSchemaType = z.infer<typeof lessonSchema>;
