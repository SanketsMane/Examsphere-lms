"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRazorpay } from "@/components/payment/use-razorpay";
import { getCurrencyConfig, formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket

interface RechargeDialogProps {
    children: React.ReactNode;
    minRecharge?: number;
    currencyCode?: string;
    userCountry?: string | null; // Added for localization - Author: Sanket
}

/**
 * Dialog component for wallet recharge
 * @author Sanket
 */
export function RechargeDialog({ 
    children,
    minRecharge = 100,
    currencyCode = "INR",
    userCountry = "India"
}: RechargeDialogProps) {
    const config = getCurrencyConfig(userCountry);
    const currencySymbol = config.symbol;
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const { openCheckout } = useRazorpay();

    const quickAmounts = [100, 500, 1000, 2000, 5000];

    const handleRecharge = async () => {
        const amountNum = parseInt(amount);

        if (!amountNum || amountNum < minRecharge) {
            toast.error(`Minimum recharge amount is ${currencySymbol}${minRecharge}`);
            return;
        }

        if (amountNum > 100000) {
            toast.error(`Maximum recharge amount is ${currencySymbol}100,000`);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/wallet/recharge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amountNum })
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error && data.error.includes("Gateway Configuration")) {
                    toast.error("Payment gateway is not configured correctly. Please contact support.");
                } else {
                    toast.error(data.error || "Failed to initiate recharge");
                }
                setLoading(false);
                return;
            }

            // Open Razorpay Checkout
            await openCheckout({
                orderId: data.orderId,
                keyId: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "Wallet Recharge",
                description: `Add ${formatPriceSimple(amountNum, userCountry)} to wallet`,
                user: data.user,
                onSuccess: (paymentId: any) => {
                    toast.success("Recharge successful! Updating wallet...");
                    // Add a small delay for webhook to process
                    setTimeout(() => {
                        window.location.href = "/dashboard/wallet?recharge=success";
                    }, 2000);
                },
                onError: (err: any) => {
                    console.error(err);
                    toast.error("Payment failed or cancelled");
                }
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to initiate recharge");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Author: Sanket
     */
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Money to Wallet</DialogTitle>
                    <DialogDescription>
                        Choose an amount or enter a custom value. 1 Point = {currencySymbol}1
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Quick Amount Buttons */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Quick Select</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {quickAmounts.map((amt) => (
                                <Button
                                    key={amt}
                                    variant={amount === amt.toString() ? "default" : "outline"}
                                    onClick={() => setAmount(amt.toString())}
                                    type="button"
                                >
                                    {formatPriceSimple(amt, userCountry)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Amount Input */}
                    <div>
                        <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
                            Custom Amount
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7"
                                min={minRecharge}
                                max={100000}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Min: {formatPriceSimple(minRecharge, userCountry)} | Max: {formatPriceSimple(100000, userCountry)}
                        </p>
                    </div>

                    {/* Summary */}
                    {amount && parseInt(amount) >= minRecharge && (
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Amount</span>
                                <span className="font-semibold">{formatPriceSimple(parseInt(amount), userCountry)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Points to be added</span>
                                <span className="font-semibold text-blue-600">{parseInt(amount).toLocaleString()} Points</span>
                            </div>
                        </div>
                    )}

                    {/* Recharge Button */}
                    <Button
                        onClick={handleRecharge}
                        disabled={!amount || parseInt(amount) < minRecharge || loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Add ${formatPriceSimple(parseInt(amount || "0"), userCountry)} to Wallet`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
