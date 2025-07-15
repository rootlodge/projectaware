import { NextRequest, NextResponse } from 'next/server';
import { getMetacognitionEngine } from '@/lib/shared/instances';

/**
 * GET /api/metacognition/bias-detection
 * Get bias detection analysis and recent findings
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const run_analysis = url.searchParams.get('run_analysis') === 'true';

    const metacognition = await getMetacognitionEngine();
    
    let detectedBiases: string[] = [];
    if (run_analysis) {
      detectedBiases = await metacognition.detectCognitiveBiases();
    }

    const recentDecisions = metacognition.getRecentDecisions(50);
    const biasIndicators = recentDecisions.flatMap(decision => decision.bias_risk_factors);
    
    // Analyze bias patterns
    const biasFrequency: { [key: string]: number } = {};
    biasIndicators.forEach(bias => {
      biasFrequency[bias] = (biasFrequency[bias] || 0) + 1;
    });

    const response = {
      success: true,
      bias_analysis: {
        detected_biases: detectedBiases,
        bias_frequency: biasFrequency,
        total_bias_indicators: biasIndicators.length,
        analysis_period: '50 recent decisions'
      },
      recent_decisions_with_bias_risk: recentDecisions
        .filter(decision => decision.bias_risk_factors.length > 0)
        .slice(0, 10),
      recommendations: [
        'Review decisions with high bias risk',
        'Implement bias correction measures',
        'Monitor confidence calibration',
        'Seek diverse perspectives on complex decisions'
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Metacognition API] Error in bias detection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform bias detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metacognition/bias-detection/report
 * Report a suspected bias for analysis
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      decision_id, 
      suspected_bias_type, 
      description, 
      evidence: _evidence, 
      severity: _severity 
    } = data;

    if (!decision_id || !suspected_bias_type || !description) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: decision_id, suspected_bias_type, description' 
        },
        { status: 400 }
      );
    }

    // In a full implementation, this would trigger detailed bias analysis
    console.log(`[Metacognition] Bias report: ${suspected_bias_type} in decision ${decision_id}`);

    const response = {
      success: true,
      report_id: `bias_report_${Date.now()}`,
      message: 'Bias report submitted for analysis',
      analysis_status: 'queued',
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      recommended_actions: [
        'Review decision-making process',
        'Consider alternative perspectives',
        'Implement bias correction strategies',
        'Monitor similar future decisions'
      ]
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Metacognition API] Error reporting bias:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit bias report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
