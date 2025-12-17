import { BaseAIAdapter } from "./adapters/base";
import { OpenAIAdapter } from "./adapters/openai";
import { OllamaAdapter } from "./adapters/ollama";
import { CustomAdapter } from "./adapters/custom";
import { AnthropicAdapter } from "./adapters/anthropic";
import { AIModel, ChatRequest, ChatResponse, StreamChunk } from "./types";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

class AIServiceRegistry {
  private adapters: Map<string, BaseAIAdapter> = new Map();

  constructor() {
    // Initialize default adapters with env vars or empty config
    // In a real multi-tenant app, we might instantiate these per-request or cache them with keys
    // For now, we assume global env config for defaults, but we should support per-tenant overrides.
    
    this.adapters.set("openai", new OpenAIAdapter({ 
        apiKey: process.env.OPENAI_API_KEY 
    }));
    
    this.adapters.set("anthropic", new AnthropicAdapter({ 
        apiKey: process.env.ANTHROPIC_API_KEY 
    }));
    
    this.adapters.set("ollama", new OllamaAdapter({ 
        baseUrl: process.env.OLLAMA_BASE_URL 
    }));
    
    // Custom would need specific config, usually initialized on demand
  }

  /**
   * Get an adapter instance, potentially configured with tenant-specific keys
   */
  async getAdapter(provider: string, tenantId?: string): Promise<BaseAIAdapter> {
      // TODO: Fetch tenant config from DB
      // const tenantConfig = await db.query.tenantModelConfigs.findFirst(...)
      
      if (provider === "custom") {
          // Example: Load custom config from DB
          return new CustomAdapter({ baseUrl: "http://localhost:1234/v1", apiKey: "xyz" });
      }

      const adapter = this.adapters.get(provider);
      if (!adapter) {
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
      return adapter;
  }

  async getModels(tenantId?: string): Promise<AIModel[]> {
      const providers = ["openai", "anthropic", "ollama"];
      let allModels: AIModel[] = [];

      for (const provider of providers) {
          try {
              const adapter = await this.getAdapter(provider, tenantId);
              const models = await adapter.listModels();
              allModels = [...allModels, ...models];
          } catch (e) {
              console.warn(`Failed to list models for ${provider}`, e);
          }
      }

      return allModels;
  }

  async generateResponse(request: ChatRequest, tenantId?: string): Promise<ChatResponse> {
      // Find provider for the requested model
      // This logic assumes we know which provider "gpt-4" belongs to. 
      // Ideally providing the model object includes the provider.
      // For now, let's look it up or pass provider in request? 
      // Let's assume the request.model is the ID, and we can find it.
      
      const models = await this.getModels(tenantId);
      const modelInfo = models.find(m => m.id === request.model);
      
      // Fallback or explicit provider detection
      let provider = modelInfo?.provider || "openai"; // Default
      if (request.model.startsWith("claude")) provider = "anthropic";
      if (request.model.includes("llama") || request.model.includes("mistral")) provider = "ollama";

      const adapter = await this.getAdapter(provider, tenantId);
      return adapter.chat(request);
  }

  async *streamResponse(request: ChatRequest, tenantId?: string): AsyncGenerator<StreamChunk> {
      const models = await this.getModels(tenantId);
      const modelInfo = models.find(m => m.id === request.model);
      
      let provider = modelInfo?.provider || "openai";
      if (request.model.startsWith("claude")) provider = "anthropic";
      
      // Ollama usually needs explicit selection or we guess
      
      const adapter = await this.getAdapter(provider, tenantId);
      yield* adapter.stream(request);
  }
}

export const aiService = new AIServiceRegistry();
