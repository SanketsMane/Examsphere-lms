"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveBankDetails } from "@/app/actions/teacher-verification";

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function BankDetailsForm({ initialData }: { initialData?: any }) {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        const ifsc = String(formData.get("bankRoutingNumber") || "").trim().toUpperCase();
        if (!IFSC_PATTERN.test(ifsc)) {
            toast.error("Enter a valid 11-character IFSC code (e.g. SBIN0001234)");
            return;
        }

        const data = {
            bankAccountName: formData.get("bankAccountName") as string,
            bankAccountNumber: formData.get("bankAccountNumber") as string,
            // DB column is still bankRoutingNumber; it now holds the IFSC code.
            bankRoutingNumber: ifsc,
        };

        startTransition(async () => {
            try {
                await saveBankDetails(data);
                toast.success("Bank details saved successfully");
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to save bank details");
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle>Bank Account Details</CardTitle>
                        <CardDescription>
                            Indian bank account for receiving payouts in INR
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bankAccountName">Account Holder Name</Label>
                            <Input id="bankAccountName" name="bankAccountName" defaultValue={initialData?.bankAccountName || ""} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankAccountNumber">Account Number</Label>
                            <Input
                                id="bankAccountNumber"
                                name="bankAccountNumber"
                                type="text"
                                inputMode="numeric"
                                pattern="\d{9,18}"
                                title="9-18 digit account number"
                                defaultValue={initialData?.bankAccountNumber || ""}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankRoutingNumber">IFSC Code</Label>
                            <Input
                                id="bankRoutingNumber"
                                name="bankRoutingNumber"
                                placeholder="e.g. SBIN0001234"
                                maxLength={11}
                                className="uppercase"
                                defaultValue={initialData?.bankRoutingNumber || ""}
                                required
                            />
                            <p className="text-xs text-muted-foreground">11 characters, printed on your cheque book or passbook.</p>
                        </div>
                    </div>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Bank Details
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
