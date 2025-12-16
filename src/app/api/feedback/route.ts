import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { submitFeedback, getUserFeedback } from "@/lib/users/feedback";
import { formatErrorResponse, AuthenticationError, ValidationError } from "@/lib/utils/errors";
import { feedbackMessageSchema, ratingSchema } from "@/lib/utils/validators";
import { feedbackTypes } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const { type, message, rating } = body;

    // Validate inputs
    if (!feedbackTypes.includes(type)) {
      throw new ValidationError("Invalid feedback type");
    }

    const messageValidation = feedbackMessageSchema.safeParse(message);
    if (!messageValidation.success) {
      throw new ValidationError(messageValidation.error.errors[0].message);
    }

    if (rating !== undefined) {
      const ratingValidation = ratingSchema.safeParse(rating);
      if (!ratingValidation.success) {
        throw new ValidationError(ratingValidation.error.errors[0].message);
      }
    }

    const result = await submitFeedback({
      userId: session.user.id,
      type,
      message,
      rating,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedbackId: result.feedbackId,
      message: "Feedback submitted successfully",
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

    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const feedback = await getUserFeedback(session.user.id, {
      limit: Math.min(limit, 100),
      offset,
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    const response = formatErrorResponse(error);
    const statusCode = response.error.statusCode || 500;
    return NextResponse.json(response, { status: statusCode });
  }
}
