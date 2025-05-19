'use client';
import { useState, useRef } from 'react';

// TypeScript type fixes for browser speech recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export default function Page() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice to text using browser SpeechRecognition
  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      setQuestion(event.results[0][0].transcript);
    };
    recognition.onerror = (event: any) => {
      alert('Speech recognition error: ' + event.error);
    };
    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAnswer('');
    const res = await fetch('http://localhost:3001/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl font-bold mb-6 text-center">neversleep.ai Agent</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="border rounded p-2 w-full min-h-[60px]"
            placeholder="Ask the agent anything..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
              {loading ? 'Thinking...' : 'Ask'}
            </button>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300" onClick={handleVoice}>
              🎤 Voice
            </button>
          </div>
        </form>
        {answer && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <span className="font-semibold">Agent:</span> {answer}
          </div>
        )}
      </div>
    </main>
  );
}
