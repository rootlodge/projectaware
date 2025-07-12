'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Bot, RefreshCw, History, Trash2, Heart } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'brain' | 'system' | 'agent' | 'identity_change';
  content: string;
  timestamp: string;
  emotion?: string;
  agent_name?: string;
  agent_role?: string;
  identity_change?: {
    type: 'name' | 'trait' | 'mood' | 'mission';
    old_value: string;
    new_value: string;
    reason: string;
  };
}

interface ConversationHistory {
  id: string;
  title: string;
  timestamp: string;
  messageCount: number;
}

interface BrainInterfaceProps {
  initialConversationData?: {
    aiQuestion: string;
    userResponse: string;
    emotion: string;
    priority: number;
    timestamp: string;
  };
}

const BrainInterface: React.FC<BrainInterfaceProps> = ({ initialConversationData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<{emotion: string, intensity: number, timestamp: string} | null>(null);
  const [systemIdentity, setSystemIdentity] = useState<{name: string} | null>(null);
  const [emotionChangeNotification, setEmotionChangeNotification] = useState<{emotion: string, show: boolean} | null>(null);
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedModel, setSelectedModel] = useState<string>('gemma3:latest');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
    loadCurrentEmotion();
    loadSystemIdentity();
    
    // Poll for emotion updates every 5 seconds
    const emotionInterval = setInterval(loadCurrentEmotion, 5000);
    return () => clearInterval(emotionInterval);
  }, []);

  // Handle initial conversation data from autonomous interactions
  useEffect(() => {
    if (initialConversationData) {
      // Add the AI's question as a system message
      const aiQuestionMessage: Message = {
        id: `ai_question_${Date.now()}`,
        type: 'system',
        content: `🤖 AI Autonomous Question (Priority ${initialConversationData.priority}): ${initialConversationData.aiQuestion}`,
        timestamp: initialConversationData.timestamp,
        emotion: initialConversationData.emotion
      };
      
      // Add the user's response
      const userResponseMessage: Message = {
        id: `user_response_${Date.now()}`,
        type: 'user',
        content: initialConversationData.userResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages([aiQuestionMessage, userResponseMessage]);
      
      // Set the input value for potential continuation
      setInputValue(`Following up on: ${initialConversationData.userResponse}`);
    }
  }, [initialConversationData]);

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

  const loadCurrentEmotion = async () => {
    try {
      const response = await fetch('/api/emotions/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentEmotion({
          emotion: data.emotion,
          intensity: data.intensity,
          timestamp: data.timestamp
        });
      }
    } catch (error) {
      console.error('Failed to load current emotion:', error);
    }
  };

  const loadSystemIdentity = async () => {
    try {
      const response = await fetch('/api/brain');
      if (response.ok) {
        const data = await response.json();
        setSystemIdentity({ name: data.status?.identity?.name || 'Neversleep AI' });
      }
    } catch (error) {
      console.error('Failed to load system identity:', error);
    }
  };

  const showEmotionChangeNotification = (newEmotion: string) => {
    setEmotionChangeNotification({ emotion: newEmotion, show: true });
    setTimeout(() => {
      setEmotionChangeNotification(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };

  // Record user activity for autonomous thinking system (immediate stop)
  const lastActivityRecordRef = useRef<number>(0);
  const recordUserActivity = async (immediate: boolean = true) => {
    const now = Date.now();
    if (!immediate && now - lastActivityRecordRef.current < 2000) return; // Throttle regular calls
    
    lastActivityRecordRef.current = now;
    try {
      if (immediate) {
        // Force immediate stop when user starts typing in brain interface
        await fetch('/api/autonomous/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ immediate: true })
        });
      } else {
        // Regular pause for general activity
        await fetch('/api/autonomous/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pause', reason: 'user_activity_in_brain_interface' })
        });
      }
    } catch (error) {
      console.error('Failed to record user activity:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // Record user activity for autonomous thinking system
    await recordUserActivity(true); // Force immediate stop when sending message

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      // First, process the user input for emotion analysis
      const previousEmotion = currentEmotion?.emotion;
      
      // Analyze user emotion and update AI emotion
      const emotionResponse = await fetch('/api/emotions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userInput: userInput, 
          context: 'brain_interface_chat' 
        })
      });

      let newAiEmotion = null;
      if (emotionResponse.ok) {
        const emotionData = await emotionResponse.json();
        newAiEmotion = emotionData.currentEmotion?.primary;
        
        // Show notification if emotion changed
        if (newAiEmotion && newAiEmotion !== previousEmotion) {
          showEmotionChangeNotification(newAiEmotion);
        }
        
        // Update current emotion state
        setCurrentEmotion({
          emotion: newAiEmotion,
          intensity: emotionData.currentEmotion?.intensity || 0.5,
          timestamp: emotionData.currentEmotion?.timestamp || new Date().toISOString()
        });
      }

      // Log user interaction for goal analysis
      try {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'log_user_interaction',
            content: userInput,
            context: 'brain_interface_chat'
          })
        });
      } catch (error) {
        console.log('Could not log user interaction to goals:', error);
      }

      // Then get the enhanced brain response with full context and memory integration
      const response = await fetch('/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userInput,
          context: 'user_interaction',
          sessionId: currentConversationId || sessionId,
          model: selectedModel // Pass the selected model for personalized responses
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          const messagesToAdd: Message[] = [];
          
          // Add identity change notifications first
          if (data.result.identity_changes && data.result.identity_changes.length > 0) {
            data.result.identity_changes.forEach((change: any) => {
              messagesToAdd.push({
                id: `identity_${Date.now()}_${Math.random()}`,
                type: 'identity_change',
                content: `🔄 Identity Evolution: ${change.type} changed from "${change.old_value}" to "${change.new_value}" - ${change.reason}`,
                timestamp: change.timestamp,
                identity_change: change
              });
            });
          }
          
          // Add agent responses if any
          if (data.result.agent_responses && data.result.agent_responses.length > 0) {
            data.result.agent_responses.forEach((agentResp: any) => {
              messagesToAdd.push({
                id: `agent_${Date.now()}_${Math.random()}`,
                type: 'agent',
                content: agentResp.response,
                timestamp: agentResp.timestamp,
                agent_name: agentResp.agent_name,
                agent_role: agentResp.agent_role
              });
            });
          }
          
          // Add the main brain response
          const brainMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'brain',
            content: data.result.response,
            timestamp: new Date().toISOString(),
            emotion: typeof data.result.emotional_state === 'string' 
              ? data.result.emotional_state 
              : (data.result.emotional_state?.primary || 'neutral')
          };
          
          messagesToAdd.push(brainMessage);
          
          setMessages(prev => [...prev, ...messagesToAdd]);
        } else {
          throw new Error(data.message || 'Failed to get response from brain');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response from brain');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure Ollama is running.`,
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
    // Generate new session ID for new conversation
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
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
      case 'agent':
        return <Bot className="w-4 h-4" />;
      case 'identity_change':
        return <RefreshCw className="w-4 h-4" />;
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
      case 'agent':
        return 'bg-green-500 text-white mr-auto';
      case 'identity_change':
        return 'bg-orange-500 text-white mx-auto';
      default:
        return 'bg-gray-500 text-white mx-auto';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col relative">
      {/* Emotion Change Notification */}
      {emotionChangeNotification?.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 
                        bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg 
                        animate-pulse flex items-center space-x-2">
          <Heart className="w-4 h-4" />
          <span className="text-sm font-medium">
            {systemIdentity?.name || 'AI'} is feeling {emotionChangeNotification.emotion}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            Brain Interface
          </h3>
          
          {/* Current Emotion Display */}
          {currentEmotion && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Heart className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                {currentEmotion.emotion}
              </span>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
        
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
      <div className="flex-1 min-h-0 mb-4">
        <div className="h-full overflow-y-auto space-y-4 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
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
                      {message.type === 'agent' && message.agent_name 
                        ? `${message.agent_name} (${message.agent_role})`
                        : message.type === 'identity_change'
                        ? 'Identity Evolution'
                        : message.type.charAt(0).toUpperCase() + message.type.slice(1)
                      }
                    </span>
                    {message.emotion && (
                      <span className="ml-2 text-xs opacity-75">
                        [{typeof message.emotion === 'string' ? message.emotion : 'mixed emotions'}]
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{message.content}</p>
                  {message.identity_change && (
                    <div className="mt-2 p-2 bg-black bg-opacity-20 rounded text-xs">
                      <div className="font-medium">Change Type: {message.identity_change.type}</div>
                      <div>From: "{message.identity_change.old_value}"</div>
                      <div>To: "{message.identity_change.new_value}"</div>
                      <div className="italic mt-1">{message.identity_change.reason}</div>
                    </div>
                  )}
                  <p className="text-xs opacity-75 mt-1">
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            recordUserActivity(true); // Force immediate stop when user starts typing
          }}
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
