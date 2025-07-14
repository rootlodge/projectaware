import { NextRequest, NextResponse } from 'next/server';
import { getBrain } from '@/lib/shared/instances';

export async function GET(request: NextRequest) {
  try {
    const brain = getBrain();
    const toolStatus = await brain.getToolConfigurationStatus();
    
    return NextResponse.json({
      success: true,
      tool_configuration: toolStatus,
      message: toolStatus.toolsConfigured 
        ? `Tool usage available with model: ${toolStatus.toolModel}`
        : 'No tool model configured in specialized_models'
    });
  } catch (error) {
    console.error('Error checking tool status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check tool status' },
      { status: 500 }
    );
  }
}
