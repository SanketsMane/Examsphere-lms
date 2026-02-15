import { createAuthClient } from "better-auth/react";
import { emailOTPClient, phoneNumberClient, adminClient } from "better-auth/client/plugins";

/**
 * Better Auth Client Singleton - PROTECTED - Author: Sanket
 */
const globalForAuthClient = globalThis as unknown as {
  __BETTER_AUTH_CLIENT_SINGLETON__: ReturnType<typeof createAuthClient> | undefined;
};

if (!globalForAuthClient.__BETTER_AUTH_CLIENT_SINGLETON__) {
  console.log("[AuthClient Singleton] Initializing...");
  globalForAuthClient.__BETTER_AUTH_CLIENT_SINGLETON__ = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    plugins: [emailOTPClient(), adminClient(), phoneNumberClient()],
  });
}

export const authClient = globalForAuthClient.__BETTER_AUTH_CLIENT_SINGLETON__;

export const useAuth = () => {
  return authClient.useSession();
};
