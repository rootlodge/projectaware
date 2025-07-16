import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database/manager';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or if explicitly enabled
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_INIT !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Database initialization not allowed in production' },
        { status: 403 }
      );
    }

    const dbManager = DatabaseManager.getInstance();
    
    // Connect to database
    await dbManager.connect();
    console.log('✅ Database connected successfully');

    // Run migrations
    await dbManager.runMigrations();
    console.log('✅ Database migrations completed');

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Database initialization failed', details: error },
      { status: 500 }
    );
  }
}
