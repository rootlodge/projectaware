import fs from 'fs';
import path from 'path';

export interface SessionState {
  id: string;
  start_time: string;
  interactions: number;
  last_activity: string;
  duration: number;
}

export interface CognitiveState {
  processing_mode: string;
  attention_focus: string;
  cognitive_load: number;
  decision_confidence: number;
  learning_rate: number;
}

export interface SocialState {
  user_mood: string;
  relationship_quality: number;
  communication_style: string;
  engagement_level: number;
  trust_level: number;
}

export interface LearningState {
  concepts_learned: number;
  knowledge_areas: string[];
  learning_velocity: number;
  retention_rate: number;
  adaptation_score: number;
}

export interface PerformanceState {
  response_time: number;
  accuracy: number;
  efficiency: number;
  resource_usage: number;
  error_rate: number;
}

export interface IdentityEvolution {
  oldName: string;
  newName: string;
  traits: string[];
  reason: string;
  timestamp: string;
}

export interface SystemState {
  session: SessionState;
  cognitive: CognitiveState;
  social: SocialState;
  learning: LearningState;
  performance: PerformanceState;
  evolution: {
    identity_changes: IdentityEvolution[];
    trait_modifications: any[];
    learning_events: any[];
  };
  last_updated: string;
}

export class StateManager {
  private statePath: string;
  private state: SystemState;

  constructor() {
    this.statePath = path.join(process.cwd(), 'src', 'lib', 'config', 'state.json');
    this.state = this.loadState();
  }

  private loadState(): SystemState {
    try {
      const stateData = fs.readFileSync(this.statePath, 'utf-8');
      return JSON.parse(stateData);
    } catch (error) {
      console.warn('State file not found, creating default state');
      return this.createDefaultState();
    }
  }

  private createDefaultState(): SystemState {
    const now = new Date().toISOString();
    return {
      session: {
        id: `session_${Date.now()}`,
        start_time: now,
        interactions: 0,
        last_activity: now,
        duration: 0
      },
      cognitive: {
        processing_mode: 'normal',
        attention_focus: 'user_interaction',
        cognitive_load: 0.3,
        decision_confidence: 0.8,
        learning_rate: 0.7
      },
      social: {
        user_mood: 'neutral',
        relationship_quality: 0.5,
        communication_style: 'conversational',
        engagement_level: 0.7,
        trust_level: 0.6
      },
      learning: {
        concepts_learned: 0,
        knowledge_areas: [],
        learning_velocity: 0.5,
        retention_rate: 0.8,
        adaptation_score: 0.6
      },
      performance: {
        response_time: 0,
        accuracy: 0.85,
        efficiency: 0.75,
        resource_usage: 0.4,
        error_rate: 0.05
      },
      evolution: {
        identity_changes: [],
        trait_modifications: [],
        learning_events: []
      },
      last_updated: now
    };
  }

  private saveState(): void {
    try {
      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  getState(): SystemState {
    return { ...this.state };
  }

  updateState(updates: Partial<SystemState>): void {
    this.state = { ...this.state, ...updates };
    this.saveState();
  }

  recordInteraction(type: string, data: any): void {
    this.state.session.interactions++;
    this.state.session.last_activity = new Date().toISOString();
    this.state.session.duration = Date.now() - new Date(this.state.session.start_time).getTime();
    
    // Update social state based on interaction
    if (data.satisfaction) {
      this.state.social.relationship_quality = Math.min(1.0, 
        this.state.social.relationship_quality + (data.satisfaction === 'positive' ? 0.1 : -0.1));
    }
    
    if (data.engagement) {
      this.state.social.engagement_level = Math.max(0, Math.min(1, 
        this.state.social.engagement_level + (data.engagement === 'high' ? 0.1 : -0.05)));
    }
    
    this.saveState();
  }

  recordIdentityEvolution(evolution: Omit<IdentityEvolution, 'timestamp'>): void {
    const evolutionRecord: IdentityEvolution = {
      ...evolution,
      timestamp: new Date().toISOString()
    };
    
    this.state.evolution.identity_changes.push(evolutionRecord);
    
    // Keep only last 50 evolution records
    if (this.state.evolution.identity_changes.length > 50) {
      this.state.evolution.identity_changes = this.state.evolution.identity_changes.slice(-50);
    }
    
    this.saveState();
  }

  recordLearning(concept: string, context: string): void {
    const learningEvent = {
      concept,
      context,
      timestamp: new Date().toISOString(),
      confidence: 0.7
    };
    
    this.state.evolution.learning_events.push(learningEvent);
    this.state.learning.concepts_learned++;
    
    // Add to knowledge areas if not already present
    if (!this.state.learning.knowledge_areas.includes(concept)) {
      this.state.learning.knowledge_areas.push(concept);
    }
    
    // Keep only last 100 learning events
    if (this.state.evolution.learning_events.length > 100) {
      this.state.evolution.learning_events = this.state.evolution.learning_events.slice(-100);
    }
    
    this.saveState();
  }

  updateCognitiveState(updates: Partial<CognitiveState>): void {
    this.state.cognitive = { ...this.state.cognitive, ...updates };
    this.saveState();
  }

  updatePerformanceMetrics(metrics: Partial<PerformanceState>): void {
    this.state.performance = { ...this.state.performance, ...metrics };
    this.saveState();
  }

  updateSocialState(updates: Partial<SocialState>): void {
    this.state.social = { ...this.state.social, ...updates };
    this.saveState();
  }

  getRecentEvolutions(limit: number = 10): IdentityEvolution[] {
    return this.state.evolution.identity_changes.slice(-limit);
  }

  getRecentLearning(limit: number = 10): any[] {
    return this.state.evolution.learning_events.slice(-limit);
  }

  getPerformanceMetrics(): PerformanceState {
    return { ...this.state.performance };
  }

  getSocialMetrics(): SocialState {
    return { ...this.state.social };
  }

  resetSession(): void {
    const now = new Date().toISOString();
    this.state.session = {
      id: `session_${Date.now()}`,
      start_time: now,
      interactions: 0,
      last_activity: now,
      duration: 0
    };
    this.saveState();
  }

  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importState(stateData: string): void {
    try {
      const imported = JSON.parse(stateData);
      this.state = { ...this.createDefaultState(), ...imported };
      this.saveState();
    } catch (error) {
      console.error('Error importing state:', error);
      throw error;
    }
  }
}
