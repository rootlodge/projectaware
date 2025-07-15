import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Check if Ollama is installed first
    try {
      await execAsync('ollama --version');
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Ollama is not installed'
      }, { status: 404 });
    }

    // Start the Ollama service
    try {
      if (process.platform === 'win32') {
        await execAsync('Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden');
      } else {
        await execAsync('ollama serve &');
      }

      // Wait for service to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify service is running by trying to list models
      await execAsync('ollama list');

      return NextResponse.json({
        success: true,
        message: 'Ollama service started successfully'
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to start Ollama service',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to start Ollama service',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
