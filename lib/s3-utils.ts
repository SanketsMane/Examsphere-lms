import { env } from "@/lib/env";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Client } from "./S3Client";
import { extractKeyFromUrl } from "./s3-helper";

// Re-export for backward compatibility if needed, but preferably update imports
export { constructS3Url, extractKeyFromUrl, isValidS3Reference } from "./s3-helper";

/**
 * Generates a signed URL for temporary access to a private S3 object
 * @param key - S3 object key or full URL
 * @param expiresIn - Expiration time in seconds (default 1 hour)
 * @returns Signed URL string
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const s3Key = extractKeyFromUrl(key);
    if (!s3Key) throw new Error("Invalid S3 key or URL");

    const client = getS3Client();
    const bucket = env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES; // Assuming recordings are in the same bucket or env bucket

    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
    });

    return await getSignedUrl(client, command, { expiresIn });
}
