import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCourseForm } from "./_components/EditCourseForm";
import { CourseStructure } from "./_components/CourseStructure";

export const dynamic = "force-dynamic";

type Params = Promise<{ courseId: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CourseActions } from "./_components/CourseActions";
import { requireTeacher } from "@/app/data/auth/require-roles";

export default async function EditRoute({
  params,
  searchParams
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  await requireTeacher();
  const { courseId } = await params;
  const { tab } = await searchParams;
  const [data, session] = await Promise.all([
    adminGetCourse(courseId),
    auth.api.getSession({ headers: await headers() })
  ]);
  const defaultTab = typeof tab === 'string' ? tab : "basic-info";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Edit Course:{" "}
          <span className="text-primary underline">{data.title}</span>
        </h1>
        <CourseActions
          courseId={courseId}
          status={data.status}
          isTeacher={(session?.user as any).role === "teacher"}
        />
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="course-structure">Course Structure</TabsTrigger>
        </TabsList>
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>
                Provide basic information about the course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditCourseForm data={data} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="course-structure">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
              <CardDescription>
                Here you can update your Course Structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseStructure data={data} />
            </CardContent>
          </Card>
        </TabsContent>
        {/* Helper to keep tab synced if needed, but defaultValue is enough for initial load */}
      </Tabs>
    </div>
  );
}
