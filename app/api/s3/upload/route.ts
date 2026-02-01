import { env } from "@/lib/env";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "@/lib/S3Client";
import { protectGeneral } from "@/lib/security";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

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
    const limit = Number(dbUser.storageLimit || 5 * 1024 * 1024 * 1024); // Default 5GB

    if (currentUsed + size > limit) {
      return NextResponse.json(
        { error: "Storage limit reached (5GB). Please delete some files or upgrade." },
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

    const uniqueKey = `${uuidv4()}-${fileName}`;

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

    const response = {
      presignedUrl,
      key: uniqueKey,
      contentType, // Return this so client uses exact same value
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
