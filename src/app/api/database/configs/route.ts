import { NextRequest, NextResponse } from 'next/server';
import { MemorySystem } from '@/lib/core/memory';

export async function GET(request: NextRequest) {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    
    const configs = await memory.getAllConfigurations(category, search);
    
    // Parse values for display
    const parsedConfigs = configs.map(config => ({
      ...config,
      value: JSON.parse(config.value)
    }));
    
    return NextResponse.json(parsedConfigs);
  } catch (error) {
    console.error('Error fetching configurations:', error);
    return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const body = await request.json();
    const { key, value, type, description, category } = body;
    
    if (!key || value === undefined || !type || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if configuration already exists
    const existing = await memory.getConfigurationByKey(key, category);
    if (existing) {
      return NextResponse.json({ error: 'Configuration with this key already exists in this category' }, { status: 409 });
    }
    
    let serializedValue: string;
    try {
      // Parse and re-serialize to ensure valid JSON
      const parsedValue: any = typeof value === 'string' ? JSON.parse(value) : value;
      serializedValue = JSON.stringify(parsedValue);
    } catch {
      return NextResponse.json({ error: 'Invalid value format' }, { status: 400 });
    }
    
    const id = await memory.saveConfiguration({
      key,
      value: serializedValue,
      type,
      description,
      category
    });
    
    return NextResponse.json({ id, success: true });
  } catch (error) {
    console.error('Error creating configuration:', error);
    return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const memory = new MemorySystem();
    await memory.initialize();
    
    const body = await request.json();
    const { id, key, value, type, description, category } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing configuration ID' }, { status: 400 });
    }
    
    const updates: any = {};
    if (key !== undefined) updates.key = key;
    if (value !== undefined) {
      try {
        const parsedValue: any = typeof value === 'string' ? JSON.parse(value) : value;
        updates.value = JSON.stringify(parsedValue);
      } catch {
        return NextResponse.json({ error: 'Invalid value format' }, { status: 400 });
      }
    }
    if (type !== undefined) updates.type = type;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    
    await memory.updateConfiguration(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
