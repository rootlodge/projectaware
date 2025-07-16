import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';
import { AuthUtils } from '@/lib/auth/utils';
import { UpdateProfileRequest, ChangePasswordRequest } from '@/lib/types/auth';
import { z } from 'zod';

const userService = new UserService();

// Validation schemas
const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
  theme: z.enum(['light', 'dark', 'tech']).optional(),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  phone: z.string().optional(),
  marketing_consent: z.boolean().optional(),
});

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

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authPayload = await authenticateRequest(request);
    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await userService.getUserById(authPayload.sub);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const { password_hash, ...userProfile } = user;

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
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
    const validation = updateProfileSchema.safeParse(body);
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

    const updateRequest: UpdateProfileRequest = validation.data;
    
    const result = await userService.updateProfile(authPayload.sub, updateRequest);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/profile - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const authPayload = await authenticateRequest(request);
    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Implement account deletion with GDPR compliance
    // This should include:
    // 1. Mark user as deleted
    // 2. Anonymize personal data
    // 3. Keep audit trail for legal requirements
    // 4. Schedule complete data deletion after retention period

    return NextResponse.json({
      success: false,
      error: 'Account deletion not yet implemented'
    }, { status: 501 });

  } catch (error) {
    console.error('Delete account API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
