import { NextRequest, NextResponse } from 'next/server';
import { resourceMonitoringService } from '@/lib/monitoring/resource-monitoring-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    if (!tenant_id) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id parameter is required'
      }, { status: 400 });
    }
    
    const summary = await resourceMonitoringService.getTenantResourceSummary(tenant_id);
    
    return NextResponse.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Resource monitoring API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenant_id, usage } = body;
    
    if (!tenant_id) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id is required'
      }, { status: 400 });
    }
    
    await resourceMonitoringService.updateResourceUsage(tenant_id, usage);
    
    return NextResponse.json({
      success: true,
      message: 'Resource usage updated successfully'
    });
    
  } catch (error) {
    console.error('Update resource usage API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
