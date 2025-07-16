import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { JWTPayload, User } from '@/lib/types/auth';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class AuthUtils {
  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // JWT Token generation
  static generateAccessToken(user: User, tenant_id?: string, tenant_role?: string): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id,
      tenant_role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseTimeToSeconds(JWT_EXPIRES_IN),
    };

    return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
  }

  static generateRefreshToken(user_id: string): string {
    const payload = {
      sub: user_id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseTimeToSeconds(JWT_REFRESH_EXPIRES_IN),
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, { algorithm: 'HS256' });
  }

  // JWT Token verification
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  }

  static verifyRefreshToken(token: string): { sub: string; type: string } | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string; type: string };
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }

  // Utility functions
  static generateSecureToken(): string {
    return uuidv4().replace(/-/g, '');
  }

  static hashToken(token: string): string {
    return bcrypt.hashSync(token, 10);
  }

  static verifyToken(token: string, hash: string): boolean {
    return bcrypt.compareSync(token, hash);
  }

  static parseTimeToSeconds(timeString: string): number {
    const units = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeString}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2] as keyof typeof units;

    return value * units[unit];
  }

  static isTokenExpired(exp: number): boolean {
    return Date.now() >= exp * 1000;
  }

  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Password strength validation
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Username validation
  static validateUsername(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (username.length > 30) {
      errors.push('Username must be no more than 30 characters long');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }

    if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
      errors.push('Username cannot start or end with underscore or hyphen');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate expiration date
  static generateExpirationDate(hours: number = 24): Date {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now;
  }

  // Extract bearer token from Authorization header
  static extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Generate avatar URL (using initials)
  static generateAvatarUrl(name: string, size: number = 64): string {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    // Using a simple avatar service - can be replaced with your preferred service
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=7c3aed&color=fff`;
  }

  // Rate limiting key generation
  static generateRateLimitKey(ip: string, endpoint: string): string {
    return `rate_limit:${ip}:${endpoint}`;
  }

  // Session device info
  static parseUserAgent(userAgent: string): string {
    // Simple user agent parsing - can be enhanced with a proper library
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}
