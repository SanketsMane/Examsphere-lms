import { env } from "@/lib/env";

/**
 * Constructs a full S3 URL from a key or returns the URL as-is if already complete
 * @param key - S3 object key or full URL
 * @returns Full S3 URL
 */
export function constructS3Url(key: string): string {
    if (!key) return "";

    // If already a full URL, return as-is
    if (key.startsWith("http://") || key.startsWith("https://")) {
        return key;
    }

    // Construct URL based on environment - Author: Sanket
    const bucket = env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES;
    
    // If we have a custom endpoint (MinIO), use it correctly
    if (env.AWS_ENDPOINT_URL_S3) {
        const baseUrl = env.AWS_ENDPOINT_URL_S3.endsWith('/') 
            ? env.AWS_ENDPOINT_URL_S3.slice(0, -1) 
            : env.AWS_ENDPOINT_URL_S3;
        
        // MinIO usually expects {endpoint}/{bucket}/{key}
        return `${baseUrl}/${bucket}/${key}`;
    }

    // Default AWS S3 URL structure
    const region = env.AWS_REGION || "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Extracts the S3 key from a full S3 URL
 * @param url - Full S3 URL or key
 * @returns S3 key or null if invalid
 */
export function extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    // If it's already just a key (no http/https), return as-is
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        // Remove leading slash from pathname to get the key
        return urlObj.pathname.substring(1);
    } catch {
        return null;
    }
}

/**
 * Validates if a string is a valid S3 key or URL
 * @param value - String to validate
 * @returns True if valid S3 key or URL
 */
export function isValidS3Reference(value: string): boolean {
    if (!value) return false;

    // Check if it's a valid URL
    if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    // Check if it's a valid key (non-empty string without http(s))
    return value.length > 0;
}
