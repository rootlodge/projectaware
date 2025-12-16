import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserActivity } from "@/lib/users/activity-tracker";
import { formatErrorResponse, AuthenticationError } from "@/lib/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const activity = await getUserActivity(session.user.id, {
      limit: Math.min(limit, 100),
      offset,
    });

    return NextResponse.json({ activity });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
