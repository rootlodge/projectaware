import { AIModel, ChatRequest, ChatResponse, StreamChunk } from "../types";

export interface AdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  additionalParams?: Record<string, any>;
}

export abstract class BaseAIAdapter {
  protected config: AdapterConfig;

  constructor(config: AdapterConfig = {}) {
    this.config = config;
  }

  /**
   * List available models from this provider (if supported dynamically)
   */
  abstract listModels(): Promise<AIModel[]>;

  /**
   * Generate a completion (non-streaming)
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Generate a stream of completions
   */
  abstract stream(request: ChatRequest): AsyncGenerator<StreamChunk>;
  
  /**
   * Validate parameters or credentials
   */
  async validate(): Promise<boolean> {
      try {
          await this.listModels();
          return true;
      } catch (e) {
          console.error("Validation failed:", e);
          return false;
      }
  }
}
