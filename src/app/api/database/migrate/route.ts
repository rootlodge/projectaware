import { NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    // List of JSON configuration files to migrate
    const configFiles = [
      'config.json',
      'agent-core.json', 
      'agents.json',
      'core.json',
      'emotions.json',
      'identity.json',
      'self-modification.json',
      'soul.json',
      'state.json',
      'tasks.json',
      'task_templates.json',
      'workflows.json'
    ];

    let totalMigrated = 0;
    const results: Record<string, any> = {};

    for (const fileName of configFiles) {
      const configPath = path.join(process.cwd(), 'src', 'lib', 'config', fileName);
      
      if (fs.existsSync(configPath)) {
        try {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          const category = path.basename(fileName, '.json');
          
          const migratedCount = await memory.migrateJsonToDatabase(configData, category);
          totalMigrated += migratedCount;
          
          results[fileName] = {
            success: true,
            migratedCount,
            category
          };
          
          console.log(`Migrated ${migratedCount} items from ${fileName}`);
        } catch (error) {
          console.error(`Error migrating ${fileName}:`, error);
          results[fileName] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            category: path.basename(fileName, '.json')
          };
        }
      } else {
        results[fileName] = {
          success: false,
          error: 'File not found',
          category: path.basename(fileName, '.json')
        };
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${totalMigrated} configuration items from JSON files to memory.db`,
      totalMigrated,
      results
    });
  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json({ 
      error: 'Failed to migrate configurations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
