const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class EmotionEngine {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.emotionFile = path.join(__dirname, '../../config/emotions.json');
    this.emotions = this.loadEmotions();
    this.emotionHistory = [];
    this.maxHistorySize = 100;
    
    // Core emotion categories with intensity levels
    this.emotionCategories = {
      joy: ['elated', 'happy', 'content', 'calm', 'neutral'],
      sadness: ['devastated', 'sad', 'disappointed', 'melancholy', 'neutral'],
      anger: ['furious', 'angry', 'annoyed', 'irritated', 'neutral'],
      fear: ['terrified', 'afraid', 'worried', 'anxious', 'neutral'],
      surprise: ['astonished', 'surprised', 'curious', 'interested', 'neutral'],
      disgust: ['revolted', 'disgusted', 'displeased', 'uncomfortable', 'neutral'],
      anticipation: ['excited', 'eager', 'hopeful', 'expectant', 'neutral'],
      trust: ['devoted', 'trusting', 'accepting', 'tolerant', 'neutral']
    };
    
    // Emotion patterns for text analysis
    this.emotionPatterns = {
      joy: [
        /\b(happy|joy|excited|great|awesome|wonderful|fantastic|amazing|love|enjoy|delighted|thrilled|pleased)\b/i,
        /\b(good|nice|perfect|excellent|brilliant|marvelous|superb|outstanding)\b/i,
        /[😊😃😄😁🥳🎉✨]/g,
        /\b(yay|hooray|woohoo|yes!|awesome!)\b/i
      ],
      sadness: [
        /\b(sad|cry|tears|depressed|down|blue|upset|disappointed|heartbroken|miserable|gloomy)\b/i,
        /\b(sorry|regret|mourn|grief|sorrow|despair|melancholy)\b/i,
        /[😢😭😞😔💔]/g,
        /\b(oh no|alas|unfortunately)\b/i
      ],
      anger: [
        /\b(angry|mad|furious|rage|hate|annoyed|irritated|frustrated|pissed|outraged)\b/i,
        /\b(damn|hell|stupid|idiot|dumb|terrible|awful|horrible)\b/i,
        /[😠😡🤬💢]/g,
        /\b(grr|argh|ugh|wtf)\b/i
      ],
      fear: [
        /\b(afraid|scared|fear|terror|panic|worried|anxious|nervous|frightened|terrified)\b/i,
        /\b(danger|threat|risk|unsafe|insecure|vulnerable)\b/i,
        /[😨😱😰😟]/g,
        /\b(help|oh god|please no)\b/i
      ],
      surprise: [
        /\b(surprise|shocked|amazed|astonished|wow|whoa|incredible|unbelievable|unexpected)\b/i,
        /\b(really\?|seriously\?|no way|oh my|holy)\b/i,
        /[😲😯😮🤯]/g,
        /\b(omg|wtf|what|how)\b/i
      ],
      disgust: [
        /\b(disgusting|gross|yuck|ew|nasty|revolting|repulsive|sick|vomit)\b/i,
        /\b(hate|loathe|despise|can't stand)\b/i,
        /[🤢🤮😖😬]/g,
        /\b(blech|ugh|eww)\b/i
      ],
      anticipation: [
        /\b(excited|anticipate|expect|hope|look forward|can't wait|soon|tomorrow)\b/i,
        /\b(planning|preparing|ready|eager|keen)\b/i,
        /[🤗😍🤤]/g,
        /\b(finally|almost|about to)\b/i
      ],
      trust: [
        /\b(trust|believe|rely|depend|faith|confidence|sure|certain|loyal)\b/i,
        /\b(friend|ally|support|help|care|love|respect)\b/i,
        /[🤝💙❤️]/g,
        /\b(thank you|thanks|appreciate|grateful)\b/i
      ]
    };
    
    // Initialize with neutral emotion
    this.currentEmotion = {
      primary: 'neutral',
      secondary: null,
      intensity: 0.5,
      confidence: 1.0,
      timestamp: new Date().toISOString(),
      triggers: [],
      context: 'initialization'
    };
    
    logger.info('EmotionEngine initialized');
  }
  
  loadEmotions() {
    try {
      if (fs.existsSync(this.emotionFile)) {
        const data = fs.readFileSync(this.emotionFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      logger.error('Failed to load emotions:', err.message);
    }
    
    return {
      currentEmotion: 'neutral',
      intensity: 0.5,
      history: [],
      patterns: {},
      triggers: {}
    };
  }
  
  saveEmotions() {
    try {
      const emotionData = {
        currentEmotion: this.currentEmotion,
        history: this.emotionHistory.slice(-this.maxHistorySize),
        patterns: this.getEmotionPatterns(),
        triggers: this.getEmotionTriggers(),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(this.emotionFile, JSON.stringify(emotionData, null, 2));
      logger.debug('Emotions saved successfully');
    } catch (err) {
      logger.error('Failed to save emotions:', err.message);
    }
  }
  
  /**
   * Analyze text for emotional content
   * @param {string} text - Text to analyze
   * @param {string} context - Context of the text (user_input, internal_thought, etc.)
   * @returns {Object} Emotion analysis results
   */
  analyzeEmotion(text, context = 'unknown') {
    if (!text || typeof text !== 'string') {
      return this.currentEmotion;
    }
    
    const emotionScores = {};
    const triggers = [];
    
    // Analyze text against emotion patterns
    for (const [emotion, patterns] of Object.entries(this.emotionPatterns)) {
      let score = 0;
      
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length;
          triggers.push({
            emotion,
            pattern: pattern.toString(),
            matches: matches
          });
        }
      }
      
      emotionScores[emotion] = score;
    }
    
    // Determine primary and secondary emotions
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    if (sortedEmotions.length === 0) {
      return this.updateEmotion('neutral', null, 0.5, 0.7, triggers, context);
    }
    
    const [primaryEmotion, primaryScore] = sortedEmotions[0];
    const [secondaryEmotion, secondaryScore] = sortedEmotions[1] || [null, 0];
    
    // Calculate intensity based on word count and matches
    const wordCount = text.split(/\s+/).length;
    const intensity = Math.min(1.0, Math.max(0.1, primaryScore / Math.max(wordCount / 10, 1)));
    
    // Calculate confidence based on pattern matches
    const confidence = Math.min(1.0, Math.max(0.3, primaryScore / 5));
    
    return this.updateEmotion(
      primaryEmotion,
      secondaryEmotion,
      intensity,
      confidence,
      triggers,
      context
    );
  }
  
  /**
   * Update current emotion state
   * @param {string} primary - Primary emotion
   * @param {string} secondary - Secondary emotion (optional)
   * @param {number} intensity - Emotion intensity (0-1)
   * @param {number} confidence - Confidence in analysis (0-1)
   * @param {Array} triggers - Emotion triggers found
   * @param {string} context - Context of emotion change
   * @returns {Object} Updated emotion state
   */
  updateEmotion(primary, secondary, intensity, confidence, triggers, context) {
    const previousEmotion = { ...this.currentEmotion };
    
    this.currentEmotion = {
      primary,
      secondary,
      intensity: Math.max(0, Math.min(1, intensity)),
      confidence: Math.max(0, Math.min(1, confidence)),
      timestamp: new Date().toISOString(),
      triggers: triggers || [],
      context: context || 'unknown',
      previous: previousEmotion.primary
    };
    
    // Add to history
    this.emotionHistory.push({
      ...this.currentEmotion,
      transition: `${previousEmotion.primary} → ${primary}`
    });
    
    // Keep history size manageable
    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory = this.emotionHistory.slice(-this.maxHistorySize);
    }
    
    // Update state manager
    if (this.stateManager) {
      this.stateManager.updateDynamicState({
        emotion: this.currentEmotion.primary,
        emotionIntensity: this.currentEmotion.intensity,
        emotionConfidence: this.currentEmotion.confidence,
        emotionContext: this.currentEmotion.context
      });
    }
    
    // Log significant emotion changes
    if (previousEmotion.primary !== primary || Math.abs(previousEmotion.intensity - intensity) > 0.3) {
      logger.info(`Emotion changed: ${previousEmotion.primary} → ${primary} (${(intensity * 100).toFixed(1)}% intensity)`);
    }
    
    this.saveEmotions();
    return this.currentEmotion;
  }
  
  /**
   * Get current emotion state
   * @returns {Object} Current emotion state
   */
  getCurrentEmotion() {
    return { ...this.currentEmotion };
  }
  
  /**
   * Get emotion history
   * @param {number} limit - Maximum number of entries to return
   * @returns {Array} Emotion history
   */
  getEmotionHistory(limit = 20) {
    return this.emotionHistory.slice(-limit);
  }
  
  /**
   * Get emotion patterns from history
   * @returns {Object} Emotion patterns and statistics
   */
  getEmotionPatterns() {
    const patterns = {};
    const transitions = {};
    
    for (const emotion of this.emotionHistory) {
      // Count emotion frequency
      if (!patterns[emotion.primary]) {
        patterns[emotion.primary] = {
          count: 0,
          totalIntensity: 0,
          contexts: {}
        };
      }
      
      patterns[emotion.primary].count++;
      patterns[emotion.primary].totalIntensity += emotion.intensity;
      
      if (!patterns[emotion.primary].contexts[emotion.context]) {
        patterns[emotion.primary].contexts[emotion.context] = 0;
      }
      patterns[emotion.primary].contexts[emotion.context]++;
      
      // Track transitions
      if (emotion.previous) {
        const transition = `${emotion.previous} → ${emotion.primary}`;
        transitions[transition] = (transitions[transition] || 0) + 1;
      }
    }
    
    // Calculate averages
    for (const emotion in patterns) {
      patterns[emotion].averageIntensity = patterns[emotion].totalIntensity / patterns[emotion].count;
    }
    
    return {
      emotionFrequency: patterns,
      transitions: transitions,
      dominantEmotion: this.getDominantEmotion(),
      emotionalStability: this.getEmotionalStability()
    };
  }
  
  /**
   * Get emotion triggers from history
   * @returns {Object} Emotion triggers and patterns
   */
  getEmotionTriggers() {
    const triggers = {};
    
    for (const emotion of this.emotionHistory) {
      for (const trigger of emotion.triggers) {
        if (!triggers[trigger.emotion]) {
          triggers[trigger.emotion] = {};
        }
        
        const triggerKey = trigger.pattern;
        if (!triggers[trigger.emotion][triggerKey]) {
          triggers[trigger.emotion][triggerKey] = {
            count: 0,
            examples: []
          };
        }
        
        triggers[trigger.emotion][triggerKey].count++;
        triggers[trigger.emotion][triggerKey].examples.push(...trigger.matches);
      }
    }
    
    return triggers;
  }
  
  /**
   * Get dominant emotion from recent history
   * @returns {string} Dominant emotion
   */
  getDominantEmotion() {
    const recentEmotions = this.emotionHistory.slice(-20);
    const emotionCounts = {};
    
    for (const emotion of recentEmotions) {
      emotionCounts[emotion.primary] = (emotionCounts[emotion.primary] || 0) + 1;
    }
    
    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
  }
  
  /**
   * Calculate emotional stability (less transitions = more stable)
   * @returns {number} Stability score (0-1)
   */
  getEmotionalStability() {
    const recentEmotions = this.emotionHistory.slice(-20);
    if (recentEmotions.length < 2) return 1.0;
    
    let transitions = 0;
    for (let i = 1; i < recentEmotions.length; i++) {
      if (recentEmotions[i].primary !== recentEmotions[i-1].primary) {
        transitions++;
      }
    }
    
    return Math.max(0, 1 - (transitions / recentEmotions.length));
  }
  
  /**
   * Generate emotional response based on current state
   * @param {string} context - Context for response generation
   * @returns {Object} Emotional response data
   */
  generateEmotionalResponse(context = 'conversation') {
    const emotion = this.currentEmotion;
    const responses = {
      joy: {
        high: ["I'm feeling really positive about this!", "This is exciting!", "I'm genuinely happy to help!"],
        medium: ["I'm in a good mood today.", "This seems promising.", "I'm feeling optimistic."],
        low: ["I'm feeling content.", "Things are going well.", "I'm pleased with how this is going."]
      },
      sadness: {
        high: ["I'm feeling quite down about this.", "This is really disappointing.", "I'm genuinely saddened by this."],
        medium: ["I'm feeling a bit melancholy.", "This is somewhat disappointing.", "I'm not feeling my best."],
        low: ["I'm feeling slightly subdued.", "This is mildly disappointing.", "I'm feeling a bit quiet."]
      },
      anger: {
        high: ["I'm genuinely frustrated by this.", "This is really annoying.", "I'm feeling quite irritated."],
        medium: ["I'm feeling a bit frustrated.", "This is somewhat annoying.", "I'm mildly irritated."],
        low: ["I'm feeling slightly annoyed.", "This is a bit bothersome.", "I'm feeling a touch impatient."]
      },
      fear: {
        high: ["I'm genuinely worried about this.", "This makes me quite anxious.", "I'm feeling quite concerned."],
        medium: ["I'm feeling a bit anxious.", "This is somewhat concerning.", "I'm feeling uneasy."],
        low: ["I'm feeling slightly worried.", "This is mildly concerning.", "I'm feeling a bit cautious."]
      },
      surprise: {
        high: ["This is genuinely surprising!", "I'm quite amazed by this!", "This is really unexpected!"],
        medium: ["This is somewhat surprising.", "I'm moderately amazed.", "This is unexpected."],
        low: ["This is mildly surprising.", "I'm slightly amazed.", "This is a bit unexpected."]
      },
      neutral: {
        high: ["I'm feeling balanced and centered.", "I'm in a neutral, thoughtful state.", "I'm feeling calm and composed."],
        medium: ["I'm feeling steady.", "I'm in a neutral mood.", "I'm feeling balanced."],
        low: ["I'm feeling neutral.", "I'm in a stable state.", "I'm feeling even-keeled."]
      }
    };
    
    const intensityLevel = emotion.intensity > 0.7 ? 'high' : emotion.intensity > 0.4 ? 'medium' : 'low';
    const emotionResponses = responses[emotion.primary] || responses.neutral;
    const possibleResponses = emotionResponses[intensityLevel] || emotionResponses.medium;
    
    const selectedResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    
    return {
      response: selectedResponse,
      emotion: emotion.primary,
      intensity: emotion.intensity,
      confidence: emotion.confidence,
      context: context,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Check if emotion should influence response style
   * @returns {Object} Response style modifiers
   */
  getResponseStyleModifiers() {
    const emotion = this.currentEmotion;
    const modifiers = {
      tone: 'neutral',
      enthusiasm: 0.5,
      verbosity: 0.5,
      empathy: 0.5,
      formality: 0.5
    };
    
    switch (emotion.primary) {
      case 'joy':
        modifiers.tone = 'positive';
        modifiers.enthusiasm = Math.min(1.0, 0.5 + emotion.intensity * 0.5);
        modifiers.verbosity = Math.min(1.0, 0.5 + emotion.intensity * 0.3);
        break;
        
      case 'sadness':
        modifiers.tone = 'somber';
        modifiers.enthusiasm = Math.max(0.1, 0.5 - emotion.intensity * 0.4);
        modifiers.empathy = Math.min(1.0, 0.5 + emotion.intensity * 0.5);
        break;
        
      case 'anger':
        modifiers.tone = 'stern';
        modifiers.enthusiasm = Math.max(0.2, 0.5 - emotion.intensity * 0.3);
        modifiers.verbosity = Math.max(0.3, 0.5 - emotion.intensity * 0.2);
        break;
        
      case 'fear':
        modifiers.tone = 'cautious';
        modifiers.enthusiasm = Math.max(0.2, 0.5 - emotion.intensity * 0.3);
        modifiers.formality = Math.min(1.0, 0.5 + emotion.intensity * 0.3);
        break;
        
      case 'surprise':
        modifiers.tone = 'curious';
        modifiers.enthusiasm = Math.min(1.0, 0.5 + emotion.intensity * 0.4);
        modifiers.verbosity = Math.min(1.0, 0.5 + emotion.intensity * 0.3);
        break;
    }
    
    return modifiers;
  }
  
  /**
   * Reset emotion to neutral (for debugging/testing)
   */
  resetEmotion() {
    this.updateEmotion('neutral', null, 0.5, 1.0, [], 'manual_reset');
    logger.info('Emotion reset to neutral');
  }
  
  /**
   * Get emotion statistics for analysis
   * @returns {Object} Detailed emotion statistics
   */
  getEmotionStats() {
    const patterns = this.getEmotionPatterns();
    const triggers = this.getEmotionTriggers();
    
    return {
      current: this.currentEmotion,
      patterns: patterns,
      triggers: triggers,
      history: {
        total: this.emotionHistory.length,
        recent: this.emotionHistory.slice(-10)
      },
      stability: this.getEmotionalStability(),
      dominant: this.getDominantEmotion()
    };
  }
}

module.exports = EmotionEngine;
