import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { constructS3Url } from "@/lib/s3-helper";

/**
 * Agora Webhook Handler
 *
 * SECURITY: this endpoint had no signature verification, so anyone who could
 * POST to it could set `recordingUrl` to an arbitrary address on any live
 * session — found simply by sending the session id as `cname`. Students are
 * shown that link as "the class recording", which makes it a phishing vector.
 * Requests are now rejected unless they carry a valid Agora-Signature-V2.
 *
 * It fails closed: with no AGORA_WEBHOOK_SECRET configured, nothing is accepted.
 * Accepting unsigned writes is the vulnerability, so an unconfigured secret must
 * not degrade into "trust everything".
 */

export const dynamic = "force-dynamic";

/**
 * Agora signs the raw request body with the secret from the Agora Console and
 * sends it as Agora-Signature-V2 (HMAC-SHA256, hex).
 */
function verifyAgoraSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const got = Buffer.from(header.trim(), "utf8");
  const exp = Buffer.from(expected, "utf8");

  // Constant-time compare; length checked first because timingSafeEqual throws
  // on differing lengths.
  return got.length === exp.length && crypto.timingSafeEqual(got, exp);
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.AGORA_WEBHOOK_SECRET?.trim();
    if (!secret) {
      logger.error("Agora webhook rejected: AGORA_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    // Must read the raw body: the signature is over the exact bytes sent.
    const rawBody = await req.text();
    const signature =
      req.headers.get("agora-signature-v2") ?? req.headers.get("Agora-Signature-V2");

    if (!verifyAgoraSignature(rawBody, signature, secret)) {
      logger.security?.("Agora webhook rejected: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { eventType, payload } = body;

    // eventType 31: cloud_recording_file_infos
    if (eventType === 31) {
      const { fileList, sid, cname } = payload ?? {};

      const session = await prisma.liveSession.findFirst({
        where: {
          OR: [{ id: cname }, { notes: { contains: sid } }],
        },
        select: { id: true },
      });

      if (session) {
        const fileName = fileList?.[0]?.fileName;
        if (!fileName) {
          logger.warn("Agora webhook: recording event carried no fileName", { sid });
          return NextResponse.json({ success: true });
        }

        // Build the URL from the project's configured storage (Cloudflare R2 via
        // NEXT_PUBLIC_S3_PUBLIC_URL). The previous code used AWS_S3_BUCKET and
        // AWS_S3_REGION, neither of which exists in this project, so it produced
        // "https://undefined.s3.us-east-1.amazonaws.com/..." even on success.
        const fullUrl = constructS3Url(fileName);

        await prisma.liveSession.update({
          where: { id: session.id },
          data: { recordingUrl: fullUrl, recordingStatus: "completed" },
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
