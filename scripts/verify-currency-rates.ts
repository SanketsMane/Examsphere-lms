
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying SiteSettings currencyRates...");

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
        console.log("No SiteSettings found! Creating one for testing...");
        try {
            settings = await prisma.siteSettings.create({
                data: {
                    siteName: "Test Site",
                    siteUrl: "http://localhost:3000",
                    currencyCode: "INR",
                    currencySymbol: "₹",
                    currencyRates: {}
                }
            });
            console.log("Created test settings.");
        } catch (e) {
            console.error("Failed to create settings:", e);
            return;
        }
    }

    console.log("Current Settings ID:", settings.id);
    const currentRates = (settings as any).currencyRates;
    console.log("Initial Currency Rates:", currentRates);

    // Try to update it
    const newRates = { "USD": 0.012, "EUR": 0.011, "GBP": 0.0095, "AED": 0.045 };
    console.log("Updating rates to:", newRates);

    const updated = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
            currencyRates: newRates
        }
    });

    console.log("Updated Rates:", (updated as any).currencyRates);

    if (JSON.stringify((updated as any).currencyRates) === JSON.stringify(newRates)) {
        console.log("SUCCESS: Currency rates updated and verified.");
    } else {
        console.error("FAILURE: Rates did not match.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
