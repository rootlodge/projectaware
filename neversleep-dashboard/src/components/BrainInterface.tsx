'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Bot, RefreshCw, History, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'brain' | 'system';
  content: string;
  timestamp: string;
  emotion?: string;
}

interface ConversationHistory {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
}

const BrainInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: currentConversationId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const brainMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'brain',
          content: data.response,
          timestamp: new Date().toISOString(),
          emotion: data.emotion
        };

        setMessages(prev => [...prev, brainMessage]);
        
        if (data.conversationId && !currentConversationId) {
          setCurrentConversationId(data.conversationId);
        }
      } else {
        throw new Error('Failed to get response from brain');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const clearCurrentConversation = () => {
    setMessages([]);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'brain':
        return <Brain className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-500 text-white ml-auto';
      case 'brain':
        return 'bg-purple-500 text-white mr-auto';
      default:
        return 'bg-gray-500 text-white mx-auto';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          Brain Interface
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Conversation History"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={clearCurrentConversation}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Clear Current Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={startNewConversation}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="New Conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation History Sidebar */}
      {showHistory && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h4 className="font-medium mb-2">Conversation History</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="w-full text-left p-2 text-sm bg-white dark:bg-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-500"
              >
                <div className="font-medium truncate">{conv.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {conv.messageCount} messages • {formatTimestamp(conv.timestamp)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with the neversleep.ai brain</p>
            <p className="text-sm mt-2">Type a message below to begin...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 
                message.type === 'system' ? 'justify-center' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyle(message.type)}`}>
                <div className="flex items-center mb-1">
                  {getMessageIcon(message.type)}
                  <span className="ml-2 text-xs font-medium">
                    {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                  </span>
                  {message.emotion && (
                    <span className="ml-2 text-xs opacity-75">
                      [{message.emotion}]
                    </span>
                  )}
                </div>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-75 mt-1">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   dark:bg-gray-700 dark:text-white"
          disabled={isProcessing}
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isProcessing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default BrainInterface;
