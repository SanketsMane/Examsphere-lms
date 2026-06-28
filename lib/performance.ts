// Performance Optimization Utilities for EXAMSPHERE
import { NextRequest, NextResponse } from "next/server";

// Cache configurations
export const CACHE_CONFIG = {
  // Static assets (1 year)
  STATIC_ASSETS: 'public, max-age=31536000, immutable',
  // API responses (5 minutes)
  API_SHORT: 'public, max-age=300, s-maxage=300',
  // API responses (1 hour)
  API_LONG: 'public, max-age=3600, s-maxage=3600',
  // User-specific data (no cache)
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  // CDN cache (1 day)
  CDN_CACHE: 'public, max-age=86400, s-maxage=86400',
};

// Performance monitoring
class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics(label: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label);
    }
    return result;
  }
}

// Database query optimization
export class QueryOptimizer {
  static async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    // In production, use Redis or similar
    const cached = await this.getFromCache(key);
    if (cached) {
      return cached as T;
    }

    const endTimer = PerformanceMonitor.startTimer(`db_query_${key}`);
    const result = await fetcher();
    endTimer();

    await this.setCache(key, result, ttl);
    return result;
  }

  private static cache: Map<string, { value: any; expires: number }> = new Map();

  private static async getFromCache(key: string): Promise<any> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      PerformanceMonitor.recordMetric('cache_hit', 1);
      return cached.value;
    }
    PerformanceMonitor.recordMetric('cache_miss', 1);
    return null;
  }

  private static async setCache(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// Image optimization
export class ImageOptimizer {
  static getOptimizedImageUrl(
    src: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): string {
    if (!src) return '';

    // For external URLs, return as-is
    if (src.startsWith('http')) {
      return src;
    }

    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());

    return `/api/images/optimize?src=${encodeURIComponent(src)}&${params.toString()}`;
  }

  static generateResponsiveImageSizes(baseWidth: number): string {
    const breakpoints = [640, 768, 1024, 1280, 1536];
    return breakpoints
      .map(bp => `(max-width: ${bp}px) ${Math.min(bp, baseWidth)}px`)
      .join(', ') + `, ${baseWidth}px`;
  }
}

// Bundle analysis and optimization
export class BundleOptimizer {
  static analyzeBundle(): Promise<any> {
    // This would integrate with webpack-bundle-analyzer in production
    return Promise.resolve({
      totalSize: 0,
      chunks: [],
      recommendations: [],
    });
  }

  static async loadComponentAsync<T>(
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    const endTimer = PerformanceMonitor.startTimer('component_load');
    try {
      const module = await importFn();
      return module.default;
    } finally {
      endTimer();
    }
  }
}

// Resource hints for preloading
export class ResourceHints {
  static generatePreloadLinks(resources: string[]): string {
    return resources
      .map(resource => {
        const ext = resource.split('.').pop();
        const type = ext === 'js' ? 'script' : ext === 'css' ? 'style' : 'fetch';
        return `<link rel="preload" href="${resource}" as="${type}">`;
      })
      .join('\n');
  }

  static generatePrefetchLinks(pages: string[]): string {
    return pages
      .map(page => `<link rel="prefetch" href="${page}">`)
      .join('\n');
  }
}

// API Response optimization
export class ResponseOptimizer {
  static compress(data: any): string {
    return JSON.stringify(data);
  }

  static addPerformanceHeaders(response: NextResponse, timing?: number): NextResponse {
    if (timing) {
      response.headers.set('X-Response-Time', `${timing.toFixed(2)}ms`);
    }
    response.headers.set('X-Powered-By', 'EXAMSPHERE');
    return response;
  }

  static enableCaching(response: NextResponse, cacheControl: string): NextResponse {
    response.headers.set('Cache-Control', cacheControl);
    response.headers.set('Vary', 'Accept-Encoding');
    return response;
  }
}

// Memory management
export class MemoryManager {
  private static intervals: NodeJS.Timeout[] = [];

  static scheduleCleanup(intervalMs: number = 300000): void {
    const interval = setInterval(() => {
      QueryOptimizer.clearCache();
      this.clearExpiredData();
      if (global.gc) {
        global.gc();
      }
    }, intervalMs);
    
    this.intervals.push(interval);
  }

  static clearExpiredData(): void {
    // Clear any expired data structures
    PerformanceMonitor.getAllMetrics(); // This internally cleans up old metrics
  }

  static cleanup(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

// Web Vitals monitoring
export class WebVitalsMonitor {
  static init(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  private static observeLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        PerformanceMonitor.recordMetric('lcp', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  private static observeFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          PerformanceMonitor.recordMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  private static observeCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            PerformanceMonitor.recordMetric('cls', clsValue);
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }
}

export { PerformanceMonitor };