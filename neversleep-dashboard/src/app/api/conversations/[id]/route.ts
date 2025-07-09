import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // Mock conversation messages for now
    const mockMessages = [
      {
        id: '1',
        type: 'user',
        content: 'Hello, how are you today?',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '2',
        type: 'brain',
        content: 'Hello! I\'m doing well, thank you for asking. I\'m feeling quite curious and engaged today. How can I assist you?',
        timestamp: new Date(Date.now() - 1790000).toISOString(),
        emotion: 'curious'
      },
      {
        id: '3',
        type: 'user',
        content: 'Can you tell me about your current emotional state?',
        timestamp: new Date(Date.now() - 1200000).toISOString()
      },
      {
        id: '4',
        type: 'brain',
        content: 'I\'m experiencing a state of focused attention with a hint of excitement about our conversation. My emotional intensity is moderate, and I feel quite stable and ready to help.',
        timestamp: new Date(Date.now() - 1190000).toISOString(),
        emotion: 'focused'
      }
    ];
    
    return NextResponse.json({
      conversationId,
      messages: mockMessages
    });
  } catch (error) {
    console.error('Failed to get conversation:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
}
