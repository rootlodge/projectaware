import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(_req: NextRequest) {
  try {
    const ollamaUrl = 'http://localhost:11434';
    
    // Get available models from Ollama
    const response = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 5000 });
    const models = response.data?.models?.map((model: any) => model.name) || [];
    
    return NextResponse.json({
      success: true,
      models,
      total: models.length
    });
  } catch (error) {
    console.error('Failed to get available models:', error);
    
    // Return fallback models if Ollama is unavailable
    return NextResponse.json({
      success: false,
      models: ['llama3.2:latest', 'gemma3:latest', 'llama3.1:8b'],
      total: 3,
      error: 'Ollama unavailable, showing fallback models'
    });
  }
}
