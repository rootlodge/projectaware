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
    const responded = url.searchParams.get('responded') || 'all';
    const search = url.searchParams.get('search') || '';
    
    const thinkingSystem = await getAutonomousThinkingSystem();
    
    // Get ALL interactions without limit first, then filter and paginate
    const allInteractions = await thinkingSystem.getAllInteractions(50000); // Very large limit to get everything
    
    // Apply filters
    let filteredInteractions = allInteractions.filter(interaction => {
      // Type filter
      if (types.length > 0 && !types.includes(interaction.type)) {
        return false;
      }
      
      // Emotion filter
      if (emotions.length > 0 && !emotions.includes(interaction.emotion_state)) {
        return false;
      }
      
      // Priority filter
      if (priorities.length > 0 && !priorities.includes(interaction.priority)) {
        return false;
      }
      
      // Date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        const itemDate = new Date(interaction.timestamp);
        let cutoffDate = new Date();
        
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
      
      // Responded filter
      if (responded === 'pending' && interaction.responded_to) {
        return false;
      }
      if (responded === 'responded' && !interaction.responded_to) {
        return false;
      }
      
      // Search filter
      if (search && !interaction.content.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Sort by priority (highest first) and then by timestamp (newest first)
    filteredInteractions.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Apply pagination
    const total = filteredInteractions.length;
    const items = filteredInteractions.slice(offset, offset + limit);
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
    console.error('Failed to get autonomous interactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get interactions',
        data: { items: [], pagination: { page: 1, limit: 10, total: 0, hasMore: false, totalPages: 0 } }
      },
      { status: 500 }
    );
  }
}
