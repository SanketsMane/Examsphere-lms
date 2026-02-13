import { constructS3Url } from './s3-helper';

/**
 * Custom Next.js image loader for S3 images
 * Handles both S3 keys and full URLs
 */
export default function s3ImageLoader({ 
  src, 
  width, 
  quality 
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // If already a full URL (http/https) or a local path (starts with /), return as-is
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
    return src;
  }
  
  // If it's an S3 key, construct the full S3 URL
  return constructS3Url(src);
}
