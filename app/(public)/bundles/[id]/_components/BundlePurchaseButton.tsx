"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentSelectionDialog } from "@/components/payment/PaymentSelectionDialog";
import { useRazorpay } from "@/components/payment/use-razorpay";
import { purchaseBundle } from "@/app/actions/bundles";
import { toast } from "sonner";
import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

interface BundlePurchaseButtonProps {
    bundleId: string;
    price: number;
    title: string;
    disabled?: boolean;
}

export function BundlePurchaseButton({ bundleId, price, title, disabled }: BundlePurchaseButtonProps) {
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const { openCheckout } = useRazorpay();
    const router = useRouter();

    const handleWalletPayment = async () => {
        try {
            const result = await purchaseBundle(bundleId, "wallet") as any;
            
            if (result.success) {
                toast.success("Bundle purchased successfully!");
                setShowPaymentDialog(false);
                setTimeout(() => {
                    router.push("/dashboard/sessions?tab=bundles&purchase=success");
                }, 1500);
            } else {
                throw new Error(result.error || "Wallet payment failed");
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRazorpayCheckout = async () => {
        try {
            const data = await purchaseBundle(bundleId, "razorpay") as any;

            if (data.error) throw new Error(data.error);

            await openCheckout({
                orderId: data.orderId,
                keyId: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "Bundle Purchase",
                description: title,
                user: data.user,
                onSuccess: (paymentId) => {
                    toast.success("Payment successful!");
                    setShowPaymentDialog(false);
                    setTimeout(() => {
                        router.push("/dashboard/sessions?tab=bundles&purchase=success");
                    }, 1500);
                },
                onError: (err) => {
                    toast.error("Payment failed. Please try again.");
                }
            });
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <Button 
                size="lg" 
                className="w-full" 
                onClick={() => setShowPaymentDialog(true)}
                disabled={disabled || loading}
            >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Bundle
            </Button>

            <PaymentSelectionDialog 
                open={showPaymentDialog}
                onOpenChange={setShowPaymentDialog}
                amount={price}
                itemType="bundle"
                itemTitle={title}
                onPaymentCheckout={handleRazorpayCheckout}
                onWalletPayment={handleWalletPayment}
            />
        </>
    );
}
