"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestPayout } from "@/app/actions/teacher-payouts";
import { formatPrice } from "@/lib/currency"; // Updated to use unified currency logic - Author: Sanket
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Switching to sonner if use-toast not standard or use user's prefered

import { getCurrencyData, convertPrice } from "@/lib/currency";

export function WithdrawForm({ balance, userId, country }: { balance: number, userId: string, country?: string | null }) {
    const [loading, setLoading] = useState(false);
    const currency = getCurrencyData(country);

    async function onSubmit(formData: FormData) {
        setLoading(true);

        const localAmount = Number(formData.get("amount"));
        const bankAccountName = formData.get("bankAccountName") as string;
        const bankAccountNumber = formData.get("bankAccountNumber") as string;
        const bankName = formData.get("bankName") as string;

        // Convert back to USD for the backend
        const usdAmount = localAmount / currency.factor;

        if (usdAmount <= 0) {
            toast.error("Invalid Amount", { description: "Amount must be greater than 0" });
            setLoading(false);
            return;
        }

        if (usdAmount > balance) {
            toast.error("Insufficient Funds", { description: "Amount exceeds available balance" });
            setLoading(false);
            return;
        }

        try {
            const result = await requestPayout({
                amount: usdAmount,
                bankAccountName,
                bankAccountNumber,
                bankName
            });

            if (result.error) {
                toast.error("Request Failed", { description: result.error });
            } else {
                toast.success("Request Sent", { description: "Payout request submitted successfully" });
            }
        } catch (error) {
            toast.error("Error", { description: "Something went wrong" });
        } finally {
            setLoading(false);
        }
    }

    const localBalance = convertPrice(balance, country);

    return (
        <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="amount">Withdraw Amount ({currency.code})</Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">{currency.symbol}</span>
                    <Input
                        id="amount"
                        name="amount"
                        type="number"
                        min={convertPrice(10, country)}
                        max={localBalance}
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        required
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Available: {formatPrice(localBalance, currency.code)}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" name="bankName" required placeholder="e.g. Chase Bank" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bankAccountName">Account Holder Name</Label>
                <Input id="bankAccountName" name="bankAccountName" required placeholder="Full Name" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input id="bankAccountNumber" name="bankAccountNumber" required placeholder="**********" />
            </div>

            <Button type="submit" className="w-full" disabled={loading || balance <= 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Submitting..." : "Submit Payout Request"}
            </Button>
        </form>
    );
}
