import { NextRequest, NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

const memorySystem = new MemorySystem();

export async function POST(request: NextRequest) {
  try {
    const { model_name } = await request.json();

    if (!model_name || typeof model_name !== 'string') {
      return NextResponse.json(
        { error: 'Model name is required and must be a string' },
        { status: 400 }
      );
    }

    await memorySystem.initialize();
    await memorySystem.setDefaultModel(model_name);

    return NextResponse.json({
      success: true,
      message: `Default model set to ${model_name}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to set default model:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set default model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    await memorySystem.initialize();
    const currentModel = await memorySystem.getCurrentModel();

    return NextResponse.json({
      success: true,
      currentModel: currentModel || { model_name: 'gemma3:latest' },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get current model:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get current model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
