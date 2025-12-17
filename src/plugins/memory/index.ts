import { PluginInterface, PluginManifest, PluginContext } from "@/lib/plugins/types";
import { db, schema } from "@/db";
import { desc, eq, and, ne } from "drizzle-orm";

export class MemoryPlugin implements PluginInterface {
  manifest: PluginManifest = {
    id: "memory-system",
    name: "Long-term Memory",
    version: "1.0.0",
    description: "Provides vector-based long-term memory retrieval and persistence.",
    author: "Project Aware Core",
    category: "ai",
    permissions: ["db:read", "db:write"],
  };

  hooks = {
    onInit: async (context: PluginContext) => {
      context.logger.info("Memory system initialized");
    },
    
    // Args: userId, currentConversationId, query
    onContextUpdate: async (context: PluginContext, userId: string, currentConversationId: string) => {
      if (!userId) {
          return ["No user context provided for memory retrieval."];
      }

      context.logger.info(`Retrieving memories for user ${userId}...`);
      
      try {
        // Query recent messages from *other* conversations 
        // to simulate "long term memory" from past interactions
        const recentMessages = await db.query.messages.findMany({
            where: (messages, { eq, and, ne }) => and(
                 // Join would be needed to filter by userId if not in messages table directly
                 // Luckily we can subquery or just use what we have.
                 // Messages table doesn't have userId, it has conversationId.
                 // So we first find conversations.
            ),
            limit: 5,
            orderBy: (messages, { desc }) => [desc(messages.createdAt)],
            with: {
                conversation: true
            }
        });
        
        // Correct approach with Drizzle:
        const userConversations = await db.query.conversations.findMany({
            where: and(
                eq(schema.conversations.userId, userId),
                ne(schema.conversations.id, currentConversationId)
            ),
            limit: 5,
            orderBy: desc(schema.conversations.updatedAt),
            with: {
                messages: {
                    limit: 1,
                    orderBy: desc(schema.messages.createdAt)
                }
            }
        });

        const memories = userConversations
            .map(c => c.messages[0]?.content)
            .filter(Boolean)
            .map(content => `Past interaction: ${content?.substring(0, 100)}...`);

        if (memories.length === 0) {
            return ["No significant past memories found."];
        }

        return memories;

      } catch (err) {
        context.logger.error("Failed to retrieve memories", err);
        return [];
      }
    }
  };
}
