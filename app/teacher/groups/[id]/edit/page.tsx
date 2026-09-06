import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { EditGroupForm } from "../../_components/edit-group-form";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/app/data/auth/require-roles";

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Await params in newer Next.js or just use as is if config allows. 
    // Next 15 requires awaiting params, but this codebase seems mixed. Assuming standard access.
    const { id } = await params; // Safety wrapper

    if (!session?.user || (session.user as any).role !== "teacher") return <div>Unauthorized</div>;

    const group = await prisma.groupClass.findUnique({
        where: { id }
    });

    if (!group) return notFound();
    if (group.teacherId !== (await prisma.teacherProfile.findUnique({ where: { userId: session.user.id } }))?.id) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Group Class / Package</h1>
            <EditGroupForm group={group} />
        </div>
    );
}
