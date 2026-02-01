"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRazorpay } from "@/components/payment/use-razorpay";

interface CoursePurchaseButtonProps {
    courseId: string;
    price: number;
}

export const CoursePurchaseButton = ({
    courseId,
    price,
}: CoursePurchaseButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const { openCheckout } = useRazorpay();

    const onEnroll = async () => {
        try {
            setIsLoading(true);

            if (price === 0) {
                // Direct Enrollment for Free Courses
                const response = await fetch("/api/enroll-free", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ courseId }),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        toast.error("Please login to enroll");
                        window.location.href = "/login";
                        return;
                    }
                    throw new Error("Enrollment failed");
                }

                toast.success("Enrolled successfully! Redirecting...");
                window.location.reload();
                return;
            } else {
                // Razorpay Checkout for Paid Courses
                const response = await fetch("/api/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ 
                        courseId,
                        couponCode: couponCode.trim() || undefined
                    }),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        toast.error("Please login to purchase");
                        window.location.href = "/login";
                        return;
                    }
                    const errorMsg = await response.text();
                    throw new Error(errorMsg || "Checkout failed");
                }

                const data = await response.json();
                
                // Open Razorpay Checkout
                await openCheckout({
                    orderId: data.orderId,
                    keyId: data.keyId,
                    amount: data.amount,
                    currency: data.currency,
                    name: data.courseName,
                    description: data.courseDescription,
                    user: data.user,
                    onSuccess: (paymentId) => {
                        toast.success("Payment successful! Redirecting...");
                        window.location.href = `/courses/${data.courseName.toLowerCase().replace(/\s+/g, '-')}/?success=1`;
                         // Fallback reload if slug construction is risky, but ideally backend provided URL or we reload
                         window.location.reload(); 
                    },
                    onError: (err) => {
                        console.error(err);
                        toast.error("Payment failed or cancelled");
                    }
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (price === 0) {
        return (
            <Button
                onClick={onEnroll}
                disabled={isLoading}
                className="w-full text-lg h-12 font-bold"
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Enroll for Free
            </Button>
        );
    }

    return (
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
            <DialogTrigger asChild>
                <Button className="w-full text-lg h-12 font-bold">
                    Enroll for ₹{price}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Complete Enrollment</DialogTitle>
                    <DialogDescription>
                        You are about to enroll in this course.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="coupon">Have a coupon?</Label>
                        <Input
                            id="coupon"
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between font-medium">
                        <span>Course Price:</span>
                        <span>₹{price}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onEnroll} disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Proceed to Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
