import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { PluginRegistry } from "./registry";
import { PluginInterface, PluginContext } from "./types";
import { PermissionManager } from "./permissions";

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

      // 1.5 Fetch all dependencies to build the graph
      // Optimization: We could filter by the plugins involved, but fetching all dependencies is usually cheap enough
      const allDependencies = await db.query.pluginDependencies.findMany();

      // Implement topological sort
      const sortedConfigs = this.topologicalSort(configs, allDependencies);
      
      // 2. Instantiate and initialize each plugin
      for (const config of sortedConfigs) {
        const pluginItem = PluginRegistry.get(config.plugin.slug);
        
        if (!pluginItem) {
            console.warn(`Plugin ${config.plugin.slug} enabled in DB but not found in registry.`);
            continue;
        }

        // Create sandboxed context with restricted permissions
        const context = this.createSandboxedContext(config.plugin.slug, config.config as Record<string, any>, config.plugin.permissions as string[] || []);

        const instance = new pluginItem.class();
        
        // Execute init hook
        if (instance.hooks.onInit) {
            try {
                await instance.hooks.onInit(context);
                this.initializedPlugins.set(config.plugin.slug, instance);
            } catch (err) {
                console.error(`Failed to initialize plugin ${config.plugin.slug}:`, err);
            }
        } else {
             this.initializedPlugins.set(config.plugin.slug, instance);
        }
      }
    } catch (error) {
        console.error("Failed to load tenant plugins:", error);
    }
  }

  private createSandboxedContext(pluginId: string, config: Record<string, any>, permissions: string[]): PluginContext {
      return {
          tenantId: this.tenantId,
          config: config || {},
          storage: {
              get: async (key) => {
                  if (!PermissionManager.hasPermission(permissions, PermissionManager.SCOPES.STORAGE_READ)) {
                      throw new Error(`Plugin ${pluginId} missing permission: ${PermissionManager.SCOPES.STORAGE_READ}`);
                  }
                  
                  // Look up the plugin's DB ID based on the slug (pluginId in this context)
                  // In a real optimized system we'd pass the UUID down, but we can query it or assume it's available.
                  // For now, let's query.
                  const pluginRecord = await db.query.plugins.findFirst({
                      where: eq(schema.plugins.slug, pluginId),
                  });
                  
                  if (!pluginRecord) return null;

                  const record = await db.query.pluginStorage.findFirst({
                      where: and(
                          eq(schema.pluginStorage.pluginId, pluginRecord.id),
                          eq(schema.pluginStorage.tenantId, this.tenantId),
                          eq(schema.pluginStorage.key, key)
                      )
                  });
                  
                  return record ? record.value : null;
              },
              set: async (key, value) => {
                  if (!PermissionManager.hasPermission(permissions, PermissionManager.SCOPES.STORAGE_WRITE)) {
                      throw new Error(`Plugin ${pluginId} missing permission: ${PermissionManager.SCOPES.STORAGE_WRITE}`);
                  }
                  
                  const pluginRecord = await db.query.plugins.findFirst({
                      where: eq(schema.plugins.slug, pluginId),
                  });
                  
                  if (!pluginRecord) throw new Error("Plugin record not found for storage");

                  // Upsert logic
                  const existing = await db.query.pluginStorage.findFirst({
                      where: and(
                          eq(schema.pluginStorage.pluginId, pluginRecord.id),
                          eq(schema.pluginStorage.tenantId, this.tenantId),
                          eq(schema.pluginStorage.key, key)
                      )
                  });

                  if (existing) {
                      await db.update(schema.pluginStorage)
                        .set({ value: value, updatedAt: new Date() })
                        .where(eq(schema.pluginStorage.id, existing.id));
                  } else {
                      await db.insert(schema.pluginStorage).values({
                          pluginId: pluginRecord.id,
                          tenantId: this.tenantId,
                          key,
                          value
                      });
                  }
              }
          },
          logger: {
              info: (msg) => console.log(`[Plugin:${pluginId}] ${msg}`),
              error: (msg, err) => console.error(`[Plugin:${pluginId}] ${msg}`, err)
          }
      };
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

  private topologicalSort(configs: any[], dependencies: any[]): any[] {
    const graph = new Map<string, Set<string>>();
    const configMap = new Map<string, any>();

    // Initialize graph
    for (const config of configs) {
        configMap.set(config.pluginId, config);
        graph.set(config.pluginId, new Set());
    }

    // Build dependency graph
    for (const dep of dependencies) {
        if (graph.has(dep.pluginId) && graph.has(dep.dependsOnPluginId)) {
            graph.get(dep.pluginId).add(dep.dependsOnPluginId);
        }
    }

    const visited = new Set<string>();
    const sorted: any[] = [];
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        if (visiting.has(nodeId)) {
            console.warn(`Circular dependency detected involving plugin ${nodeId}. Skipping cycle.`);
            return;
        }

        visiting.add(nodeId);

        const edges = graph.get(nodeId);
        if (edges) {
            for (const dependencyId of edges) {
                visit(dependencyId);
            }
        }

        visiting.delete(nodeId);
        visited.add(nodeId);
        
        if (configMap.has(nodeId)) {
            sorted.push(configMap.get(nodeId));
        }
    };

    for (const config of configs) {
        visit(config.pluginId);
    }

    return sorted;
  }
}
