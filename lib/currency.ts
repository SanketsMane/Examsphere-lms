
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", factor: 1 },
  INR: { code: "INR", symbol: "₹", factor: 80 }, // Example conversion rate
  AED: { code: "AED", symbol: "AED", factor: 3.67 }, // Example conversion rate
};

export type CurrencyCode = keyof typeof CURRENCIES;

export const countryToCurrency = (country?: string | null): CurrencyCode => {
  if (!country) return "USD";
  
  const normalizedCountry = country.toLowerCase().trim();
  
  if (normalizedCountry === "india") return "INR";
  if (normalizedCountry === "uae" || normalizedCountry === "united arab emirates" || normalizedCountry === "dubai") return "AED";
  if (normalizedCountry === "usa" || normalizedCountry === "united states") return "USD";
  
  return "USD"; // Default to USD for all except India and Dubai
};

export const getCurrencyData = (country?: string | null) => {
  const code = countryToCurrency(country);
  return CURRENCIES[code];
};

export const convertPrice = (priceInUsd: number, country?: string | null) => {
  const currency = getCurrencyData(country);
  return Math.round(priceInUsd * currency.factor);
};
