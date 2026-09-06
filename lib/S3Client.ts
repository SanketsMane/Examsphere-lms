import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const getS3Client = () => {
  const accessKeyId = env.AWS_ACCESS_KEY_ID || "";
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || "";

  // Credentials are legitimately absent during builds, so fall back to an inert client
  // rather than throwing at import time.
  //
  // This must key off the credentials themselves and NOT off SKIP_ENV_VALIDATION. That
  // flag is set in normal production too, so the old check short-circuited every time and
  // signed real uploads with the literal key "dummy" — R2 rejects those with
  // "Credential access key has length 5, should be 32", and S3 with InvalidAccessKeyId.
  if (!accessKeyId || !secretAccessKey) {
    return new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: "dummy",
        secretAccessKey: "dummy"
      }
    });
  }

  const endpoint = env.AWS_ENDPOINT_URL_S3 || undefined;

  return new S3Client({
    // R2 ignores region but requires a value; "auto" is its convention.
    region: env.AWS_REGION || "auto",
    endpoint,
    forcePathStyle: !!endpoint, // Required for R2 / MinIO / LocalStack
    credentials: { accessKeyId, secretAccessKey },
    // The SDK otherwise folds an x-amz-checksum-crc32 header into the presigned
    // signature, but a browser PUT never sends that header, so R2 rejects the upload.
    // Only compute checksums when the operation actually requires one.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
};
