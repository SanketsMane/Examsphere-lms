"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPriceSimple } from "@/lib/currency"; // Added for localization - Author: Sanket
import { authClient } from "@/lib/auth-client"; // Added for localization - Author: Sanket
import { useCurrency } from "@/components/providers/CurrencyProvider";

interface PaymentSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    itemType: "course" | "session" | "group" | "bundle";
    itemTitle: string;
    onPaymentCheckout: () => Promise<void>;
    onWalletPayment: () => Promise<void>;
}

/**
 * Payment selection dialog - Choose between Razorpay or Wallet
 * @author Sanket
 */
export function PaymentSelectionDialog({
    open,
    onOpenChange,
    amount,
    itemType,
    itemTitle,
    onPaymentCheckout,
    onWalletPayment
}: PaymentSelectionDialogProps) {
    const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "wallet">("razorpay");
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingBalance, setLoadingBalance] = useState(true);
    const [userCountry, setUserCountry] = useState<string>("India");
    const { rates } = useCurrency();

    // Fetch wallet balance and user country
    useEffect(() => {
        if (open) {
            fetchWalletBalance();
            fetchUserCountry();
        }
    }, [open]);

    const fetchUserCountry = async () => {
        const { data: session } = await authClient.getSession();
        if (session?.user) {
            setUserCountry((session.user as any).country || "India");
        }
    };

    const fetchWalletBalance = async () => {
        setLoadingBalance(true);
        try {
            const response = await fetch("/api/wallet/balance");
            const data = await response.json();
            setWalletBalance(data.balance || 0);
        } catch (error) {
            console.error("Failed to fetch wallet balance:", error);
            setWalletBalance(0);
        } finally {
            setLoadingBalance(false);
        }
    };

    const handleProceed = async () => {
        setLoading(true);
        try {
            if (paymentMethod === "razorpay") {
                await onPaymentCheckout();
            } else {
                await onWalletPayment();
            }
        } catch (error: any) {
            toast.error(error.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    const insufficientBalance = walletBalance !== null && walletBalance < amount;
    const canProceed = paymentMethod === "razorpay" || (paymentMethod === "wallet" && !insufficientBalance);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Payment Method</DialogTitle>
                    <DialogDescription>
                        Choose how you'd like to pay for "{itemTitle}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Amount Display */}
                    <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Amount</span>
                            <span className="text-2xl font-bold">{formatPriceSimple(amount, userCountry, rates)}</span>
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "razorpay" | "wallet")}>
                        {/* Razorpay Option */}
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="razorpay" id="razorpay" />
                            <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <CreditCard className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Razorpay (Cards/UPI/Netbanking)</p>
                                        <p className="text-sm text-muted-foreground">Pay securely via Razorpay</p>
                                    </div>
                                </div>
                            </Label>
                        </div>

                        {/* Wallet Option */}
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value="wallet" id="wallet" disabled={loadingBalance} />
                            <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Wallet className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">Wallet Balance</p>
                                            {loadingBalance ? (
                                                <p className="text-sm text-muted-foreground">Loading balance...</p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Available: {formatPriceSimple(walletBalance || 0, userCountry, rates)}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>

                    {/* Insufficient Balance Warning */}
                    {paymentMethod === "wallet" && insufficientBalance && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Insufficient wallet balance. You need {formatPriceSimple(amount - (walletBalance || 0), userCountry, rates)} more.
                                <Button
                                    variant="link"
                                    className="p-0 h-auto ml-1"
                                    onClick={() => window.open("/dashboard/wallet", "_blank")}
                                >
                                    Add money to wallet
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Proceed Button */}
                    <Button
                        onClick={handleProceed}
                        disabled={!canProceed || loading || loadingBalance}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {paymentMethod === "razorpay" ? "Proceed to Checkout" : `Pay ${formatPriceSimple(amount, userCountry, rates)} from Wallet`}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
