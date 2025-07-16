import { NextRequest, NextResponse } from 'next/server';
import { tenantProvisioningService } from '@/lib/tenant/tenant-provisioning-service';
import { z } from 'zod';

const provisionTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  owner_email: z.string().email('Valid email is required'),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = provisionTenantSchema.parse(body);
    
    // Provision tenant
    const result = await tenantProvisioningService.provisionTenant(validatedData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        tenant_id: result.tenant_id,
        provisioning_steps: result.provisioning_steps,
        message: 'Tenant provisioned successfully'
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        provisioning_steps: result.provisioning_steps,
        message: 'Tenant provisioning failed'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Tenant provisioning API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.issues
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

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
    
    const status = await tenantProvisioningService.getTenantProvisioningStatus(tenant_id);
    
    return NextResponse.json({
      success: true,
      ...status
    });
    
  } catch (error) {
    console.error('Get tenant status API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
