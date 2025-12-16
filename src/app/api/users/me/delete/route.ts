import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteUserAccount } from "@/lib/users/data-deletion";
import { trackActivity } from "@/lib/users/activity-tracker";
import { formatErrorResponse, AuthenticationError, ValidationError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { confirm } = body;

    if (confirm !== "DELETE") {
      throw new ValidationError("Please confirm deletion by sending 'DELETE'");
    }

    // Track deletion request
    await trackActivity({
      userId: session.user.id,
      action: "data_delete_request",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const result = await deleteUserAccount(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Sign out the user
    await auth.api.signOut({
      headers: request.headers,
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
