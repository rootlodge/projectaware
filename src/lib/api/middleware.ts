import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, hasRequiredScope, type APIKeyScope } from "./api-keys";
import { checkRateLimit, getRateLimitConfig } from "./rate-limiting";
import { getClientIP } from "./logging";
import { RateLimitError, AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

/**
 * API middleware for authentication and rate limiting
 */
export async function withAPIMiddleware(
  request: NextRequest,
  requiredScope: APIKeyScope = "read"
): Promise<{
  userId: string;
  userRole: string;
  tenantId?: string;
  apiKeyId: string;
}> {
  // Extract API key from header
  const apiKeyHeader = request.headers.get("x-api-key") || request.headers.get("authorization");
  
  if (!apiKeyHeader) {
    throw new AuthenticationError("API key required");
  }

  // Remove "Bearer " prefix if present
  const apiKey = apiKeyHeader.startsWith("Bearer ")
    ? apiKeyHeader.slice(7)
    : apiKeyHeader;

  // Validate API key
  const validation = await validateAPIKey(apiKey);

  if (!validation.valid || !validation.apiKey) {
    throw new AuthenticationError(validation.error || "Invalid API key");
  }

  // Check scope
  if (!hasRequiredScope(validation.apiKey.scope as APIKeyScope, requiredScope)) {
    throw new AuthorizationError(`This endpoint requires '${requiredScope}' scope or higher`);
  }

  // Rate limiting - use API key as identifier
  const tier = validation.apiKey.scope === "admin" ? "premium" : "authenticated";
  const rateLimitConfig = getRateLimitConfig(tier);
  const rateLimit = await checkRateLimit(
    validation.apiKey.id,
    "api",
    rateLimitConfig
  );

  if (!rateLimit.allowed) {
    throw new RateLimitError("Rate limit exceeded");
  }

  // Add rate limit headers to response (will be added by caller)
  return {
    userId: validation.apiKey.user.id,
    userRole: validation.apiKey.user.role,
    tenantId: validation.apiKey.tenantId || undefined,
    apiKeyId: validation.apiKey.id,
  };
}

/**
 * IP-based rate limiting for public endpoints
 */
export async function withIPRateLimit(request: NextRequest): Promise<void> {
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(ip, "public", {
    windowMs: 60 * 1000,
    maxRequests: 60,
  });

  if (!rateLimit.allowed) {
    throw new RateLimitError("Too many requests from this IP");
  }
}

/**
 * Create API response with rate limit headers
 */
export function createAPIResponse(
  data: any,
  options?: {
    status?: number;
    remaining?: number;
    resetAt?: Date;
  }
): NextResponse {
  const response = NextResponse.json(data, { status: options?.status || 200 });

  if (options?.remaining !== undefined) {
    response.headers.set("X-RateLimit-Remaining", options.remaining.toString());
  }

  if (options?.resetAt) {
    response.headers.set("X-RateLimit-Reset", options.resetAt.toISOString());
  }

  return response;
}
