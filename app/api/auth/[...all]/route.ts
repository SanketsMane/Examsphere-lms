import { auth } from "@/lib/auth";
import { protectSignup, protectGeneral, getClientIP } from "@/lib/security";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";


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

export const POST = async (req: NextRequest) => {
  try {
    const pathname = req.nextUrl.pathname;

    // Pass the request through untouched. This used to overwrite the Origin and Referer
    // headers with this server's own host, which made every request look same-origin and
    // silently defeated Better Auth's CSRF/origin protection: any website could submit
    // sign-in, sign-out or account-change requests with a visitor's cookies.
    const response = await authHandlers.POST(req);
    
    if (response.status >= 400) {
        const clonedRes = response.clone();
        const errorBody = await clonedRes.json().catch(() => ({}));
        console.warn(`[BetterAuth Error] ${pathname} returning ${response.status}:`, JSON.stringify(errorBody));
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
