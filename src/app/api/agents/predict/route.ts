import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/agents/UserModel';
import { NeedAnticipationService } from '@/lib/agents/NeedAnticipationService';

/**
 * Predicts user needs and next actions using UserModel and NeedAnticipationService.
 * @param req Next.js API request
 * @returns JSON with predictions and anticipated needs
 */
export async function GET(_req: NextRequest) {
  try {
    // Example: get userId from query or session (expand as needed)
    // UserModel and NeedAnticipationService currently have placeholder methods
    const userModel = new UserModel();
    const needService = new NeedAnticipationService(userModel);

    // If predictNextActions does not exist, return a placeholder or empty array
    let predictions: { action: string; confidence: number }[] = [];
    if (typeof userModel.predictNextActions === 'function') {
      predictions = await userModel.predictNextActions();
    }

    // Use anticipateNeeds as the correct method
    let anticipatedNeeds: unknown[] = [];
    if (typeof needService.anticipateNeeds === 'function') {
      anticipatedNeeds = await needService.anticipateNeeds();
    }

    return NextResponse.json({
      predictions,
      anticipatedNeeds,
    });
  } catch (error) {
    // Log error for dev/ops
    console.error('Prediction API error:', error);
    return NextResponse.json(
      { error: 'Unable to generate predictions at this time.' },
      { status: 500 }
    );
  }
}
