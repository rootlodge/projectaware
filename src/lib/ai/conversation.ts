import { db, schema } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { ChatMessage } from "./types";
import { aiService } from "./service";

export class ConversationManager {
  
  /**
   * Create a new conversation or get existing
   */
  async getOrCreateConversation(tenantId: string, userId: string, conversationId?: string) {
      if (conversationId) {
          const conv = await db.query.conversations.findFirst({
              where: and(
                  eq(schema.conversations.id, conversationId),
                  eq(schema.conversations.tenantId, tenantId)
              )
          });
          if (conv) return conv;
      }

      // Create new
      const [newConv] = await db.insert(schema.conversations).values({
          tenantId,
          userId, // Optional depending on schema, but usually good
          title: "New Conversation",
      }).returning();
      
      return newConv;
  }

  /**
   * Add user message and get AI response
   */
  async chat(
    tenantId: string, 
    userId: string, 
    conversationId: string, 
    message: string, 
    modelId: string = "gpt-4-turbo"
  ) {
      // 1. Save User Message
      await db.insert(schema.messages).values({
          conversationId,
          role: "user",
          content: message,
          tokenCount: message.length / 4, // Rough estimate
      });

      // 2. Fetch History (Limited context)
      // TODO: Implement smart token window trimming
      const history = await db.query.messages.findMany({
          where: eq(schema.messages.conversationId, conversationId),
          orderBy: [desc(schema.messages.createdAt)],
          limit: 20, // Simple limit for now
      });

      // Reverse history to be chronological
      const messages: ChatMessage[] = history.reverse().map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content
      }));

      // 3. Generate Response
      const response = await aiService.generateResponse({
          model: modelId,
          messages: messages,
      }, tenantId);

      // 4. Save Assistant Message
      await db.insert(schema.messages).values({
          conversationId,
          role: "assistant",
          content: response.content,
          model: response.model,
          tokenCount: response.usage?.completionTokens || (response.content.length / 4),
      });

      return response.content;
  }
}

export const conversationManager = new ConversationManager();
