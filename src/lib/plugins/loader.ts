import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { PluginRegistry } from "./registry";
import { PluginInterface, PluginContext } from "./types";

/**
 * Loads and initializes active plugins for a specific tenant
 */
export class TenantPluginLoader {
  private tenantId: string;
  private initializedPlugins: Map<string, PluginInterface> = new Map();

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Initialize all enabled plugins for this tenant
   */
  async init() {
    try {
      // 1. Fetch enabled plugin configs for tenant
      const configs = await db.query.pluginConfigs.findMany({
        where: and(
            eq(schema.pluginConfigs.tenantId, this.tenantId),
            eq(schema.pluginConfigs.isEnabled, true)
        ),
        with: {
            plugin: true
        }
      });

      // 2. Instantiate and initialize each plugin
      for (const config of configs) {
        // Find the plugin class in the registry using the slug or ID matching
        // Note: The registry uses internal IDs, but the DB uses UUIDs. 
        // We need a mapping strategy. Ideally, the `slug` in DB matches the `id` in manifest.
        const pluginItem = PluginRegistry.get(config.plugin.slug);
        
        if (!pluginItem) {
            console.warn(`Plugin ${config.plugin.slug} enabled in DB but not found in registry.`);
            continue;
        }

        const context: PluginContext = {
            tenantId: this.tenantId,
            config: (config.config as Record<string, any>) || {},
            storage: {
                get: async (key) => {
                    // Placeholder: In real app, this would get from a KV store or JSON column
                    return null;
                },
                set: async (key, value) => {
                     // Placeholder
                }
            },
            logger: {
                info: (msg) => console.log(`[Plugin:${config.plugin.slug}] ${msg}`),
                error: (msg, err) => console.error(`[Plugin:${config.plugin.slug}] ${msg}`, err)
            }
        };

        const instance = new pluginItem.class();
        
        // Execute init hook
        if (instance.hooks.onInit) {
            await instance.hooks.onInit(context);
        }

        this.initializedPlugins.set(config.plugin.slug, instance);
      }
    } catch (error) {
        console.error("Failed to load tenant plugins:", error);
    }
  }

  /**
   * Execute a hook across all active plugins
   */
  async executeHook(hookName: keyof PluginInterface['hooks'], ...args: any[]) {
      const results = [];
      for (const [id, plugin] of this.initializedPlugins) {
          if (plugin.hooks[hookName]) {
            try {
                // @ts-ignore
                const result = await plugin.hooks[hookName](...args);
                results.push({ id, result, status: 'success' });
            } catch (error) {
                console.error(`Error executing hook ${String(hookName)} on plugin ${id}:`, error);
                results.push({ id, error, status: 'error' });
            }
          }
      }
      return results;
  }
  
  getActivePlugins() {
      return Array.from(this.initializedPlugins.values());
  }
}
