import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { protectGeneral } from "@/lib/security";

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

// Your existing authentication middleware
async function authMiddleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Simplified security middleware
async function securityMiddleware(request: NextRequest) {
  // Skip security checks for static assets and auth routes
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  const clientIP = getClientIP(request) || "unknown";

  // Strict rate limit for detailed auth routes (sign-in, sign-up, etc)
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const authCheck = await protectGeneral(request, `${clientIP}:auth`, {
      maxRequests: 15, // 15 attempts per minute
      windowMs: 60 * 1000
    });
    
    if (!authCheck.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many authentication attempts. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // Rate limit: 100 requests per minute per IP globally
  const securityCheck = await protectGeneral(request, `${clientIP}:global`, {
    maxRequests: 100, 
    windowMs: 60 * 1000
  });

  if (!securityCheck.success) {
    return new NextResponse(
      JSON.stringify({ error: securityCheck.error || 'Too many requests' }),
      {
        status: securityCheck.status || 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|api/auth|public).*)"],
};

export default async function proxy(request: NextRequest) {
  // First apply security middleware
  const securityResponse = await securityMiddleware(request);
  if (securityResponse.status !== 200) {
    return securityResponse;
  }

  // Handle protected routes that require authentication
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/teacher") ||
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Let the page components handle role verification
    // This avoids complex auth API calls in middleware
    return NextResponse.next();
  }

  // For non-protected routes, just continue
  return NextResponse.next();
}
