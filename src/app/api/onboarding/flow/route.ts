import { NextRequest, NextResponse } from 'next/server';
import { onboardingManager } from '@/lib/onboarding/manager';

export async function GET() {
  try {
    await onboardingManager.initialize();
    const flow = await onboardingManager.getCurrentFlow();
    await onboardingManager.close();

    return NextResponse.json(flow);
  } catch (error) {
    console.error('Failed to get onboarding flow:', error);
    return NextResponse.json(
      { error: 'Failed to load onboarding flow' },
      { status: 500 }
    );
  }
}
