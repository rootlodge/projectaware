import { BaseAIAdapter, AdapterConfig } from "./base";
import { AIModel, ChatRequest, ChatResponse, StreamChunk } from "../types";
import OpenAI from "openai";

export class OpenAIAdapter extends BaseAIAdapter {
  private client: OpenAI;

  constructor(config: AdapterConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey || "dummy", // Allow init without key, validate later
      baseURL: config.baseUrl, // Optional override
      dangerouslyAllowBrowser: true // For client-side usage if needed (though we should be server-side)
    });
  }

  async listModels(): Promise<AIModel[]> {
    try {
      const response = await this.client.models.list();
      return response.data.map(m => ({
        id: m.id,
        name: m.id,
        provider: "openai",
        contextWindow: 128000, // Default assumption for modern models
        supportsStreaming: true
      }));
    } catch (error) {
      console.error("OpenAI: Failed to list models", error);
      return [];
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const completion = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages as any[], // Casting validation needed
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false
    });

    const choice = completion.choices[0];
    
    return {
      id: completion.id,
      content: choice.message.content || "",
      role: "assistant",
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      model: completion.model,
      created: completion.created
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages as any[],
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      yield {
        id: chunk.id,
        content,
        done: false
      };
    }
    
    yield { id: "done", content: "", done: true };
  }
}
