-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('View', 'Enroll', 'Complete', 'Search', 'Like', 'Share', 'Download', 'Rate', 'Comment');

-- CreateEnum
CREATE TYPE "LearningStyle" AS ENUM ('Visual', 'Auditory', 'Kinesthetic', 'Reading');

-- CreateEnum
CREATE TYPE "TimeAvailability" AS ENUM ('Low', 'Medium', 'High');

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categories" TEXT[],
    "difficulty" TEXT[],
    "priceRangeMin" DOUBLE PRECISION DEFAULT 0,
    "priceRangeMax" DOUBLE PRECISION DEFAULT 1000,
    "learningStyle" "LearningStyle" NOT NULL DEFAULT 'Visual',
    "timeAvailability" "TimeAvailability" NOT NULL DEFAULT 'Medium',
    "goals" TEXT[],
    "topics" TEXT[],
    "languages" TEXT[],
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "courseId" TEXT,
    "category" TEXT,
    "searchQuery" TEXT,
    "duration" INTEGER,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT[],
    "tags" TEXT[],
    "algorithm" TEXT NOT NULL,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "enrolled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "estimatedDuration" INTEGER,
    "courses" JSONB NOT NULL,
    "prerequisites" JSONB,
    "tags" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "progress" JSONB NOT NULL,
    "currentCourse" TEXT,
    "completedAt" TIMESTAMP(3),
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_interactions_userId_timestamp_idx" ON "user_interactions"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "user_interactions_courseId_idx" ON "user_interactions"("courseId");

-- CreateIndex
CREATE INDEX "user_interactions_type_idx" ON "user_interactions"("type");

-- CreateIndex
CREATE INDEX "course_recommendations_userId_createdAt_idx" ON "course_recommendations"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "course_recommendations_expiresAt_idx" ON "course_recommendations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "course_recommendations_userId_courseId_key" ON "course_recommendations"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_enrollments_userId_learningPathId_key" ON "learning_path_enrollments"("userId", "learningPathId");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interactions" ADD CONSTRAINT "user_interactions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_recommendations" ADD CONSTRAINT "course_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_recommendations" ADD CONSTRAINT "course_recommendations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_enrollments" ADD CONSTRAINT "learning_path_enrollments_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
