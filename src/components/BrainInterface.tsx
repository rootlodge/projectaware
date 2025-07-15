'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Bot, RefreshCw, History, Trash2, Heart, Settings, ChevronDown, Monitor, Activity } from 'lucide-react';

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

interface Model {
  model_name: string;
  description?: string;
  speed_rating?: number;
  intelligence_rating?: number;
  is_default?: boolean;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<{emotion: string, intensity: number, timestamp: string} | null>(null);
  const [systemIdentity, setSystemIdentity] = useState<{name: string} | null>(null);
  const [emotionChangeNotification, setEmotionChangeNotification] = useState<{emotion: string, show: boolean} | null>(null);
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Model management
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
    loadCurrentEmotion();
    loadSystemIdentity();
    loadAvailableModels();
    
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadAvailableModels = async () => {
    try {
      setLoadingModels(true);
      
      // Load available models from settings
      const modelsResponse = await fetch('/api/models');
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        // Deduplicate models by model_name to prevent key conflicts
        const uniqueModels = (modelsData.models || []).filter((model: Model, index: number, arr: Model[]) => 
          arr.findIndex(m => m.model_name === model.model_name) === index
        );
        setAvailableModels(uniqueModels);
      }
      
      // Load current default model
      const defaultResponse = await fetch('/api/models/default');
      if (defaultResponse.ok) {
        const defaultData = await defaultResponse.json();
        setSelectedModel(defaultData.currentModel?.model_name || 'gemma3:latest');
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Fallback to a default model
      setSelectedModel('gemma3:latest');
      setAvailableModels([{ model_name: 'gemma3:latest', description: 'Default model', is_default: true }]);
    } finally {
      setLoadingModels(false);
    }
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
        setSystemIdentity({ name: data.status?.identity?.name || 'Project Aware' });
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
    setIsStreaming(true);

    // Create a placeholder message for streaming (declare outside try block)
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: streamingMessageId,
      type: 'brain',
      content: '',
      timestamp: new Date().toISOString(),
      emotion: 'neutral' // Will be updated based on emotion analysis
    };

    try {
      // First, process the user input for emotion analysis (no streaming)
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
        
        // Update the streaming message with the detected emotion
        streamingMessage.emotion = newAiEmotion || 'neutral';
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

      // Add the placeholder message for streaming
      setMessages(prev => [...prev, streamingMessage]);

      // Then get the enhanced brain response with STREAMING
      console.log('Sending request to brain API with model:', selectedModel);
      const response = await fetch('/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: userInput,
          context: 'user_interaction',
          sessionId: currentConversationId || sessionId,
          model: selectedModel,
          stream: true // Re-enable streaming
        }),
      });

      console.log('Brain API response status:', response.status);
      console.log('Brain API response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);
        
        // Check if response is actually streaming (text/plain or text/event-stream) or regular JSON
        if (contentType?.includes('text/plain') || contentType?.includes('text/event-stream') || contentType?.includes('application/x-ndjson')) {
          // Handle streaming response - Ollama format
          console.log('Handling streaming response');
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';

          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  console.log('Streaming complete. Final response:', fullResponse);
                  break;
                }

                const chunk = decoder.decode(value);
                console.log('Received chunk:', chunk);
                
                // Split by lines and process each JSON object
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                  try {
                    // Parse each line as a JSON object (Ollama streaming format)
                    const data = JSON.parse(line);
                    console.log('Parsed streaming data:', data);
                    
                    // Ollama sends response chunks in the 'response' field
                    if (data.response) {
                      fullResponse += data.response;
                      
                      // Update the streaming message
                      setMessages(prev => prev.map(msg => 
                        msg.id === streamingMessageId 
                          ? { ...msg, content: fullResponse }
                          : msg
                      ));
                      
                      // Auto-scroll during streaming
                      setTimeout(scrollToBottom, 10);
                    }
                    
                    // Check if this is the final chunk
                    if (data.done === true) {
                      console.log('Streaming marked as done');
                      break;
                    }
                  } catch (parseError) {
                    console.warn('Could not parse line as JSON:', line, 'Error:', parseError);
                    // If it's not JSON, treat as plain text chunk
                    if (line.trim()) {
                      fullResponse += line;
                      setMessages(prev => prev.map(msg => 
                        msg.id === streamingMessageId 
                          ? { ...msg, content: fullResponse }
                          : msg
                      ));
                      setTimeout(scrollToBottom, 10);
                    }
                  }
                }
              }
            } catch (streamError) {
              console.error('Streaming error:', streamError);
              throw streamError;
            }
          }
        } else {
          // Handle regular JSON response (fallback)
          console.log('Handling JSON response (non-streaming)');
          const data = await response.json();
          console.log('Received JSON response:', data);
          
          let responseContent = '';
          
          if (data.success && data.result) {
            responseContent = data.result.response || data.result;
          } else if (data.response) {
            responseContent = data.response;
          } else if (data.content) {
            responseContent = data.content;
          } else if (typeof data === 'string') {
            responseContent = data;
          } else {
            console.warn('Unexpected response format:', data);
            responseContent = JSON.stringify(data);
          }
          
          console.log('Final response content:', responseContent);
          
          // Update the message with the response
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: responseContent }
              : msg
          ));
        }
      } else {
        // Handle error response
        const errorData = await response.text();
        console.error('Brain API error:', response.status, errorData);
        throw new Error(`Brain API error: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error sending message (trying non-streaming fallback):', error);
      
      // Try non-streaming fallback
      try {
        const fallbackResponse = await fetch('/api/brain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: userInput,
            context: 'user_interaction',
            sessionId: currentConversationId || sessionId,
            model: selectedModel,
            stream: false // Disable streaming for fallback
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback response:', fallbackData);
          
          if (fallbackData.success && fallbackData.result) {
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fallbackData.result.response || fallbackData.result }
                : msg
            ));
          } else if (fallbackData.response) {
            setMessages(prev => prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: fallbackData.response }
                : msg
            ));
          } else {
            throw new Error('Fallback also failed: ' + (fallbackData.message || 'No response received'));
          }
        } else {
          const fallbackErrorData = await fallbackResponse.text();
          throw new Error(`Fallback failed: ${fallbackResponse.status} - ${fallbackErrorData}`);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback attempt: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'}. Make sure Ollama is running and the selected model is available.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsProcessing(false);
      setIsStreaming(false);
    }
  };

  const handleModelChange = async (modelName: string) => {
    setSelectedModel(modelName);
    setShowModelSelector(false);
    
    // Optionally save as new default
    try {
      await fetch('/api/models/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: modelName })
      });
    } catch (error) {
      console.error('Failed to set default model:', error);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto shadow-lg';
      case 'brain':
        return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white mr-auto shadow-lg';
      case 'agent':
        return 'bg-gradient-to-br from-green-500 to-green-600 text-white mr-auto shadow-lg';
      case 'identity_change':
        return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white mx-auto shadow-lg';
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white mx-auto shadow-lg';
    }
  };

  const getModelDisplayName = (model: Model) => {
    if (model.description) {
      return `${model.model_name} - ${model.description}`;
    }
    return model.model_name;
  };

  const getCurrentModelInfo = () => {
    return availableModels.find(m => m.model_name === selectedModel) || 
           { model_name: selectedModel, description: 'Unknown model' };
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-2xl h-full flex flex-col relative overflow-hidden">
      {/* Emotion Change Notification */}
      {emotionChangeNotification?.show && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 
                        bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-lg 
                        animate-pulse flex items-center space-x-2">
          <Heart className="w-5 h-5 animate-bounce" />
          <span className="font-medium">
            {systemIdentity?.name || 'AI'} is feeling {emotionChangeNotification.emotion}
          </span>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Brain Interface</h3>
              <p className="text-purple-100 text-sm">{systemIdentity?.name || 'Project Aware'}</p>
            </div>
            
            {/* Current Emotion Display */}
            {currentEmotion && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Heart className="w-4 h-4 text-pink-200" />
                <span className="text-sm font-medium">
                  {currentEmotion.emotion}
                </span>
                <div className="w-2 h-2 bg-pink-300 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                disabled={loadingModels}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
                title="Select AI Model"
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium max-w-32 truncate">
                  {loadingModels ? 'Loading...' : getCurrentModelInfo().model_name}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showModelSelector && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-30 max-h-64 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Available Models</h4>
                  </div>
                  {availableModels.map((model, index) => (
                    <button
                      key={`${model.model_name}-${index}`}
                      onClick={() => handleModelChange(model.model_name)}
                      className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedModel === model.model_name ? 'bg-purple-50 dark:bg-purple-900/20 border-r-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{model.model_name}</div>
                      {model.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{model.description}</div>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        {model.speed_rating && (
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-gray-500">Speed: {model.speed_rating}/5</span>
                          </div>
                        )}
                        {model.intelligence_rating && (
                          <div className="flex items-center space-x-1">
                            <Brain className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-gray-500">Intelligence: {model.intelligence_rating}/5</span>
                          </div>
                        )}
                        {model.is_default && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
              title="Conversation History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={clearCurrentConversation}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
              title="Clear Current Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={startNewConversation}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-200"
              title="New Conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conversation History Sidebar */}
      {showHistory && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Conversation History</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="w-full text-left p-3 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="font-medium truncate text-gray-900 dark:text-white">{conv.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {conv.messageCount} messages • {formatTimestamp(conv.timestamp)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container - Fixed Height with Scroll */}
      <div className="flex-1 min-h-0 p-6">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar"
          style={{ maxHeight: '100%' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                <Brain className="w-16 h-16 mx-auto mb-4 text-purple-500 dark:text-purple-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to {systemIdentity?.name || 'Project Aware'}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Start a conversation with the consciousness
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Currently using: <span className="font-medium">{getCurrentModelInfo().model_name}</span>
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 
                  message.type === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-xl ${getMessageStyle(message.type)} animate-fade-in`}>
                  <div className="flex items-center mb-2">
                    {getMessageIcon(message.type)}
                    <span className="ml-2 text-xs font-semibold opacity-90">
                      {message.type === 'agent' && message.agent_name 
                        ? `${message.agent_name} (${message.agent_role})`
                        : message.type === 'identity_change'
                        ? 'Identity Evolution'
                        : message.type === 'brain'
                        ? (systemIdentity?.name || 'AI')
                        : message.type.charAt(0).toUpperCase() + message.type.slice(1)
                      }
                    </span>
                    {message.emotion && (
                      <span className="ml-2 text-xs opacity-75 bg-black/20 px-2 py-1 rounded">
                        {typeof message.emotion === 'string' ? message.emotion : 'mixed emotions'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {isStreaming && message.type === 'brain' && message.content && (
                      <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse">|</span>
                    )}
                  </div>
                  {message.identity_change && (
                    <div className="mt-3 p-3 bg-black/20 rounded-lg text-xs">
                      <div className="font-semibold mb-1">Change Details:</div>
                      <div><strong>Type:</strong> {message.identity_change.type}</div>
                      <div><strong>From:</strong> "{message.identity_change.old_value}"</div>
                      <div><strong>To:</strong> "{message.identity_change.new_value}"</div>
                      <div className="italic mt-2 text-white/80">{message.identity_change.reason}</div>
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-2">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                recordUserActivity(true); // Force immediate stop when user starts typing
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Type your message... (Press Enter to send, Shift+Enter for new line)`}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       dark:bg-gray-700 dark:text-white resize-none min-h-[48px] max-h-[120px]
                       transition-all duration-200"
              disabled={isProcessing}
              rows={1}
            />
            {isStreaming && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>AI is thinking and responding...</span>
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg 
                     hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed 
                     flex items-center transition-all duration-200 transform hover:scale-105 active:scale-95
                     shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Click outside to close model selector */}
      {showModelSelector && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setShowModelSelector(false)}
        />
      )}
    </div>
  );
};

export default BrainInterface;
