import { NextRequest, NextResponse } from 'next/server';
import { apiUsageService } from '../usage/api-usage-service';
import { getStripeService } from '../billing/stripe-service';
import { verify } from 'jsonwebtoken';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  remaining?: {
    hourly: number;
    daily: number;
    monthly: number;
  };
}

export class APIRateLimiter {
  private static instance: APIRateLimiter;

  private constructor() {}

  public static getInstance(): APIRateLimiter {
    if (!APIRateLimiter.instance) {
      APIRateLimiter.instance = new APIRateLimiter();
    }
    return APIRateLimiter.instance;
  }

  // Main middleware function for rate limiting
  async checkRateLimit(request: NextRequest): Promise<RateLimitResult> {
    try {
      const tenant_id = await this.extractTenantId(request);
      if (!tenant_id) {
        return {
          allowed: false,
          reason: 'Invalid or missing authentication',
        };
      }

      const stripeService = getStripeService();
      if (!stripeService) {
        return {
          allowed: false,
          reason: 'Billing service unavailable',
        };
      }

      const result = await apiUsageService.canMakeRequest(tenant_id, stripeService);
      
      if (!result.allowed) {
        return {
          allowed: false,
          reason: result.reason,
          retryAfter: this.calculateRetryAfter(result.reason),
        };
      }

      // Calculate remaining limits
      const remaining = result.limits && result.current ? {
        hourly: Math.max(0, result.limits.max_api_calls_per_hour - result.current.api_calls_this_hour),
        daily: Math.max(0, result.limits.max_api_calls_per_day - result.current.api_calls_this_day),
        monthly: result.limits.max_api_calls_per_month === -1 ? -1 : 
                Math.max(0, result.limits.max_api_calls_per_month - result.current.api_calls_this_month),
      } : undefined;

      return {
        allowed: true,
        remaining,
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return {
        allowed: false,
        reason: 'Internal rate limiting error',
      };
    }
  }

  // Extract tenant ID from request (JWT token, API key, etc.)
  async extractTenantId(request: NextRequest): Promise<string | null> {
    try {
      // Try JWT token first
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verify(token, process.env.JWT_SECRET!) as any;
        return decoded.tenant_id || null;
      }

      // Try API key
      const apiKey = request.headers.get('x-api-key');
      if (apiKey) {
        // In a real implementation, you'd look up the tenant_id by API key
        // For now, we'll extract it from the key format: tenant_id.key
        const parts = apiKey.split('.');
        if (parts.length >= 2) {
          return parts[0];
        }
      }

      // Try query parameter (for development/testing)
      const tenantId = request.nextUrl.searchParams.get('tenant_id');
      if (tenantId) {
        return tenantId;
      }

      return null;
    } catch (error) {
      console.error('Failed to extract tenant ID:', error);
      return null;
    }
  }

  // Calculate retry-after header value based on limit type
  private calculateRetryAfter(reason?: string): number | undefined {
    if (!reason) return undefined;

    if (reason.includes('hourly')) {
      // Retry after the current hour ends
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      return Math.ceil((nextHour.getTime() - now.getTime()) / 1000);
    }

    if (reason.includes('daily')) {
      // Retry after the current day ends
      const now = new Date();
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      return Math.ceil((nextDay.getTime() - now.getTime()) / 1000);
    }

    if (reason.includes('concurrent')) {
      // Retry after a short delay for concurrent requests
      return 30; // 30 seconds
    }

    // Default retry after 1 hour
    return 3600;
  }

  // Record API usage after request completion
  async recordAPIUsage(
    request: NextRequest,
    response: NextResponse,
    startTime: number,
    tokensUsed?: number
  ): Promise<void> {
    try {
      const tenant_id = await this.extractTenantId(request);
      if (!tenant_id) return;

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Extract file size from request if it's a file upload
      let fileSizeMb = 0;
      const contentLength = request.headers.get('content-length');
      if (contentLength) {
        fileSizeMb = parseInt(contentLength) / (1024 * 1024);
      }

      await apiUsageService.recordUsage({
        tenant_id,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        timestamp: new Date(),
        tokens_used: tokensUsed,
        file_size_mb: fileSizeMb,
        response_time_ms: responseTime,
        status_code: response.status,
      });
    } catch (error) {
      console.error('Failed to record API usage:', error);
    }
  }

  // Increment concurrent request counter
  trackConcurrentRequest(tenant_id: string): void {
    apiUsageService.incrementConcurrentRequests(tenant_id);
  }

  // Decrement concurrent request counter
  releaseConcurrentRequest(tenant_id: string): void {
    apiUsageService.decrementConcurrentRequests(tenant_id);
  }
}

// Middleware function to be used in API routes
export async function withRateLimit(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimiter = APIRateLimiter.getInstance();
  const startTime = Date.now();
  
  // Check rate limits
  const limitResult = await rateLimiter.checkRateLimit(request);
  
  if (!limitResult.allowed) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: limitResult.reason,
        retry_after: limitResult.retryAfter,
      },
      { 
        status: 429,
        headers: {
          'Retry-After': limitResult.retryAfter?.toString() || '3600',
          'X-RateLimit-Remaining-Hourly': limitResult.remaining?.hourly?.toString() || '0',
          'X-RateLimit-Remaining-Daily': limitResult.remaining?.daily?.toString() || '0',
          'X-RateLimit-Remaining-Monthly': limitResult.remaining?.monthly?.toString() || '0',
        }
      }
    );
    return response;
  }

  // Track concurrent request
  const tenant_id = await rateLimiter.extractTenantId(request);
  if (tenant_id) {
    rateLimiter.trackConcurrentRequest(tenant_id);
  }

  try {
    // Execute the actual API handler
    const response = await handler(request);
    
    // Add rate limit headers to response
    if (limitResult.remaining) {
      response.headers.set('X-RateLimit-Remaining-Hourly', limitResult.remaining.hourly.toString());
      response.headers.set('X-RateLimit-Remaining-Daily', limitResult.remaining.daily.toString());
      response.headers.set('X-RateLimit-Remaining-Monthly', limitResult.remaining.monthly.toString());
    }
    
    // Record usage
    await rateLimiter.recordAPIUsage(request, response, startTime);
    
    return response;
  } finally {
    // Always release concurrent request counter
    if (tenant_id) {
      rateLimiter.releaseConcurrentRequest(tenant_id);
    }
  }
}

// Helper function for API routes to check file upload limits
export async function checkFileUploadLimit(
  tenant_id: string,
  fileSizeMb: number
): Promise<{ allowed: boolean; reason?: string; maxSize?: number }> {
  try {
    const stripeService = getStripeService();
    if (!stripeService) {
      return { allowed: false, reason: 'Billing service unavailable' };
    }

    const result = await apiUsageService.canMakeRequest(tenant_id, stripeService);
    
    if (!result.allowed || !result.limits) {
      return { allowed: false, reason: result.reason };
    }

    if (fileSizeMb > result.limits.max_file_upload_size_mb) {
      return {
        allowed: false,
        reason: `File size exceeds limit of ${result.limits.max_file_upload_size_mb}MB`,
        maxSize: result.limits.max_file_upload_size_mb,
      };
    }

    return { allowed: true, maxSize: result.limits.max_file_upload_size_mb };
  } catch (error) {
    console.error('Failed to check file upload limit:', error);
    return { allowed: false, reason: 'Internal error checking file limits' };
  }
}

export const rateLimiter = APIRateLimiter.getInstance();
