
/**
 * Author: Sanket
 * Unified currency utility for Kidokool LMS.
 * Handles adaptive pricing based on user country.
 */

export interface CurrencyConfig {
    code: string;
    symbol: string;
    locale: string;
    exchangeRate: number; // Rate relative to INR (base currency) - Author: Sanket
}

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
    "India": { code: "INR", symbol: "₹", locale: "en-IN", exchangeRate: 1 },
    "United States": { code: "USD", symbol: "$", locale: "en-US", exchangeRate: 0.012 }, // 1 INR ~ 0.012 USD
    "United Arab Emirates": { code: "AED", symbol: "AED", locale: "en-AE", exchangeRate: 0.044 }, // 1 INR ~ 0.044 AED
    "United Kingdom": { code: "GBP", symbol: "£", locale: "en-GB", exchangeRate: 0.0095 },
    "European Union": { code: "EUR", symbol: "€", locale: "de-DE", exchangeRate: 0.011 },
    "Singapore": { code: "SGD", symbol: "S$", locale: "en-SG", exchangeRate: 0.016 },
    "Canada": { code: "CAD", symbol: "C$", locale: "en-CA", exchangeRate: 0.016 },
    "Australia": { code: "AUD", symbol: "A$", locale: "en-AU", exchangeRate: 0.018 },
};

const DEFAULT_CURRENCY: CurrencyConfig = { code: "INR", symbol: "₹", locale: "en-IN", exchangeRate: 1 };

/**
 * Gets currency configuration based on user country.
 * Author: Sanket
 */
export function getCurrencyConfig(country?: string | null): CurrencyConfig {
    if (!country) return DEFAULT_CURRENCY;
    return COUNTRY_CURRENCY_MAP[country] || DEFAULT_CURRENCY;
}

/**
 * Formats a price value (in cents/paise) to a localized currency string.
 * Author: Sanket
 */
export function formatPrice(amount: number, country?: string | null): string {
    const config = getCurrencyConfig(country);
    
    // Amount is assumed to be in subunits (cents/paise) of the BASE currency (INR)
    // Convert to target currency - Author: Sanket
    const convertedAmount = (amount / 100) * config.exchangeRate;

    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(convertedAmount);
}

/**
 * Simple helper for course/pricing cards where we might just need the symbol and value.
 * Converts from base numeric units (e.g. 500 INR) to target.
 * Author: Sanket
 */
export function formatPriceSimple(amountInBaseUnits: number, country?: string | null): string {
    const config = getCurrencyConfig(country);
    
    if (amountInBaseUnits === 0) return "Free";

    const convertedValue = amountInBaseUnits * config.exchangeRate;

    // For simple display, we can round or show 2 decimals if it's USD/AED
    const formattedValue = convertedValue.toLocaleString(config.locale, {
        minimumFractionDigits: config.code === "INR" ? 0 : 2,
        maximumFractionDigits: 2
    });

    return `${config.symbol}${formattedValue}`;
}

/**
 * Legacy support for components using getCurrencyData
 * Adapter to match the new configuration structure.
 * Author: Sanket
 */
export function getCurrencyData(country?: string | null) {
    const config = getCurrencyConfig(country);
    return {
        ...config,
        factor: config.exchangeRate
    };
}

/**
 * Legacy support for converting price.
 * Converts a USD amount to local currency value (numeric).
 * Author: Sanket
 */
export function convertPrice(amount: number, country?: string | null): number {
    const config = getCurrencyConfig(country);
    return amount * config.exchangeRate;
}
