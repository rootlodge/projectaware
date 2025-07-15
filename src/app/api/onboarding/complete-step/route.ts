import { NextRequest, NextResponse } from 'next/server';
import { onboardingManager } from '@/lib/onboarding/manager';

export async function POST(request: NextRequest) {
  try {
    const { stepId, data } = await request.json();

    if (!stepId) {
      return NextResponse.json(
        { error: 'Step ID is required' },
        { status: 400 }
      );
    }

    await onboardingManager.initialize();
    
    // Save step data and complete the step
    await onboardingManager.completeStep(stepId, data);
    
    // Get updated flow
    const result = await onboardingManager.getCurrentFlow();
    
    await onboardingManager.close();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to complete step:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding step' },
      { status: 500 }
    );
  }
}
