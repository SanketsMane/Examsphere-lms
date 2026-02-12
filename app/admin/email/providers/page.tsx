import { prisma } from "@/lib/db";
import { 
  IconServer, 
  IconPlus, 
  IconEdit, 
  IconArrowLeft,
  IconCheck,
  IconX,
  IconTrophy,
  IconTrash
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revalidatePath } from "next/cache";

/**
 * Author: Sanket
 * Email Providers List Page
 */
export default async function EmailProvidersPage() {
  const providers = await prisma.emailProvider.findMany({
    orderBy: { isDefault: 'desc' }
  });

  async function toggleProvider(id: string, currentStatus: boolean) {
    "use server";
    await prisma.emailProvider.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath("/admin/email/providers");
  }

  async function setAsDefault(id: string) {
    "use server";
    // Unset current default
    await prisma.emailProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
    // Set new default
    await prisma.emailProvider.update({
      where: { id },
      data: { isDefault: true, isActive: true }
    });
    revalidatePath("/admin/email/providers");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/email">
            <Button variant="ghost" size="icon" className="rounded-full">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Providers</h1>
            <p className="text-muted-foreground">Configure SMTP, Gmail, or other email delivery services.</p>
          </div>
        </div>
        <Link href="/admin/email/providers/new">
          <Button className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" /> Add Provider
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configured Providers ({providers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-full ${p.isActive ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"}`}>
                        <IconServer className={`h-4 w-4 ${p.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </div>
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={async () => { "use server"; await toggleProvider(p.id, p.isActive); }}>
                      <button type="submit" className="focus:outline-none">
                        {p.isActive ? (
                          <Badge className="bg-emerald-500 cursor-pointer">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground cursor-pointer">Inactive</Badge>
                        )}
                      </button>
                    </form>
                  </TableCell>
                  <TableCell>
                    {p.isDefault ? (
                      <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                        <IconTrophy className="h-3 w-3 mr-1" /> Primary
                      </Badge>
                    ) : (
                      <form action={async () => { "use server"; await setAsDefault(p.id); }}>
                        <Button variant="ghost" size="sm" type="submit" className="text-xs h-7">
                          Set as Primary
                        </Button>
                      </form>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/email/providers/${p.id}`}>
                        <Button variant="ghost" size="icon">
                          <IconEdit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {providers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No providers configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
