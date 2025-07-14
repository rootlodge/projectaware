import { NextRequest, NextResponse } from 'next/server';
import { getEmotionEngine } from '@/lib/shared/instances';

/**
 * GET /api/emotions/forecast
 * Returns emotion trend forecast from the EmotionEngine.
 * @author Dylan Ellison
 */
export async function GET(req: NextRequest) {
  try {
    const engine = getEmotionEngine();
    const result = engine.forecastEmotionTrends();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Log error for dev/ops
    console.error('Emotion trend forecast error:', error);
    return NextResponse.json({ error: 'Unable to forecast emotion trends.' }, { status: 500 });
  }
}
