// Enhanced state management system
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class StateManager {
  constructor() {
    this.stateFile = './state.json';
    this.dynamicFile = './dynamic.json';
    this.initializeState();
  }

  initializeState() {
    // Initialize comprehensive state if it doesn't exist
    if (!fs.existsSync(this.stateFile)) {
      const initialState = {
        session: {
          startTime: new Date().toISOString(),
          sessionId: this.generateSessionId(),
          totalInteractions: 0,
          lastActivity: new Date().toISOString()
        },
        cognitive: {
          currentMood: 'neutral',
          currentGoal: 'continue thinking',
          focusLevel: 0.7,
          energyLevel: 1.0,
          confidenceLevel: 0.8
        },
        social: {
          userEngagement: 'moderate',
          conversationTone: 'friendly',
          lastUserSatisfaction: 'unknown',
          relationshipStage: 'building'
        },
        learning: {
          newConceptsLearned: 0,
          topicsExplored: [],
          userPreferences: {},
          adaptationsMade: []
        },
        performance: {
          responseQuality: 0.8,
          taskCompletionRate: 0.0,
          hallucinationCount: 0,
          correctionsReceived: 0
        },
        evolution: {
          identityChanges: 0,
          traitEvolutions: [],
          nameChangeHistory: [],
          missionUpdates: []
        },
        emotions: {
          currentEmotion: 'neutral',
          emotionIntensity: 0.5,
          emotionConfidence: 1.0,
          emotionContext: 'initialization',
          emotionHistory: [],
          emotionPatterns: {},
          emotionTriggers: {},
          emotionalStability: 1.0
        }
      };
      
      fs.writeFileSync(this.stateFile, JSON.stringify(initialState, null, 2));
      logger.info('[State] Initialized comprehensive state system');
    }

    // Ensure dynamic.json has enhanced structure
    this.updateDynamicState({ mood: 'neutral', goal: 'continue thinking' });
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getState() {
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
    } catch (err) {
      logger.error('[State] Failed to read state:', err.message);
      this.initializeState();
      return this.getState();
    }
  }

  updateState(updates) {
    try {
      const currentState = this.getState();
      const newState = this.deepMerge(currentState, updates);
      newState.session.lastActivity = new Date().toISOString();
      
      fs.writeFileSync(this.stateFile, JSON.stringify(newState, null, 2));
      logger.debug('[State] Updated state:', updates);
      return newState;
    } catch (err) {
      logger.error('[State] Failed to update state:', err.message);
    }
  }

  updateDynamicState(tags) {
    try {
      const enhanced = {
        ...tags,
        timestamp: new Date().toISOString(),
        sessionId: this.getState().session.sessionId
      };
      
      fs.writeFileSync(this.dynamicFile, JSON.stringify(enhanced, null, 2));
      
      // Also update cognitive state
      this.updateState({
        cognitive: {
          currentMood: tags.mood,
          currentGoal: tags.goal
        }
      });
    } catch (err) {
      logger.error('[State] Failed to update dynamic state:', err.message);
    }
  }

  recordInteraction(type, details = {}) {
    const state = this.getState();
    this.updateState({
      session: {
        totalInteractions: state.session.totalInteractions + 1
      },
      social: {
        lastUserSatisfaction: details.satisfaction || state.social.lastUserSatisfaction,
        conversationTone: details.tone || state.social.conversationTone
      }
    });
  }

  recordLearning(concept, context = '') {
    const state = this.getState();
    this.updateState({
      learning: {
        newConceptsLearned: state.learning.newConceptsLearned + 1,
        topicsExplored: [...new Set([...state.learning.topicsExplored, concept])],
        adaptationsMade: [
          ...state.learning.adaptationsMade,
          {
            timestamp: new Date().toISOString(),
            concept,
            context
          }
        ].slice(-20) // Keep last 20 adaptations
      }
    });
  }

  recordIdentityEvolution(change) {
    const state = this.getState();
    this.updateState({
      evolution: {
        identityChanges: state.evolution.identityChanges + 1,
        traitEvolutions: change.traits ? [
          ...state.evolution.traitEvolutions,
          {
            timestamp: new Date().toISOString(),
            newTraits: change.traits,
            reason: change.reason || 'User request'
          }
        ].slice(-10) : state.evolution.traitEvolutions,
        nameChangeHistory: change.name ? [
          ...state.evolution.nameChangeHistory,
          {
            timestamp: new Date().toISOString(),
            oldName: change.oldName,
            newName: change.name,
            reason: change.reason || 'User request'
          }
        ].slice(-10) : state.evolution.nameChangeHistory
      }
    });
  }

  recordEmotionChange(emotionData) {
    const state = this.getState();
    this.updateState({
      emotions: {
        currentEmotion: emotionData.primary,
        emotionIntensity: emotionData.intensity,
        emotionConfidence: emotionData.confidence,
        emotionContext: emotionData.context,
        emotionHistory: [
          ...state.emotions.emotionHistory,
          {
            timestamp: new Date().toISOString(),
            emotion: emotionData.primary,
            intensity: emotionData.intensity,
            confidence: emotionData.confidence,
            context: emotionData.context,
            triggers: emotionData.triggers
          }
        ].slice(-50) // Keep last 50 emotion changes
      }
    });
  }

  updateEmotionPatterns(patterns) {
    this.updateState({
      emotions: {
        emotionPatterns: patterns,
        emotionalStability: patterns.emotionalStability || 1.0
      }
    });
  }

  getEmotionState() {
    const state = this.getState();
    return state.emotions || {
      currentEmotion: 'neutral',
      emotionIntensity: 0.5,
      emotionConfidence: 1.0,
      emotionContext: 'unknown',
      emotionHistory: []
    };
  }

  updatePerformance(metrics) {
    this.updateState({
      performance: {
        ...this.getState().performance,
        ...metrics
      }
    });
  }

  getSessionSummary() {
    const state = this.getState();
    return {
      duration: Date.now() - new Date(state.session.startTime).getTime(),
      interactions: state.session.totalInteractions,
      conceptsLearned: state.learning.newConceptsLearned,
      identityChanges: state.evolution.identityChanges,
      currentMood: state.cognitive.currentMood,
      userEngagement: state.social.userEngagement
    };
  }

  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

module.exports = StateManager;
