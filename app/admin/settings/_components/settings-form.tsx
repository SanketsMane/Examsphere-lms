"use client";

import { useActionState, useEffect, useState } from "react";
import type { AdminSiteSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSiteSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { Globe, Phone, Share2, CreditCard } from "lucide-react";
import { SettingsImageUpload } from "@/components/ui/settings-image-upload";
import { FooterLinksEditor } from "./footer-links-editor";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { CurrencySettings } from "./CurrencySettings";
import { Slider } from "@/components/ui/slider";

/**
 * Author: Sanket
 */

export function SettingsForm({ settings }: { settings: AdminSiteSettings | null }) {
    const [state, formAction, isPending] = useActionState(updateSiteSettings, {
        message: "",
        success: false
    });

    // Initialize logo and favicon state
    const [logoUrl, setLogoUrl] = useState((settings as any)?.logo || "");
    const [faviconUrl, setFaviconUrl] = useState((settings as any)?.favicon || "");
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
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="siteName">Site Name</Label>
                                    <Input 
                                        id="siteName" 
                                        name="siteName" 
                                        placeholder="ExamSphere"
                                        defaultValue={settings?.siteName || "ExamSphere"} 
                                    />
                                    <p className="text-xs text-muted-foreground">The display name for your platform.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siteUrl">Site URL</Label>
                                    <Input id="siteUrl" name="siteUrl" type="url" defaultValue={settings?.siteUrl || ""} placeholder="https://examsphere.online" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Favicon</Label>
                                    <input type="hidden" name="favicon" value={faviconUrl} />
                                    <SettingsImageUpload
                                        value={faviconUrl}
                                        onChange={setFaviconUrl}
                                        label="Favicon"
                                    />
                                    <p className="text-xs text-muted-foreground">Recommended: 32x32 or 64x64px ICO/PNG.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Logo</Label>
                                    <input type="hidden" name="logo" value={logoUrl} />
                                    <SettingsImageUpload
                                        value={logoUrl}
                                        onChange={setLogoUrl}
                                        label="Logo"
                                    />
                                    <p className="text-xs text-muted-foreground">Transparent PNG recommended. Wide logos supported.</p>
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
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                             <Label htmlFor="maxGroupClassSize">Global Max Group Class Size</Label>
                             <Input 
                                id="maxGroupClassSize" 
                                name="maxGroupClassSize" 
                                type="number" 
                                min="1"
                                defaultValue={settings?.maxGroupClassSize || 12} 
                             />
                             <p className="text-xs text-muted-foreground">Maximum students allowed in any group class.</p>
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
                                <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings?.contactEmail || ""} placeholder="support@examsphere.online" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input id="contactPhone" name="contactPhone" type="tel" pattern="\+?[0-9 ()\-]{7,20}" defaultValue={settings?.contactPhone || ""} placeholder="+91 98765 43210" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactAddress">Address</Label>
                            <Input id="contactAddress" name="contactAddress" defaultValue={settings?.contactAddress || ""} placeholder="2nd Floor, Shivaji Nagar, Pune, Maharashtra 411005" />
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
                                <Input id="facebook" name="facebook" type="url" defaultValue={settings?.facebook || ""} placeholder="https://facebook.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twitter">Twitter (X)</Label>
                                <Input id="twitter" name="twitter" type="url" defaultValue={settings?.twitter || ""} placeholder="https://x.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagram">Instagram</Label>
                                <Input id="instagram" name="instagram" type="url" defaultValue={settings?.instagram || ""} placeholder="https://instagram.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input id="linkedin" name="linkedin" type="url" defaultValue={settings?.linkedin || ""} placeholder="https://linkedin.com/in/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="youtube">YouTube</Label>
                                <Input id="youtube" name="youtube" type="url" defaultValue={settings?.youtube || ""} placeholder="https://youtube.com/@..." />
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
                                    autoComplete="new-password"
                                    placeholder={settings?.hasRazorpayKeySecret ? "•••••••• saved — leave blank to keep" : "Not set"}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="razorpayWebhookSecret">Razorpay Webhook Secret</Label>
                            <Input
                                id="razorpayWebhookSecret"
                                name="razorpayWebhookSecret"
                                type="password"
                                autoComplete="new-password"
                                placeholder={settings?.hasRazorpayWebhookSecret ? "•••••••• saved — leave blank to keep" : "Not set"}
                             />
                             <p className="text-[10px] text-muted-foreground">This secret is used to verify that webhook calls are legitimate and come from Razorpay.</p>
                        </div>
                        {(settings?.hasRazorpayKeySecret || settings?.hasRazorpayWebhookSecret) && (
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input type="checkbox" name="clearRazorpaySecrets" className="h-4 w-4" />
                                Remove saved Razorpay key secret and webhook secret
                            </label>
                        )}
                    </CardContent>
                </Card>

                {/* Currency Exchange Rates - Author: Sanket */}
                <CurrencySettings initialRates={(settings as any)?.currencyRates} />

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
