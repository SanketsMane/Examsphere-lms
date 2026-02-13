// Author: Sanket
// Purpose: Hook to construct full S3 URLs from keys
import { constructS3Url } from "@/lib/s3-helper";

export function useConstructUrl(key: string): string {
  return constructS3Url(key);
}
