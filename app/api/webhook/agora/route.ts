import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Agora Webhook Handler
 * Author: Sanket
 */

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { eventType, payload } = body;

        // eventType 31: cloud_recording_file_infos
        if (eventType === 31) {
            const { fileList, sid, cname } = payload;
            // cname is usually the channel name, which we set to channelId (mapping to sessionId in startRecording)
            
            // Re-finding session by SID stored in notes or by cname
            const session = await prisma.liveSession.findFirst({
                where: {
                    OR: [
                        { id: cname },
                        { notes: { contains: sid } }
                    ]
                }
            });

            if (session) {
                // Assuming first file in list is the one
                const recordingUrl = fileList[0]?.fileName; // This needs to be joined with bucket URL
                const bucket = process.env.AWS_S3_BUCKET;
                const region = process.env.AWS_S3_REGION || "us-east-1";
                const fullUrl = `https://${bucket}.s3.${region}.amazonaws.com/${recordingUrl}`;

                await prisma.liveSession.update({
                    where: { id: session.id },
                    data: {
                        recordingUrl: fullUrl,
                        recordingStatus: "completed"
                    }
                });
                
                logger.info("Recording completed via webhook", { sessionId: session.id, sid });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error("Agora Webhook Error", { error });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
