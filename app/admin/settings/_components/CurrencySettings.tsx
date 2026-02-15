"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CurrencySettingsProps {
    initialRates: Record<string, number> | null;
}

export function CurrencySettings({ initialRates }: CurrencySettingsProps) {
    const [rates, setRates] = useState<Record<string, number>>({});

    // Initialize with props or defaults
    useEffect(() => {
        const baseRates: Record<string, number> = {};
        SUPPORTED_CURRENCIES.forEach(c => {
            baseRates[c.code] = initialRates?.[c.code] ?? c.defaultRate;
        });
        setRates(baseRates);
    }, [initialRates]);

    const handleRateChange = (code: string, value: string) => {
        const numValue = parseFloat(value);
        setRates(prev => ({ ...prev, [code]: isNaN(numValue) ? 0 : numValue }));
    };

    const resetToDefaults = () => {
        const defaults: Record<string, number> = {};
        SUPPORTED_CURRENCIES.forEach(c => {
            defaults[c.code] = c.defaultRate;
        });
        setRates(defaults);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" />
                            Exchange Rates
                        </CardTitle>
                        <CardDescription>
                            Base Currency: <strong>INR (₹)</strong>. Set exchange rates relative to INR.
                        </CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={resetToDefaults}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Defaults
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Hidden input to submit the JSON object */}
                <input type="hidden" name="currencyRates" value={JSON.stringify(rates)} />
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SUPPORTED_CURRENCIES.map((currency) => {
                        const rate = rates[currency.code] ?? currency.defaultRate;
                        // Avoid division by zero
                        const inverse = rate > 0 ? (1 / rate).toFixed(2) : "0";

                        return (
                            <div key={currency.code} className="space-y-2 border p-4 rounded-lg bg-muted/20">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{currency.symbol}</span>
                                        <div>
                                            <Label htmlFor={`rate-${currency.code}`} className="font-bold block">
                                                {currency.code}
                                            </Label>
                                            <span className="text-xs text-muted-foreground">{currency.name}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground">
                                        1 INR = ? {currency.code}
                                    </Label>
                                    <Input
                                        id={`rate-${currency.code}`}
                                        type="number"
                                        step="0.000001"
                                        min="0"
                                        className="font-mono"
                                        value={rate}
                                        onChange={(e) => handleRateChange(currency.code, e.target.value)}
                                    />
                                </div>

                                <div className="pt-2 mt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
                                    <span>Inverse Rate:</span>
                                    <span className="font-mono font-medium">1 {currency.code} ≈ ₹{inverse}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
