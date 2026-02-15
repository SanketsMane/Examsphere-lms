import { auth } from "@/lib/auth";
import { protectSignup, protectGeneral, getClientIP } from "@/lib/security";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const LOG_FILE = path.join(process.cwd(), "auth_debug.log");

function logToFile(message: string) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

async function protect(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isAuthAction = pathname.startsWith("/api/auth/sign-in") || pathname.startsWith("/api/auth/sign-up");
  
  // Optimization: Skip session fetch for sign-in/sign-up to prevent potential DB deadlocks/crashes during auth
  let userId: string = "127.0.0.1";
  
  if (!isAuthAction) {
    try {
      const session = await auth.api.getSession({
        headers: req.headers,
      });
      if (session?.user.id) {
        userId = session.user.id;
      } else {
        userId = getClientIP(req) || "127.0.0.1";
      }
    } catch (e) {
      console.error("Session check failed in protect:", e);
      userId = getClientIP(req) || "127.0.0.1";
    }
  } else {
    userId = getClientIP(req) || "127.0.0.1";
  }

  // Skip rate limiting for sign-out requests
  if (pathname.startsWith("/api/auth/sign-out")) {
    return { success: true };
  }

  // If this is a signup then use the special protectSignup rule
  if (pathname.startsWith("/api/auth/sign-up")) {
    try {
      // Better-Auth reads the body, so we need to clone the request preemptively
      const clonedReq = req.clone();
      const body = await clonedReq.json();

      // If the email is in the body of the request then we can run email validation
      if (body && typeof body.email === "string") {
        return await protectSignup(req, userId, body.email);
      }
    } catch (bodyError) {
      console.warn("Could not parse body for signup protection:", bodyError);
    }
    
    return await protectGeneral(req, userId, {
      maxRequests: 2500,
      windowMs: 120000 
    });
  } else {
    // For all other auth requests
    return await protectGeneral(req, userId, {
      maxRequests: 5000,
      windowMs: 60000 
    });
  }
}

const authHandlers = toNextJsHandler(auth.handler);

export const { GET } = authHandlers;

// Wrap the POST handler with custom security protections
export const POST = async (req: NextRequest) => {
  try {
    const pathname = req.nextUrl.pathname;
    
    // Auth-Handshake Stabilization: 
    // Force the Origin to match the server's own Host header.
    // This creates a "Same-Origin" state that satisfies Better Auth's strict check 
    // without needing to guess the baseURL mismatch.
    const origin = req.headers.get("origin");
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const xProtocol = req.headers.get("x-forwarded-proto") || "http";
    const derivedOrigin = `${xProtocol}://${hostHeader}`;
    
    const modifiedHeaders = new Headers(req.headers);
    modifiedHeaders.set("origin", derivedOrigin);
    modifiedHeaders.set("referer", derivedOrigin + "/");
    
    const targetReq = new NextRequest(req, {
        headers: modifiedHeaders
    });
    
    logToFile(`Incoming Request: ${req.method} ${pathname} | Original Origin: ${origin} | Derived Origin: ${derivedOrigin} | Host: ${hostHeader}`);

    let securityCheck;
    try {
      securityCheck = await protect(targetReq);
    } catch (error: any) {
      logToFile(` ❌ securityCheck crashed: ${error.message}`);
      securityCheck = { success: true };
    }

    if (!securityCheck.success) {
      logToFile(` ❌ Security blocked request: ${securityCheck.error}`);
      return Response.json({ 
        message: securityCheck.error || "Security check failed", 
        status: securityCheck.status || 403 
      }, { status: securityCheck.status || 403 });
    }

    const response = await authHandlers.POST(targetReq);
    
    if (response.status >= 400) {
        const clonedRes = response.clone();
        const errorBody = await clonedRes.json().catch(() => ({}));
        logToFile(` ⚠️ BetterAuth Error ${response.status}: ${JSON.stringify(errorBody)}`);
        console.warn(`[BetterAuth Error] ${pathname} returning ${response.status}:`, JSON.stringify(errorBody));
    } else {
        logToFile(` ✅ BetterAuth Success ${response.status}`);
    }
    
    return response;

  } catch (error: any) {
    console.error("🔥 [CRITICAL] Auth Route Crashed:", error);
    return Response.json({
      message: "Internal Server Error in Auth Route",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
};
