import { BaseAIAdapter, AdapterConfig } from "./base";
import { AIModel, ChatRequest, ChatResponse, StreamChunk } from "../types";
import Anthropic from "@anthropic-ai/sdk";

export class AnthropicAdapter extends BaseAIAdapter {
  private client: Anthropic;

  constructor(config: AdapterConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey || "dummy",
    });
  }

  async listModels(): Promise<AIModel[]> {
    // Anthropic doesn't have a public list models API that returns metadata in the same way,
    // so we return a static list of known supported models for now.
    return [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", contextWindow: 200000, supportsStreaming: true },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic", contextWindow: 200000, supportsStreaming: true },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", provider: "anthropic", contextWindow: 200000, supportsStreaming: true },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", provider: "anthropic", contextWindow: 200000, supportsStreaming: true },
    ];
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const messages = request.messages.filter(m => m.role !== "system");
    const systemMessage = request.messages.find(m => m.role === "system")?.content;

    const response = await this.client.messages.create({
      model: request.model,
      messages: messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      system: systemMessage,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      stream: false
    });

    const contentBlock = response.content[0];
    const text = contentBlock.type === 'text' ? contentBlock.text : "";

    return {
      id: response.id,
      content: text,
      role: "assistant",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model,
      created: Date.now()
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const messages = request.messages.filter(m => m.role !== "system");
    const systemMessage = request.messages.find(m => m.role === "system")?.content;

    const stream = await this.client.messages.create({
      model: request.model,
      messages: messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      system: systemMessage,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      stream: true
    });

    for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            yield {
                id: "anthropic-stream",
                content: chunk.delta.text,
                done: false
            };
        }
    }
    
    yield { id: "done", content: "", done: true };
  }
}
