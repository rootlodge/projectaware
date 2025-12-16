import { NextRequest, NextResponse } from "next/server";
import { withAPIMiddleware } from "@/lib/api/middleware";
import { formatErrorResponse} from "@/lib/utils/errors";

// Example protected API endpoint
export async function GET(request: NextRequest) {
  try {
    // Validate API key and check permissions
    const context = await withAPIMiddleware(request, "read");

    return NextResponse.json({
      message: "API is working",
      userId: context.userId,
      userRole: context.userRole,
      tenantId: context.tenantId,
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
