import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

export interface ModelConfig {
  name: string;
  parameters: string;
  supports_tools: boolean;
  performance_tier: 'fast' | 'medium' | 'slow';
  use_cases: string[];
}

export interface PerformanceState {
  tool_calls_active: number;
  last_tool_call: number;
  llm_calls_paused: boolean;
  current_load: number;
}

export interface ToolUsageContext {
  useCase: string;
  priority: 'low' | 'medium' | 'high';
  requiresTools: boolean;
  expectedComplexity: 'simple' | 'complex';
}

export class ModelManager {
  private configPath: string;
  private ollamaUrl: string = 'http://localhost:11434';
  private performanceState: PerformanceState = {
    tool_calls_active: 0,
    last_tool_call: 0,
    llm_calls_paused: false,
    current_load: 0
  };
  private availableModels: string[] = [];
  private modelConfigs: ModelConfig[] = [];

  constructor() {
    this.configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'config.json');
    this.initializeModelDiscovery();
  }

  /**
   * Initialize and discover available models from Ollama
   */
  private async initializeModelDiscovery(): Promise<void> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      this.availableModels = response.data?.models?.map((model: any) => model.name) || [];
      console.log('[ModelManager] Discovered available models:', this.availableModels);
    } catch (error) {
      console.warn('[ModelManager] Could not discover models from Ollama:', error);
      this.availableModels = ['llama3.2:latest', 'gemma3:latest']; // Fallback
    }
  }

  /**
   * Load model configuration from config file
   */
  private async loadConfig(): Promise<any> {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      console.error('[ModelManager] Failed to load config:', error);
      throw error;
    }
  }

  /**
   * Get the best model for a specific use case
   */
  public async getModelForUseCase(useCase: string, context?: ToolUsageContext): Promise<string> {
    try {
      const config = await this.loadConfig();
      const modelSettings = config.model_settings;

      // Check if we should pause LLM calls due to active tool usage
      if (this.shouldPauseLLMCalls() && !context?.requiresTools) {
        console.log('[ModelManager] Pausing LLM call due to active tool usage');
        await this.waitForToolCompletion();
      }

      // Get specialized model for use case
      const specializedModel = modelSettings.specialized_models[useCase];
      if (specializedModel && this.isModelAvailable(specializedModel)) {
        // Check if this use case requires tools
        if (context?.requiresTools) {
          const modelConfig = this.getModelConfig(specializedModel, modelSettings);
          if (modelConfig?.supports_tools) {
            await this.registerToolUsage();
            return specializedModel;
          }
        } else {
          return specializedModel;
        }
      }

      // Fallback to best available model for the context
      return await this.selectBestAvailableModel(context, modelSettings);
    } catch (error) {
      console.error('[ModelManager] Error selecting model:', error);
      return 'llama3.2:latest'; // Safe fallback
    }
  }

  /**
   * Register that a tool usage session is starting
   */
  private async registerToolUsage(): Promise<void> {
    const config = await this.loadConfig();
    const perfSettings = config.model_settings.performance_management.tool_usage_throttling;

    this.performanceState.tool_calls_active++;
    this.performanceState.last_tool_call = Date.now();

    if (perfSettings.pause_other_llm_calls) {
      this.performanceState.llm_calls_paused = true;
    }

    // Reduce thinking rate during tool usage
    if (perfSettings.enabled) {
      await this.adjustThinkingRate(perfSettings.reduced_thinking_rate);
    }

    console.log(`[ModelManager] Tool usage registered. Active calls: ${this.performanceState.tool_calls_active}`);
  }

  /**
   * Register that a tool usage session has completed
   */
  public async completeToolUsage(): Promise<void> {
    const config = await this.loadConfig();
    const perfSettings = config.model_settings.performance_management.tool_usage_throttling;

    this.performanceState.tool_calls_active = Math.max(0, this.performanceState.tool_calls_active - 1);

    // If no more active tool calls, resume normal operations
    if (this.performanceState.tool_calls_active === 0) {
      setTimeout(() => {
        this.performanceState.llm_calls_paused = false;
        this.restoreNormalThinkingRate();
        console.log('[ModelManager] Tool usage completed, resuming normal operations');
      }, perfSettings.cooldown_period_ms || 5000);
    }
  }

  /**
   * Check if LLM calls should be paused due to tool usage
   */
  private shouldPauseLLMCalls(): boolean {
    return this.performanceState.llm_calls_paused && this.performanceState.tool_calls_active > 0;
  }

  /**
   * Wait for tool completion before proceeding with LLM call
   */
  private async waitForToolCompletion(maxWaitMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    while (this.shouldPauseLLMCalls() && (Date.now() - startTime) < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Get model configuration for a specific model
   */
  private getModelConfig(modelName: string, modelSettings: any): ModelConfig | null {
    return modelSettings.available_models.find((model: ModelConfig) => model.name === modelName) || null;
  }

  /**
   * Check if a model is available in Ollama
   */
  private isModelAvailable(modelName: string): boolean {
    return this.availableModels.includes(modelName);
  }

  /**
   * Select the best available model based on context
   */
  private async selectBestAvailableModel(context: ToolUsageContext | undefined, modelSettings: any): Promise<string> {
    const availableConfigs = modelSettings.available_models.filter((model: ModelConfig) => 
      this.isModelAvailable(model.name)
    );

    if (!context) {
      // Return fastest available model for general use
      const fastModel = availableConfigs.find((model: ModelConfig) => model.performance_tier === 'fast');
      return fastModel?.name || 'llama3.2:latest';
    }

    // Filter by tool requirements
    let candidates = availableConfigs;
    if (context.requiresTools) {
      candidates = candidates.filter((model: ModelConfig) => model.supports_tools);
    }

    // Filter by complexity requirements
    if (context.expectedComplexity === 'complex') {
      candidates = candidates.filter((model: ModelConfig) => 
        model.performance_tier === 'medium' || model.performance_tier === 'slow'
      );
    }

    // Select by priority
    if (context.priority === 'high') {
      const bestModel = candidates.find((model: ModelConfig) => model.performance_tier === 'slow') ||
                       candidates.find((model: ModelConfig) => model.performance_tier === 'medium');
      if (bestModel) return bestModel.name;
    }

    // Default to fastest available
    const fastModel = candidates.find((model: ModelConfig) => model.performance_tier === 'fast');
    return fastModel?.name || candidates[0]?.name || 'llama3.2:latest';
  }

  /**
   * Adjust autonomous thinking rate during tool usage
   */
  private async adjustThinkingRate(reductionFactor: number): Promise<void> {
    try {
      // Update the autonomous thinking system throttling
      await fetch('/api/autonomous/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_throttle',
          config: {
            thought_throttling: {
              max_thoughts_per_minute: Math.floor(8 / reductionFactor) // Reduce from base rate
            }
          }
        })
      });
    } catch (error) {
      console.warn('[ModelManager] Failed to adjust thinking rate:', error);
    }
  }

  /**
   * Restore normal thinking rate after tool usage
   */
  private async restoreNormalThinkingRate(): Promise<void> {
    try {
      await fetch('/api/autonomous/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_throttle',
          config: {
            thought_throttling: {
              max_thoughts_per_minute: 8 // Restore to normal rate
            }
          }
        })
      });
    } catch (error) {
      console.warn('[ModelManager] Failed to restore thinking rate:', error);
    }
  }

  /**
   * Check if a model supports tools
   */
  public async modelSupportsTools(modelName: string): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      const modelConfig = config.model_settings.available_models.find(
        (model: ModelConfig) => model.name === modelName
      );
      return modelConfig?.supports_tools || false;
    } catch (error) {
      console.error('[ModelManager] Error checking tool support:', error);
      return false;
    }
  }

  /**
   * Get available models that support tools
   */
  public async getToolCapableModels(): Promise<string[]> {
    try {
      const config = await this.loadConfig();
      return config.model_settings.available_models
        .filter((model: ModelConfig) => model.supports_tools && this.isModelAvailable(model.name))
        .map((model: ModelConfig) => model.name);
    } catch (error) {
      console.error('[ModelManager] Error getting tool-capable models:', error);
      return [];
    }
  }

  /**
   * Get current performance state for monitoring
   */
  public getPerformanceState(): PerformanceState {
    return { ...this.performanceState };
  }

  /**
   * Update model configuration
   */
  public async updateModelConfig(updates: any): Promise<void> {
    try {
      const config = await this.loadConfig();
      config.model_settings = { ...config.model_settings, ...updates };
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log('[ModelManager] Model configuration updated');
    } catch (error) {
      console.error('[ModelManager] Failed to update model config:', error);
      throw error;
    }
  }

  /**
   * Get model recommendations for a use case
   */
  public async getModelRecommendations(useCase: string): Promise<{
    recommended: string;
    alternatives: string[];
    reasoning: string;
  }> {
    try {
      const config = await this.loadConfig();
      const modelSettings = config.model_settings;
      
      const recommended = await this.getModelForUseCase(useCase);
      const availableForUseCase = modelSettings.available_models
        .filter((model: ModelConfig) => 
          model.use_cases.includes(useCase) && this.isModelAvailable(model.name)
        )
        .map((model: ModelConfig) => model.name);

      const reasoning = this.generateRecommendationReasoning(useCase, recommended, config);

      return {
        recommended,
        alternatives: availableForUseCase.filter((name: string) => name !== recommended),
        reasoning
      };
    } catch (error) {
      console.error('[ModelManager] Error generating recommendations:', error);
      return {
        recommended: 'llama3.2:latest',
        alternatives: [],
        reasoning: 'Error generating recommendations, using fallback'
      };
    }
  }

  private generateRecommendationReasoning(useCase: string, recommended: string, config: any): string {
    const modelConfig = config.model_settings.available_models.find(
      (model: ModelConfig) => model.name === recommended
    );

    if (!modelConfig) {
      return `Selected ${recommended} as a fallback option.`;
    }

    let reasoning = `Selected ${recommended} (${modelConfig.parameters}) for ${useCase}. `;
    
    if (modelConfig.supports_tools) {
      reasoning += 'This model supports tool usage. ';
    }
    
    reasoning += `Performance tier: ${modelConfig.performance_tier}. `;
    
    if (modelConfig.use_cases.includes(useCase)) {
      reasoning += `Optimized for ${useCase} tasks.`;
    } else {
      reasoning += 'General purpose model suitable for this task.';
    }

    return reasoning;
  }
}
