import { NextRequest, NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

export async function DELETE(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const memory = new MemorySystem();
    await memory.initialize();
    
    await memory.deleteConfiguration(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
  }
}
