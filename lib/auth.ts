import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP, phoneNumber } from "better-auth/plugins";
import { sendEmail } from "./email";
import { admin } from "better-auth/plugins";
import twilio from "twilio";



const authOptions = {
  database: prismaAdapter(prisma, {
    provider: "mysql", // Refactored for MySQL - Author: Sanket
  }),
  baseURL: (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/['"]/g, ""),
  secret: process.env.BETTER_AUTH_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("BETTER_AUTH_SECRET is missing in production"); })() : "dummy_secret_for_dev_only"),
  trustHost: true,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3000/",
    "http://192.168.1.37:3000",
    "http://192.168.1.37:3000/",
    "http://192.168.1.37",
    "http://192.168.1.37/",
    ...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.replace(/['"]/g, "").split(",").map(o => [o.trim(), o.trim() + "/"]).flat() : []),
  ],
  advanced: {
    disableCSRFCheck: true,
    disableOriginCheck: true,
  },
  onRequest: async (request: Request) => {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    const cleanBaseURL = (process.env.BETTER_AUTH_URL || "http://localhost:3000").trim().replace(/['"]/g, "");
    
    // Handshake Debugger:
    // If we still get 403, we need to know exactly what Better Auth is seeing.
    if (!origin || origin === "null" || origin.includes("192.168") || origin.includes("localhost")) {
       request.headers.set("origin", cleanBaseURL);
    }

    console.log(`[BetterAuth Request] ${request.method} ${request.url} | Origin: ${request.headers.get("origin")} | Host: ${host}`);
    return undefined;
  },
  onResponse: async (response: Response) => {
    if (response.status >= 400) {
        console.error(`[BetterAuth Error Response] Status: ${response.status}`);
    }
    return undefined;
  },
  socialProviders: {},
  
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }: { user: any; url: string }) {
      await sendEmail({
        to: user.email,
        subject: "KIDOKOOL - Reset Your Password",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
              .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
              .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
              .subtitle { font-size: 14px; color: #666666; }
              .content { padding: 40px; }
              .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
              .message { font-size: 15px; color: #333333; margin-bottom: 24px; }
              .cta-button { display: inline-block; background: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 14px; font-weight: 500; margin: 20px 0; }
              .notice { background: #fafafa; border-left: 3px solid #000000; padding: 16px 20px; margin: 20px 0; }
              .notice p { font-size: 14px; color: #333333; margin: 0; }
              .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
              .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">KIDOKOOL</div>
                <div class="subtitle">Learning Management System</div>
              </div>
              
              <div class="content">
                <h1 class="title">Password Reset Request</h1>
                <p class="message">Hi ${user.name || "there"},<br><br>We received a request to reset your password. Click the button below to proceed:</p>
                
                <div style="text-align: center;">
                  <a href="${url}" class="cta-button">Reset Password</a>
                </div>
                
                <div class="notice">
                  <p><strong>Important:</strong> This link will expire in 1 hour.</p>
                </div>
                
                <div class="notice">
                  <p><strong>Security Note:</strong> If you didn't request this, please ignore this email.</p>
                </div>
              </div>
              
              <div class="footer">
                <div class="footer-text"><strong>KIDOKOOL</strong></div>
                <div class="footer-text">Learning Management System</div>
                <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string" as const,
      },
      bio: {
        type: "string" as const,
        required: false,
      },
      education: {
        type: "string" as const,
        required: false,
      },
      // Country field for localization - Author: Sanket
      country: {
        type: "string" as const,
        required: false,
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        console.log("AUTH DEBUG: sendVerificationOTP called for:", email);
        console.log("AUTH DEBUG: OTP generated:", otp);
        try {
          const success = await sendEmail({
            to: email,
            subject: "KIDOKOOL - Verify your email",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px; line-height: 1.6; }
                  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; }
                  .header { background: #ffffff; padding: 32px 40px; border-bottom: 1px solid #e5e5e5; }
                  .logo { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
                  .subtitle { font-size: 14px; color: #666666; }
                  .content { padding: 40px; }
                  .title { font-size: 18px; font-weight: 600; color: #000000; margin-bottom: 16px; }
                  .message { font-size: 15px; color: #333333; margin-bottom: 24px; }
                  .otp-box { background: #f9f9f9; border: 2px solid #e5e5e5; padding: 32px; text-align: center; margin: 24px 0; }
                  .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666666; font-weight: 600; margin-bottom: 16px; }
                  .otp-code { font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: 'SF Mono', 'Monaco', 'Courier New', monospace; margin: 0; }
                  .expiry { margin-top: 16px; font-size: 13px; color: #666666; }
                  .notice { background: #fafafa; border-left: 3px solid #000000; padding: 16px 20px; margin: 24px 0; }
                  .notice p { font-size: 14px; color: #333333; margin: 0; }
                  .footer { border-top: 1px solid #e5e5e5; padding: 32px 40px; background: #fafafa; text-align: center; }
                  .footer-text { font-size: 13px; color: #666666; margin: 4px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">KIDOKOOL</div>
                    <div class="subtitle">Learning Management System</div>
                  </div>
                  
                  <div class="content">
                    <h1 class="title">📧 Email Verification</h1>
                    <p class="message">Hi there,<br><br>Please use the following OTP to verify your email address:</p>
                    
                    <div class="otp-box">
                      <div class="otp-label">Verification Code</div>
                      <p class="otp-code">${otp}</p>
                      <div class="expiry">This OTP will expire in 10 minutes for security reasons.</div>
                    </div>
                    
                    <div class="notice">
                      <p><strong>Security Notice:</strong> If you didn't request this verification, please ignore this email.</p>
                    </div>
                  </div>
                  
                  <div class="footer">
                    <div class="footer-text"><strong>KIDOKOOL</strong></div>
                    <div class="footer-text">Learning Management System</div>
                    <div class="footer-text">© 2026 KIDOKOOL. All rights reserved.</div>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          console.log("AUTH DEBUG: sendEmail result:", success);
          if (!success) throw new Error("sendEmail returned false");
        } catch (e: any) {
          console.error("AUTH DEBUG: sendVerificationOTP FAILED:", e);
          throw e; // Rethrow to let better-auth know it failed
        }
      },
    }),
    admin(),
    phoneNumber({
      async sendOTP({ phoneNumber, code }, request) {
        console.log("AUTH DEBUG: sendOTP called for:", phoneNumber);
        console.log("AUTH DEBUG: OTP generated:", code);
        try {
            const accountSid = process.env.TWILIO_ACCOUNT_SID;
            const authToken = process.env.TWILIO_AUTH_TOKEN;
            const fromNumber = process.env.TWILIO_PHONE_NUMBER;

            if (!accountSid || !authToken || !fromNumber) {
                console.error("Twilio credentials missing");
                throw new Error("Twilio credentials missing");
            }

            const client = twilio(accountSid, authToken);
            await client.messages.create({
                body: `Your Kidokool verification code is: ${code}`,
                from: fromNumber,
                to: phoneNumber
            });
            console.log("AUTH DEBUG: OTP sent successfully via Twilio");
        } catch (e) {
            console.error("AUTH DEBUG: sendOTP FAILED:", e);
            throw e;
        }
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone}@temp.kidokool.com`,
        getTempName: (phone) => `User ${phone}`,
      },
    }),
  ],
};

// Singleton pattern for Better Auth - Absolutely strictly enforced - Author: Sanket
// Multiple instances can cause 403 Origin errors due to internal state mismatch.
const globalForAuth = globalThis as unknown as {
  __BETTER_AUTH_SINGLETON_PROTECTED__: ReturnType<typeof betterAuth> | undefined;
};

if (!globalForAuth.__BETTER_AUTH_SINGLETON_PROTECTED__) {
  console.log(`[Auth Singleton] Initializing core instance for: ${authOptions.baseURL}`);
  globalForAuth.__BETTER_AUTH_SINGLETON_PROTECTED__ = betterAuth(authOptions);
} else {
  // Silent reuse to avoid log spam, but ensures only one instance exists
}

export const auth = globalForAuth.__BETTER_AUTH_SINGLETON_PROTECTED__;
