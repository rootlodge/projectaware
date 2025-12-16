import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTenant, getUserTenants } from "@/lib/tenants/provisioning";
import { defaultTenantConfig } from "@/lib/tenants/configuration";
import { isAdmin } from "@/lib/auth/rbac";
import { formatErrorResponse, AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !isAdmin(session.user.role as any)) {
      throw new AuthorizationError("Only admins can create tenants");
    }

    const body = await request.json();
    const { name, slug, maxUsers, maxApiCalls, storageLimit } = body;

    const result = await createTenant({
      name,
      slug,
      ownerId: session.user.id,
      configuration: defaultTenantConfig,
      maxUsers,
      maxApiCalls,
      storageLimit,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tenantId: result.tenantId,
      message: "Tenant created successfully",
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const tenants = await getUserTenants(session.user.id);

    return NextResponse.json({ tenants });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
