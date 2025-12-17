import { PluginInterface, PluginRegistryItem } from "./types";
import { EmotionPlugin } from "@/plugins/emotion";
import { MemoryPlugin } from "@/plugins/memory";
import { GoalsPlugin } from "@/plugins/goals";

class PluginRegistryService {
  private plugins: Map<string, PluginRegistryItem> = new Map();

  constructor() {
    this.register(EmotionPlugin);
    this.register(MemoryPlugin);
    this.register(GoalsPlugin);
  }

  register(pluginClass: any) {
    try {
      const instance = new pluginClass();
      const manifest = instance.manifest;
      
      if (!manifest || !manifest.id) {
        throw new Error("Plugin missing manifest or ID");
      }

      if (this.plugins.has(manifest.id)) {
        console.warn(`Plugin ${manifest.id} already registered. Overwriting.`);
      }

      this.plugins.set(manifest.id, {
        manifest,
        class: pluginClass,
      });

      console.log(`Plugin registered: ${manifest.name} (${manifest.id})`);
    } catch (error) {
      console.error("Failed to register plugin:", error);
    }
  }

  get(id: string): PluginRegistryItem | undefined {
    return this.plugins.get(id);
  }

  list(): PluginRegistryItem[] {
    return Array.from(this.plugins.values());
  }

  // Future: Dynamic loading from filesystem
  async loadFromDirectory(path: string) {
    // implementation for dynamic loading would go here
  }

  getManifests() {
      return Array.from(this.plugins.values()).map(p => p.manifest);
  }
}

export const PluginRegistry = new PluginRegistryService();
