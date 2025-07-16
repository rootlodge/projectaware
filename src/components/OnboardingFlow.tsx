import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  canSkip?: boolean;
  isCompleted?: boolean;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  user?: any;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onClose, onComplete, user }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Project Aware',
      description: 'Let\'s get you set up with your personalized AI experience.',
      component: (
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Welcome, {user?.full_name || user?.email}!
          </h3>
          <p className="text-gray-300">
            Project Aware is your advanced AI platform with self-aware capabilities, 
            plugin ecosystem, and powerful analytics. Let's personalize your experience.
          </p>
        </div>
      ),
      canSkip: false
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Configure your basic preferences for the best experience.',
      component: <PreferencesStep />,
      canSkip: true
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Choose how you want to stay informed.',
      component: <NotificationStep />,
      canSkip: true
    },
    {
      id: 'features',
      title: 'Explore Key Features',
      description: 'Learn about the main features available to you.',
      component: <FeaturesStep userRole={user?.role} />,
      canSkip: false
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Your account is ready to use.',
      component: (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Welcome aboard!
          </h3>
          <p className="text-gray-300">
            You're ready to start using Project Aware. You can always change these 
            settings later in your profile.
          </p>
        </div>
      ),
      canSkip: false
    }
  ];

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (steps[currentStep].canSkip) {
      handleNext();
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">{currentStepData.title}</h2>
            <p className="text-sm text-gray-400">{currentStepData.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {currentStepData.component}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-2">
            {currentStepData.canSkip && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const PreferencesStep: React.FC = () => {
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Theme</label>
        <div className="grid grid-cols-3 gap-3">
          {['dark', 'light', 'auto'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-3 rounded-lg border transition-colors ${
                theme === t
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <span className="text-white capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="UTC">UTC</option>
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="Europe/London">London</option>
          <option value="Europe/Paris">Paris</option>
          <option value="Asia/Tokyo">Tokyo</option>
        </select>
      </div>
    </div>
  );
};

const NotificationStep: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  return (
    <div className="space-y-4">
      <p className="text-gray-300 mb-6">
        Choose which notifications you'd like to receive. You can change these anytime.
      </p>

      {[
        { label: 'Email Notifications', value: emailNotifications, onChange: setEmailNotifications, description: 'Important updates and alerts' },
        { label: 'Push Notifications', value: pushNotifications, onChange: setPushNotifications, description: 'Real-time browser notifications' },
        { label: 'Security Alerts', value: securityAlerts, onChange: setSecurityAlerts, description: 'Login attempts and security updates' },
        { label: 'Marketing Emails', value: marketingEmails, onChange: setMarketingEmails, description: 'Product updates and tips' }
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
          <div>
            <h4 className="text-white font-medium">{item.label}</h4>
            <p className="text-sm text-gray-400">{item.description}</p>
          </div>
          <button
            onClick={() => item.onChange(!item.value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              item.value ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                item.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
};

const FeaturesStep: React.FC<{ userRole?: string }> = ({ userRole }) => {
  const features = [
    {
      title: 'AI Chat Interface',
      description: 'Interact with advanced AI models with conversation memory',
      icon: '💬',
      available: true
    },
    {
      title: 'Plugin Ecosystem',
      description: 'Extend functionality with a wide range of plugins',
      icon: '🔌',
      available: true
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track usage and performance metrics',
      icon: '📊',
      available: userRole === 'admin'
    },
    {
      title: 'Model Management',
      description: 'Configure and switch between different AI models',
      icon: '🧠',
      available: true
    },
    {
      title: 'Advanced Settings',
      description: 'Fine-tune your AI experience with detailed controls',
      icon: '⚙️',
      available: userRole === 'admin' || userRole === 'developer'
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-gray-300 mb-6">
        Here are the key features available to you based on your role: <span className="font-medium capitalize text-blue-400">{userRole}</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className={`p-4 rounded-lg border ${
              feature.available
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-gray-600 bg-gray-700/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <h4 className={`font-medium ${feature.available ? 'text-white' : 'text-gray-400'}`}>
                  {feature.title}
                  {feature.available && <span className="ml-2 text-xs text-green-400">✓ Available</span>}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingFlow;
