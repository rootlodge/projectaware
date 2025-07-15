import { Brain } from '../core/brain';
import { MemorySystem } from '../core/memory';
import { userContextService } from '../services/UserContextService';
import { StateManager } from '../core/StateManager';

export interface ConversationSummary {
  id?: number;
  session_id: string;
  summary_text: string;
  start_timestamp: string;
  end_timestamp: string;
  message_count: number;
  key_topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  importance_score: number; // 0-1, where 1 is highly important
  created_at: string;
}

export interface SummaryTrigger {
  type: 'time' | 'message_count' | 'topic_change' | 'session_end' | 'cerebrum_request';
  value?: number | string;
  last_triggered?: string;
}

export class SummarizingAgent {
  private brain: Brain;
  private memorySystem: MemorySystem;
  private stateManager: StateManager;
  private isProcessing: boolean = false;
  private lastSummaryTime: Date = new Date();
  private processingQueue: string[] = [];

  // Configuration
  private readonly MIN_MESSAGES_FOR_SUMMARY = 5;
  private readonly MAX_TIME_BETWEEN_SUMMARIES = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly IMPORTANCE_THRESHOLD = 0.3; // Only summarize conversations above this threshold

  constructor(
    brain: Brain,
    memorySystem: MemorySystem,
    stateManager: StateManager
  ) {
    this.brain = brain;
    this.memorySystem = memorySystem;
    this.stateManager = stateManager;
    
    // Start the periodic check
    this.startPeriodicCheck();
  }

  /**
   * Start periodic check for summarization needs
   */
  private startPeriodicCheck(): void {
    setInterval(async () => {
      await this.checkSummarizationNeeds();
    }, 10 * 60 * 1000); // Check every 10 minutes
  }

  /**
   * Check if summarization is needed based on various triggers
   */
  async checkSummarizationNeeds(): Promise<void> {
    if (this.isProcessing) {
      console.log('[SummarizingAgent] Already processing, skipping check');
      return;
    }

    try {
      await this.memorySystem.initialize();

      // Check time-based trigger (at least once per hour)
      const timeSinceLastSummary = Date.now() - this.lastSummaryTime.getTime();
      if (timeSinceLastSummary >= this.MAX_TIME_BETWEEN_SUMMARIES) {
        console.log('[SummarizingAgent] Time-based trigger activated');
        await this.triggerSummarization('time');
        return;
      }

      // Check for sessions with unsummarized conversations
      const sessionsNeedingSummary = await this.getSessionsNeedingSummary();
      if (sessionsNeedingSummary.length > 0) {
        console.log(`[SummarizingAgent] Found ${sessionsNeedingSummary.length} sessions needing summary`);
        for (const sessionId of sessionsNeedingSummary) {
          await this.triggerSummarization('message_count', sessionId);
        }
      }

      await this.memorySystem.close();
    } catch (error) {
      console.error('[SummarizingAgent] Error in periodic check:', error);
    }
  }

  /**
   * Manually trigger summarization (called by Cerebrum)
   */
  async triggerSummarization(
    triggerType: SummaryTrigger['type'], 
    sessionId?: string
  ): Promise<ConversationSummary[]> {
    if (this.isProcessing) {
      console.log('[SummarizingAgent] Already processing, queuing request');
      if (sessionId) {
        this.processingQueue.push(sessionId);
      }
      return [];
    }

    this.isProcessing = true;
    const summaries: ConversationSummary[] = [];

    try {
      await this.memorySystem.initialize();

      if (sessionId) {
        // Summarize specific session
        const summary = await this.summarizeSession(sessionId, triggerType);
        if (summary) {
          summaries.push(summary);
        }
      } else {
        // Summarize all sessions needing summary
        const sessionsNeedingSummary = await this.getSessionsNeedingSummary();
        for (const session of sessionsNeedingSummary) {
          const summary = await this.summarizeSession(session, triggerType);
          if (summary) {
            summaries.push(summary);
          }
        }
      }

      // Process queued requests
      while (this.processingQueue.length > 0) {
        const queuedSession = this.processingQueue.shift()!;
        const summary = await this.summarizeSession(queuedSession, 'cerebrum_request');
        if (summary) {
          summaries.push(summary);
        }
      }

      this.lastSummaryTime = new Date();
      console.log(`[SummarizingAgent] Completed summarization: ${summaries.length} summaries created`);

      await this.memorySystem.close();
      return summaries;

    } catch (error) {
      console.error('[SummarizingAgent] Error in summarization:', error);
      return [];
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Summarize a specific session
   */
  private async summarizeSession(sessionId: string, triggerType: string): Promise<ConversationSummary | null> {
    try {
      // Get conversations for this session that haven't been summarized yet
      const conversations = await this.getUnsummarizedConversations(sessionId);
      
      if (conversations.length < this.MIN_MESSAGES_FOR_SUMMARY) {
        console.log(`[SummarizingAgent] Session ${sessionId} has insufficient messages (${conversations.length})`);
        return null;
      }

      // Calculate importance score
      const importanceScore = await this.calculateImportanceScore(conversations);
      if (importanceScore < this.IMPORTANCE_THRESHOLD) {
        console.log(`[SummarizingAgent] Session ${sessionId} below importance threshold (${importanceScore})`);
        return null;
      }

      // Get user context for personalization
      const userContext = await userContextService.loadUserContext();
      const userName = userContext.username || 'User';

      // Create summarization prompt
      const prompt = this.buildSummarizationPrompt(conversations, userName);
      
      // Generate summary using the brain
      const summaryResponse = await this.brain.askLLMForComplexAnalysis(prompt, 0.3);
      
      // Parse the summary response
      const summaryData = this.parseSummaryResponse(summaryResponse);
      
      // Create summary object
      const summary: ConversationSummary = {
        session_id: sessionId,
        summary_text: summaryData.summary,
        start_timestamp: conversations[0].timestamp,
        end_timestamp: conversations[conversations.length - 1].timestamp,
        message_count: conversations.length,
        key_topics: summaryData.topics,
        sentiment: summaryData.sentiment,
        importance_score: importanceScore,
        created_at: new Date().toISOString()
      };

      // Save summary to database
      await this.memorySystem.saveConversationSummary(summary);
      
      // Mark conversations as summarized
      await this.memorySystem.markConversationsAsSummarized(conversations.map(c => c.id!));

      console.log(`[SummarizingAgent] Created summary for session ${sessionId}: ${conversations.length} messages`);
      return summary;

    } catch (error) {
      console.error(`[SummarizingAgent] Error summarizing session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Build the summarization prompt
   */
  private buildSummarizationPrompt(conversations: any[], userName: string): string {
    const conversationText = conversations.map(conv => 
      `${userName}: ${conv.user_message}\nAI: ${conv.ai_response}`
    ).join('\n\n');

    return `You are a sophisticated conversation analysis agent. Analyze the following conversation between ${userName} and an AI assistant, then provide a structured summary.

CONVERSATION:
${conversationText}

Please analyze this conversation and provide a JSON response with the following structure:
{
  "summary": "A comprehensive but concise summary of the conversation, highlighting key discussions, decisions, and outcomes",
  "key_topics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive|neutral|negative|mixed",
  "key_insights": ["insight1", "insight2"],
  "user_needs": ["need1", "need2"],
  "ai_performance": "Brief assessment of how well the AI assisted the user",
  "follow_up_opportunities": ["potential next topics or areas for future discussion"]
}

Focus on:
- Main topics discussed
- User's goals, problems, or questions
- AI's responses and helpfulness
- Overall conversation flow and sentiment
- Important decisions or conclusions
- Areas where the user might need continued support

Provide only the JSON response, no additional text.`;
  }

  /**
   * Parse the summary response from the LLM
   */
  private parseSummaryResponse(response: string): {
    summary: string;
    topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  } {
    try {
      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Summary could not be generated',
          topics: parsed.key_topics || [],
          sentiment: parsed.sentiment || 'neutral'
        };
      }
    } catch (error) {
      console.error('[SummarizingAgent] Error parsing summary response:', error);
    }

    // Fallback parsing
    return {
      summary: response.substring(0, 500) + '...',
      topics: ['general discussion'],
      sentiment: 'neutral'
    };
  }

  /**
   * Calculate importance score for conversations
   */
  private async calculateImportanceScore(conversations: any[]): Promise<number> {
    let score = 0;
    const messageCount = conversations.length;
    
    // Base score from message count
    score += Math.min(messageCount / 20, 0.3); // Up to 0.3 for message count
    
    // Analyze content for importance indicators
    const allText = conversations.map(c => c.user_message + ' ' + c.ai_response).join(' ').toLowerCase();
    
    // Important keywords boost score
    const importantKeywords = [
      'help', 'problem', 'important', 'urgent', 'question', 'learn', 'understand',
      'project', 'work', 'create', 'build', 'analyze', 'explain', 'code', 'debug'
    ];
    
    for (const keyword of importantKeywords) {
      if (allText.includes(keyword)) {
        score += 0.05; // Small boost per keyword
      }
    }
    
    // Length of responses indicates engagement
    const avgResponseLength = conversations.reduce((sum, c) => sum + c.ai_response.length, 0) / messageCount;
    if (avgResponseLength > 200) {
      score += 0.2; // Boost for detailed responses
    }
    
    // Recent conversations are more important
    const timeSinceConversation = Date.now() - new Date(conversations[0].timestamp).getTime();
    const hoursSince = timeSinceConversation / (1000 * 60 * 60);
    if (hoursSince < 1) {
      score += 0.2; // Recent conversations are more important
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Get sessions that need summarization
   */
  private async getSessionsNeedingSummary(): Promise<string[]> {
    try {
      return await this.memorySystem.getSessionsNeedingSummary(this.MIN_MESSAGES_FOR_SUMMARY);
    } catch (error) {
      console.error('[SummarizingAgent] Error getting sessions needing summary:', error);
      return [];
    }
  }

  /**
   * Get unsummarized conversations for a session
   */
  private async getUnsummarizedConversations(sessionId: string): Promise<any[]> {
    try {
      return await this.memorySystem.getUnsummarizedConversations(sessionId);
    } catch (error) {
      console.error('[SummarizingAgent] Error getting unsummarized conversations:', error);
      return [];
    }
  }

  /**
   * Get summaries for context (used by Brain)
   */
  async getRecentSummaries(sessionId?: string, limit: number = 5): Promise<ConversationSummary[]> {
    try {
      await this.memorySystem.initialize();
      const results = await this.memorySystem.getConversationSummaries(sessionId, limit);
      await this.memorySystem.close();
      return results;
    } catch (error) {
      console.error('[SummarizingAgent] Error getting recent summaries:', error);
      return [];
    }
  }

  /**
   * Get summary context for brain responses
   */
  async getSummaryContext(sessionId: string): Promise<string> {
    const summaries = await this.getRecentSummaries(sessionId, 3);
    
    if (summaries.length === 0) {
      return '';
    }

    const context = summaries.map(summary => {
      const timeAgo = this.getTimeAgo(summary.created_at);
      return `Previous conversation summary (${timeAgo}): ${summary.summary_text}
Key topics: ${summary.key_topics.join(', ')}
Sentiment: ${summary.sentiment}`;
    }).join('\n\n');

    return `\n\nCONVERSATION HISTORY CONTEXT:\n${context}\n\n`;
  }

  /**
   * Helper to get human-readable time ago
   */
  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'less than an hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  }

  /**
   * Get agent status
   */
  getStatus(): {
    isProcessing: boolean;
    lastSummaryTime: string;
    queueLength: number;
    processingSince?: string;
  } {
    return {
      isProcessing: this.isProcessing,
      lastSummaryTime: this.lastSummaryTime.toISOString(),
      queueLength: this.processingQueue.length,
    };
  }
}
