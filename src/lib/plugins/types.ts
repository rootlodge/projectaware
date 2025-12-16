/**
 * Plugin System Types
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  category: "utility" | "ai" | "integration" | "core";
  permissions: string[];
  minVersion?: string;
}

export type PluginHookName = 
  | "onInit" 
  | "onMessageReceived" 
  | "onMessageSending" 
  | "onAgentAction" 
  | "onContextUpdate"
  | "renderSettings";

export interface PluginContext {
  tenantId: string;
  userId?: string;
  config: Record<string, any>;
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
  logger: {
    info: (msg: string) => void;
    error: (msg: string, err?: any) => void;
  };
}

export interface PluginInterface {
  manifest: PluginManifest;
  hooks: Partial<Record<PluginHookName, (context: PluginContext, ...args: any[]) => Promise<any>>>;
}

export type PluginConstructor = new () => PluginInterface;

// Core Plugin Registry Structure
export interface PluginRegistryItem {
    manifest: PluginManifest;
    class: PluginConstructor;
}
