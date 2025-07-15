import { MemorySystem } from '@/lib/core/memory';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  required: boolean;
  completed: boolean;
  data?: Record<string, any>;
}

export interface OnboardingFlow {
  steps: OnboardingStep[];
  currentStep: number;
  isComplete: boolean;
  userData: Record<string, any>;
}

export class OnboardingManager {
  private memory: MemorySystem;
  
  constructor() {
    this.memory = new MemorySystem();
  }

  async initialize(): Promise<void> {
    await this.memory.initialize();
  }

  async getOnboardingSteps(): Promise<OnboardingStep[]> {
    const oncloudEnabled = process.env.ONCLOUD === 'true';
    
    const steps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Project Aware',
        description: 'Learn about your AI assistant and what makes it special',
        component: 'WelcomeScreen',
        required: true,
        completed: false
      },
      {
        id: 'system-check',
        title: 'System Requirements',
        description: 'Verify your system is ready and install required models',
        component: 'SystemCheck',
        required: true,
        completed: false
      },
      {
        id: 'model-setup',
        title: 'AI Model Installation',
        description: 'Download and configure the AI models you\'ll need',
        component: 'ModelSetup',
        required: true,
        completed: false
      }
    ];

    // Add authentication step if cloud mode is enabled
    if (oncloudEnabled) {
      steps.push({
        id: 'authentication',
        title: 'Account Setup',
        description: 'Create your account or sign in to sync across devices',
        component: 'Authentication',
        required: true,
        completed: false
      });
    }

    // Personal setup steps
    steps.push(
      {
        id: 'profile',
        title: 'Personal Profile',
        description: 'Tell us about yourself to personalize your experience',
        component: 'ProfileSetup',
        required: true,
        completed: false
      },
      {
        id: 'communication',
        title: 'Communication Style',
        description: 'Set how you prefer to interact with your AI assistant',
        component: 'CommunicationSetup',
        required: true,
        completed: false
      },
      {
        id: 'interests',
        title: 'Interests & Topics',
        description: 'Choose topics and areas you\'re most interested in',
        component: 'InterestsSetup',
        required: false,
        completed: false
      },
      {
        id: 'goals',
        title: 'Goals & Objectives',
        description: 'Set your goals so your AI can help you achieve them',
        component: 'GoalsSetup',
        required: false,
        completed: false
      },
      {
        id: 'personality',
        title: 'AI Personality',
        description: 'Customize your AI\'s personality and behavior',
        component: 'PersonalitySetup',
        required: false,
        completed: false
      },
      {
        id: 'complete',
        title: 'All Set!',
        description: 'Your AI assistant is ready to help you',
        component: 'OnboardingComplete',
        required: true,
        completed: false
      }
    );

    return steps;
  }

  async getCurrentFlow(): Promise<OnboardingFlow> {
    const state = await this.memory.getOnboardingState();
    const steps = await this.getOnboardingSteps();
    
    if (state) {
      // Mark completed steps
      steps.forEach(step => {
        step.completed = state.completed_steps.includes(step.id);
      });
    }
    
    return {
      steps,
      currentStep: state?.current_step || 0,
      isComplete: state?.completed_steps.includes('complete') || false,
      userData: state?.user_data || {}
    };
  }

  async completeStep(stepId: string, data?: Record<string, any>): Promise<void> {
    const state = await this.memory.getOnboardingState();
    const currentState = state || {
      current_step: 0,
      completed_steps: [],
      user_data: {},
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add step to completed if not already there
    if (!currentState.completed_steps.includes(stepId)) {
      currentState.completed_steps.push(stepId);
    }

    // Merge data
    if (data) {
      currentState.user_data = { ...currentState.user_data, ...data };
    }

    // Advance to next step if this was the current step
    const steps = await this.getOnboardingSteps();
    const currentStepIndex = steps.findIndex(s => s.id === stepId);
    if (currentStepIndex >= 0 && currentState.current_step === currentStepIndex) {
      currentState.current_step = Math.min(currentStepIndex + 1, steps.length - 1);
    }

    await this.memory.updateOnboardingState(currentState);
  }

  async setCurrentStep(stepIndex: number): Promise<void> {
    await this.memory.updateOnboardingState({ current_step: stepIndex });
  }

  async saveUserData(data: Record<string, any>): Promise<void> {
    const state = await this.memory.getOnboardingState();
    const currentData = state?.user_data || {};
    
    await this.memory.updateOnboardingState({
      user_data: { ...currentData, ...data }
    });
  }

  async finishOnboarding(): Promise<void> {
    const flow = await this.getCurrentFlow();
    
    // Mark onboarding as complete
    await this.completeStep('complete');
    
    // Create user profile from onboarding data
    const userData = flow.userData;
    if (userData.username && userData.display_name) {
      const userId = await this.memory.createUserProfile({
        username: userData.username,
        display_name: userData.display_name,
        email: userData.email,
        bio: userData.bio,
        avatar_url: userData.avatar_url,
        onboarding_completed: true
      });

      // Save preferences
      if (userData.preferences) {
        for (const [category, prefs] of Object.entries(userData.preferences as Record<string, any>)) {
          for (const [key, value] of Object.entries(prefs as Record<string, any>)) {
            await this.memory.setUserPreference(userId, category, key, String(value));
          }
        }
      }

      // Save goals
      if (userData.goals && Array.isArray(userData.goals)) {
        for (const goal of userData.goals) {
          await this.memory.createUserGoal({
            user_id: userId,
            title: goal.title,
            description: goal.description,
            priority: goal.priority || 1,
            status: 'active'
          });
        }
      }
    }

    // Update environment variable (in production, this would be handled differently)
    await this.updateFirstTimeFlag();
  }

  private async updateFirstTimeFlag(): Promise<void> {
    // In production, this would update the database or external config
    // For now, we'll use the onboarding_completed flag in the user profile
    console.log('Onboarding completed - first time flag updated');
  }

  async resetOnboarding(): Promise<void> {
    await this.memory.resetUserData();
  }

  async isFirstTime(): Promise<boolean> {
    return await this.memory.isFirstTimeUser();
  }

  async close(): Promise<void> {
    await this.memory.close();
  }
}

export const onboardingManager = new OnboardingManager();
