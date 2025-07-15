import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    return NextResponse.json({
      success: true,
      ...config
    });
  } catch (error) {
    console.error('Failed to load system config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    const configPath = path.join(process.cwd(), 'src', 'lib', 'config', 'config.json');
    
    // Load current config
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Apply updates
    const updatedConfig = { ...config, ...updates };
    
    // Save updated config
    await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Failed to update system config:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
