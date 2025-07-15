import { NextRequest, NextResponse } from 'next/server';
import { onboardingManager } from '@/lib/onboarding/manager';

export async function POST(request: NextRequest) {
  try {
    await onboardingManager.initialize();
    
    await onboardingManager.finishOnboarding();
    
    await onboardingManager.close();

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding completed successfully' 
    });
  } catch (error) {
    console.error('Failed to finish onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
