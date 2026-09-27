import { requireUser } from "@/app/data/user/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, User, Landmark, IndianRupee, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export const dynamic = "force-dynamic";

// Each setting lives on the page that actually saves it; this page just routes there.
const SETTINGS_LINKS = [
  {
    icon: User,
    title: "Teaching Profile",
    description: "Bio, expertise, languages, qualifications and timezone",
    href: "/teacher/profile",
  },
  {
    icon: Landmark,
    title: "Bank Details & Verification",
    description: "Payout bank account (IFSC) and identity documents",
    href: "/teacher/verification",
  },
  {
    icon: IndianRupee,
    title: "Pricing & Offerings",
    description: "1-on-1 session rates and free trial options",
    href: "/teacher/pricing",
  },
  {
    icon: Calendar,
    title: "Availability",
    description: "Weekly slots students can book",
    href: "/teacher/sessions/availability",
  },
];

export default async function TeacherSettingsPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Teacher Settings
        </h1>
        <p className="text-muted-foreground">Manage your teaching profile and preferences</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_LINKS.map((item) => (
          <Card key={item.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <item.icon className="h-5 w-5" />
                {item.title}
              </CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href={item.href}>
                  Manage <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ChangePasswordForm />
    </div>
  );
}
