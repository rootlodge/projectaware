import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';

const userService = new UserService();

export async function POST(request: NextRequest) {
  // EMAIL VERIFICATION TEMPORARILY DISABLED
  return NextResponse.json(
    { success: false, error: 'Email verification is temporarily disabled' },
    { status: 501 }
  );

  /* COMMENTED OUT - EMAIL VERIFICATION DISABLED
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await userService.verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now sign in.'
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
  */
}
