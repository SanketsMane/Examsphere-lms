"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateSiteSettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { Globe, Phone, Share2, CreditCard, Coins, Image as ImageIcon } from "lucide-react";
import { SiteSettings } from "@prisma/client";
import { FileUpload } from "@/components/ui/file-upload";
import { FooterLinksEditor } from "./footer-links-editor";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { CurrencySettings } from "./CurrencySettings";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Author: Sanket
 */

export function SettingsForm({ settings }: { settings: SiteSettings | null }) {
    const [state, formAction, isPending] = useActionState(updateSiteSettings, {
        message: "",
        success: false
    });

    // Initialize logo and favicon state
    const [logoUrl, setLogoUrl] = useState((settings as any)?.logo || "");
    const [faviconUrl, setFaviconUrl] = useState((settings as any)?.favicon || "");
    const [logoSize, setLogoSize] = useState((settings as any)?.logoSize || 100);

    const [currencyCode, setCurrencyCode] = useState(settings?.currencyCode || "INR");

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
                                        placeholder="Enter site name (optional)"
                                        defaultValue={settings?.siteName || ""} 
                                    />
                                    <p className="text-xs text-muted-foreground">The display name for your platform.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siteUrl">Site URL</Label>
                                    <Input id="siteUrl" name="siteUrl" defaultValue={settings?.siteUrl || ""} placeholder="https://kidokool.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Favicon</Label>
                                    <input type="hidden" name="favicon" value={faviconUrl} />
                                    <FileUpload
                                        value={faviconUrl}
                                        onChange={setFaviconUrl}
                                        label="Upload Favicon"
                                        onFileSelect={async (file) => {
                                            return new Promise((resolve, reject) => {
                                                const img = new Image();
                                                img.src = URL.createObjectURL(file);
                                                img.onload = () => {
                                                    if (img.width > 128 || img.height > 128) {
                                                        toast.error(`Favicon too large! Max 128x128px. Uploaded: ${img.width}x${img.height}px.`);
                                                        reject(new Error("Image dimensions exceed 128x128px limit"));
                                                    } else {
                                                        resolve(file);
                                                    }
                                                };
                                                img.onerror = () => reject(new Error("Invalid image file"));
                                            });
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Recommended: 32x32px or 64x64px. Max: 128x128px.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
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
                                                        toast.error(`Image too large! Max 512x512px. Uploaded: ${img.width}x${img.height}px.`);
                                                        reject(new Error("Image dimensions exceed 512x512px limit"));
                                                    } else {
                                                        resolve(file);
                                                    }
                                                };
                                                img.onerror = () => reject(new Error("Invalid image file"));
                                            });
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Transparent PNG recommended. Max 512x512px.</p>
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

                {/* Localization Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" />
                            Localization
                        </CardTitle>
                        <CardDescription>Currency and regional settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currencyCode">Default Site Currency</Label>
                                <input type="hidden" name="currencyCode" value={currencyCode} />
                                <Select value={currencyCode} onValueChange={setCurrencyCode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INR">INR (₹)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="AED">AED (AED)</SelectItem>
                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                        <SelectItem value="SGD">SGD (S$)</SelectItem>
                                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                                <Input 
                                    id="currencySymbol" 
                                    name="currencySymbol" 
                                    defaultValue={settings?.currencySymbol || "₹"} 
                                    placeholder="e.g. ₹ or $" 
                                />
                                <p className="text-xs text-muted-foreground">Symbol used for manual displays.</p>
                            </div>
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
                        <div className="space-y-2">
                            <Label htmlFor="razorpayWebhookSecret">Razorpay Webhook Secret</Label>
                            <Input 
                                id="razorpayWebhookSecret" 
                                name="razorpayWebhookSecret" 
                                type="password"
                                defaultValue={(settings as any)?.razorpayWebhookSecret || ""} 
                                placeholder="••••••••••••••••" 
                             />
                             <p className="text-[10px] text-muted-foreground">This secret is used to verify that webhook calls are legitimate and come from Razorpay.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Currency Exchange Rates - Author: Sanket */}
                <CurrencySettings initialRates={(settings as any)?.currencyRates} />

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
