import { BaseAIAdapter, AdapterConfig } from "./base";
import { AIModel, ChatRequest, ChatResponse, StreamChunk } from "../types";

export class OllamaAdapter extends BaseAIAdapter {
  private getBaseUrl(): string {
    return this.config.baseUrl || "http://localhost:11434";
  }

  async listModels(): Promise<AIModel[]> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/tags`);
      if (!res.ok) throw new Error("Failed to fetch Ollama tags");
      
      const data = await res.json();
      return data.models.map((m: any) => ({
        id: m.name,
        name: m.name,
        provider: "ollama",
        contextWindow: 4096, // Default, can't easily detect yet without 'show' API
        supportsStreaming: true
      }));
    } catch (error) {
      console.warn("Ollama: Failed to list models (is it running?)");
      return [];
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.getBaseUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        stream: false
      })
    });

    if (!res.ok) throw new Error(`Ollama Error: ${res.statusText}`);

    const data = await res.json();
    
    return {
      id: "ollama-" + Date.now(),
      content: data.message.content,
      role: "assistant",
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      },
      model: data.model,
      created: Date.now()
    };
  }

  async *stream(request: ChatRequest): AsyncGenerator<StreamChunk> {
    const res = await fetch(`${this.getBaseUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        stream: true
      })
    });

    if (!res.ok || !res.body) throw new Error(`Ollama Error: ${res.statusText}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        buffer += text;
        
        // Process line by line
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            yield {
              id: "ollama-stream",
              content: data.message?.content || "",
              done: data.done
            };
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    yield { id: "done", content: "", done: true };
  }
}
