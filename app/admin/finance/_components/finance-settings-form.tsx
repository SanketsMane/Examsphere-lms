"use client";

import { useActionState, useEffect, useState } from "react";
import { updateFinanceSettings } from "@/app/actions/finance-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LucideWallet, LucidePercent, LucideDollarSign, Loader2, CreditCard, Coins } from "lucide-react";
import { getCurrencyConfig } from "@/lib/currency"; // Added for localization - Author: Sanket

interface FinanceSettingsFormProps {
    initialData: any;
}

/**
 * Dedicated form for Financial Controls
 * @author Sanket
 */
export function FinanceSettingsForm({ initialData }: FinanceSettingsFormProps) {
    const [state, formAction] = useActionState(updateFinanceSettings, null);
    const [isPending, setIsPending] = useState(false); // Added - Author: Sanket
    const currencyConfig = getCurrencyConfig("India"); // Admin default is usually site default or India for now

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Platform Earning Section */}
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="bg-blue-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <LucidePercent className="h-5 w-5" />
                            Platform Revenue
                        </CardTitle>
                        <CardDescription>Configure how much the platform earns from transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="platformCommission">Platform Commission (%)</Label>
                            <div className="relative">
                                <Input
                                    id="platformCommission"
                                    name="platformCommission"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.platformCommission || 20}
                                    className="pr-10"
                                    placeholder="e.g. 20"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">The percentage taken from every successful course purchase or live session booking.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Tax Configuration */}
                <Card className="border-orange-100 shadow-sm">
                    <CardHeader className="bg-orange-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <LucideDollarSign className="h-5 w-5" />
                            Taxation (GST)
                        </CardTitle>
                        <CardDescription>Manage tax rates for your region (Inclusive logic)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
                            <div className="relative">
                                <Input
                                    id="gstPercentage"
                                    name="gstPercentage"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.gstPercentage || 0.0}
                                    className="pr-10"
                                    placeholder="18.00"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">GST is calculated as inclusive in the total price (Base = Total / (1 + GST/100)).</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Wallet Safeguards */}
                <Card className="border-indigo-100 shadow-sm">
                    <CardHeader className="bg-indigo-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                            <LucideWallet className="h-5 w-5" />
                            Wallet Safeguards
                        </CardTitle>
                        <CardDescription>Control minimum limits for wallet transactions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="minWalletRecharge">Min Wallet Recharge ({initialData?.currencyCode || currencyConfig.code})</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{initialData?.currencySymbol || currencyConfig.symbol}</span>
                                <Input
                                    id="minWalletRecharge"
                                    name="minWalletRecharge"
                                    type="number"
                                    defaultValue={initialData?.minWalletRecharge || 100}
                                    className="pl-7"
                                    placeholder={`e.g. ${currencyConfig.symbol}100`}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Minimum amount a student can add to their wallet at once.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minWithdrawal">Min Withdrawal ({initialData?.currencyCode || currencyConfig.code})</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{initialData?.currencySymbol || currencyConfig.symbol}</span>
                                <Input
                                    id="minWithdrawal"
                                    name="minWithdrawal"
                                    type="number"
                                    defaultValue={initialData?.minWithdrawal || 500}
                                    className="pl-7"
                                    placeholder={`e.g. ${currencyConfig.symbol}500`}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">Minimum amount a user can withdraw from their wallet at once.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Localization */}
                <Card className="border-slate-100 shadow-sm">
                    <CardHeader className="bg-slate-50/50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-slate-700">
                            <CreditCard className="h-5 w-5" />
                            Localization & Currency
                        </CardTitle>
                        <CardDescription>Set the display currency for the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="currencyCode">Currency Code</Label>
                                <Input 
                                    id="currencyCode" 
                                    name="currencyCode" 
                                    defaultValue={initialData?.currencyCode || "INR"}
                                    placeholder="INR"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                                <Input 
                                    id="currencySymbol" 
                                    name="currencySymbol" 
                                    defaultValue={initialData?.currencySymbol || "₹"}
                                    placeholder="₹"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end p-4 bg-muted/30 rounded-xl border border-dashed">
                <Button type="submit" size="lg" disabled={isPending} className="px-10">
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Settings...
                        </>
                    ) : (
                        "Update Financial Controls"
                    )}
                </Button>
            </div>
        </form>
    );
}
