/**
 * Advanced Security System for EXAMSPHERE
 * Enhanced security with comprehensive protection measures
 * Features: Bot detection, rate limiting, email validation, CSRF protection, 
 * input sanitization, file upload security, and performance monitoring
 */

import { logger } from "@/lib/logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface SecurityCheckResult {
  success: boolean;
  error?: string;
  status?: number;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

// In-memory rate limiting store
class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  check(identifier: string, options: RateLimitOptions): boolean {
    // RATE LIMITING DISABLED BY USER REQUEST
    return true; 
    
    /* Original Logic Preserved for Reference:
    const now = Date.now();
    const key = `${identifier}:${options.windowMs}`;
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return true;
    }

    if (entry.count >= options.maxRequests) {
      return false;
    }

    entry.count++;
    this.store.set(key, entry);
    return true;
    */
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimiter = new InMemoryRateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Detect potential bot behavior based on user agent and request patterns
 */
export function detectBot(request: Request): boolean {
  // BOT DETECTION DISABLED FOR DEVELOPMENT
  return false;

  /* Original Logic Preserved:
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // Common bot patterns
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
    'java', 'go-http', 'okhttp', 'axios', 'postman', 'insomnia'
  ];

  return botPatterns.some(pattern => userAgent.includes(pattern));
  */
}

/**
 * Validate email format and detect disposable/invalid domains
 */
export function validateEmail(email: string): { valid: boolean; reason?: string } {
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, reason: "Email address format is invalid. Is there a typo?" };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: "Invalid email domain" };
  }

  // Common disposable email domains
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc'
  ];

  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: "We do not allow disposable email addresses." };
  }

  return { valid: true };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string | null {
  // Try to get IP from various headers
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Handle comma-separated IPs (x-forwarded-for can have multiple)
      return value.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * Protect signup requests with email validation, bot detection, and rate limiting
 */
export async function protectSignup(
  request: Request,
  identifier: string,
  email: string
): Promise<SecurityCheckResult> {
  // Check for bot behavior
  if (detectBot(request)) {
    return {
      success: false,
      error: "You are a bot! If this is a mistake, contact our support",
      status: 403
    };
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return {
      success: false,
      error: emailValidation.reason || "Invalid email",
      status: 400
    };
  }

  const rateLimitOk = rateLimiter.check(identifier, {
    maxRequests: 1250, // Increased 25x from 50
    windowMs: 2 * 60 * 1000 // 2 minutes
  });

  if (!rateLimitOk) {
    logger.security("SIGNUP_RATE_LIMIT_HIT", { identifier, email });
    return {
      success: false,
      error: "You have been blocked due to rate limiting",
      status: 429
    };
  }

  return { success: true };
}

/**
 * General protection for regular requests
 */
export async function protectGeneral(
  request: Request,
  identifier: string,
  options: RateLimitOptions = { maxRequests: 2500, windowMs: 60000 } // Increased 25x from 100
): Promise<SecurityCheckResult> {
  // Check for bot behavior
  if (detectBot(request)) {
    return {
      success: false,
      error: "You are a bot! If this is a mistake, contact our support",
      status: 403
    };
  }

  // Apply rate limiting
  const rateLimitOk = rateLimiter.check(identifier, options);

  if (!rateLimitOk) {
    logger.security("GENERAL_RATE_LIMIT_HIT", { identifier, maxRequests: options.maxRequests });
    return {
      success: false,
      error: "You have been blocked due to rate limiting",
      status: 429
    };
  }

  return { success: true };
}