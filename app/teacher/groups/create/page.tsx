import { getTeacherSubjectOptions } from "@/app/teacher/_lib/subject-options";
import { CreateGroupForm } from "../_components/create-group-form";
import { requireTeacher } from "@/app/data/auth/require-roles";

export default async function CreateGroupPage() {
  await requireTeacher();
    const subjects = await getTeacherSubjectOptions();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Create New Group Class</h1>
            <CreateGroupForm subjects={subjects} />
        </div>
    );
}
