
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Updating Razorpay Settings via Script...");
    
    // Check for environment variables
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.error("ERROR: Missing Razorpay Environment Variables!");
        console.error("NEXT_PUBLIC_RAZORPAY_KEY_ID:", !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
        console.error("RAZORPAY_KEY_ID:", !!process.env.RAZORPAY_KEY_ID);
        console.error("RAZORPAY_KEY_SECRET:", !!process.env.RAZORPAY_KEY_SECRET);
        process.exit(1);
    }

    console.log(`Found Key ID: ${keyId.substring(0, 5)}...`);
    console.log(`Found Key Secret: ${keySecret.substring(0, 5)}...`);

    // Find any existing settings or create default
    const existing = await prisma.siteSettings.findFirst();

    if (existing) {
        console.log("Updating existing settings row:", existing.id);
        await prisma.siteSettings.update({
            where: { id: existing.id },
            data: {
                razorpayKeyId: keyId,
                razorpayKeySecret: keySecret
            }
        });
    } else {
        console.log("Creating new settings row...");
        await prisma.siteSettings.create({
            data: {
                siteName: "Kidokool LMS",
                siteUrl: "https://kidokool.xyz",
                razorpayKeyId: keyId,
                razorpayKeySecret: keySecret,
                contactEmail: "admin@kidokool.xyz"
            }
        });
    }

    console.log("SUCCESS: Razorpay Settings Updated in Database!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
