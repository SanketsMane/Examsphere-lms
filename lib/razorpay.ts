import Razorpay from "razorpay";
import { prisma } from "./db";

export async function getRazorpayInstance() {
    const settings = await prisma.siteSettings.findFirst();
    
    if (!settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
        throw new Error("Razorpay credentials not configured in Admin Settings");
    }

    return new Razorpay({
        key_id: settings.razorpayKeyId,
        key_secret: settings.razorpayKeySecret,
    });
}

export async function getRazorpayKeyId() {
    const settings = await prisma.siteSettings.findFirst();
    return settings?.razorpayKeyId || null;
}
