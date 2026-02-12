
import { getCurrencyConfig, formatPrice, formatPriceSimple } from "../lib/currency";

const testCases = [
    { country: "India", amount: 10000, expectedSymbol: "₹", expectedCode: "INR" },
    { country: "United States", amount: 10000, expectedSymbol: "$", expectedCode: "USD" },
    { country: "United Arab Emirates", amount: 10000, expectedSymbol: "AED", expectedCode: "AED" },
    { country: null, amount: 10000, expectedSymbol: "₹", expectedCode: "INR" }, // Default fallback
    { country: "Mars", amount: 10000, expectedSymbol: "₹", expectedCode: "INR" }, // Unknown country fallback
];

console.log("Starting Currency Logic Verification...");

let passed = 0;
let failed = 0;

testCases.forEach((test) => {
    const config = getCurrencyConfig(test.country);
    const formatted = formatPrice(test.amount, test.country);
    const simple = formatPriceSimple(test.amount, test.country);

    console.log(`\nTesting Country: ${test.country}`);
    console.log(`Config Code: ${config.code} (Expected: ${test.expectedCode})`);
    
    let testPassed = true;

    if (config.code !== test.expectedCode) {
        console.error(`❌ Code Mismatch! Got ${config.code}, expected ${test.expectedCode}`);
        testPassed = false;
    }

    if (!formatted.includes(test.expectedSymbol) && !simple.includes(test.expectedSymbol)) {
        // Checking if symbol is present in either formatted string
        // Note: formatPrice might behave differently depending on locale (e.g. "US$")
        console.error(`❌ Symbol Mismatch in output! Formatted: ${formatted}, Simple: ${simple}. Expected symbol: ${test.expectedSymbol}`);
        testPassed = false;
    } else {
        console.log(`✅ Symbol check passed: ${simple}`);
    }

    if (testPassed) {
        passed++;
    } else {
        failed++;
    }
});

console.log(`\n---------------------------------------------------`);
console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
