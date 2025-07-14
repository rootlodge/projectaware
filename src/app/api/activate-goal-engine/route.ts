import { NextRequest } from 'next/server';
import { GoalEngine } from '@/lib/systems/GoalEngine';

export async function POST(_request: NextRequest) {
  try {
    const goalEngine = GoalEngine.getInstance();
    
    // Initialize the goal engine if not already done
    await goalEngine.initialize();
    
    // Trigger goal creation and processing
    const createdGoals = await goalEngine.analyzeAndCreateGoals();
    
    // Process some goals to generate thought events
    for (let i = 0; i < Math.min(3, createdGoals.length); i++) {
      const goal = createdGoals[i];
      await goalEngine.logThought(`Analyzing goal: ${goal.title}`, goal.id);
      await goalEngine.logReflection(`Considering approaches for ${goal.title}`, goal.id);
      await goalEngine.logAction(`Initiated work on ${goal.title}`, goal.id);
      
      // Small delay between processing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Trigger some additional processing
    await goalEngine.processNextGoal();
    
    return Response.json({ 
      success: true, 
      message: `Goal engine activated. Created ${createdGoals.length} goals and generated thought events.`,
      createdGoals: createdGoals.length,
      thoughtEventsGenerated: createdGoals.length * 3
    });

  } catch (error) {
    console.error('Error activating goal engine:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to activate goal engine',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const goalEngine = GoalEngine.getInstance();
    
    // Get current status
    return Response.json({
      success: true,
      message: 'Goal engine status retrieved',
      isInitialized: goalEngine['isInitialized'] || false
    });
  } catch (error) {
    console.error('Error getting goal engine status:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to get goal engine status' 
    }, { status: 500 });
  }
}
