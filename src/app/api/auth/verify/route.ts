import { NextRequest, NextResponse } from "next/server";
import { verifyEmailWithToken } from "@/lib/auth/verification";
import { formatErrorResponse } from "@/lib/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const result = await verifyEmailWithToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
