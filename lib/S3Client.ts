import "server-only";

import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const getS3Client = () => {
  if (process.env.SKIP_ENV_VALIDATION || !env.AWS_REGION || !env.AWS_ACCESS_KEY_ID) {
    // Return a dummy client or null during build if creds are missing
    // Cast to any to avoid strict type checks on dummy object if needed, or just standard client with dummy values
    return new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: "dummy",
        secretAccessKey: "dummy"
      }
    });
  }

  // Author: Sanket - Debug logging to verify region
  console.log("S3Client - Using Region:", env.AWS_REGION);

  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    }
  });
};
