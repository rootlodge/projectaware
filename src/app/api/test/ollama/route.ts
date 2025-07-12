import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    // Test Ollama connection using /api/tags
    const response = await axios.get('http://localhost:11434/api/tags', {
      timeout: 5000
    });
    
    const models = response.data.models || [];
    
    return NextResponse.json({
      success: true,
      ollama_running: true,
      available_models: models.map((model: any) => ({
        name: model.name,
        size: model.size,
        modified_at: model.modified_at,
        details: model.details
      })),
      model_count: models.length,
      message: `Ollama is running with ${models.length} models available`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Ollama connection test failed:', error);
    
    let errorMessage = 'Unknown error';
    let isConnectionError = false;
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Ollama service is not running. Please start Ollama first.';
        isConnectionError = true;
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Cannot connect to Ollama. Check if it\'s running on localhost:11434.';
        isConnectionError = true;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection to Ollama timed out. Please check if Ollama is responsive.';
        isConnectionError = true;
      } else {
        errorMessage = `Connection error: ${error.message}`;
        isConnectionError = true;
      }
    }
    
    return NextResponse.json({
      success: false,
      ollama_running: false,
      available_models: [],
      model_count: 0,
      message: errorMessage,
      is_connection_error: isConnectionError,
      timestamp: new Date().toISOString()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, model } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }
    
    const testModel = model || 'gemma3:latest';
    
    // Test basic Ollama generation
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: testModel,
      prompt: `Test message: ${message}`,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.8,
        repeat_penalty: 1.1,
        num_predict: 100
      }
    }, {
      timeout: 30000
    });
    
    if (!response.data?.response) {
      throw new Error('No response from Ollama');
    }
    
    return NextResponse.json({
      success: true,
      response: response.data.response.trim(),
      model_used: testModel,
      message: 'Ollama test successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ollama test failed:', error);
    
    let errorMessage = 'Unknown error';
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Ollama service is not running. Please start Ollama first.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Model not found. Make sure the model is installed in Ollama.';
      } else {
        errorMessage = `Ollama error: ${error.message}`;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
