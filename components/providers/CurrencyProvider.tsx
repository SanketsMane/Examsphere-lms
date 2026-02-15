"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { formatPrice as formatPriceStatic, getCurrencyConfig } from "@/lib/currency";

interface CurrencyContextType {
    rates: Record<string, number>;
    formatPrice: (amount: number, country?: string | null) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ 
    children, 
    initialRates 
}: { 
    children: React.ReactNode; 
    initialRates?: Record<string, number> | null 
}) {
    const [rates, setRates] = useState<Record<string, number>>(initialRates || {});

    useEffect(() => {
        if (initialRates) {
            setRates(initialRates);
        }
    }, [initialRates]);

    /**
     * Context-aware formatPrice that uses dynamic rates
     */
    const formatPrice = (amount: number, country?: string | null): string => {
        const config = getCurrencyConfig(country);
        
        // If we have a dynamic rate for this currency code, use it
        // Otherwise fallback to static default in config
        const dynamicRate = rates[config.code];
        const effectiveRate = dynamicRate !== undefined ? dynamicRate : config.exchangeRate;

        // Calculate converted amount
        const convertedAmount = (amount / 100) * effectiveRate;

        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(convertedAmount);
    };

    return (
        <CurrencyContext.Provider value={{ rates, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        // Fallback if used outside provider (e.g. server components trying to use it erroneously, or tests)
        // Returns static formatter
        return { 
            rates: {}, 
            formatPrice: formatPriceStatic 
        };
    }
    return context;
}
