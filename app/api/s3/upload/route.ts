import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { constructS3Url } from "@/lib/s3-helper";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/S3Client";
import { protectGeneral } from "@/lib/security";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { isAllowedUploadType, ownerTagFor, sanitizeFileName } from "../s3-access";

export const dynamic = "force-dynamic";

const fileUploadSchema = z.object({
  fileName: z.string().min(1, { message: "Filename is required" }),
  contentType: z.string().min(1, { message: "Content type is required" }),
  size: z.number().min(1, { message: "Size is required" }),
  isImage: z.boolean(),
});

export async function POST(request: Request) {
  // Author: Sanket - Allow all authenticated users to upload files
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Rate limiting removed as per user request

    const body = await request.json();
    const validation = fileUploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid Request Body" },
        { status: 400 }
      );
    }

    const { fileName, contentType, size } = validation.data;

    // The bucket is publicly readable, so an unrestricted type would let anyone
    // host HTML/JS/SVG on our domain.
    if (!isAllowedUploadType(contentType)) {
      return NextResponse.json(
        { error: "This file type is not allowed. Upload an image, PDF, MP4/WebM video or an Office document." },
        { status: 400 }
      );
    }

    // 1. Enforce 500MB per-file limit (Increased from 5MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
        { status: 400 }
      );
    }

    // 2. Fetch user to check total storage limit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = user as any;
    const currentUsed = Number(dbUser.storageUsed || 0);
    const limit = Number(dbUser.storageLimit || 500 * 1024 * 1024); // schema default: 500 MB

    if (currentUsed + size > limit) {
      return NextResponse.json(
        { error: `Storage limit reached (${formatBytes(limit)}). Please delete some files or upgrade.` },
        { status: 400 }
      );
    }

    // 3. Increment storageUsed (reservation)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        storageUsed: {
          increment: size
        }
      } as any
    });

    // The owner tag lets /api/s3/delete recognise the uploader before the key
    // is saved on any record (e.g. removing a file from an unsaved form).
    const uniqueKey = `${uuidv4()}-o${ownerTagFor(user.id)}-${sanitizeFileName(fileName)}`;

    // Author: Sanket - Include ContentType to ensure proper file serving
    // Client MUST send the exact same Content-Type header during PUT
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const S3 = getS3Client();
    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // URL expires in 6 minutes
    });

    // Author: Sanket - Construct the public URL using unified helper
    const publicUrl = constructS3Url(uniqueKey);

    const response = {
      presignedUrl,
      key: uniqueKey,
      publicUrl, // Added for client to use directly - Author: Sanket
      contentType, 
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number) {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
