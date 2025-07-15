import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { userContextService } from '@/lib/services/UserContextService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Load user context based on session
    const userContext = await userContextService.loadUserContext(session?.user);
    
    return NextResponse.json({
      success: true,
      user: userContext
    });
  } catch (error) {
    console.error('Failed to get user context:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load user context' },
      { status: 500 }
    );
  }
}
