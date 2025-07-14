import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(_request: NextRequest) {
  try {
    // Fetch installed models from Ollama
    const response = await axios.get('http://localhost:11434/api/tags', {
      timeout: 5000
    });
    
    const models = response.data.models || [];
    
    // Transform the model data for our UI
    const transformedModels = models.map((model: any) => {
      const details = model.details || {};
      const parameterSize = details.parameter_size || 'Unknown';
      const family = details.family || 'Unknown';
      
      // Estimate speed and intelligence based on parameter size
      let speedRating = 3;
      let intelligenceRating = 3;
      
      if (parameterSize.includes('3.2B') || parameterSize.includes('1B') || parameterSize.includes('0.5B')) {
        speedRating = 5;
        intelligenceRating = 3;
      } else if (parameterSize.includes('7B') || parameterSize.includes('8B')) {
        speedRating = 4;
        intelligenceRating = 4;
      } else if (parameterSize.includes('13B') || parameterSize.includes('14B')) {
        speedRating = 3;
        intelligenceRating = 5;
      } else if (parameterSize.includes('30B') || parameterSize.includes('70B')) {
        speedRating = 2;
        intelligenceRating = 5;
      }
      
      return {
        name: model.name,
        model: model.model,
        size_bytes: model.size,
        size_formatted: formatBytes(model.size),
        modified_at: model.modified_at,
        parameter_size: parameterSize,
        family: family,
        format: details.format || 'gguf',
        quantization: details.quantization_level || 'Unknown',
        speed_rating: speedRating,
        intelligence_rating: intelligenceRating,
        description: generateDescription(model.name, parameterSize, family)
      };
    });
    
    return NextResponse.json({
      success: true,
      models: transformedModels,
      count: transformedModels.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    
    let errorMessage = 'Failed to fetch models';
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Ollama service is not running. Please start Ollama first.';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Connection to Ollama timed out.';
      } else {
        errorMessage = `Ollama error: ${error.message}`;
      }
    }
    
    return NextResponse.json({
      success: false,
      models: [],
      count: 0,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateDescription(name: string, parameterSize: string, family: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('llama3.2')) {
    return 'Fast and efficient model optimized for quick responses and basic tasks';
  } else if (lowerName.includes('gemma')) {
    return 'Well-balanced model with good performance for general conversations';
  } else if (lowerName.includes('deepseek')) {
    return 'Advanced reasoning model with strong analytical capabilities';
  } else if (lowerName.includes('llama')) {
    return 'Popular open-source model with strong general capabilities';
  } else if (lowerName.includes('mistral')) {
    return 'Efficient model with good instruction following';
  } else if (lowerName.includes('qwen')) {
    return 'Multilingual model with strong reasoning abilities';
  } else {
    return `${family} family model with ${parameterSize} parameters`;
  }
}
