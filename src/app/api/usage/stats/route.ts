import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '../../../../lib/middleware/rate-limiter';

async function handler(request: NextRequest): Promise<NextResponse> {
  if (request.method === 'GET') {
    // Get usage statistics for the tenant
    return NextResponse.json({
      message: 'API usage endpoint - rate limited',
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.nextUrl.pathname,
    });
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Export the rate-limited handler
export async function GET(request: NextRequest): Promise<NextResponse> {
  return withRateLimit(request, handler);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withRateLimit(request, handler);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return withRateLimit(request, handler);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return withRateLimit(request, handler);
}
