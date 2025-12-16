import { NextRequest, NextResponse } from "next/server";
import { PluginRegistry } from "@/lib/plugins/registry";

export async function GET(request: NextRequest) {
    // In a real implementation, we would also check DB for installed status per tenant
    // For now, we just list the registry
    
    const plugins = PluginRegistry.list().map(item => ({
        manifest: item.manifest,
        isInstalled: false // Mock
    }));

    return NextResponse.json({ plugins });
}
