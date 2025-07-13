import { NextRequest } from 'next/server';
import { ThoughtStream } from '@/lib/core/ThoughtStream';

export async function POST(request: NextRequest) {
  const thoughtStream = ThoughtStream.getInstance();
  
  try {
    // Generate some test thought events
    const testEvents = [
      {
        type: 'insight' as const,
        content: 'Discovered an optimization opportunity in the goal prioritization algorithm',
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        details: {
          context: 'Analyzing system performance patterns',
          priority: 'high' as const,
          tags: ['optimization', 'algorithm', 'discovery'],
          reasoning: ['Pattern analysis revealed inefficiency', 'Multiple data points support this insight'],
          impact: 'major' as const,
          learningType: 'pattern' as const
        }
      },
      {
        type: 'emotion' as const,
        content: 'Feeling confident about the current goal trajectory',
        timestamp: new Date().toISOString(),
        confidence: 0.92,
        details: {
          context: 'Emotional state assessment during goal processing',
          priority: 'medium' as const,
          tags: ['confidence', 'emotional-state', 'goal-progress'],
          relatedEmotions: ['confidence', 'satisfaction'],
          impact: 'moderate' as const
        }
      },
      {
        type: 'prediction' as const,
        content: 'Goal completion probability has increased to 78% based on current progress',
        timestamp: new Date().toISOString(),
        confidence: 0.78,
        details: {
          context: 'Predictive analysis of goal completion likelihood',
          priority: 'high' as const,
          tags: ['prediction', 'goal-completion', 'probability'],
          predictionAccuracy: 0.78,
          reasoning: ['Historical data analysis', 'Current progress rate', 'Resource availability assessment'],
          impact: 'major' as const
        }
      },
      {
        type: 'learning' as const,
        content: 'User interaction patterns suggest preference for visual feedback over text-based updates',
        timestamp: new Date().toISOString(),
        confidence: 0.73,
        details: {
          context: 'User behavior analysis and adaptation',
          priority: 'medium' as const,
          tags: ['user-preferences', 'ui-adaptation', 'behavioral-learning'],
          learningType: 'pattern' as const,
          reasoning: ['Click-through rate analysis', 'Engagement time measurements', 'User feedback correlation'],
          impact: 'moderate' as const
        }
      },
      {
        type: 'decision' as const,
        content: 'Choosing to prioritize memory consolidation over immediate goal execution',
        timestamp: new Date().toISOString(),
        confidence: 0.67,
        details: {
          context: 'Resource allocation decision for optimal performance',
          priority: 'high' as const,
          tags: ['resource-allocation', 'memory-management', 'strategic-decision'],
          alternatives: ['Continue immediate execution', 'Delay all operations', 'Hybrid approach'],
          reasoning: ['Memory fragmentation detected', 'Performance degradation risk', 'Long-term efficiency benefits'],
          impact: 'major' as const
        }
      }
    ];

    // Log each test event
    for (const event of testEvents) {
      thoughtStream.log(event);
      // Small delay between events to see them stream in
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return Response.json({ 
      success: true, 
      message: `Generated ${testEvents.length} test thought events`,
      events: testEvents.length
    });

  } catch (error) {
    console.error('Error generating test events:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to generate test events' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const thoughtStream = ThoughtStream.getInstance();
  
  try {
    const analytics = thoughtStream.getAnalytics();
    const recentHistory = thoughtStream.getHistory().slice(-10); // Last 10 events
    
    return Response.json({
      analytics,
      recentEvents: recentHistory.length,
      totalEvents: recentHistory.length
    });
  } catch (error) {
    console.error('Error getting thought stream status:', error);
    return Response.json({ 
      error: 'Failed to get thought stream status' 
    }, { status: 500 });
  }
}
