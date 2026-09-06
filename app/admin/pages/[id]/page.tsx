import { PageForm } from "../_components/page-form";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/data/auth/require-roles";

export default async function AdminEditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
    const { id } = await params;
    const page = await prisma.page.findUnique({
        where: { id }
    });

    if (!page) notFound();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8" />
                    Edit Page: {page.title}
                </h1>
                <p className="text-muted-foreground">Update page content and settings.</p>
            </div>
            <PageForm page={page} />
        </div>
    );
}
