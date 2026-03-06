import { getEnrolledCourses } from "@/app/data/user/get-enrolled-courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, BarChart3, PlayCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CertificateButton } from "./_components/CertificateButton";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

export default async function DashboardCoursesPage() {
  const enrolledCourses = await getEnrolledCourses();

  if (enrolledCourses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">No Enrolled Courses</h2>
            <p className="text-muted-foreground mb-6">
              You haven't enrolled in any courses yet. Browse our course catalog to get started.
            </p>
            <Button asChild>
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Courses</h1>
        <p className="text-muted-foreground">
          Continue your learning journey with your enrolled courses
        </p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((enrollment) => {
          const course = enrollment.Course;

          // Calculate progress
          const totalLessons = course.chapter.reduce(
            (acc, chapter) => acc + chapter.lessons.length,
            0
          );

          const completedLessons = course.chapter.reduce(
            (acc, chapter) =>
              acc +
              chapter.lessons.filter((lesson) =>
                lesson.lessonProgress.some((progress) => progress.completed)
              ).length,
            0
          );

          const progressPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

          // Get first incomplete lesson
          let nextLessonId = null;
          for (const chapter of course.chapter) {
            for (const lesson of chapter.lessons) {
              const isCompleted = lesson.lessonProgress.some(
                (progress) => progress.completed
              );
              if (!isCompleted) {
                nextLessonId = lesson.id;
                break;
              }
            }
            if (nextLessonId) break;
          }

          return (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="aspect-video relative">
                  <Image
                    src={constructS3Url(course.fileKey)}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {course.smallDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration} min</span>
                    </div>
                    <Badge variant="secondary">
                      {course.level}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {completedLessons} of {totalLessons} lessons completed
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 gap-2">
                {progressPercentage === 100 ? (
                  <CertificateButton courseId={course.id} />
                ) : nextLessonId ? (
                  <Button asChild className="flex-1">
                    <Link href={`/dashboard/${course.slug}/${nextLessonId}`}>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="flex-1">
                    <Link href={`/dashboard/${course.slug}`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Course
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}