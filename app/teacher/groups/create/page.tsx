import { prisma } from "@/lib/db";
import { CreateGroupForm } from "../_components/create-group-form";

export default async function CreateGroupPage() {
    const subjects = await prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Create New Group Class</h1>
            <CreateGroupForm subjects={subjects as any} />
        </div>
    );
}
