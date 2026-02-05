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

export async function createRazorpaySubscription(planId: string, customerId?: string) {
    const instance = await getRazorpayInstance();
    // Create subscription
    const subscription = await instance.subscriptions.create({
        plan_id: planId,
        total_count: 120, // 10 years (indefinite essentially)
        quantity: 1,
        customer_notify: 1,
    });
    return subscription;
}

export async function cancelRazorpaySubscription(subscriptionId: string) {
    const instance = await getRazorpayInstance();
    return await instance.subscriptions.cancel(subscriptionId);
}
