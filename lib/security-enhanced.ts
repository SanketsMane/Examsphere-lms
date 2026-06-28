// Enhanced Security Extensions for EXAMSPHERE
import crypto from 'crypto';

/**
 * CSRF Protection utilities
 */
export class CSRFProtection {
  private static readonly tokenName = 'examsphere-csrf-token';

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static validateToken(request: Request, token: string): boolean {
    const headerToken = request.headers.get('X-CSRF-Token');
    return headerToken === token;
  }
}

/**
 * Input sanitization and validation
 */
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { isValid: errors.length === 0, errors };
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars
      .replace(/\.{2,}/g, '.') // Replace multiple dots
      .substring(0, 255); // Limit length
  }
}

/**
 * File upload security
 */
export class FileUploadSecurity {
  private static readonly allowedTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    document: ['pdf', 'doc', 'docx', 'txt'],
    video: ['mp4', 'webm', 'mov'],
    audio: ['mp3', 'wav', 'ogg'],
  };

  static validateFile(file: File, type: keyof typeof FileUploadSecurity.allowedTypes): { valid: boolean; error?: string } {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.allowedTypes[type].includes(extension)) {
      return { valid: false, error: `File type ${extension} not allowed` };
    }

    // Check file size limits
    const maxSizes = { image: 10, document: 50, video: 500, audio: 100 };
    const maxSize = maxSizes[type] * 1024 * 1024;
    
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSizes[type]}MB limit` };
    }

    return { valid: true };
  }
}

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionUtils {
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static hashPassword(password: string, salt?: string): string {
    const saltToUse = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, saltToUse, 10000, 64, 'sha512');
    return `${saltToUse}:${hash.toString('hex')}`;
  }

  static verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
  }
}