import "server-only";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "./db";

export const PAYMENTS_UNAVAILABLE_MESSAGE =
    "Online payments are not available yet. Please contact us to enroll.";

export class RazorpayNotConfiguredError extends Error {
    constructor() {
        super(PAYMENTS_UNAVAILABLE_MESSAGE);
        this.name = "RazorpayNotConfiguredError";
    }
}

export interface RazorpayConfig {
    keyId: string | null;
    keySecret: string | null;
    webhookSecret: string | null;
}

// Admin Settings (SiteSettings row) wins; env vars are the fallback so a deploy
// can take payments before anyone has saved the settings form.
export async function getRazorpayConfig(): Promise<RazorpayConfig> {
    const settings = await prisma.siteSettings.findFirst({
        select: { razorpayKeyId: true, razorpayKeySecret: true, razorpayWebhookSecret: true },
    });
    return {
        keyId: settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || null,
        keySecret: settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || null,
        webhookSecret: settings?.razorpayWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || null,
    };
}

export async function isRazorpayConfigured(): Promise<boolean> {
    const { keyId, keySecret } = await getRazorpayConfig();
    return Boolean(keyId && keySecret);
}

export async function getRazorpayInstance() {
    const { keyId, keySecret } = await getRazorpayConfig();

    if (!keyId || !keySecret) {
        throw new RazorpayNotConfiguredError();
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

export async function getRazorpayKeyId() {
    const { keyId } = await getRazorpayConfig();
    return keyId;
}

function safeEqualHex(a: string, b: string) {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

/** Checkout success callback signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export async function verifyRazorpayPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): Promise<boolean> {
    const { keySecret } = await getRazorpayConfig();
    if (!keySecret) throw new RazorpayNotConfiguredError();
    const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return safeEqualHex(signature, expected);
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
