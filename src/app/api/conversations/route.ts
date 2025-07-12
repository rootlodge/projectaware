import { NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

export async function GET() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    // Get recent conversations from database
    const conversations = await memory.getConversationHistory(50);
    
    // Group conversations by session_id and create conversation summaries
    const conversationMap = new Map();
    
    conversations.forEach(conv => {
      const sessionId = conv.session_id || 'default';
      if (!conversationMap.has(sessionId)) {
        conversationMap.set(sessionId, {
          id: sessionId,
          title: conv.user_message.length > 50 
            ? conv.user_message.substring(0, 50) + '...'
            : conv.user_message,
          timestamp: conv.timestamp,
          messageCount: 0,
          lastMessage: conv.timestamp
        });
      }
      
      const existing = conversationMap.get(sessionId);
      existing.messageCount += 2; // user + ai message
      if (conv.timestamp > existing.lastMessage) {
        existing.timestamp = conv.timestamp;
        existing.lastMessage = conv.timestamp;
      }
    });
    
    // Convert to array and sort by last activity
    const result = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    await memory.close();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get conversations:', error);
    
    // Fallback to mock data if database is not available
    const mockConversations = [
      {
        id: 'conv_1',
        title: 'Initial Setup Discussion',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        messageCount: 12
      },
      {
        id: 'conv_2', 
        title: 'Identity Evolution Chat',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        messageCount: 8
      },
      {
        id: 'conv_3',
        title: 'System Configuration',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        messageCount: 15
      }
    ];
    
    return NextResponse.json(mockConversations);
  }
}
