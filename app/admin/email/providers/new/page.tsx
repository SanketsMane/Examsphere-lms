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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Author: Sanket
 * Add New Email Provider Page
 */
export default async function NewProviderPage() {
  
  async function createProvider(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const host = formData.get("host") as string;
    const port = parseInt(formData.get("port") as string);
    const secure = formData.get("secure") === "true";
    const user = formData.get("user") as string;
    const pass = formData.get("pass") as string;
    const isActive = formData.get("isActive") === "on";

    await prisma.emailProvider.create({
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
        isActive,
        isDefault: false
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
          <h1 className="text-3xl font-bold tracking-tight">New Provider</h1>
          <p className="text-muted-foreground">Add a new email delivery service.</p>
        </div>
      </div>

      <form action={createProvider}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconServer className="h-5 w-5 text-muted-foreground" /> Configuration
            </CardTitle>
            <CardDescription>
              Enter the connection details for your email service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider Name</label>
                <Input name="name" placeholder="e.g. My SMTP Server" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Type</label>
                <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                   <option value="smtp">Standard SMTP</option>
                   <option value="gmail">Gmail Service</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Host</label>
                <Input name="host" placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Port</label>
                <Input name="port" type="number" defaultValue="587" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Security</label>
               <select name="secure" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                   <option value="false">STARTTLS (Usually 587)</option>
                   <option value="true">SSL/TLS (Usually 465)</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input name="user" placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password / App Key</label>
                <Input name="pass" type="password" placeholder="••••••••" required />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" name="isActive" id="isActive" defaultChecked className="rounded border-gray-300" />
              <label htmlFor="isActive" className="text-sm font-medium">Enable immediately</label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/admin/email/providers">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="gap-2">
            <IconDeviceFloppy className="h-4 w-4" /> create Provider
          </Button>
        </div>
      </form>
    </div>
  );
}
