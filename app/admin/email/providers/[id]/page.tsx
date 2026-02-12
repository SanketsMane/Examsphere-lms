import { prisma } from "@/lib/db";
import { 
  IconArrowLeft,
  IconDeviceFloppy,
  IconServer
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Author: Sanket
 * Edit Email Provider Page - Using async params for Next.js 16 compatibility
 */
export default async function EditProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const provider = await prisma.emailProvider.findUnique({
    where: { id }
  });

  if (!provider) {
    redirect("/admin/email/providers");
  }

  const config = provider.config as any;

  async function updateProvider(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const host = formData.get("host") as string;
    const port = parseInt(formData.get("port") as string);
    const secure = formData.get("secure") === "true";
    const user = formData.get("user") as string;
    const pass = formData.get("pass") as string;
    const isActive = formData.get("isActive") === "on";

    const { id: currentId } = await params;

    await prisma.emailProvider.update({
      where: { id: currentId },
      data: {
        name,
        type,
        config: {
          host,
          port,
          secure,
          user,
          pass
        },
        isActive
      }
    });

    revalidatePath("/admin/email/providers");
    redirect("/admin/email/providers");
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/email/providers">
          <Button variant="ghost" size="icon" className="rounded-full">
            <IconArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Provider</h1>
          <p className="text-muted-foreground">{provider.name}</p>
        </div>
      </div>

      <form action={updateProvider}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconServer className="h-5 w-5 text-muted-foreground" /> Configuration
            </CardTitle>
            <CardDescription>
              Update the connection details for this email service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider Name</label>
                <Input name="name" defaultValue={provider.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Type</label>
                <select name="type" defaultValue={provider.type} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                   <option value="smtp">Standard SMTP</option>
                   <option value="gmail">Gmail Service</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Host</label>
                <Input name="host" defaultValue={config.host} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Port</label>
                <Input name="port" type="number" defaultValue={config.port} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Security</label>
               <select name="secure" defaultValue={config.secure?.toString()} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                   <option value="false">STARTTLS (Usually 587)</option>
                   <option value="true">SSL/TLS (Usually 465)</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input name="user" defaultValue={config.user} placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password / App Key</label>
                <Input name="pass" type="password" defaultValue={config.pass} placeholder="••••••••" required />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" name="isActive" id="isActive" defaultChecked={provider.isActive} className="rounded border-gray-300" />
              <label htmlFor="isActive" className="text-sm font-medium">Keep active</label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/admin/email/providers">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="gap-2">
            <IconDeviceFloppy className="h-4 w-4" /> Save Provider
          </Button>
        </div>
      </form>
    </div>
  );
}
