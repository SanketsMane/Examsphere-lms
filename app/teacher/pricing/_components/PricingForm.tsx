"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateTeacherPricing } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PricingItem {
    type: string;
    price: number;
    duration: number;
}

interface PricingFormProps {
    pricing: any[];
    allowFreeDemo: boolean;
    allowFreeGroup: boolean;
    teacherId?: string;
}

const SESSION_TYPES = [
    { type: "DEMO", label: "Demo Class", defaultDuration: 30 },
    { type: "THIRTY_MIN", label: "30 Minute Session", defaultDuration: 30 },
    { type: "SIXTY_MIN", label: "60 Minute Session", defaultDuration: 60 },
    { type: "GROUP", label: "Group Class (Base Price)", defaultDuration: 60 },
    { type: "CRASH_COURSE", label: "Crash Course (Base Price)", defaultDuration: 0 },
    { type: "FULL_COURSE", label: "Full Course (Base Price)", defaultDuration: 0 },
];

export function PricingForm({ pricing, allowFreeDemo, allowFreeGroup }: PricingFormProps) {
    /**
     * Teacher pricing configuration form.
     * Allows toggling free trials and setting session rates.
     * Author: Sanket
     */
    const [isLoading, setIsLoading] = useState(false);
    
    // Initialize state
    const [config, setConfig] = useState({
        allowFreeDemo,
        allowFreeGroup
    });

    const [prices, setPrices] = useState<PricingItem[]>(() => {
        return SESSION_TYPES.map(t => {
            const existing = pricing.find(p => p.type === t.type);
            return {
                type: t.type,
                price: existing ? existing.price : 0,
                duration: existing ? existing.duration : t.defaultDuration
            };
        });
    });

    const handlePriceChange = (type: string, field: 'price' | 'duration', value: number) => {
        setPrices(prev => prev.map(p => 
            p.type === type ? { ...p, [field]: value } : p
        ));
    };

    const onSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await updateTeacherPricing({
                ...config,
                pricing: prices
            });

            if (result.success) {
                toast.success("Pricing updated successfully");
            } else {
                toast.error(result.error || "Failed to update pricing");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Free Trials</CardTitle>
                    <CardDescription>Configure your free session offerings. Note: Students are limited to 1 free demo and 1 free group class lifetime.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="demo-toggle">Allow Free Demo Class</Label>
                            <span className="text-sm text-muted-foreground">Enable potential students to book a free 30-minute demo with you.</span>
                        </div>
                        <Switch 
                            id="demo-toggle" 
                            checked={config.allowFreeDemo}
                            onCheckedChange={(c) => setConfig({...config, allowFreeDemo: c})}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="group-toggle">Allow Free Group Class</Label>
                            <span className="text-sm text-muted-foreground">Allow students to join their first group class for free (if you set price to 0).</span>
                        </div>
                        <Switch 
                            id="group-toggle" 
                            checked={config.allowFreeGroup}
                            onCheckedChange={(c) => setConfig({...config, allowFreeGroup: c})}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Session Pricing</CardTitle>
                    <CardDescription>Set your standard rates in whole rupees. Students can only book 1-on-1 sessions once the 30 or 60 minute price is set above ₹0.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {SESSION_TYPES.map((type) => {
                        const current = prices.find(p => p.type === type.type)!;
                        return (
                            <div key={type.type} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex flex-col justify-center">
                                    <Label className="font-semibold text-base">{type.label}</Label>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1.5 block">Price (₹ INR)</Label>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        value={current.price}
                                        onChange={(e) => handlePriceChange(type.type, 'price', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                {type.defaultDuration > 0 && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1.5 block">Duration (Min)</Label>
                                        <Input 
                                            type="number" 
                                            min="15"
                                            value={current.duration}
                                            onChange={(e) => handlePriceChange(type.type, 'duration', parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={onSubmit} disabled={isLoading} className="w-full md:w-auto">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
