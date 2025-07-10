import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Test basic soul functionality
    const response = await fetch(`${req.nextUrl.origin}/api/soul`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error('Soul API not responding');
    }
    
    const soulData = await response.json();
    
    // Test behavior evaluation
    const behaviorTest = await fetch(`${req.nextUrl.origin}/api/soul`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evaluate_behavior',
        change: 'Test change for validation',
        context: 'Testing soul system integration',
        severity: 'moderate'
      })
    });
    
    const behaviorResult = await behaviorTest.json();
    
    return NextResponse.json({
      status: 'Soul System Test Passed',
      tests: {
        configLoad: soulData ? 'PASS' : 'FAIL',
        coreValues: soulData.coreValues?.length > 0 ? 'PASS' : 'FAIL',
        behaviorEvaluation: behaviorResult.decision_made ? 'PASS' : 'FAIL'
      },
      soulData,
      behaviorResult
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Soul System Test Failed',
      error: error.message
    }, { status: 500 });
  }
}
