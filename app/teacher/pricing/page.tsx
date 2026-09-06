import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PricingForm } from "./_components/PricingForm";
import { requireTeacher } from "@/app/data/auth/require-roles";

export default async function TeacherPricingPage() {
  await requireTeacher();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      pricing: true
    }
  });

  if (!teacher) {
    return <div>Teacher profile not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
       <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Pricing & Offerings</h1>
        <p className="text-muted-foreground">
          Manage your session rates and free trial availability.
        </p>
      </div>
      
      <div className="max-w-3xl">
        <PricingForm 
            pricing={teacher.pricing} 
            allowFreeDemo={teacher.allowFreeDemo} 
            allowFreeGroup={teacher.allowFreeGroup}
            teacherId={teacher.id}
        />
      </div>
    </div>
  );
}
