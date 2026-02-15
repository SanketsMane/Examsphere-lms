# Deployment Guide

## Production Deployment

The `kidokool-lms` project is configured for continuous deployment.

### 1. Push to Main
The primary deployment method is pushing to the `main` branch. This triggers the connected CI/CD pipeline (e.g., Vercel, AWS Amplify, or a custom GitHub Action).

```bash
git push origin main
```

### 2. Manual Build
If you need to build the project manually on a server (e.g., EC2):

1.  **Pull latest changes**:
    ```bash
    git pull origin main
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the application**:
    ```bash
    npm run build
    ```
    *This runs `prisma generate` followed by `next build`.*

4.  **Start the server**:
    ```bash
    npm start
    ```

## Environment Variables
Ensure all production environment variables are set in your deployment platform or `.env.production` file. Critical variables include:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`

## Troubleshooting
If the build fails, check the logs for:
- `server-only` import errors (should be resolved as of Feb 2026).
- TypeScript errors (`npm run lint` or `npx tsc --noEmit`).
