"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Bell, Settings, User, GraduationCap } from "lucide-react";
import { useActionState, useState } from "react";
import { updateProfile } from "./actions";
import { useEffect } from "react";
import { toast } from "sonner";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { constructS3Url } from "@/lib/s3-helper";
import { BOARDS, CURRENT_CLASSES, TARGET_PROGRAMS } from "@/lib/examsphere-taxonomy";
import { isSchoolStudent } from "@/lib/student-profile";

const initialState = {
    message: "",
    status: "",
};

interface SettingsFormProps {
    user: any;
    preferences: any;
    studentProfile: any;
}

const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const thisYear = new Date().getFullYear();
const TARGET_YEARS = Array.from({ length: 8 }, (_, i) => thisYear + i);

export function SettingsForm({ user, preferences, studentProfile }: SettingsFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState);
    const profile = studentProfile ?? {};
    // Board and guardian details only apply to school students, not MBBS.
    const [currentClass, setCurrentClass] = useState<string>(profile.currentClass ?? "");
    const schoolStudent = isSchoolStudent({ currentClass });

    useEffect(() => {
        if (state?.status === "success") {
            toast.success(state.message);
        } else if (state?.status === "error") {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Settings className="h-8 w-8" />
                    Settings
                </h1>
                <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <form action={formAction} className="grid gap-6">
                {/* Profile Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile Settings
                        </CardTitle>
                        <CardDescription>Update your profile information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={constructS3Url(user.image || "")} />
                                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Label>Profile Picture</Label>
                                <input type="hidden" name="image" value={user.image || ""} id="image-input" />
                                <div className="mt-2 max-w-xs">
                                    <Uploader
                                        fileTypeAccepted="image"
                                        onChange={(url) => {
                                            const input = document.getElementById("image-input") as HTMLInputElement;
                                            if (input) input.value = url;
                                        }}
                                        value={user.image || ""}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" name="name" defaultValue={user.name || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={user.email} disabled />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ExamSphere academic profile (BUG-0007) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Academic Profile
                        </CardTitle>
                        <CardDescription>
                            Tell us what you&apos;re preparing for so we can guide you to the right courses and mentors
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="targetProgram">Target Programme</Label>
                                <select id="targetProgram" name="targetProgram" className={selectClass} defaultValue={profile.targetProgram ?? ""}>
                                    <option value="">Select programme</option>
                                    {TARGET_PROGRAMS.map((p) => (
                                        <option key={p} value={p}>{p === "Foundation" ? "Foundation (Class 6–10)" : p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currentClass">Current Class / Year</Label>
                                <select
                                    id="currentClass"
                                    name="currentClass"
                                    className={selectClass}
                                    value={currentClass}
                                    onChange={(e) => setCurrentClass(e.target.value)}
                                >
                                    <option value="">Select class</option>
                                    {CURRENT_CLASSES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetYear">Target Exam Year</Label>
                                <select id="targetYear" name="targetYear" className={selectClass} defaultValue={profile.targetYear ?? ""}>
                                    <option value="">Select year</option>
                                    {TARGET_YEARS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            {schoolStudent && (
                                <div className="space-y-2">
                                    <Label htmlFor="board">Board</Label>
                                    <select id="board" name="board" className={selectClass} defaultValue={profile.board ?? ""}>
                                        <option value="">Select board</option>
                                        {BOARDS.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="institution">School / College</Label>
                                <Input
                                    id="institution"
                                    name="institution"
                                    placeholder="Your school, coaching institute or medical college"
                                    defaultValue={profile.institution ?? ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" name="city" autoComplete="address-level2" defaultValue={profile.city ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input id="state" name="state" autoComplete="address-level1" defaultValue={profile.state ?? ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Mobile Number</Label>
                                <Input
                                    id="contactPhone"
                                    name="contactPhone"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="+91 98765 43210"
                                    defaultValue={profile.contactPhone ?? ""}
                                />
                            </div>
                        </div>

                        {schoolStudent && (
                            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="guardianName">Parent / Guardian Name</Label>
                                    <Input id="guardianName" name="guardianName" defaultValue={profile.guardianName ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guardianPhone">Parent / Guardian Mobile</Label>
                                    <Input
                                        id="guardianPhone"
                                        name="guardianPhone"
                                        type="tel"
                                        defaultValue={profile.guardianPhone ?? ""}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notification Preferences
                        </CardTitle>
                        <CardDescription>Manage how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive email updates</p>
                            </div>
                            <Switch defaultChecked={preferences?.notifications ?? true} name="notifications" value="on" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending} size="lg">
                        {isPending ? "Saving..." : "Save All Changes"}
                    </Button>
                </div>
            </form>

            {/* Password Change Section - Author: Sanket */}
            <ChangePasswordForm />
        </div>
    );
}
