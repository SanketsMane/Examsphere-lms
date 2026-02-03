"use server";

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Agora Cloud Recording Service
 * Author: Sanket
 */

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_API_KEY = process.env.AGORA_API_KEY;
const AGORA_API_SECRET = process.env.AGORA_API_SECRET;
const AGORA_RECORDER_UID = "1001"; // Dedicated UID for recorder

async function getAgoraAuthHeader() {
    const auth = Buffer.from(`${AGORA_API_KEY}:${AGORA_API_SECRET}`).toString("base64");
    return { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" };
}

export async function startRecording(sessionId: string, channelName: string) {
    try {
        // 1. Acquire resource
        const acquireResponse = await fetch(
            `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/acquire`,
            {
                method: "POST",
                headers: await getAgoraAuthHeader(),
                body: JSON.stringify({
                    cname: channelName,
                    uid: AGORA_RECORDER_UID,
                    clientRequest: { resourceExpiredHour: 24 }
                })
            }
        );

        if (!acquireResponse.ok) throw new Error("Failed to acquire Agora resource");
        const { resourceId } = await acquireResponse.json();

        // 2. Start recording
        const startResponse = await fetch(
            `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`,
            {
                method: "POST",
                headers: await getAgoraAuthHeader(),
                body: JSON.stringify({
                    cname: channelName,
                    uid: AGORA_RECORDER_UID,
                    clientRequest: {
                        recordingConfig: {
                            maxIdleTime: 30,
                            streamTypes: 2,
                            transcodingConfig: {
                                height: 720,
                                width: 1280,
                                bitRate: 2260,
                                fps: 15,
                                mixedVideoLayout: 1
                            }
                        },
                        storageConfig: {
                            vendor: 1, // AWS S3
                            region: 1, // US East (N. Virginia)
                            bucket: process.env.AWS_S3_BUCKET,
                            accessKey: process.env.AWS_ACCESS_KEY_ID,
                            secretKey: process.env.AWS_SECRET_ACCESS_KEY,
                            fileNamePrefix: [`sessions/${sessionId}`]
                        }
                    }
                })
            }
        );

        if (!startResponse.ok) throw new Error("Failed to start Agora recording");
        const { sid } = await startResponse.json();

        // 3. Save recording metadata to DB
        await prisma.liveSession.update({
            where: { id: sessionId },
            data: { 
                recordingStatus: "processing",
                notes: `Recording SID: ${sid}` // Temporary storage for SID
            }
        });

        return { success: true, resourceId, sid };
    } catch (error) {
        logger.error("Start Recording Error", { error, sessionId });
        return { success: false, error: "Failed to initiate recording" };
    }
}

export async function stopRecording(sessionId: string, resourceId: string, sid: string) {
    try {
        const stopResponse = await fetch(
            `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`,
            {
                method: "POST",
                headers: await getAgoraAuthHeader(),
                body: JSON.stringify({
                    cname: sessionId, // Channel name usually session ID
                    uid: AGORA_RECORDER_UID,
                    clientRequest: {}
                })
            }
        );

        if (!stopResponse.ok) throw new Error("Failed to stop Agora recording");

        return { success: true };
    } catch (error) {
        logger.error("Stop Recording Error", { error, sessionId });
        return { success: false, error: "Failed to stop recording" };
    }
}
