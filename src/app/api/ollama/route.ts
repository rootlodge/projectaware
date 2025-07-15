import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // First check if Ollama is installed
    try {
      await execAsync('ollama --version');
    } catch (versionError) {
      return NextResponse.json({ 
        ollamaInstalled: false,
        serviceRunning: false,
        models: [],
        error: 'Ollama is not installed or not in PATH'
      });
    }

    // Try to list models (this will fail if service isn't running)
    let models = [];
    let serviceRunning = true;
    let serviceStarted = false;

    try {
      const { stdout } = await execAsync('ollama list');
      models = stdout.split('\n')
        .filter(line => line.trim() && !line.startsWith('NAME') && !line.startsWith('NAMEID'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            name: parts[0],
            size: parts[1] || 'Unknown',
            modified: parts[2] || 'Unknown'
          };
        });
    } catch (listError) {
      serviceRunning = false;
      
      // Try to start the service
      try {
        if (process.platform === 'win32') {
          await execAsync('Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden');
        } else {
          await execAsync('ollama serve &');
        }
        
        // Wait a moment for service to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try listing models again
        const { stdout } = await execAsync('ollama list');
        models = stdout.split('\n')
          .filter(line => line.trim() && !line.startsWith('NAME') && !line.startsWith('NAMEID'))
          .map(line => {
            const parts = line.trim().split(/\s+/);
            return {
              name: parts[0],
              size: parts[1] || 'Unknown',
              modified: parts[2] || 'Unknown'
            };
          });
        
        serviceRunning = true;
        serviceStarted = true;
      } catch (startError) {
        return NextResponse.json({ 
          ollamaInstalled: true,
          serviceRunning: false,
          models: [],
          error: 'Ollama service could not be started'
        });
      }
    }

    return NextResponse.json({ 
      ollamaInstalled: true,
      serviceRunning,
      serviceStarted,
      models 
    });
  } catch (error) {
    return NextResponse.json({ 
      ollamaInstalled: false,
      serviceRunning: false,
      models: [],
      error: 'Failed to check Ollama status'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, model } = await request.json();

    if (action === 'install' && model) {
      // Install the specified model
      const { stdout, stderr } = await execAsync(`ollama pull ${model}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Model ${model} installed successfully`,
        output: stdout 
      });
    } else if (action === 'install-recommended') {
      // Install recommended models for the system
      const recommendedModels = [
        'llama3.2:latest',
        'qwen2.5-coder:7b',
        'nomic-embed-text:latest'
      ];

      const results = [];
      for (const model of recommendedModels) {
        try {
          const { stdout } = await execAsync(`ollama pull ${model}`);
          results.push({ model, success: true, output: stdout });
        } catch (error) {
          results.push({ 
            model, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Recommended models installation completed',
        results 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing model parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to manage models:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
