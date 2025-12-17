import { OpenAIAdapter } from "./openai";
import { AdapterConfig } from "./base";
import { AIModel } from "../types";

export class CustomAdapter extends OpenAIAdapter {
  constructor(config: AdapterConfig) {
    if (!config.baseUrl) {
      throw new Error("Custom adapter requires a baseUrl");
    }
    super(config);
  }

  // Override list models to provider correct context
  async listModels(): Promise<AIModel[]> {
    const models = await super.listModels();
    return models.map(m => ({
      ...m,
      provider: "custom"
    }));
  }
}
