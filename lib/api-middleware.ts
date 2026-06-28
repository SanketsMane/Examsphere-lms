// API Middleware for Security and Performance Optimization
import { NextRequest, NextResponse } from "next/server";
import { PerformanceMonitor } from "./performance";
import { protectGeneral } from "./security";
import { CSRFProtection } from "./security-enhanced";

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Content Security Policy
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:", "blob:"],
  'media-src': ["'self'", "https:", "blob:"],
  'connect-src': ["'self'", "https:", "wss:"],
  'frame-src': ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
  'worker-src': ["'self'", "blob:"],
};

interface MiddlewareOptions {
  requireAuth?: boolean;
  enableCSRF?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  enablePerformanceTracking?: boolean;
}

export function withSecurityAndPerformance(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const endTimer = PerformanceMonitor.startTimer(`api_${request.nextUrl.pathname}`);

    try {
      // Get client identifier
      const clientIP = getClientIP(request);
      const identifier = clientIP || 'unknown';

      // Apply security protection
      const securityCheck = await protectGeneral(request, identifier, options.rateLimit);
      
      if (!securityCheck.success) {
        const errorResponse = NextResponse.json(
          { error: securityCheck.error },
          { status: securityCheck.status || 400 }
        );
        return applySecurityHeaders(errorResponse);
      }

      // CSRF protection for state-changing operations
      if (options.enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfToken = request.headers.get('X-CSRF-Token');
        if (!csrfToken || !CSRFProtection.validateToken(request, csrfToken)) {
          const errorResponse = NextResponse.json(
            { error: 'CSRF token validation failed' },
            { status: 403 }
          );
          return applySecurityHeaders(errorResponse);
        }
      }

      // Execute the handler
      const response = await handler(request);

      // Add performance tracking
      if (options.enablePerformanceTracking) {
        const duration = endTimer();
        response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
        response.headers.set('X-Server-Time', new Date().toISOString());
      }

      // Apply security headers and return
      return applySecurityHeaders(response);

    } catch (error) {
      console.error('API middleware error:', error);
      
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      return applySecurityHeaders(errorResponse);
    }
  };
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Content Security Policy
  const csp = Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional security headers
  response.headers.set('X-Powered-By', 'EXAMSPHERE');
  response.headers.set('Vary', 'Accept-Encoding, Origin');

  return response;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cfConnecting = request.headers.get('cf-connecting-ip');
  
  return (
    forwarded?.split(',')[0]?.trim() ||
    real ||
    cfConnecting ||
    (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')) ||
    'unknown'
  );
}

// Cache management utilities
export class CacheManager {
  private static cache = new Map<string, { data: any; expires: number }>();

  static set(key: string, data: any, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      PerformanceMonitor.recordMetric('cache_miss', 1);
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      PerformanceMonitor.recordMetric('cache_expired', 1);
      return null;
    }

    PerformanceMonitor.recordMetric('cache_hit', 1);
    return entry.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Response optimization utilities
export class ResponseOptimizer {
  static addCacheHeaders(response: NextResponse, maxAge: number = 300): NextResponse {
    response.headers.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);
    response.headers.set('ETag', `"${Date.now()}"`);
    return response;
  }

  static addNoCacheHeaders(response: NextResponse): NextResponse {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  static compress(data: any): string {
    return JSON.stringify(data, null, process.env.NODE_ENV === 'development' ? 2 : 0);
  }
}

// Database query optimization
export class QueryOptimizer {
  static async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> {
    // Try cache first
    const cached = CacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const endTimer = PerformanceMonitor.startTimer(`db_query_${key}`);
    try {
      const result = await fetcher();
      CacheManager.set(key, result, ttl);
      return result;
    } finally {
      endTimer();
    }
  }

  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${Buffer.from(sortedParams).toString('base64')}`;
  }
}

// Performance monitoring utilities
export class APIMetrics {
  private static metrics = new Map<string, { count: number; totalTime: number; errors: number }>();

  static recordRequest(endpoint: string, duration: number, success: boolean): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
    }

    const metric = this.metrics.get(endpoint)!;
    metric.count++;
    metric.totalTime += duration;
    
    if (!success) {
      metric.errors++;
    }
  }

  static getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [endpoint, metric] of this.metrics.entries()) {
      result[endpoint] = {
        totalRequests: metric.count,
        averageResponseTime: metric.count > 0 ? metric.totalTime / metric.count : 0,
        errorRate: metric.count > 0 ? metric.errors / metric.count : 0,
        totalErrors: metric.errors
      };
    }

    return result;
  }

  static reset(): void {
    this.metrics.clear();
  }
}

// Cleanup scheduler
setInterval(() => {
  CacheManager.cleanup();
}, 60000); // Clean up every minute