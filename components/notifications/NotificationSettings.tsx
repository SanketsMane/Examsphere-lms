"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Phone, Loader2 } from "lucide-react";

/**
 * Notification Preferences UI
 * Author: Sanket
 */

export default function NotificationSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [prefs, setPrefs] = useState<any>(null);

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await fetch("/api/notifications/preferences");
                if (res.ok) {
                    const data = await res.ok ? await res.json() : null;
                    setPrefs(data);
                }
            } catch (error) {
                console.error("Failed to fetch notification preferences", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrefs();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/notifications/preferences", {
                method: "POST",
                body: JSON.stringify(prefs),
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                toast.success("Preferences updated successfully");
            } else {
                toast.error("Failed to update preferences");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!prefs) return <div>Failed to load settings</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
                <p className="text-muted-foreground">Manage how you receive alerts and reminders.</p>
            </div>

            <div className="grid gap-6">
                {/* Email Reminders */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <CardTitle>Email Notifications</CardTitle>
                        </div>
                        <CardDescription>Receive reminders about your upcoming sessions via email.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="emailReminders">Enabled Reminders</Label>
                            <Switch
                                id="emailReminders"
                                checked={prefs.emailReminders}
                                onCheckedChange={(val) => setPrefs({ ...prefs, emailReminders: val })}
                            />
                        </div>
                        {prefs.emailReminders && (
                            <div className="ml-6 space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="email24h">24h Before Session</Label>
                                    <Switch
                                        id="email24h"
                                        checked={prefs.email24hBefore}
                                        onCheckedChange={(val) => setPrefs({ ...prefs, email24hBefore: val })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="email1h">1h Before Session</Label>
                                    <Switch
                                        id="email1h"
                                        checked={prefs.email1hBefore}
                                        onCheckedChange={(val) => setPrefs({ ...prefs, email1hBefore: val })}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* SMS Reminders */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            <CardTitle>SMS Notifications</CardTitle>
                        </div>
                        <CardDescription>Get text messages sent directly to your phone.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="smsReminders">Enabled SMS Alerts</Label>
                            <Switch
                                id="smsReminders"
                                checked={prefs.smsReminders}
                                onCheckedChange={(val) => setPrefs({ ...prefs, smsReminders: val })}
                            />
                        </div>

                        {prefs.smsReminders && (
                            <div className="ml-6 space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number</Label>
                                    <Input
                                        id="phoneNumber"
                                        placeholder="+1 234 567 890"
                                        value={prefs.phoneNumber || ""}
                                        onFocus={(e) => {
                                          if (!e.target.value) setPrefs({ ...prefs, phoneNumber: "+91" });
                                        }}
                                        onChange={(e) => setPrefs({ ...prefs, phoneNumber: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground italic">Use international format (e.g., +91...)</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="sms24h">24h Before Session</Label>
                                    <Switch
                                        id="sms24h"
                                        checked={prefs.sms24hBefore}
                                        onCheckedChange={(val) => setPrefs({ ...prefs, sms24hBefore: val })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="sms1h">1h Before Session</Label>
                                    <Switch
                                        id="sms1h"
                                        checked={prefs.sms1hBefore}
                                        onCheckedChange={(val) => setPrefs({ ...prefs, sms1hBefore: val })}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Other Notifications */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <CardTitle>Global Updates</CardTitle>
                        </div>
                        <CardDescription>Stay updated on account activity and general messages.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="sessionUpdates">Platform Session Updates</Label>
                            <Switch
                                id="sessionUpdates"
                                checked={prefs.emailSessionUpdates}
                                onCheckedChange={(val) => setPrefs({ ...prefs, emailSessionUpdates: val })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor="newMessages">Direct Messaging Alerts</Label>
                            </div>
                            <Switch
                                id="newMessages"
                                checked={prefs.emailNewMessages}
                                onCheckedChange={(val) => setPrefs({ ...prefs, emailNewMessages: val })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Preferences"}
                </Button>
            </div>
        </div>
    );
}
