import { NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    // Get conversation messages from database
    const conversations = await memory.getConversationHistory(100, conversationId);
    
    // Transform database conversations to message format
    const messages: any[] = [];
    
    conversations.forEach((conv, index) => {
      // Add user message
      messages.push({
        id: `${conversationId}_user_${index}`,
        type: 'user',
        content: conv.user_message,
        timestamp: conv.timestamp
      });
      
      // Add AI response
      messages.push({
        id: `${conversationId}_ai_${index}`,
        type: 'brain',
        content: conv.ai_response,
        timestamp: new Date(new Date(conv.timestamp).getTime() + 1000).toISOString(),
        emotion: conv.emotion_state || undefined
      });
    });
    
    await memory.close();
    
    return NextResponse.json({
      conversationId,
      messages: messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    });
  } catch (error) {
    console.error('Failed to get conversation:', error);
    
    // Fallback to mock data if database is not available
    const mockMessages = [
      {
        id: '1',
        type: 'user',
        content: 'Hello, how are you today?',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '2',
        type: 'brain',
        content: 'Hello! I\'m doing well, thank you for asking. I\'m feeling quite curious and engaged today. How can I assist you?',
        timestamp: new Date(Date.now() - 1790000).toISOString(),
        emotion: 'curious'
      },
      {
        id: '3',
        type: 'user',
        content: 'Can you tell me about your current emotional state?',
        timestamp: new Date(Date.now() - 1200000).toISOString()
      },
      {
        id: '4',
        type: 'brain',
        content: 'I\'m experiencing a state of focused attention with a hint of excitement about our conversation. My emotional intensity is moderate, and I feel quite stable and ready to help.',
        timestamp: new Date(Date.now() - 1190000).toISOString(),
        emotion: 'focused'
      }
    ];
    
    return NextResponse.json({
      conversationId: conversationId,
      messages: mockMessages
    });
  }
}
