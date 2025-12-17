import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { PluginRegistry } from "@/lib/plugins/registry";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * GET /api/admin/plugins
 * Lists all available plugins (syncs Registry to DB if needed)
 */
export async function GET() {
    try {
        const registeredManifests = PluginRegistry.getManifests();
        
        // Sync registry with database (simple upsert for now)
        // In a real system, we might want to be more careful about overwriting user data
        for (const manifest of registeredManifests) {
            const existing = await db.query.plugins.findFirst({
                where: eq(schema.plugins.slug, manifest.id)
            });

            if (!existing) {
                await db.insert(schema.plugins).values({
                    name: manifest.name,
                    slug: manifest.id,
                    version: manifest.version,
                    description: manifest.description,
                    author: manifest.author,
                    category: manifest.category,
                    status: "active", // Auto-activate built-in plugins for availability
                    permissions: manifest.permissions
                });
            }
        }

        const allPlugins = await db.query.plugins.findMany();
        return NextResponse.json(allPlugins);

    } catch (error) {
        console.error("Failed to list plugins:", error);
        return NextResponse.json({ error: "Failed to list plugins" }, { status: 500 });
    }
}

const publishSchema = z.object({
    name: z.string(),
    slug: z.string(),
    version: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    permissions: z.array(z.string()).optional()
});

/**
 * POST /api/admin/plugins
 * Publishes a new plugin to the marketplace (database only)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const output = publishSchema.safeParse(body);

        if (!output.success) {
            return NextResponse.json({ error: output.error }, { status: 400 });
        }

        const { data } = output;

        const newPlugin = await db.insert(schema.plugins).values({
            ...data,
            status: "active"
        }).returning();

        return NextResponse.json(newPlugin[0]);

    } catch (error) {
        console.error("Failed to publish plugin:", error);
         return NextResponse.json({ error: "Failed to publish plugin" }, { status: 500 });
    }
}
