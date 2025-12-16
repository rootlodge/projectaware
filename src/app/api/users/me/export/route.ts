import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateDataExportFile } from "@/lib/users/data-export";
import { trackActivity } from "@/lib/users/activity-tracker";
import { formatErrorResponse, AuthenticationError } from "@/lib/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    // Track data export activity
    await trackActivity({
      userId: session.user.id,
      action: "data_export",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const dataJson = await generateDataExportFile(session.user.id);

    return new NextResponse(dataJson, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-${session.user.id}.json"`,
      },
    });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
