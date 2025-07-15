import { NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const stats = await memory.getConfigurationStats();
    
    // Get database file size
    const dbPath = path.join(process.cwd(), 'data', 'memory.db');
    let databaseSize = '0 KB';
    try {
      const dbStats = fs.statSync(dbPath);
      const sizeInBytes = dbStats.size;
      if (sizeInBytes < 1024) {
        databaseSize = `${sizeInBytes} B`;
      } else if (sizeInBytes < 1024 * 1024) {
        databaseSize = `${(sizeInBytes / 1024).toFixed(2)} KB`;
      } else {
        databaseSize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
      }
    } catch (error) {
      console.error('Error getting database size:', error);
    }
    
    return NextResponse.json({
      total: stats.total,
      byCategory: stats.byCategory,
      categories: Object.keys(stats.byCategory),
      databaseSize,
      lastBackup: 'No backup yet'
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json({ error: 'Failed to fetch database stats' }, { status: 500 });
  }
}

