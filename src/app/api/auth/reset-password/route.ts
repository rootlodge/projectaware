import { NextRequest, NextResponse } from "next/server";
import { createResetToken, resetPasswordWithToken } from "@/lib/auth/password-reset";
import { passwordSchema } from "@/lib/auth/password";
import { sendEmail, emailTemplates } from "@/lib/email";
import { formatErrorResponse } from "@/lib/utils/errors";

// Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

    // If token and newPassword are provided, reset the password
    if (token && newPassword) {
      // Validate new password
      const passwordValidation = passwordSchema.safeParse(newPassword);
      if (!passwordValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid password",
            details: passwordValidation.error.errors.map((e) => e.message),
          },
          { status: 400 }
        );
      }

      const result = await resetPasswordWithToken(token, newPassword);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Password reset successfully",
      });
    }

    // Otherwise, request a reset token
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const result = await createResetToken(email);

    // Send reset email if token was created
    if (result.success &&result.token) {
      const resetUrl = `${process.env.BETTER_AUTH_URL}/reset-password?token=${result.token}`;
      const template = emailTemplates.passwordReset(resetUrl);

      await sendEmail({
        to: email,
        ...template,
      });
    }

    // Always return success (don't leak user existence)
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a reset link has been sent",
    });
  } catch (error) {
    return NextResponse.json(
      formatErrorResponse(error),
      { status: 500 }
    );
  }
}
