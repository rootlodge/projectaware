import { NextApiRequest, NextApiResponse } from 'next';
import { ThoughtStream } from '../../../lib/core/ThoughtStream';

// Simple in-memory subscription for SSE (Server-Sent Events)
const subscribers: Set<NextApiResponse> = new Set();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial history
    const history = ThoughtStream.getInstance().getHistory();
    res.write(`data: ${JSON.stringify({ type: 'history', data: history })}\n\n`);

    // Subscribe to new thought events
    const onThought = (event: any) => {
      res.write(`data: ${JSON.stringify({ type: 'thought', data: event })}\n\n`);
    };
    ThoughtStream.getInstance().on('thought', onThought);
    subscribers.add(res);

    // Remove on close
    req.on('close', () => {
      ThoughtStream.getInstance().off('thought', onThought);
      subscribers.delete(res);
      res.end();
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
