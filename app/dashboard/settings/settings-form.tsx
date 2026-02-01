"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Lock, Settings, User, Heart, Target, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { updateProfile } from "./actions";
import { useEffect } from "react";
import { toast } from "sonner";
import { Uploader } from "@/components/file-uploader/Uploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

const initialState = {
    message: "",
    status: "",
};

interface SettingsFormProps {
    user: any;
    preferences: any;
    categories: any[];
}

export function SettingsForm({ user, preferences, categories }: SettingsFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState);

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
                                <AvatarImage src={user.image || ""} />
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

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                placeholder="Tell us a little about yourself"
                                defaultValue={user.bio || ""}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="education">Education</Label>
                            <Textarea
                                id="education"
                                name="education"
                                placeholder="Enter your education details..."
                                defaultValue={user.education || ""}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Interests & Goals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Learning Goals & Interests
                        </CardTitle>
                        <CardDescription>Tell us what you want to learn to get better recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Interests (Categories)</Label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <label
                                        key={cat.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            name="categories"
                                            value={cat.name}
                                            defaultChecked={preferences?.categories?.includes(cat.name)}
                                            className="hidden peer"
                                        />
                                        <div className="w-4 h-4 rounded-sm border peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full hidden peer-checked:block" />
                                        </div>
                                        <span className="text-sm font-medium">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goals">Learning Goals</Label>
                            <Textarea
                                id="goals"
                                name="goals"
                                placeholder="e.g., Learn React, Master Figma, Get a job in tech..."
                                defaultValue={preferences?.goals?.join(", ") || ""}
                            />
                            <p className="text-xs text-muted-foreground">Separate goals with commas</p>
                        </div>
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
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Course Updates</Label>
                                <p className="text-sm text-muted-foreground">Get notified about new lessons</p>
                            </div>
                            <Switch defaultChecked />
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
