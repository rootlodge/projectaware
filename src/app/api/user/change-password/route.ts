import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';
import { AuthUtils } from '@/lib/auth/utils';
import { ChangePasswordRequest } from '@/lib/types/auth';
import { z } from 'zod';

const userService = new UserService();

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

// Authentication middleware
async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = AuthUtils.extractBearerToken(authHeader);

  if (!token) {
    return null;
  }

  const payload = AuthUtils.verifyAccessToken(token);
  if (!payload || AuthUtils.isTokenExpired(payload.exp)) {
    return null;
  }

  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await authenticateRequest(request);
    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed', 
          details: validation.error.issues 
        },
        { status: 400 }
      );
    }

    const changePasswordRequest: ChangePasswordRequest = validation.data;
    
    const result = await userService.changePassword(authPayload.sub, changePasswordRequest);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully. Please sign in again.'
    });

  } catch (error) {
    console.error('Change password API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
