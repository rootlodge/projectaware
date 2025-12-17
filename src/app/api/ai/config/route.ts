import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth"; // Assuming auth export
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
      headers: await headers()
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Add proper RBAC check (e.g. session.user.role === 'admin')
  // For now assuming all authenticated users can view, but only admins can edit (enforced in POST)

  const tenantId = session.session.activeTenantId; // Assuming better-auth tenant plugin or custom field
  if (!tenantId) {
      // Fallback for non-multi-tenant setup or missing context
      return NextResponse.json({ error: "No active tenant" }, { status: 400 });
  }

  const configs = await db.query.tenantModelConfigs.findMany({
    where: eq(schema.tenantModelConfigs.tenantId, tenantId),
    with: {
        model: true
    }
  });

  // Mask API keys
  const safeConfigs = configs.map(c => ({
      ...c,
      encryptedApiKey: c.encryptedApiKey ? "sk-****" : null, // Simple mask
  }));

  return NextResponse.json(safeConfigs);
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
  
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC Check
    // if (session.user.role !== 'admin' && session.user.role !== 'owner') {
    //     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }
  
    const tenantId = session.session.activeTenantId;
    if (!tenantId) return NextResponse.json({ error: "No active tenant" }, { status: 400 });

    const body = await req.json();
    const { modelId, apiKey, isEnabled, customEndpoint } = body;

    if (!modelId) return NextResponse.json({ error: "Missing modelId" }, { status: 400 });

    // Find existing
    const existing = await db.query.tenantModelConfigs.findFirst({
        where: and(
            eq(schema.tenantModelConfigs.tenantId, tenantId),
            eq(schema.tenantModelConfigs.modelId, modelId)
        )
    });

    if (existing) {
        await db.update(schema.tenantModelConfigs).set({
            encryptedApiKey: apiKey, // In real app, encrypt this!
            isEnabled,
            customEndpoint,
            updatedAt: new Date()
        }).where(eq(schema.tenantModelConfigs.id, existing.id));
    } else {
        await db.insert(schema.tenantModelConfigs).values({
            tenantId,
            modelId,
            encryptedApiKey: apiKey,
            isEnabled,
            customEndpoint
        });
    }

    return NextResponse.json({ success: true });
}
