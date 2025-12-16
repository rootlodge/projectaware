import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAPIKey, getUserAPIKeys, revokeAPIKey } from "@/lib/api/api-keys";
import { formatErrorResponse, AuthenticationError, ValidationError } from "@/lib/utils/errors";

// Get user's API keys
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const keys = await getUserAPIKeys(session.user.id);

    return NextResponse.json({ keys });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}

// Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { name, scope, expiresInDays } = body;

    if (!name) {
      throw new ValidationError("API key name is required");
    }

    const result = await createAPIKey({
      name,
      userId: session.user.id,
      scope: scope || "read",
      expiresInDays,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      key: result.key,
      message: "API key created successfully. Please save it securely - it won't be shown again.",
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}

// Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = request.nextUrl;
    const keyId = searchParams.get("id");

    if (!keyId) {
      throw new ValidationError("API key ID is required");
    }

    const result = await revokeAPIKey(keyId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
