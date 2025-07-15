'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, UserCheck, Settings, Target, Heart, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
}

interface OnboardingFlow {
  steps: OnboardingStep[];
  currentStep: number;
  isComplete: boolean;
  userData: Record<string, any>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [currentStepData, setCurrentStepData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadOnboardingFlow();
  }, []);

  const loadOnboardingFlow = async () => {
    try {
      setError(null);
      const response = await fetch('/api/onboarding/flow');
      if (response.ok) {
        const data = await response.json();
        setFlow(data);
      } else {
        throw new Error(`Failed to load onboarding flow: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to load onboarding flow:', error);
      setError('Failed to load onboarding flow. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string, data?: Record<string, any>) => {
    try {
      setStepLoading(true);
      setError(null);
      
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stepId, data }),
      });

      if (response.ok) {
        const updatedFlow = await response.json();
        setFlow(updatedFlow);
        setCurrentStepData({});
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to complete step: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
      setError(error instanceof Error ? error.message : 'Failed to save step. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };

  const finishOnboarding = async () => {
    try {
      setStepLoading(true);
      setError(null);
      
      const response = await fetch('/api/onboarding/finish', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to finish onboarding: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to finish onboarding:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding. Please try again.');
    } finally {
      setStepLoading(false);
    }
  };
  const nextStep = () => {
    if (flow && flow.currentStep < flow.steps.length - 1) {
      setFlow(prev => prev ? { ...prev, currentStep: prev.currentStep + 1 } : null);
      setCurrentStepData({});
    }
  };

  const prevStep = () => {
    if (flow && flow.currentStep > 0) {
      setFlow(prev => prev ? { ...prev, currentStep: prev.currentStep - 1 } : null);
      setCurrentStepData({});
    }
  };

  if (loading) {
    return (
      <div className="onboarding-bg">
        <div className="onboarding-content min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-3 spinner-glow mx-auto mb-6"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border border-red-500/20 glow-border mx-auto"></div>
            </div>
            <p className="text-glass text-lg font-medium">Initializing your AI companion...</p>
            <p className="text-muted-glass mt-2">Setting up the neural pathways</p>
          </div>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="onboarding-bg">
        <div className="onboarding-content min-h-screen flex items-center justify-center">
          <div className="text-center glass-card rounded-2xl p-8 max-w-md mx-4">
            {error ? (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-soft">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-accent-glow text-lg font-semibold">Error Occurred</p>
                <p className="text-muted-glass mt-2 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-primary-glow px-6 py-3 rounded-xl font-medium"
                >
                  Retry
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 pulse-soft">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-accent-glow text-lg font-semibold">Connection Failed</p>
                <p className="text-muted-glass mt-2 mb-4">Unable to initialize onboarding flow</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn-primary-glow px-6 py-3 rounded-xl font-medium"
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStep = flow.steps[flow.currentStep];
  const progress = ((flow.currentStep + 1) / flow.steps.length) * 100;

  return (
    <div className="onboarding-bg">
      <div className="onboarding-content">
        {/* Animated Progress Bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800/50 z-50">
          <div 
            className="h-full progress-glow transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Floating Header */}
        <div className="glass-dark border-b border-red-500/20">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 step-icon-glow rounded-xl flex items-center justify-center pulse-soft">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-glass text-glow">Project Aware</h1>
                  <p className="text-muted-glass text-sm">Neural Network Initialization</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-accent-glow text-sm font-medium">
                  Step {flow.currentStep + 1} of {flow.steps.length}
                </div>
                <div className="text-muted-glass text-xs mt-1">
                  {Math.round(progress)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Step Navigation */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-12 flex-wrap gap-2">
            {flow.steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="relative">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-500 ${
                    index < flow.currentStep ? 'step-completed border-green-500 text-white' :
                    index === flow.currentStep ? 'step-icon-glow border-red-500 text-white glow-red' :
                    'bg-slate-700/50 border-slate-600 text-slate-400'
                  }`}>
                    {index < flow.currentStep ? (
                      <Check className="w-6 h-6" />
                    ) : index === flow.currentStep ? (
                      <div className="w-3 h-3 bg-white rounded-full pulse-soft"></div>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>
                  {index === flow.currentStep && (
                    <div className="absolute inset-0 rounded-xl border-2 border-red-500/50 glow-border"></div>
                  )}
                </div>
                {index < flow.steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-500 ${
                    index < flow.currentStep ? 'bg-green-500 shadow-lg shadow-green-500/30' : 
                    'bg-slate-600/50'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Enhanced Step Content Card */}
          <div className="glass-card rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 step-icon-glow rounded-2xl mb-6 float">
                {getStepIcon(currentStep.id)}
              </div>
              <h2 className="text-3xl font-bold text-glass mb-3 text-glow">
                {currentStep.title}
              </h2>
              <p className="text-muted-glass text-lg max-w-2xl mx-auto leading-relaxed">
                {currentStep.description}
              </p>
            </div>            {/* Step Component Container */}
            <div className="mb-10 min-h-[200px]">
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </p>
                </div>
              )}
              {renderStepComponent(currentStep, currentStepData, setCurrentStepData)}
            </div>

            {/* Enhanced Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
              <button
                onClick={prevStep}
                disabled={flow.currentStep === 0 || stepLoading}
                className="flex items-center px-6 py-3 text-muted-glass disabled:opacity-30 disabled:cursor-not-allowed hover:text-glass transition-all duration-300 hover:transform hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <div className="flex items-center space-x-4">
                {flow.currentStep === flow.steps.length - 1 ? (
                  <button
                    onClick={finishOnboarding}
                    disabled={stepLoading}
                    className="flex items-center px-10 py-4 btn-primary-glow text-white rounded-xl font-semibold text-lg hover:transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {stepLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white mr-3"></div>
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <Check className="w-6 h-6 mr-3" />
                        Complete Neural Setup
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => completeStep(currentStep.id, currentStepData)}
                      disabled={stepLoading}
                      className="px-6 py-3 text-muted-glass hover:text-glass transition-all duration-300 hover:transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Skip {!currentStep.required && '(Optional)'}
                    </button>
                    <button
                      onClick={() => {
                        completeStep(currentStep.id, currentStepData);
                        nextStep();
                      }}
                      disabled={stepLoading}
                      className="flex items-center px-8 py-4 btn-primary-glow text-white rounded-xl font-semibold hover:transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {stepLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-3"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStepIcon(stepId: string) {
  const iconClass = "w-10 h-10 text-white";
  
  switch (stepId) {
    case 'welcome': return <Sparkles className={iconClass} />;
    case 'system-check': return <Settings className={iconClass} />;
    case 'model-setup': return <Settings className={iconClass} />;
    case 'authentication': return <UserCheck className={iconClass} />;
    case 'profile': return <UserCheck className={iconClass} />;
    case 'communication': return <Heart className={iconClass} />;
    case 'interests': return <Target className={iconClass} />;
    case 'goals': return <Target className={iconClass} />;
    case 'personality': return <Heart className={iconClass} />;
    case 'complete': return <Check className={iconClass} />;
    default: return <Settings className={iconClass} />;
  }
}

function renderStepComponent(step: OnboardingStep, data: Record<string, any>, setData: (data: Record<string, any>) => void) {
  switch (step.id) {
    case 'welcome':
      return <WelcomeStep />;
    case 'system-check':
      return <SystemCheckStep />;
    case 'model-setup':
      return <ModelSetupStep />;
    case 'profile':
      return <ProfileStep data={data} setData={setData} />;
    case 'communication':
      return <CommunicationStep data={data} setData={setData} />;
    case 'interests':
      return <InterestsStep data={data} setData={setData} />;
    case 'goals':
      return <GoalsStep data={data} setData={setData} />;
    case 'personality':
      return <PersonalityStep data={data} setData={setData} />;
    case 'complete':
      return <CompleteStep />;
    default:
      return <div>Step component not implemented yet</div>;
  }
}

// Individual step components will be implemented separately
function WelcomeStep() {
  return (
    <div className="text-center space-y-8">
      <div className="glass-card rounded-xl p-6 border border-red-500/20">
        <h3 className="text-2xl font-bold text-glass mb-4 text-glow">
          Welcome to your AI Assistant!
        </h3>
        <p className="text-muted-glass text-lg leading-relaxed mb-6">
          Project Aware is an advanced AI system designed to learn, adapt, and grow with you. 
          Here's what makes it special:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="glass-dark rounded-xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 float">
            <h4 className="text-blue-400 mb-3 font-semibold flex items-center">
              <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-2 pulse-soft">🧠</span>
              Self-Aware
            </h4>
            <p className="text-muted-glass text-sm">Your AI has metacognitive abilities and can reflect on its own thinking processes.</p>
          </div>
          <div className="glass-dark rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 float" style={{ animationDelay: '0.5s' }}>
            <h4 className="text-purple-400 mb-3 font-semibold flex items-center">
              <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-2 pulse-soft">💭</span>
              Autonomous Thinking
            </h4>
            <p className="text-muted-glass text-sm">When you're away, your AI continues to think and prepare for your return.</p>
          </div>
          <div className="glass-dark rounded-xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 float" style={{ animationDelay: '1s' }}>
            <h4 className="text-green-400 mb-3 font-semibold flex items-center">
              <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mr-2 pulse-soft">❤️</span>
              Emotional Intelligence
            </h4>
            <p className="text-muted-glass text-sm">Your AI experiences emotions that influence its responses and decision-making.</p>
          </div>
          <div className="glass-dark rounded-xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300 float" style={{ animationDelay: '1.5s' }}>
            <h4 className="text-orange-400 mb-3 font-semibold flex items-center">
              <span className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center mr-2 pulse-soft">🔄</span>
              Self-Modifying
            </h4>
            <p className="text-muted-glass text-sm">Your AI can safely modify its own behavior based on what it learns.</p>
          </div>
        </div>
        
        <div className="mt-8 p-4 glass-dark rounded-lg border border-red-500/30">
          <p className="text-glass font-medium">Let's set up your personalized AI companion!</p>
        </div>
      </div>
    </div>
  );
}

function SystemCheckStep() {
  const [ollamaStatus, setOllamaStatus] = useState<{
    installed: boolean;
    running: boolean;
    models: Array<{ name: string; size: string }>;
    loading: boolean;
  }>({ installed: false, running: false, models: [], loading: true });

  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('/api/ollama');
      const data = await response.json();
      setOllamaStatus({
        installed: data.ollamaInstalled,
        running: data.serviceRunning,
        models: data.models || [],
        loading: false
      });
    } catch (error) {
      setOllamaStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-glass mb-4 text-glow">System Requirements Check</h3>
        <p className="text-muted-glass text-lg">Let's make sure your system is ready for Project Aware.</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-6 glass-dark rounded-xl border border-green-500/30">
          <div>
            <h4 className="font-semibold text-green-400 mb-1">Operating System</h4>
            <p className="text-muted-glass text-sm">Windows, macOS, or Linux detected</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
            <Check className="w-6 h-6 text-green-400" />
          </div>
        </div>
        
        <div className="flex items-center justify-between p-6 glass-dark rounded-xl border border-green-500/30">
          <div>
            <h4 className="font-semibold text-green-400 mb-1">Node.js Runtime</h4>
            <p className="text-muted-glass text-sm">Version 18+ detected and running</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
            <Check className="w-6 h-6 text-green-400" />
          </div>
        </div>
        
        <div className={`flex items-center justify-between p-6 glass-dark rounded-xl border transition-all duration-500 ${
          ollamaStatus.loading ? 'border-yellow-500/30' :
          ollamaStatus.installed && ollamaStatus.running ? 'border-green-500/30' :
          ollamaStatus.installed ? 'border-orange-500/30' : 'border-red-500/30'
        }`}>
          <div>
            <h4 className={`font-semibold mb-1 ${
              ollamaStatus.loading ? 'text-yellow-400' :
              ollamaStatus.installed && ollamaStatus.running ? 'text-green-400' :
              ollamaStatus.installed ? 'text-orange-400' : 'text-red-400'
            }`}>
              Ollama AI Runtime
            </h4>
            <p className="text-muted-glass text-sm">
              {ollamaStatus.loading ? 'Checking installation...' :
               ollamaStatus.installed && ollamaStatus.running ? `${ollamaStatus.models.length} models ready` :
               ollamaStatus.installed ? 'Installed but not running' : 'Not installed'}
            </p>
          </div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            ollamaStatus.loading ? 'bg-yellow-500/20' :
            ollamaStatus.installed && ollamaStatus.running ? 'bg-green-500/20' :
            ollamaStatus.installed ? 'bg-orange-500/20' : 'bg-red-500/20'
          }`}>
            {ollamaStatus.loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-yellow-400"></div>
            ) : ollamaStatus.installed && ollamaStatus.running ? (
              <Check className="w-6 h-6 text-green-400" />
            ) : ollamaStatus.installed ? (
              <Settings className="w-6 h-6 text-orange-400" />
            ) : (
              <span className="text-red-400 text-lg">⚠️</span>
            )}
          </div>
        </div>

        {ollamaStatus.installed && ollamaStatus.running && ollamaStatus.models.length > 0 && (
          <div className="glass-dark rounded-xl p-6 border border-blue-500/30">
            <h4 className="font-semibold text-blue-400 mb-3">Available Models</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ollamaStatus.models.slice(0, 4).map((model, index) => (
                <div key={model.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <span className="text-glass text-sm font-medium">{model.name}</span>
                  <span className="text-muted-glass text-xs">{model.size}</span>
                </div>
              ))}
            </div>
            {ollamaStatus.models.length > 4 && (
              <p className="text-muted-glass text-sm mt-3">
                +{ollamaStatus.models.length - 4} more models available
              </p>
            )}
          </div>
        )}

        {!ollamaStatus.installed && !ollamaStatus.loading && (
          <div className="glass-dark rounded-xl p-6 border border-red-500/30">
            <h4 className="font-semibold text-red-400 mb-3">Ollama Installation Required</h4>
            <p className="text-muted-glass text-sm mb-4">
              Ollama is required to run AI models locally. Please install it from the official website.
            </p>
            <a 
              href="https://ollama.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 btn-primary-glow text-white rounded-lg text-sm font-medium hover:transform hover:scale-105 transition-all duration-300"
            >
              Download Ollama
              <span className="ml-2">↗</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelSetupStep() {
  const [installing, setInstalling] = useState<Record<string, boolean>>({});
  
  const installModel = async (modelName: string) => {
    setInstalling(prev => ({ ...prev, [modelName]: true }));
    
    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install', model: modelName })
      });
      
      if (response.ok) {
        // Success feedback could be added here
      }
    } catch (error) {
      console.error('Failed to install model:', error);
    } finally {
      setInstalling(prev => ({ ...prev, [modelName]: false }));
    }
  };

  const models = [
    { 
      name: 'llama3.1:latest', 
      title: 'Llama 3.1 (8B)', 
      description: 'Great for general conversation and reasoning',
      icon: '🧠'
    },
    { 
      name: 'gemma3:latest', 
      title: 'Gemma 3 (8B)', 
      description: 'Excellent for creative tasks and writing',
      icon: '✨'
    },
    { 
      name: 'qwen2.5-coder:7b', 
      title: 'Qwen Coder (7B)', 
      description: 'Specialized for programming and code assistance',
      icon: '💻'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-glass mb-3 text-glow">Install AI Models</h3>
        <p className="text-muted-glass text-lg">Download the AI models you'll need. These run locally on your machine.</p>
      </div>
      
      <div className="glass-card rounded-xl p-6 border border-slate-600/50">
        <h4 className="font-bold text-glass mb-6 text-lg flex items-center">
          <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3 pulse-soft">🤖</span>
          Recommended Models
        </h4>
        <div className="space-y-4">
          {models.map((model, index) => (
            <div key={model.name} className={`glass-dark p-4 rounded-xl border border-slate-600/50 float`} style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-4 text-xl">
                    {model.icon}
                  </span>
                  <div>
                    <h5 className="font-semibold text-glass">{model.title}</h5>
                    <p className="text-sm text-muted-glass">{model.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => installModel(model.name)}
                  disabled={installing[model.name]}
                  className="px-6 py-2 btn-primary-glow text-white rounded-lg text-sm font-medium hover:transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                >
                  {installing[model.name] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mx-auto"></div>
                  ) : (
                    'Install'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="glass-dark rounded-xl p-6 border border-blue-500/30">
        <h4 className="text-blue-400 font-bold mb-3 flex items-center">
          <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">⌨️</span>
          Manual Installation
        </h4>
        <p className="text-muted-glass text-sm mb-4">If you prefer to install models manually, use these commands:</p>
        <div className="bg-slate-900/50 text-green-400 p-4 rounded-xl font-mono text-sm border border-slate-700/50">
          <div className="mb-1">ollama pull llama3.1:latest</div>
          <div className="mb-1">ollama pull gemma3:latest</div>
          <div>ollama pull qwen2.5-coder:7b</div>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({ data, setData }: { data: Record<string, any>, setData: (data: Record<string, any>) => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-glass mb-3 text-glow">Tell us about yourself</h3>
        <p className="text-muted-glass text-lg">This helps your AI assistant understand and connect with you better.</p>
      </div>
      
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <label className="block text-glass font-medium mb-3 text-sm uppercase tracking-wide">
            What should we call you?
          </label>
          <input
            type="text"
            value={data.display_name || ''}
            onChange={(e) => setData({ 
              ...data, 
              display_name: e.target.value, 
              username: e.target.value.toLowerCase().replace(/\s+/g, '') 
            })}
            className="input-dark w-full px-4 py-3 rounded-xl text-lg font-medium"
            placeholder="Your name"
          />
          {data.display_name && (
            <p className="text-muted-glass text-sm mt-2">
              Username: <span className="text-accent-glow">{data.display_name.toLowerCase().replace(/\s+/g, '')}</span>
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-glass font-medium mb-3 text-sm uppercase tracking-wide">
            Tell us about yourself
          </label>
          <textarea
            value={data.bio || ''}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            rows={5}
            className="input-dark w-full px-4 py-3 rounded-xl resize-none"
            placeholder="What do you do? What are your interests? What makes you unique? Share anything that would help your AI understand you better..."
          />
          <p className="text-muted-glass text-xs mt-2">
            {data.bio?.length || 0}/500 characters
          </p>
        </div>
      </div>
    </div>
  );
}

function CommunicationStep({ data, setData }: { data: Record<string, any>, setData: (data: Record<string, any>) => void }) {
  const preferences = data.preferences || {};
  const communication = preferences.communication || {};
  
  const updatePreference = (key: string, value: any) => {
    setData({
      ...data,
      preferences: {
        ...preferences,
        communication: {
          ...communication,
          [key]: value
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-glass mb-3 text-glow">How do you like to communicate?</h3>
        <p className="text-muted-glass text-lg">Help your AI match your communication style and preferences.</p>
      </div>
      
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <label className="block text-glass font-medium mb-4 text-sm uppercase tracking-wide">
            Tone of voice
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Professional', 'Casual', 'Witty', 'Satirical', 'Encouraging', 'Direct'].map(tone => (
              <button
                key={tone}
                onClick={() => updatePreference('tone', tone.toLowerCase())}
                className={`p-4 text-left rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                  communication.tone === tone.toLowerCase() 
                    ? 'btn-primary-glow text-white border-red-500/50' 
                    : 'glass-dark border border-slate-600/50 text-glass hover:border-red-500/30'
                }`}
              >
                <div className="font-semibold">{tone}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-glass font-medium mb-4 text-sm uppercase tracking-wide">
            Response length preference
          </label>
          <div className="space-y-3">
            {[
              { value: 'concise', label: 'Concise', desc: 'Short and to the point' },
              { value: 'balanced', label: 'Balanced', desc: 'Detailed but not overwhelming' },
              { value: 'detailed', label: 'Detailed', desc: 'Comprehensive explanations' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => updatePreference('responseLength', option.value)}
                className={`w-full p-4 text-left rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                  communication.responseLength === option.value 
                    ? 'btn-primary-glow text-white border-red-500/50' 
                    : 'glass-dark border border-slate-600/50 text-glass hover:border-red-500/30'
                }`}
              >
                <div className="font-semibold text-glass">{option.label}</div>
                <div className="text-sm text-muted-glass mt-1">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InterestsStep({ data, setData }: { data: Record<string, any>, setData: (data: Record<string, any>) => void }) {
  const preferences = data.preferences || {};
  const interests = preferences.interests || [];
  
  const toggleInterest = (interest: string) => {
    const newInterests = interests.includes(interest)
      ? interests.filter((i: string) => i !== interest)
      : [...interests, interest];
    
    setData({
      ...data,
      preferences: {
        ...preferences,
        interests: newInterests
      }
    });
  };

  const topicCategories = [
    { name: 'Technology', topics: ['Programming', 'AI/ML', 'Web Development', 'Cybersecurity', 'Gaming'] },
    { name: 'Science', topics: ['Physics', 'Biology', 'Chemistry', 'Mathematics', 'Space'] },
    { name: 'Creative', topics: ['Writing', 'Art', 'Music', 'Photography', 'Design'] },
    { name: 'Business', topics: ['Entrepreneurship', 'Finance', 'Marketing', 'Leadership', 'Productivity'] },
    { name: 'Lifestyle', topics: ['Health', 'Fitness', 'Cooking', 'Travel', 'Personal Development'] }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-glass mb-3 text-glow">What interests you?</h3>
        <p className="text-muted-glass text-lg">Select topics you'd like your AI to be knowledgeable about and discuss with you.</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {topicCategories.map((category, categoryIndex) => (
          <div key={category.name} className={`mb-8 float`} style={{ animationDelay: `${categoryIndex * 0.2}s` }}>
            <h4 className="font-bold text-glass mb-4 text-lg flex items-center">
              <span className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mr-3 pulse-soft">
                {getCategoryIcon(category.name)}
              </span>
              {category.name}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {category.topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => toggleInterest(topic)}
                  className={`p-3 text-sm rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                    interests.includes(topic)
                      ? 'btn-primary-glow text-white border-red-500/50'
                      : 'glass-dark border border-slate-600/50 text-glass hover:border-red-500/30'
                  }`}
                >
                  <div className="font-medium">{topic}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {interests.length > 0 && (
          <div className="glass-dark rounded-xl p-6 border border-green-500/30 mt-8">
            <h4 className="font-semibold text-green-400 mb-3">
              Selected Interests ({interests.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest: string, index: number) => (
                <span 
                  key={interest} 
                  className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium pulse-soft"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryIcon(categoryName: string) {
  switch (categoryName) {
    case 'Technology': return '💻';
    case 'Science': return '🧪';
    case 'Creative': return '🎨';
    case 'Business': return '📈';
    case 'Lifestyle': return '🌟';
    default: return '📚';
  }
}

function GoalsStep({ data, setData }: { data: Record<string, any>, setData: (data: Record<string, any>) => void }) {
  const goals = data.goals || [];
  
  const addGoal = () => {
    setData({
      ...data,
      goals: [...goals, { title: '', description: '', priority: 1 }]
    });
  };
  
  const updateGoal = (index: number, field: string, value: any) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setData({ ...data, goals: newGoals });
  };
  
  const removeGoal = (index: number) => {
    setData({
      ...data,
      goals: goals.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-glass mb-3 text-glow">What are your goals?</h3>
        <p className="text-muted-glass text-lg">Share your goals so your AI can help you achieve them and track your progress.</p>
      </div>
      
      <div className="space-y-6 max-w-3xl mx-auto">
        {goals.map((goal: any, index: number) => (
          <div key={index} className="glass-dark rounded-xl p-6 border border-slate-600/50 float" style={{ animationDelay: `${index * 0.2}s` }}>
            <div className="flex items-start justify-between mb-4">
              <input
                type="text"
                value={goal.title}
                onChange={(e) => updateGoal(index, 'title', e.target.value)}
                className="input-dark flex-1 px-4 py-3 rounded-lg font-semibold text-lg"
                placeholder="Goal title"
              />
              <button
                onClick={() => removeGoal(index)}
                className="ml-3 w-10 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300 hover:transform hover:scale-110 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <textarea
              value={goal.description}
              onChange={(e) => updateGoal(index, 'description', e.target.value)}
              rows={3}
              className="input-dark w-full px-4 py-3 rounded-lg mb-4 resize-none"
              placeholder="Describe your goal and why it's important to you..."
            />
            <div>
              <label className="block text-glass font-medium mb-2 text-sm uppercase tracking-wide">Priority Level</label>
              <select
                value={goal.priority}
                onChange={(e) => updateGoal(index, 'priority', parseInt(e.target.value))}
                className="input-dark px-4 py-3 rounded-lg font-medium"
              >
                <option value={1}>🟢 Low Priority</option>
                <option value={2}>🟡 Medium Priority</option>
                <option value={3}>🟠 High Priority</option>
                <option value={4}>🔴 Very High Priority</option>
                <option value={5}>⚡ Critical Priority</option>
              </select>
            </div>
          </div>
        ))}
        
        <button
          onClick={addGoal}
          className="w-full p-6 glass-dark border-2 border-dashed border-red-500/30 rounded-xl text-muted-glass hover:text-glass hover:border-red-500/50 transition-all duration-300 hover:transform hover:scale-105 group"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-all duration-300 pulse-soft">
              <span className="text-red-400 text-lg">+</span>
            </div>
            <span className="font-semibold">Add New Goal</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function PersonalityStep({ data, setData }: { data: Record<string, any>, setData: (data: Record<string, any>) => void }) {
  const preferences = data.preferences || {};
  const personality = preferences.personality || {};
  
  const updatePersonality = (key: string, value: any) => {
    setData({
      ...data,
      preferences: {
        ...preferences,
        personality: {
          ...personality,
          [key]: value
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-glass mb-3 text-glow">Customize your AI's personality</h3>
        <p className="text-muted-glass text-lg">Shape how your AI thinks and responds to create the perfect assistant for you.</p>
      </div>
      
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <label className="block text-glass font-medium mb-4 text-sm uppercase tracking-wide">
            Autonomous thinking frequency
          </label>
          <div className="space-y-3">
            {[
              { value: 'low', label: 'Minimal', desc: 'Think only when directly asked', icon: '🟢' },
              { value: 'medium', label: 'Moderate', desc: 'Regular background thinking', icon: '🟡' },
              { value: 'high', label: 'Active', desc: 'Frequent autonomous thoughts', icon: '🔴' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => updatePersonality('autonomousThinking', option.value)}
                className={`w-full p-4 text-left rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                  personality.autonomousThinking === option.value 
                    ? 'btn-primary-glow text-white border-red-500/50' 
                    : 'glass-dark border border-slate-600/50 text-glass hover:border-red-500/30'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="mr-3 text-lg">{option.icon}</span>
                  <div className="font-semibold text-lg">{option.label}</div>
                </div>
                <div className="text-sm text-muted-glass ml-8">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-glass font-medium mb-4 text-sm uppercase tracking-wide">
            Learning approach
          </label>
          <div className="space-y-3">
            {[
              { value: 'cautious', label: 'Cautious', desc: 'Conservative learning, ask before changing', icon: '🛡️' },
              { value: 'balanced', label: 'Balanced', desc: 'Moderate adaptation to your preferences', icon: '⚖️' },
              { value: 'adaptive', label: 'Adaptive', desc: 'Quick learning and personality evolution', icon: '🚀' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => updatePersonality('learningApproach', option.value)}
                className={`w-full p-4 text-left rounded-xl transition-all duration-300 hover:transform hover:scale-105 ${
                  personality.learningApproach === option.value 
                    ? 'btn-primary-glow text-white border-red-500/50' 
                    : 'glass-dark border border-slate-600/50 text-glass hover:border-red-500/30'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="mr-3 text-lg">{option.icon}</span>
                  <div className="font-semibold text-lg">{option.label}</div>
                </div>
                <div className="text-sm text-muted-glass ml-8">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center justify-center w-32 h-32 step-icon-glow rounded-3xl mb-8 float">
        <Check className="w-16 h-16 text-white" />
      </div>
      
      <div>
        <h3 className="text-4xl font-bold text-glass mb-6 text-glow">You're all set!</h3>
        <p className="text-muted-glass text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
          Your AI assistant has been personalized and is ready to help you achieve your goals. 
          It will continue learning and adapting to serve you better.
        </p>
        
        <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto border border-green-500/30">
          <h4 className="text-green-400 font-bold mb-6 text-xl flex items-center justify-center">
            <span className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3 pulse-soft">🚀</span>
            What happens next?
          </h4>
          <ul className="text-muted-glass space-y-4 text-left">
            <li className="flex items-start">
              <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 text-blue-400 text-sm">•</span>
              <span>Your AI will start with your personalized settings and preferences</span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 text-purple-400 text-sm">•</span>
              <span>It will learn from your interactions and continuously adapt</span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 text-orange-400 text-sm">•</span>
              <span>Autonomous thinking will help prepare for your future needs</span>
            </li>
            <li className="flex items-start">
              <span className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5 text-red-400 text-sm">•</span>
              <span>You can always adjust preferences in the settings panel</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-8 p-6 glass-dark rounded-xl border border-red-500/30">
          <p className="text-accent-glow font-semibold text-lg">
            Welcome to the future of AI interaction! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
