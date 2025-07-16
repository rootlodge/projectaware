import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/auth/user-service';
import { SignUpRequest } from '@/lib/types/auth';
import { z } from 'zod';

const userService = new UserService();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1).max(100).optional(),
  privacy_consent: z.boolean().refine(val => val === true, 'Privacy consent is required'),
  marketing_consent: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = signUpSchema.safeParse(body);
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

    const signUpRequest: SignUpRequest = validation.data;
    
    // Get client IP and user agent for logging
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Register user
    const result = await userService.signUp(signUpRequest);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Sign up API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
