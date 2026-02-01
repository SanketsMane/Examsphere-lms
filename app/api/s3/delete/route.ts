import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { protectGeneral } from "@/lib/security";
import { env } from "@/lib/env";
import { getS3Client } from "@/lib/S3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  // Author: Sanket - Allow authenticated users to delete files, not just admins
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Apply rate limiting for file deletions (1250 per minute)
    const securityCheck = await protectGeneral(request, session?.user.id as string, {
      maxRequests: 1250, // Increased 25x from 50
      windowMs: 60000
    });

    if (!securityCheck.success) {
      return NextResponse.json({ error: securityCheck.error }, { status: securityCheck.status });
    }
    const body = await request.json();

    const key = body.key;

    if (!key) {
      return NextResponse.json(
        { error: "Missing or invalid object key" },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    const S3 = getS3Client();
    await S3.send(command);

    return NextResponse.json(
      { message: "File deleted succesfully" },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Missing or invalid object key" },
      { status: 500 }
    );
  }
}
