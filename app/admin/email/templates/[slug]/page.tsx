import { prisma } from "@/lib/db";
import { 
  IconDeviceFloppy, 
  IconEye, 
  IconArrowLeft,
  IconInfoCircle,
  IconCode
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming this exists
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Author: Sanket
 * Email Template Editor Page - Using async params for Next.js 16 compatibility
 */
export default async function TemplateEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const template = await prisma.emailTemplate.findUnique({
    where: { slug }
  });

  if (!template) {
    redirect("/admin/email/templates");
  }

  async function updateTemplate(formData: FormData) {
    "use server";
    // Author: Sanket - Extract and update template data
    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const isActive = formData.get("isActive") === "on";

    const { slug: currentSlug } = await params;

    await prisma.emailTemplate.update({
      where: { id: template!.id },
      data: { name, subject, content, isActive }
    });

    revalidatePath(`/admin/email/templates/${currentSlug}`);
    revalidatePath("/admin/email/templates");
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/email/templates">
            <Button variant="ghost" size="icon" className="rounded-full">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
            <p className="text-muted-foreground">{template.name}</p>
          </div>
        </div>
      </div>

      <form action={updateTemplate} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input name="name" defaultValue={template.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Line</label>
                <Input name="subject" defaultValue={template.subject} required />
                <p className="text-[10px] text-muted-foreground">Supports placeholders like {"${userName}"}</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" id="isActive" defaultChecked={template.isActive} className="rounded border-gray-300" />
                <label htmlFor="isActive" className="text-sm font-medium">Active and ready to use</label>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconCode className="h-5 w-5" /> HTML Content
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconInfoCircle className="h-3 w-3" />
                <span>Use inline CSS for best compatibility</span>
              </div>
            </CardHeader>
            <CardContent>
              <textarea 
                name="content" 
                defaultValue={template.content} 
                className="min-h-[500px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/admin/email/templates">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" className="gap-2">
              <IconDeviceFloppy className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 self-start">
           <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconEye className="h-5 w-5" /> Live Preview
              </CardTitle>
              <Badge variant="secondary">Desktop View</Badge>
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="bg-muted p-4 min-h-[700px] flex items-center justify-center">
                <iframe 
                  srcDoc={template.content} 
                  title="Preview"
                  className="w-full h-[650px] bg-white shadow-sm border rounded"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle className="text-sm">Available Placeholders</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="flex flex-wrap gap-2">
                   {["${userName}", "${courseTitle}", "${courseUrl}", "${resetUrl}", "${expirationTime}", "${teacherName}", "${sessionTitle}", "${sessionDate}"].map(p => (
                     <code key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">{p}</code>
                   ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 italic">
                  Note: Different templates support different placeholders. Make sure yours is compatible.
                </p>
             </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
