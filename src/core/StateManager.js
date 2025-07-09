// Enhanced state management system
const fs = require('fs');
const path = require('path');
const logger = require('../src/core/logger');

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
        },
        tasks: {
          totalCreated: 0,
          totalStarted: 0,
          totalCompleted: 0,
          totalUpdated: 0,
          totalDeleted: 0,
          activeTasks: 0,
          recentTasks: []
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

  /**
   * Task Management Methods
   */
  
  recordTaskCreation(task) {
    const state = this.getState();
    this.updateState({
      tasks: {
        ...state.tasks,
        totalCreated: (state.tasks?.totalCreated || 0) + 1,
        activeTasks: (state.tasks?.activeTasks || 0) + 1,
        recentTasks: [
          ...(state.tasks?.recentTasks || []),
          {
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            createdAt: task.createdAt,
            action: 'created'
          }
        ].slice(-10)
      }
    });
  }

  recordTaskStart(task) {
    const state = this.getState();
    this.updateState({
      tasks: {
        ...state.tasks,
        totalStarted: (state.tasks?.totalStarted || 0) + 1,
        recentTasks: [
          ...(state.tasks?.recentTasks || []),
          {
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            startTime: task.startTime,
            action: 'started'
          }
        ].slice(-10)
      }
    });
  }

  recordTaskCompletion(task) {
    const state = this.getState();
    this.updateState({
      tasks: {
        ...state.tasks,
        totalCompleted: (state.tasks?.totalCompleted || 0) + 1,
        activeTasks: Math.max(0, (state.tasks?.activeTasks || 1) - 1),
        recentTasks: [
          ...(state.tasks?.recentTasks || []),
          {
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            completedAt: task.endTime,
            duration: task.actualDuration,
            action: 'completed'
          }
        ].slice(-10)
      },
      performance: {
        ...state.performance,
        taskCompletionRate: (state.tasks?.totalCompleted || 0) / (state.tasks?.totalCreated || 1)
      }
    });
  }

  recordTaskUpdate(task) {
    const state = this.getState();
    this.updateState({
      tasks: {
        ...state.tasks,
        totalUpdated: (state.tasks?.totalUpdated || 0) + 1,
        recentTasks: [
          ...(state.tasks?.recentTasks || []),
          {
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            updatedAt: task.updatedAt,
            action: 'updated'
          }
        ].slice(-10)
      }
    });
  }

  recordTaskDeletion(task) {
    const state = this.getState();
    this.updateState({
      tasks: {
        ...state.tasks,
        totalDeleted: (state.tasks?.totalDeleted || 0) + 1,
        activeTasks: task.status === 'in_progress' ? Math.max(0, (state.tasks?.activeTasks || 1) - 1) : (state.tasks?.activeTasks || 0),
        recentTasks: [
          ...(state.tasks?.recentTasks || []),
          {
            id: task.id,
            name: task.name,
            status: task.status,
            priority: task.priority,
            deletedAt: new Date().toISOString(),
            action: 'deleted'
          }
        ].slice(-10)
      }
    });
  }

  getTaskState() {
    const state = this.getState();
    return state.tasks || {
      totalCreated: 0,
      totalStarted: 0,
      totalCompleted: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      activeTasks: 0,
      recentTasks: []
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

  resetToDefaults() {
    const defaultState = {
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
        lastEvolution: new Date().toISOString()
      },
      tasks: {
        totalCreated: 0,
        totalStarted: 0,
        totalCompleted: 0,
        totalUpdated: 0,
        totalDeleted: 0,
        activeTasks: 0,
        recentTasks: []
      }
    };
    
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(defaultState, null, 2));
      
      // Reset dynamic state too
      const defaultDynamic = {
        mood: 'neutral',
        goal: 'continue thinking',
        currentFocus: 'general',
        energyLevel: 1.0,
        lastUpdate: new Date().toISOString()
      };
      
      fs.writeFileSync(this.dynamicFile, JSON.stringify(defaultDynamic, null, 2));
      
      logger.info('[StateManager] State reset to defaults');
      return true;
    } catch (error) {
      logger.error('[StateManager] Failed to reset state:', error.message);
      return false;
    }
  }
}

module.exports = StateManager;
