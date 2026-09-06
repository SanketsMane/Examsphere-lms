import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    AUTH_GITHUB_CLIENT_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    // Email configuration (optional - will use defaults if not provided)
    EMAIL_SERVICE: z.string().optional(),
    EMAIL_HOST: z.string().optional(),
    EMAIL_PORT: z.string().optional(),
    EMAIL_SECURE: z.string().optional(),
    EMAIL_USER: z.string().optional(),
    EMAIL_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_ENDPOINT_URL_S3: z.string().min(1),
    AWS_ENDPOINT_URL_IAM: z.string().min(1),
    AWS_REGION: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    TAWKTOO_API_URL: z.string().url(),
    TAWKTOO_API_KEY: z.string().min(1),
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  client: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1),
    NEXT_PUBLIC_AWS_REGION: z.string().min(1),
    NEXT_PUBLIC_S3_LOCAL_ENDPOINT: z.string().optional(),
    // Public read base URL for uploaded objects (Cloudflare R2 r2.dev URL or a custom
    // domain). R2's S3 API endpoint requires SigV4 on every request, so it cannot serve
    // public reads — object URLs must be built from this instead. Optional so an
    // unset value degrades to the legacy S3 path rather than breaking every page:
    // this block is validated in the browser (SKIP_ENV_VALIDATION is server-only).
    NEXT_PUBLIC_S3_PUBLIC_URL: z.string().optional(),
  },

  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES:
      process.env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    NEXT_PUBLIC_S3_LOCAL_ENDPOINT: process.env.NEXT_PUBLIC_S3_LOCAL_ENDPOINT,
    NEXT_PUBLIC_S3_PUBLIC_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
  },
});
