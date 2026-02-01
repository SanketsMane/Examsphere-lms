/**
 * Action Security Helpers
 * Provides security protection functions for server actions
 */

import { protectGeneral } from './security';

interface ActionSecurityResult {
  success: boolean;
  error?: string;
}

/**
 * Protect admin actions with enhanced rate limiting
 */
export async function protectAdminAction(userId: string): Promise<ActionSecurityResult> {
  // Create a mock request for rate limiting
  const mockRequest = new Request('https://example.com', {
    headers: {
      'user-agent': 'Next.js Server Action'
    }
  });

  const result = await protectGeneral(mockRequest, `admin:${userId}`, {
    maxRequests: 50, // Increased from 5
    windowMs: 60000 // 1 minute window
  });

  return {
    success: result.success,
    error: result.error
  };
}

/**
 * Protect enrollment actions with user-specific rate limiting
 */
export async function protectEnrollmentAction(userId: string): Promise<ActionSecurityResult> {
  // Create a mock request for rate limiting
  const mockRequest = new Request('https://example.com', {
    headers: {
      'user-agent': 'Next.js Server Action'
    }
  });

  const result = await protectGeneral(mockRequest, `enroll:${userId}`, {
    maxRequests: 30, // Increased from 3
    windowMs: 60000 // 1 minute window, stricter for enrollments
  });

  return {
    success: result.success,
    error: result.error
  };
}