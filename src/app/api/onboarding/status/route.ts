import { NextRequest, NextResponse } from 'next/server';
import { onboardingManager } from '@/lib/onboarding/manager';

export async function GET() {
  try {
    await onboardingManager.initialize();
    const isFirstTime = await onboardingManager.isFirstTime();
    await onboardingManager.close();

    return NextResponse.json({ 
      isFirstTime,
      oncloudEnabled: process.env.ONCLOUD === 'true'
    });
  } catch (error) {
    console.error('Failed to check first time status:', error);
    return NextResponse.json(
      { error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
