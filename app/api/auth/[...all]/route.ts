import { auth } from "@/lib/auth";
import { protectSignup, protectGeneral, getClientIP } from "@/lib/security";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function protect(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // If the user is logged in we'll use their ID as the identifier
  let userId: string;
  if (session?.user.id) {
    userId = session.user.id;
  } else {
    userId = getClientIP(req) || "127.0.0.1";
  }

  // Skip rate limiting for sign-out requests
  if (req.nextUrl.pathname.startsWith("/api/auth/sign-out")) {
    return { success: true };
  }

  // If this is a signup then use the special protectSignup rule
  if (req.nextUrl.pathname.startsWith("/api/auth/sign-up")) {
    // Better-Auth reads the body, so we need to clone the request preemptively
    const body = await req.clone().json();

    // If the email is in the body of the request then we can run email validation
    if (typeof body.email === "string") {
      return await protectSignup(req, userId, body.email);
    } else {
      // Otherwise use general protection with rate limiting (50 per 2 mins - increased from 5)
      return await protectGeneral(req, userId, {
        maxRequests: 50,
        windowMs: 120000 // 2 minutes
      });
    }
  } else {
    // For all other auth requests (100 per min - increased from 10)
    return await protectGeneral(req, userId, {
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    });
  }
}

const authHandlers = toNextJsHandler(auth.handler);

export const { GET } = authHandlers;

// Wrap the POST handler with custom security protections
export const POST = async (req: NextRequest) => {
  const securityCheck = await protect(req);

  console.log("Security Check:", securityCheck);

  if (!securityCheck.success) {
    return Response.json({ message: securityCheck.error }, { status: securityCheck.status });
  }

  return authHandlers.POST(req);
};
