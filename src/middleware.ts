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
