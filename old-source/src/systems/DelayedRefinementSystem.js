const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');

class DelayedRefinementSystem {
  constructor(centralBrainAgent, stateManager) {
    this.centralBrain = centralBrainAgent;
    this.stateManager = stateManager;
    this.pendingRefinements = new Map();
    this.refinementDelay = 30000; // 30 seconds
    this.enabled = true;
  }

  /**
   * Process immediate response and queue refinement check
   */
  async processWithDelayedRefinement(userInput, context = 'user_input') {
    const startTime = Date.now();
    
    // Step 1: Generate immediate response
    const immediateResponse = await this.generateImmediateResponse(userInput, context);
    
    // Step 2: Display immediate response to user
    const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Step 3: Queue refinement check
    if (this.enabled) {
      this.queueRefinementCheck(responseId, userInput, immediateResponse, context);
    }

    return {
      ...immediateResponse,
      responseId,
      hasDelayedRefinement: this.enabled,
      refinementDelay: this.refinementDelay
    };
  }

  /**
   * Generate immediate response using fast model
   */
  async generateImmediateResponse(userInput, context) {
    try {
      // Use fast model for immediate response
      const modelManager = this.centralBrain.modelManager;
      const fastModel = modelManager.selectModel('immediate_response');
      const temperature = modelManager.getTemperature('conversation', fastModel);

      const response = await askLLM(userInput, fastModel, temperature);
      
      logger.info(`[DelayedRefinement] Immediate response generated with ${fastModel}`);
      
      return {
        response: response,
        model: fastModel,
        temperature: temperature,
        responseTime: Date.now() - Date.now(),
        type: 'immediate',
        refined: false
      };
    } catch (error) {
      logger.error('[DelayedRefinement] Immediate response failed:', error.message);
      return {
        response: "I'm processing your request. Please give me a moment to provide a better response.",
        error: error.message,
        type: 'error',
        refined: false
      };
    }
  }

  /**
   * Queue refinement check for later
   */
  queueRefinementCheck(responseId, userInput, immediateResponse, context) {
    const refinementData = {
      responseId,
      userInput,
      immediateResponse,
      context,
      queuedAt: Date.now(),
      status: 'queued'
    };

    this.pendingRefinements.set(responseId, refinementData);

    // Schedule refinement check
    setTimeout(() => {
      this.performRefinementCheck(responseId);
    }, this.refinementDelay);

    logger.info(`[DelayedRefinement] Queued refinement check for response ${responseId}`);
  }

  /**
   * Perform the actual refinement check
   */
  async performRefinementCheck(responseId) {
    const refinementData = this.pendingRefinements.get(responseId);
    if (!refinementData) {
      logger.warn(`[DelayedRefinement] Refinement data not found for ${responseId}`);
      return;
    }

    try {
      refinementData.status = 'analyzing';
      
      // Check if response needs refinement
      const needsRefinement = await this.analyzeResponseQuality(
        refinementData.userInput,
        refinementData.immediateResponse.response
      );

      if (needsRefinement.shouldRefine) {
        logger.info(`[DelayedRefinement] Response ${responseId} needs refinement: ${needsRefinement.reason}`);
        
        // Generate refined response
        const refinedResponse = await this.generateRefinedResponse(
          refinementData.userInput,
          refinementData.immediateResponse.response,
          needsRefinement.suggestions
        );

        // Display refinement to user
        this.displayRefinement(refinedResponse, needsRefinement.reason);
        
        refinementData.status = 'refined';
        refinementData.refinedResponse = refinedResponse;
        refinementData.refinementReason = needsRefinement.reason;
        
      } else {
        logger.info(`[DelayedRefinement] Response ${responseId} is sufficient, no refinement needed`);
        refinementData.status = 'sufficient';
      }

    } catch (error) {
      logger.error(`[DelayedRefinement] Refinement check failed for ${responseId}:`, error.message);
      refinementData.status = 'error';
      refinementData.error = error.message;
    }

    // Cleanup after some time
    setTimeout(() => {
      this.pendingRefinements.delete(responseId);
    }, 300000); // 5 minutes
  }

  /**
   * Analyze if the immediate response needs refinement
   */
  async analyzeResponseQuality(userInput, immediateResponse) {
    const analysisPrompt = `You are CEREBRUM's quality analyzer. Evaluate if this immediate response is sufficient or needs refinement.

USER INPUT: "${userInput}"
IMMEDIATE RESPONSE: "${immediateResponse}"

Analyze the response for:
1. Completeness - Does it fully address the user's question/request?
2. Accuracy - Is the information correct and reliable?
3. Helpfulness - Does it provide actionable value to the user?
4. Clarity - Is it easy to understand and well-structured?
5. Depth - For complex queries, does it provide sufficient detail?

Return JSON:
{
  "shouldRefine": true/false,
  "reason": "specific reason why refinement is needed",
  "suggestions": ["specific improvements to make"],
  "complexity_score": 1-10,
  "quality_score": 1-10
}`;

    try {
      const modelManager = this.centralBrain.modelManager;
      const analysisModel = modelManager.selectModel('analysis');
      const response = await askLLM(analysisPrompt, analysisModel, 0.1);
      
      const analysis = JSON.parse(response);
      
      // Additional logic: complex questions likely need refinement
      if (analysis.complexity_score > 6 && analysis.quality_score < 8) {
        analysis.shouldRefine = true;
        analysis.reason = analysis.reason || "Complex query requires more detailed analysis";
      }
      
      return analysis;
    } catch (error) {
      logger.error('[DelayedRefinement] Analysis failed:', error.message);
      return {
        shouldRefine: false,
        reason: "Analysis failed, keeping original response",
        suggestions: [],
        error: error.message
      };
    }
  }

  /**
   * Generate refined response using CEREBRUM delegation
   */
  async generateRefinedResponse(userInput, originalResponse, suggestions) {
    const refinementPrompt = `I provided an immediate response to the user, but after analysis, I believe it can be improved.

ORIGINAL USER INPUT: "${userInput}"
MY IMMEDIATE RESPONSE: "${originalResponse}"
IMPROVEMENT SUGGESTIONS: ${suggestions.join(', ')}

Please provide a refined, more comprehensive response that addresses these improvements while maintaining the helpful tone. Focus on:
- Adding missing details or context
- Improving accuracy and completeness
- Making the response more actionable
- Enhancing clarity and structure

REFINED RESPONSE:`;

    try {
      // Use CEREBRUM's full delegation system for refinement
      const result = await this.centralBrain.process(refinementPrompt, 'refinement');
      
      return {
        response: result.response,
        improvements: suggestions,
        delegations: result.delegations || 0,
        model: 'cerebrum_delegation',
        type: 'refined'
      };
    } catch (error) {
      logger.error('[DelayedRefinement] Refinement generation failed:', error.message);
      return {
        response: "I wanted to provide additional insights, but encountered an issue during analysis.",
        error: error.message,
        type: 'refinement_error'
      };
    }
  }

  /**
   * Display refinement to user
   */
  displayRefinement(refinedResponse, reason) {
    const chalk = require('chalk');
    
    console.log(chalk.cyan.bold('\n🔄 REFINED RESPONSE:'));
    console.log(chalk.gray(`Reason for refinement: ${reason}`));
    console.log(chalk.white(refinedResponse.response));
    
    if (refinedResponse.improvements && refinedResponse.improvements.length > 0) {
      console.log(chalk.yellow('\n✨ Improvements made:'));
      refinedResponse.improvements.forEach(improvement => {
        console.log(chalk.gray(`• ${improvement}`));
      });
    }
  }

  /**
   * Get refinement statistics
   */
  getRefinementStats() {
    const stats = {
      total_responses: 0,
      refinements_performed: 0,
      refinement_rate: 0,
      pending_refinements: this.pendingRefinements.size,
      enabled: this.enabled
    };

    for (const [id, data] of this.pendingRefinements) {
      stats.total_responses++;
      if (data.status === 'refined') {
        stats.refinements_performed++;
      }
    }

    if (stats.total_responses > 0) {
      stats.refinement_rate = (stats.refinements_performed / stats.total_responses) * 100;
    }

    return stats;
  }

  /**
   * Enable/disable refinement system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`[DelayedRefinement] System ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set refinement delay
   */
  setDelay(delayMs) {
    this.refinementDelay = Math.max(5000, Math.min(120000, delayMs)); // 5s to 2min
    logger.info(`[DelayedRefinement] Delay set to ${this.refinementDelay}ms`);
  }

  /**
   * Clear pending refinements
   */
  clearPending() {
    this.pendingRefinements.clear();
    logger.info('[DelayedRefinement] Cleared all pending refinements');
  }
}

module.exports = DelayedRefinementSystem;
