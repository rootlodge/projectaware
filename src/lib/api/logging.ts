import { NextRequest, NextResponse } from "next/server";

/**
 * Request logger middleware
 */
export interface RequestLog {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  tenantId?: string;
  timestamp: Date;
}

const requestLogs: RequestLog[] = [];
const MAX_LOGS = 1000; // Keep last 1000 requests in memory

/**
 * Log an API request
 */
export function logRequest(log: RequestLog): void {
  requestLogs.unshift(log);
  if (requestLogs.length > MAX_LOGS) {
    requestLogs.pop();
  }

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[${log.method}] ${log.url} - ${log.statusCode} (${log.duration}ms)`);
  }
}

/**
 * Get recent request logs
 */
export function getRequestLogs(limit: number = 100): RequestLog[] {
  return requestLogs.slice(0, limit);
}

/**
 * Create request logger wrapper
 */
export function withRequestLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();

    try {
      const response = await handler(...args);
      const duration = Date.now() - startTime;

      logRequest({
        method: request.method,
        url: request.url,
        statusCode: response.status,
        duration,
        userAgent: request.headers.get("user-agent") || undefined,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        timestamp: new Date(),
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logRequest({
        method: request.method,
        url: request.url,
        statusCode: 500,
        duration,
        userAgent: request.headers.get("user-agent") || undefined,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        timestamp: new Date(),
      });

      throw error;
    }
  }) as T;
}

/**
 * Extract client IP from request
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
