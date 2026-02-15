
import { formatPrice, formatPriceSimple } from "../lib/currency";

console.log("Starting Currency Conversion Tests...\n");

const tests = [
    {
        name: "Default INR (No Country)",
        fn: () => formatPriceSimple(1000, null),
        expected: "₹1,000"
    },
    {
        name: "Default INR (Explicit 'India')",
        fn: () => formatPriceSimple(1000, "India"),
        expected: "₹1,000"
    },
    {
        name: "Static USD (No Overrides)",
        // Assuming default rate is roughly 0.012 or similar from lib/currency
        // We will just print the output to verify it looks like USD
        fn: () => formatPriceSimple(1000, "United States"),
        check: (result: string) => result.startsWith("$")
    },
    {
        name: "Dynamic USD Override (Rate: 0.02)",
        fn: () => formatPriceSimple(1000, "United States", { "USD": 0.02 }),
        expected: "$20.00" // 1000 * 0.02 = 20
    },
    {
        name: "Dynamic EUR Override (Rate: 0.01)",
        fn: () => formatPriceSimple(1000, "Germany", { "EUR": 0.01 }),
        expected: "€10,00" // 1000 * 0.01 = 10 (German locale uses comma)
    },
    {
        name: "Free Course (0 Amount)",
        fn: () => formatPriceSimple(0, "India"),
        expected: "Free"
    },
     {
        name: "Complex Format (Cents input) - INR",
        // formatPrice takes cents/paise. 10000 paise = 100 INR
        fn: () => formatPrice(10000, "India"),
        expected: "₹100.00"
    },
    {
        name: "Complex Format - USD Override (Rate 0.02)",
        // 10000 base units (paise) = 100 INR.  
        // formatPrice converts (amount/100) * rate. 
        // (10000 / 100) * 0.02 = 100 * 0.02 = 2 USD
        fn: () => formatPrice(10000, "United States", { "USD": 0.02 }),
        expected: "$2.00"
    }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    try {
        const result = test.fn();
        let isPass = false;
        
        if (test.expected) {
            isPass = result === test.expected;
        } else if (test.check) {
            isPass = test.check(result);
        }

        if (isPass) {
            console.log(`✅ [PASS] ${test.name}`);
            console.log(`   Result: ${result}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${test.name}`);
            console.error(`   Expected: ${test.expected}`);
            console.error(`   Actual:   ${result}`);
            failed++;
        }
    } catch (e) {
        console.error(`❌ [ERROR] ${test.name}`, e);
        failed++;
    }
    console.log("---------------------------------------------------");
});

console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
