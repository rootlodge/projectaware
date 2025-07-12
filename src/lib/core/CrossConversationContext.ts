/**
 * CrossConversationContext: Links and preserves relevant context across conversations.
 * Part of Advanced Autonomous Intelligence.
 */

export interface ConversationLink {
  fromConversationId: string;
  toConversationId: string;
  contextSummary: string;
  timestamp: string;
}

export class CrossConversationContext {
  private links: ConversationLink[] = [];

  addLink(fromId: string, toId: string, summary: string) {
    this.links.push({
      fromConversationId: fromId,
      toConversationId: toId,
      contextSummary: summary,
      timestamp: new Date().toISOString(),
    });
    if (this.links.length > 200) this.links.shift();
  }

  getLinksForConversation(conversationId: string): ConversationLink[] {
    return this.links.filter(l => l.fromConversationId === conversationId || l.toConversationId === conversationId);
  }

  getRecentLinks(limit = 10): ConversationLink[] {
    return this.links.slice(-limit);
  }
}
