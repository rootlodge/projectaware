import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';
import { SignInRequest } from '@/lib/types/auth';
import { z } from 'zod';

const userService = new UserService();

// Validation schema
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = signInSchema.safeParse(body);
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

    const signInRequest: SignInRequest = validation.data;
    
    // Get client IP and user agent for logging
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Add IP and user agent to request for session creation
    const requestWithMeta = {
      ...signInRequest,
      ip,
      userAgent
    };

    // Authenticate user
    const result = await userService.signIn(requestWithMeta);

    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    // Set HTTP-only cookie for refresh token (more secure)
    const response = NextResponse.json(result);
    
    if (result.refresh_token) {
      response.cookies.set('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });
    }

    return response;

  } catch (error) {
    console.error('Sign in API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
