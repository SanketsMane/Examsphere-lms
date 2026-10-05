"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createCoupon } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateCouponPage() {
   // Since createCoupon redirects, we stick to basic form action
   // Could enhance with useActionState for errors. (Simplified for beta)

   return (
    <div className="max-w-2xl mx-auto p-6">
        <Card>
            <CardHeader>
                <CardTitle>Create New Coupon</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={async (formData) => {
                    await createCoupon(formData);
                }} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <Input id="code" name="code" placeholder="SUMMER50" required className="uppercase font-mono" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Discount Type</Label>
                            <Select name="type" defaultValue="PERCENTAGE">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                    <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Value</Label>
                            <Input id="value" name="value" type="number" min="0" required placeholder="50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Applicable On (Optional - Leave empty for global)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {["DEMO", "GROUP", "30MIN", "60MIN", "CRASH_COURSE", "FULL_COURSE"].map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <Checkbox id={`app-${type}`} name="applicableOn" value={type} />
                                    <Label htmlFor={`app-${type}`} className="text-sm font-normal">{type}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="usageLimit">Total Usage Limit</Label>
                            <Input id="usageLimit" name="usageLimit" type="number" min="1" defaultValue="100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="perUserLimit">Limit Per User</Label>
                            <Input id="perUserLimit" name="perUserLimit" type="number" min="1" defaultValue="1" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input id="expiryDate" name="expiryDate" type="date" required />
                    </div>

                    <Button type="submit" className="w-full">Create Coupon</Button>
                </form>
            </CardContent>
        </Card>
    </div>
   );
}
