export type AIProvider = "openai" | "anthropic" | "ollama" | "custom" | "cohere";

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutputTokens?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  supportsImage?: boolean; // Multi-modal
  supportsStreaming?: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  tool_calls?: any[]; // For function calling
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  user?: string; // End-user ID for tracking
}

export interface ChatResponse {
  id: string;
  content: string;
  role: "assistant";
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string; // The actual model used
  created: number;
}

export interface StreamChunk {
  id: string;
  content: string; // Delta content
  role?: "assistant";
  done: boolean;
}
