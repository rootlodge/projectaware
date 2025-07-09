import { NextResponse } from 'next/server';

// Mock conversation data for now
const mockConversations = [
  {
    id: 'conv_1',
    title: 'Initial Setup Discussion',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    messageCount: 12
  },
  {
    id: 'conv_2', 
    title: 'Identity Evolution Chat',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    messageCount: 8
  },
  {
    id: 'conv_3',
    title: 'System Configuration',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    messageCount: 15
  }
];

export async function GET() {
  try {
    // TODO: Replace with actual conversation history from database
    return NextResponse.json(mockConversations);
  } catch (error) {
    console.error('Failed to get conversations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}
