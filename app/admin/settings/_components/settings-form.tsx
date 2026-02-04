"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSiteSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { Globe, Phone, Share2, CreditCard } from "lucide-react";
import { SiteSettings } from "@prisma/client";
import { FileUpload } from "@/components/ui/file-upload";
import { FooterLinksEditor } from "./footer-links-editor";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Slider } from "@/components/ui/slider";

export function SettingsForm({ settings }: { settings: SiteSettings | null }) {
    const [state, formAction, isPending] = useActionState(updateSiteSettings, {
        message: "",
        success: false
    });

    // Initialize logo URL state from settings or empty string
    // Initialize logo URL state from settings or empty string
    const [logoUrl, setLogoUrl] = useState((settings as any)?.logo || "");
    const [logoSize, setLogoSize] = useState((settings as any)?.logoSize || 100);

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <div className="space-y-6">
            <form action={formAction} className="space-y-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            General Settings
                        </CardTitle>
                        <CardDescription>Platform-wide configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input 
                                id="siteName" 
                                name="siteName" 
                                placeholder="Enter site name"
                                defaultValue={settings?.siteName || "KidoKool LMS"} 
                            />
                            <p className="text-xs text-muted-foreground">The display name for your platform.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="siteUrl">Site URL</Label>
                            <Input id="siteUrl" name="siteUrl" defaultValue={settings?.siteUrl || ""} placeholder="https://kidokool.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <input type="hidden" name="logo" value={logoUrl} />
                            <FileUpload
                                value={logoUrl}
                                onChange={setLogoUrl}
                                label="Upload Site Logo"
                                onFileSelect={async (file) => {
                                    return new Promise((resolve, reject) => {
                                        const img = new Image();
                                        img.src = URL.createObjectURL(file);
                                        img.onload = () => {
                                            if (img.width > 512 || img.height > 512) {
                                                toast.error(`Image too large! Max allowed size is 512x512px. Uploaded: ${img.width}x${img.height}px.`);
                                                reject(new Error("Image dimensions exceed 512x512px limit"));
                                            } else {
                                                resolve(file);
                                            }
                                        };
                                        img.onerror = () => reject(new Error("Invalid image file"));
                                    });
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Max size: 512x512px (Locked). Transparent PNG recommended.</p>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="logoSize">Logo Size Percentage</Label>
                                <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{logoSize}%</span>
                            </div>
                            <input type="hidden" name="logoSize" value={logoSize} />
                            <Slider
                                defaultValue={[logoSize]}
                                max={100}
                                min={0}
                                step={1}
                                onValueChange={(vals) => setLogoSize(vals[0])}
                            />
                            <p className="text-xs text-muted-foreground italic">Drag the slider to adjust how large the logo appears in the top navigation bar.</p>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="maxGroupClassSize">Global Max Group Class Size</Label>
                             <Input 
                                id="maxGroupClassSize" 
                                name="maxGroupClassSize" 
                                type="number" 
                                min="1"
                                defaultValue={settings?.maxGroupClassSize || 12} 
                             />
                             <p className="text-xs text-muted-foreground">Maximum students allowed in any group class. Defaults to 12.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Contact Details
                        </CardTitle>
                        <CardDescription>Displayed in footer and contact page</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input id="contactEmail" name="contactEmail" defaultValue={settings?.contactEmail || ""} placeholder="support@kidokool.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input id="contactPhone" name="contactPhone" defaultValue={settings?.contactPhone || ""} placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactAddress">Address</Label>
                            <Input id="contactAddress" name="contactAddress" defaultValue={settings?.contactAddress || ""} placeholder="123 Education St, Learning City" />
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5" />
                            Social Media
                        </CardTitle>
                        <CardDescription>Links to your social profiles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="facebook">Facebook</Label>
                                <Input id="facebook" name="facebook" defaultValue={settings?.facebook || ""} placeholder="https://facebook.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twitter">Twitter (X)</Label>
                                <Input id="twitter" name="twitter" defaultValue={settings?.twitter || ""} placeholder="https://x.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram</Label>
                                <Input id="instagram" name="instagram" defaultValue={settings?.instagram || ""} placeholder="https://instagram.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input id="linkedin" name="linkedin" defaultValue={settings?.linkedin || ""} placeholder="https://linkedin.com/in/..." />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Razorpay Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment Gateway (Razorpay)
                        </CardTitle>
                        <CardDescription>Configure your Razorpay credentials for payments</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                                <Input 
                                    id="razorpayKeyId" 
                                    name="razorpayKeyId" 
                                    defaultValue={settings?.razorpayKeyId || ""} 
                                    placeholder="rzp_live_..." 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                                <Input 
                                    id="razorpayKeySecret" 
                                    name="razorpayKeySecret" 
                                    type="password"
                                    defaultValue={settings?.razorpayKeySecret || ""} 
                                    placeholder="••••••••••••••••" 
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            These credentials are used to process all payments (Course Purchases, Wallet Recharges). 
                            Get them from your <a href="https://dashboard.razorpay.com/app/website-app-settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Razorpay Dashboard</a>.
                        </p>
                    </CardContent>
                </Card>

                {/* Footer Links */}
                <FooterLinksEditor initialData={(settings as any)?.footerLinks} />

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isPending}>
                        {isPending ? "Saving Changes..." : "Save All Changes"}
                    </Button>
                </div>
            </form>

            {/* Password Change Section - Author: Sanket */}
            <ChangePasswordForm />
        </div>
    );
}
