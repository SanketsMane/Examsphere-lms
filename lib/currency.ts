
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

export const SUPPORTED_CURRENCIES = [
    { name: "United States", code: "USD", symbol: "$", locale: "en-US", defaultRate: 0.012 },
    { name: "United Arab Emirates", code: "AED", symbol: "AED", locale: "en-AE", defaultRate: 0.044 },
    { name: "United Kingdom", code: "GBP", symbol: "£", locale: "en-GB", defaultRate: 0.0095 },
    { name: "European Union", code: "EUR", symbol: "€", locale: "de-DE", defaultRate: 0.011 },
    { name: "Singapore", code: "SGD", symbol: "S$", locale: "en-SG", defaultRate: 0.016 },
    { name: "Canada", code: "CAD", symbol: "C$", locale: "en-CA", defaultRate: 0.016 },
    { name: "Australia", code: "AUD", symbol: "A$", locale: "en-AU", defaultRate: 0.018 },
];

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
    "India": { code: "INR", symbol: "₹", locale: "en-IN", exchangeRate: 1 },
};

// Populate map from supported list
SUPPORTED_CURRENCIES.forEach(c => {
    COUNTRY_CURRENCY_MAP[c.name] = { 
        code: c.code, 
        symbol: c.symbol, 
        locale: c.locale, 
        exchangeRate: c.defaultRate 
    };
});

// Map common Eurozone countries to EUR - Author: Sanket
const eurConfig = COUNTRY_CURRENCY_MAP["European Union"];
if (eurConfig) {
    ["Germany", "France", "Italy", "Spain", "Netherlands", "Ireland", "Belgium", "Austria"].forEach(country => {
        COUNTRY_CURRENCY_MAP[country] = eurConfig;
    });
}

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
export function formatPrice(amount: number, country?: string | null, overrides?: Record<string, number> | null): string {
    const config = getCurrencyConfig(country);
    
    // Amount is assumed to be in subunits (cents/paise) of the BASE currency (INR)
    // Convert to target currency - Author: Sanket
    const rate = overrides?.[config.code] ?? config.exchangeRate;
    const convertedAmount = (amount / 100) * rate;

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
export function formatPriceSimple(amountInBaseUnits: number, country?: string | null, overrides?: Record<string, number> | null): string {
    const config = getCurrencyConfig(country);
    
    if (amountInBaseUnits === 0) return "Free";

    const rate = overrides?.[config.code] ?? config.exchangeRate;
    const convertedValue = amountInBaseUnits * rate;

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
