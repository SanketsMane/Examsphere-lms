"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSubscriptionPlan, updateSubscriptionPlan } from "@/app/actions/admin-subscriptions";
import { toast } from "sonner";
import { SubscriptionPlan, UserRole } from "@prisma/client";
import { IconPlus, IconEdit } from "@tabler/icons-react";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useEffect } from "react";

interface SubscriptionPlanDialogProps {
    plan?: SubscriptionPlan;
    trigger?: React.ReactNode;
}

export function SubscriptionPlanDialog({ plan, trigger }: SubscriptionPlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [userCountry, setUserCountry] = useState<string>("India");

    useEffect(() => {
        const fetchUser = async () => {
            const { data: session } = await authClient.getSession();
            if (session?.user) {
                setUserCountry((session.user as any).country || "India");
            }
        };
        fetchUser();
    }, []);

    const { symbol: s } = getCurrencyConfig(userCountry);

    const [formData, setFormData] = useState({
        name: plan?.name || "",
        description: plan?.description || "",
        price: plan?.price || 0,
        role: plan?.role || "TEACHER",
        features: plan?.features.join("\n") || "",
        razorpayPlanId: plan?.razorpayPlanId || "",
        searchBoost: plan?.metadata ? (plan.metadata as any).searchBoost : 1,
        commissionRate: plan?.metadata ? (plan.metadata as any).commissionRate : 20,
        maxCourses: plan?.metadata ? (plan.metadata as any).maxCourses : 3,
        maxGroups: plan?.metadata ? (plan.metadata as any).maxGroups : 2,
        maxCourseEnrollments: plan?.metadata ? (plan.metadata as any).maxCourseEnrollments : 5,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const featuresArray = formData.features.split("\n").filter(line => line.trim() !== "");
        
        const metadata = {
            searchBoost: Number(formData.searchBoost),
            commissionRate: Number(formData.commissionRate),
            maxCourses: Number(formData.maxCourses),
            maxGroups: Number(formData.maxGroups),
            maxCourseEnrollments: Number(formData.maxCourseEnrollments),
        };

        const payload = {
            name: formData.name,
            description: formData.description,
            price: Number(formData.price),
            role: formData.role as UserRole,
            features: featuresArray,
            razorpayPlanId: formData.razorpayPlanId,
            metadata
        };

        try {
            if (plan) {
                const res = await updateSubscriptionPlan(plan.id, payload as any);
                if (res.error) throw new Error(res.error);
                toast.success("Plan updated successfully");
            } else {
                const res = await createSubscriptionPlan(payload as any);
                if (res.error) throw new Error(res.error);
                toast.success("Plan created successfully");
            }
            setOpen(false);
            if (!plan) {
                // Reset form only on create
                setFormData({
                    name: "", description: "", price: 0, role: "TEACHER", features: "", razorpayPlanId: "", 
                    searchBoost: 1, commissionRate: 20, maxCourses: 3, maxGroups: 2, maxCourseEnrollments: 5
                });
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={plan ? "ghost" : "default"} size={plan ? "icon" : "sm"}>
                        {plan ? <IconEdit className="h-4 w-4" /> : <><IconPlus className="h-4 w-4 mr-2" />Add Plan</>}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                    <DialogDescription>
                        Configure the subscription plan details, pricing, and features.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Plan Name</Label>
                            <Input 
                                required 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Premium Teacher"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price ({s})</Label>
                            <Input 
                                type="number" 
                                required 
                                min="0"
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select 
                            value={formData.role} 
                            onValueChange={(val) => setFormData({...formData, role: val as UserRole})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TEACHER">Teacher</SelectItem>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Features (One per line)</Label>
                        <Textarea 
                            rows={4}
                            value={formData.features}
                            onChange={e => setFormData({...formData, features: e.target.value})}
                            placeholder="Valid for 1 month&#10;10% Commission&#10;Priority Support"
                        />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                             <Label>Max Courses</Label>
                             <Input 
                                type="number"
                                value={formData.maxCourses}
                                onChange={e => setFormData({...formData, maxCourses: Number(e.target.value)})}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label>Max Groups</Label>
                             <Input 
                                type="number"
                                value={formData.maxGroups}
                                onChange={e => setFormData({...formData, maxGroups: Number(e.target.value)})}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label>Max Enrollments</Label>
                             <Input 
                                type="number"
                                value={formData.maxCourseEnrollments}
                                onChange={e => setFormData({...formData, maxCourseEnrollments: Number(e.target.value)})}
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Commission Rate (%)</Label>
                             <Input 
                                type="number"
                                value={formData.commissionRate}
                                onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
                             />
                        </div>
                        <div className="space-y-2">
                             <Label>Search Boost Factor</Label>
                             <Input 
                                type="number"
                                value={formData.searchBoost}
                                onChange={e => setFormData({...formData, searchBoost: Number(e.target.value)})}
                             />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Razorpay Plan ID (Recurring)</Label>
                        <Input 
                             value={formData.razorpayPlanId}
                             onChange={e => setFormData({...formData, razorpayPlanId: e.target.value})}
                             placeholder="plan_H3..."
                        />
                        <p className="text-xs text-muted-foreground">Required for recurring payments via Razorpay.</p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Plan"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
