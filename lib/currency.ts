
export const CURRENCIES = {
  INR: { code: "INR", symbol: "₹", factor: 1 },
  USD: { code: "USD", symbol: "$", factor: 0.012 }, // Approx conversion from INR
  AED: { code: "AED", symbol: "AED", factor: 0.044 }, // Approx conversion from INR
};

export type CurrencyCode = keyof typeof CURRENCIES;

export const countryToCurrency = (country?: string | null): CurrencyCode => {
  if (!country) return "INR";
  
  const normalizedCountry = country.toLowerCase().trim();
  
  if (normalizedCountry === "india") return "INR";
  if (normalizedCountry === "uae" || normalizedCountry === "united arab emirates" || normalizedCountry === "dubai") return "AED";
  if (normalizedCountry === "usa" || normalizedCountry === "united states") return "USD";
  
  return "INR"; // Default to INR
};

export const getCurrencyData = (country?: string | null) => {
  const code = countryToCurrency(country);
  return CURRENCIES[code];
};

export const convertPrice = (priceInUsd: number, country?: string | null) => {
  const currency = getCurrencyData(country);
  return Math.round(priceInUsd * currency.factor);
};
