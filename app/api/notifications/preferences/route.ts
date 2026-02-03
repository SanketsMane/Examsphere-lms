import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Notification Preferences API
 * Author: Sanket
 */

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;

        let preferences = await prisma.notificationPreferences.findUnique({
            where: { userId }
        });

        if (!preferences) {
            preferences = await prisma.notificationPreferences.create({
                data: { userId }
            });
        }

        return NextResponse.json(preferences);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = (session.user as any).id;
        const data = await request.json();

        const preferences = await prisma.notificationPreferences.upsert({
            where: { userId },
            update: {
                emailReminders: data.emailReminders,
                email24hBefore: data.email24hBefore,
                email1hBefore: data.email1hBefore,
                smsReminders: data.smsReminders,
                sms24hBefore: data.sms24hBefore,
                sms1hBefore: data.sms1hBefore,
                phoneNumber: data.phoneNumber,
                emailSessionUpdates: data.emailSessionUpdates,
                emailNewMessages: data.emailNewMessages,
            },
            create: {
                userId,
                emailReminders: data.emailReminders ?? true,
                email24hBefore: data.email24hBefore ?? true,
                email1hBefore: data.email1hBefore ?? true,
                smsReminders: data.smsReminders ?? false,
                sms24hBefore: data.sms24hBefore ?? false,
                sms1hBefore: data.sms1hBefore ?? false,
                phoneNumber: data.phoneNumber,
                emailSessionUpdates: data.emailSessionUpdates ?? true,
                emailNewMessages: data.emailNewMessages ?? true,
            }
        });

        return NextResponse.json(preferences);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
