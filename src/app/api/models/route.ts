import { NextRequest, NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

const memorySystem = new MemorySystem();

export async function GET(_request: NextRequest) {
  try {
    await memorySystem.initialize();
    const models = await memorySystem.getModelPreferences();
    
    return NextResponse.json({
      success: true,
      models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get models:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve models',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { model_name, description, speed_rating, intelligence_rating, is_default } = await request.json();

    if (!model_name || typeof model_name !== 'string') {
      return NextResponse.json(
        { error: 'Model name is required and must be a string' },
        { status: 400 }
      );
    }

    await memorySystem.initialize();
    const modelId = await memorySystem.addModelPreference({
      model_name,
      description: description || '',
      speed_rating: speed_rating || 3,
      intelligence_rating: intelligence_rating || 3,
      is_default: is_default || false
    });

    if (is_default) {
      await memorySystem.setDefaultModel(model_name);
    }

    return NextResponse.json({
      success: true,
      modelId,
      message: 'Model preference added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to add model:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
