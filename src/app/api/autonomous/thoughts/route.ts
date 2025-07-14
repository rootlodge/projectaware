import { NextRequest, NextResponse } from 'next/server';
import { getAutonomousThinkingSystem } from '@/lib/systems/autonomousThinkingInstance';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Filtering parameters
    const types = url.searchParams.get('types')?.split(',').filter(Boolean) || [];
    const emotions = url.searchParams.get('emotions')?.split(',').filter(Boolean) || [];
    const priorities = url.searchParams.get('priorities')?.split(',').map(p => parseInt(p)).filter(p => !isNaN(p)) || [];
    const dateRange = url.searchParams.get('dateRange') || 'all';
    const search = url.searchParams.get('search') || '';
    
    const thinkingSystem = await getAutonomousThinkingSystem();
    
    // Get ALL thoughts without limit first, then filter and paginate
    const allThoughts = await thinkingSystem.getAllThoughts(50000); // Very large limit to get everything
    
    // Apply filters
    const filteredThoughts = allThoughts.filter(thought => {
      // Type filter
      if (types.length > 0 && !types.includes(thought.type)) {
        return false;
      }
      
      // Emotion filter
      if (emotions.length > 0 && !emotions.includes(thought.emotion_influence)) {
        return false;
      }
      
      // Priority filter
      if (priorities.length > 0 && !priorities.includes(thought.priority)) {
        return false;
      }
      
      // Date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        const itemDate = new Date(thought.timestamp);
        const cutoffDate = new Date();
        
        switch (dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        if (itemDate < cutoffDate) return false;
      }
      
      // Search filter
      if (search && !thought.content.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort by priority (highest first) and then by timestamp (newest first)
    filteredThoughts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Apply pagination
    const total = filteredThoughts.length;
    const items = filteredThoughts.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    
    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          hasMore,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Failed to get autonomous thoughts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get thoughts',
        data: { items: [], pagination: { page: 1, limit: 20, total: 0, hasMore: false, totalPages: 0 } }
      },
      { status: 500 }
    );
  }
}
