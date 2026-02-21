import { requireUser } from "@/app/data/user/require-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Bell, Lock, DollarSign, Calendar } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { getSessionWithRole } from "@/app/data/auth/require-roles"; // Added for localization - Author: Sanket

export const dynamic = "force-dynamic";

export default async function TeacherSettingsPage() {
  const user = await requireUser();
  const session = await getSessionWithRole();
  const userCountry = (session?.user as any)?.country || "India";
  const { symbol: s } = getCurrencyConfig(userCountry);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Teacher Settings
        </h1>
        <p className="text-muted-foreground">Manage your teaching profile and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your teaching profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell students about your teaching experience..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise">Areas of Expertise</Label>
              <Input id="expertise" placeholder="e.g., Mathematics, Science, English" />
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Settings
            </CardTitle>
            <CardDescription>Manage your payment information and pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hourly-rate">Hourly Rate ({s})</Label>
              <Input id="hourly-rate" type="number" placeholder="1000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank-account">Bank Account (for payouts)</Label>
              <Input id="bank-account" placeholder="Account number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input id="ifsc" placeholder="IFSC code" />
            </div>
            <Button>Update Payment Info</Button>
          </CardContent>
        </Card>

        {/* Availability Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability
            </CardTitle>
            <CardDescription>Set your teaching availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Accept New Students</Label>
                <p className="text-sm text-muted-foreground">Allow new students to enroll</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-approve Sessions</Label>
                <p className="text-sm text-muted-foreground">Automatically accept live session bookings</p>
              </div>
              <Switch />
            </div>
            <Separator />

          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Manage your notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Enrollments</Label>
                <p className="text-sm text-muted-foreground">Get notified when students enroll</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Bookings</Label>
                <p className="text-sm text-muted-foreground">Alerts for new live session bookings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Student Messages</Label>
                <p className="text-sm text-muted-foreground">Notifications for student messages</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Password Change Section - Author: Sanket */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
