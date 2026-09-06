/**
 * Money handling — single source of truth for the unit of stored amounts.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `Course.price`, `Enrollment.amount` and wallet balances are stored as INTEGER
 * MAJOR UNITS (whole rupees). That convention was implicit and two call sites had
 * already drifted apart:
 *
 *   app/api/checkout/route.ts          Math.round(finalPrice * 100)   // rupees -> paise  ✅
 *   app/(public)/courses/[slug]/...    Math.round(course.price)       // treated as paise ❌
 *
 * The second charged 499 paise (₹4.99) for a ₹499 course — a 100x undercharge.
 * Every Razorpay call site must go through `toPaise()` so the conversion exists in
 * exactly one place and cannot drift again.
 *
 * The stored unit is whole rupees because that is what the course form collects
 * ("Price (INR)" with a ₹ prefix) and what `formatPriceSimple()` renders back.
 *
 * Amounts are integers, never floats: `Course.price` is an INT column and JS
 * floating point cannot represent decimal currency exactly.
 */

/** Smallest unit per major unit. INR: 100 paise = ₹1. */
export const MINOR_UNITS_PER_MAJOR = 100;

/** MySQL signed INT max — the ceiling for any amount column in this schema. */
export const MAX_STORED_AMOUNT = 2_147_483_647;

/**
 * Highest price a course may be listed at, in whole rupees.
 *
 * Bounded well below MAX_STORED_AMOUNT so that `toPaise()` (which multiplies by 100)
 * cannot overflow either the INT column or Razorpay's own amount limits.
 */
export const MAX_COURSE_PRICE = 10_000_000; // ₹1,00,00,000

/**
 * Convert stored major units (whole rupees) to the minor units (paise) that
 * payment providers require.
 *
 * @throws if given a non-integer, negative, or out-of-range amount — a bad amount
 *         must fail loudly rather than silently charge the wrong number.
 */
export function toPaise(majorUnits: number): number {
  if (!Number.isFinite(majorUnits)) {
    throw new Error(`Invalid amount: ${majorUnits}`);
  }
  if (!Number.isInteger(majorUnits)) {
    // Rounding here would hide a data bug, and the column is an INT anyway.
    throw new Error(`Amount must be a whole number of rupees, got: ${majorUnits}`);
  }
  if (majorUnits < 0) {
    throw new Error(`Amount cannot be negative, got: ${majorUnits}`);
  }
  const paise = majorUnits * MINOR_UNITS_PER_MAJOR;
  if (paise > MAX_STORED_AMOUNT) {
    throw new Error(`Amount too large to charge: ${majorUnits}`);
  }
  return paise;
}

/**
 * Price a course is actually sold at right now, in whole rupees.
 *
 * A discount applies only when it is set, cheaper than the list price, and either
 * has no expiry or has not expired yet. Anything else falls back to list price, so
 * a malformed discount can never make a course cheaper than intended.
 */
export function effectivePrice(course: {
  price: number;
  discountPrice?: number | null;
  discountExpiry?: Date | null;
}): number {
  const { price, discountPrice, discountExpiry } = course;

  if (discountPrice === null || discountPrice === undefined) return price;
  if (!Number.isInteger(discountPrice) || discountPrice < 0) return price;
  if (discountPrice >= price) return price;
  if (discountExpiry && discountExpiry.getTime() <= Date.now()) return price;

  return discountPrice;
}

/**
 * Format an amount held in MAJOR units (whole rupees) for display.
 *
 * Deliberately separate from `formatPrice()` in lib/currency.ts, which divides by
 * 100 because it expects minor units. Enrollment.amount, Course.price and payout
 * amounts are all stored in major units, so passing them through that helper
 * under-reports every figure by 100x — the admin revenue total showed a Rs 499
 * sale as Rs 4.99.
 *
 * Uses `Intl` grouping for the locale and always shows the currency, so a bare
 * number can never appear on a money screen.
 */
export function formatMoney(
  majorUnits: number,
  opts: { currency?: string; locale?: string; showDecimals?: boolean } = {}
): string {
  const { currency = "INR", locale = "en-IN", showDecimals = false } = opts;
  const value = Number.isFinite(majorUnits) ? majorUnits : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
}

/**
 * Mask an account number, showing only the last 4 digits.
 * Full bank account numbers must never be rendered in a list view.
 */
export function maskAccountNumber(account?: string | null): string {
  if (!account) return "—";
  const trimmed = String(account).replace(/\s+/g, "");
  if (trimmed.length <= 4) return "••••";
  return `•••• ${trimmed.slice(-4)}`;
}
