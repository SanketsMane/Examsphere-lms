import { prisma } from "@/lib/db";
import { 
  IconMail, 
  IconSettings, 
  IconTemplate, 
  IconServer, 
  IconAlertTriangle,
  IconCheck,
  IconX 
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { revalidatePath } from "next/cache";
import { TestEmailForm } from "./_components/test-email-form";

/**
 * Author: Sanket
 * Email Management Dashboard - Refined for production
 */
export default async function EmailManagementPage() {
  const globalSettings = await prisma.emailGlobalSettings.findUnique({
    where: { id: 'default' }
  });

  const templatesCount = await prisma.emailTemplate.count();
  const activeTemplatesCount = await prisma.emailTemplate.count({
    where: { isActive: true }
  });

  const providers = await prisma.emailProvider.findMany({
    orderBy: { isDefault: 'desc' }
  });

  const activeProvider = providers.find(p => p.isActive);

  async function toggleSystemStatus() {
    "use server";
    // Author: Sanket - Toggle global email system status
    const current = await prisma.emailGlobalSettings.findUnique({
      where: { id: 'default' }
    });
    
    await prisma.emailGlobalSettings.upsert({
      where: { id: 'default' },
      update: { isSystemEnabled: !current?.isSystemEnabled },
      create: { id: 'default', isSystemEnabled: false }
    });
    
    revalidatePath("/admin/email");
  }

  const recentTemplates = await prisma.emailTemplate.findMany({
    take: 3,
    orderBy: { updatedAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
        <p className="text-muted-foreground">
          Control email templates, configure providers, and manage system-wide email settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {globalSettings?.isSystemEnabled ? (
              <IconCheck className="h-4 w-4 text-emerald-500" />
            ) : (
              <IconX className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {globalSettings?.isSystemEnabled ? "Enabled" : "Disabled"}
              </span>
              <form action={toggleSystemStatus}>
                <Button 
                  size="sm" 
                  variant={globalSettings?.isSystemEnabled ? "destructive" : "default"}
                  className="h-8"
                >
                  {globalSettings?.isSystemEnabled ? "Disable" : "Enable"}
                </Button>
              </form>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Global toggle for all outgoing emails
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <IconTemplate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTemplatesCount} / {templatesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Templates ready for use
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Provider</CardTitle>
            <IconServer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {activeProvider?.name || "None Configured"}
            </div>
            <Badge variant={activeProvider ? "secondary" : "destructive"} className="mt-1">
              {activeProvider ? activeProvider.type.toUpperCase() : "INACTIVE"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Mode</CardTitle>
            <IconMail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Standard</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently processing in real-time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Email Templates</CardTitle>
              <Link href="/admin/email/templates">
                <Button variant="outline" size="sm">Manage Templates</Button>
              </Link>
            </div>
            <CardDescription>
              Modify the content and styling of system-generated emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {recentTemplates.length > 0 ? (
               recentTemplates.map((template) => (
                 <Link key={template.id} href={`/admin/email/templates/${template.slug}`}>
                    <div className="rounded-md border p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{template.name}</div>
                          {template.isActive ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 truncate">
                          {template.subject}
                        </div>
                    </div>
                 </Link>
               ))
             ) : (
               <div className="text-center py-6 text-muted-foreground italic text-sm">
                 No templates created yet.
               </div>
             )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Service Providers</CardTitle>
              <Link href="/admin/email/providers">
                <Button variant="outline" size="sm">Manage Services</Button>
              </Link>
            </div>
            <CardDescription>
              Configure SMTP, Gmail, or SendGrid integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.length > 0 ? (
                providers.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${p.isActive ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"}`}>
                        <IconServer className={`h-4 w-4 ${p.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.type.toUpperCase()}</div>
                      </div>
                    </div>
                    {p.isActive && <Badge className="bg-emerald-500">Active</Badge>}
                    {!p.isActive && <Badge variant="outline">Inactive</Badge>}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <IconAlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No providers configured yet.</p>
                  <Button variant="link" size="sm" className="mt-2" asChild>
                    <Link href="/admin/email/providers/new">Add your first provider</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Tools</CardTitle>
          <CardDescription>Verify your email configuration by sending a test message.</CardDescription>
        </CardHeader>
        <CardContent>
          <TestEmailForm />
        </CardContent>
      </Card>
    </div>
  );
}
