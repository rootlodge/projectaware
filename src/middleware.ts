import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenants/isolation";

const publicPaths = ["/", "/login", "/register", "/verify-email", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes (they handle their own auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // API v1 Authentication & Rate Limiting
  if (pathname.startsWith("/api/v1/")) {
    const apiKey = request.headers.get("x-api-key");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API key", code: "missing_api_key" }, 
        { status: 401 }
      );
    }

    try {
      // Validate API Key
      // We need to dynamically import DB because middleware might load in contexts where DB isn't fully ready immediately
      // or to avoid top-level await issues if any.
      const { db, schema } = await import("@/db");
      const { eq } = await import("drizzle-orm");
      
      const keyRecord = await db.query.apiKeys.findFirst({
        where: eq(schema.apiKeys.key, apiKey),
      });

      if (!keyRecord || !keyRecord.isActive) {
        return NextResponse.json(
          { error: "Invalid or inactive API key", code: "invalid_api_key" },
          { status: 401 }
        );
      }

      // Check Rate Limit (e.g. 100 req/min for now)
      const { checkRateLimit } = await import("@/lib/api/rate-limit");
      const isAllowed = await checkRateLimit(keyRecord.id, pathname, 100, 60);

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded", code: "rate_limit_exceeded" },
          { status: 429 }
        );
      }

      // Attach context to headers for downstream
      const response = NextResponse.next();
      response.headers.set("x-user-id", keyRecord.userId);
      response.headers.set("x-api-key-id", keyRecord.id);
      if (keyRecord.tenantId) {
        response.headers.set("x-tenant-id", keyRecord.tenantId);
      }
      return response;

    } catch (error) {
      console.error("Middleware API check failed:", error);
      return NextResponse.json(
        { error: "Internal Server Error", code: "internal_error" },
        { status: 500 }
      );
    }
  }

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add tenant context to request headers (if multi-tenant mode)
  if (process.env.MULTI_TENANT === "true") {
    const tenantId = await getTenantId(request);
    if (tenantId) {
      const response = NextResponse.next();
      response.headers.set("x-tenant-id", tenantId);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs", // Use Node.js runtime instead of edge to support database operations
};
