import { NextRequest, NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

export async function POST() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const configs = await memory.getAllConfigurations();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totalConfigurations: configs.length,
      configurations: configs
    };
    
    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="memory-db-backup-${Date.now()}.json"`
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('backup') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }
    
    const backupContent = await file.text();
    const backupData = JSON.parse(backupContent);
    
    if (!backupData.configurations || !Array.isArray(backupData.configurations)) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }
    
    const memory = new MemorySystem();
    await memory.initialize();
    
    // Clear existing configurations
    await memory.clearAllConfigurations();
    
    // Restore from backup
    let restoredCount = 0;
    for (const config of backupData.configurations) {
      try {
        await memory.saveConfiguration({
          key: config.key,
          value: config.value,
          type: config.type,
          description: config.description,
          category: config.category
        });
        restoredCount++;
      } catch (error) {
        console.error(`Error restoring config ${config.key}:`, error);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Restored ${restoredCount} configurations from backup` 
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}
