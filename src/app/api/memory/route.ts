import { NextRequest, NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';
    
    const memory = new MemorySystem();
    await memory.initialize();
    
    switch (action) {
      case 'stats':
        const stats = await memory.getStats();
        await memory.close();
        return NextResponse.json({
          success: true,
          data: stats
        });
        
      case 'recent_messages':
        const limit = parseInt(searchParams.get('limit') || '10');
        const type = searchParams.get('type') || undefined;
        const messages = await memory.getRecentMessages(limit, type);
        await memory.close();
        return NextResponse.json({
          success: true,
          data: messages
        });
        
      case 'conversation_history':
        const historyLimit = parseInt(searchParams.get('limit') || '20');
        const sessionId = searchParams.get('sessionId') || undefined;
        const conversations = await memory.getConversationHistory(historyLimit, sessionId);
        await memory.close();
        return NextResponse.json({
          success: true,
          data: conversations
        });
        
      case 'user_patterns':
        const patterns = await memory.getUserResponsePatterns();
        await memory.close();
        return NextResponse.json({
          success: true,
          data: patterns
        });
        
      case 'learning_events':
        const eventsLimit = parseInt(searchParams.get('limit') || '50');
        const events = await memory.getLearningEvents(eventsLimit);
        await memory.close();
        return NextResponse.json({
          success: true,
          data: events
        });
        
      case 'search':
        const query = searchParams.get('query');
        const searchType = searchParams.get('type') || 'all';
        const searchLimit = parseInt(searchParams.get('limit') || '20');
        
        if (!query) {
          await memory.close();
          return NextResponse.json({
            success: false,
            error: 'Search query is required'
          }, { status: 400 });
        }
        
        const searchResults = await memory.searchMessages(query, searchType, searchLimit);
        await memory.close();
        return NextResponse.json({
          success: true,
          data: searchResults
        });
        
      case 'analytics':
        const analytics = await memory.getAdvancedAnalytics();
        await memory.close();
        return NextResponse.json({
          success: true,
          data: analytics
        });
        
      default:
        await memory.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process memory request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    const memory = new MemorySystem();
    await memory.initialize();
    
    switch (action) {
      case 'save_message':
        await memory.saveMessage(data.type, data.content, data.metadata || {});
        await memory.close();
        return NextResponse.json({
          success: true,
          message: 'Message saved'
        });
        
      case 'save_conversation':
        await memory.saveConversation(
          data.sessionId,
          data.userMessage,
          data.aiResponse,
          data.satisfactionScore,
          data.emotionState
        );
        await memory.close();
        return NextResponse.json({
          success: true,
          message: 'Conversation saved'
        });
        
      case 'record_learning_event':
        await memory.recordLearningEvent(
          data.eventType,
          data.description,
          data.context
        );
        await memory.close();
        return NextResponse.json({
          success: true,
          message: 'Learning event recorded'
        });
        
      case 'cleanup':
        const daysToKeep = data.daysToKeep || 30;
        await memory.cleanup(daysToKeep);
        await memory.close();
        return NextResponse.json({
          success: true,
          message: `Cleaned up data older than ${daysToKeep} days`
        });
        
      default:
        await memory.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process memory request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
