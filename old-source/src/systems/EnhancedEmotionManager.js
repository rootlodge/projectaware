const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class EnhancedEmotionManager {
  constructor() {
    this.configPath = './config/emotions.json';
    this.config = null;
    this.currentEmotion = 'neutral';
    this.emotionIntensity = 0.5;
    this.emotionHistory = [];
    this.manualOverrides = {};
    this.loadConfig();
  }

  loadConfig() {
    try {
      this.config = fs.readJsonSync(this.configPath);
      
      // Apply manual overrides
      this.manualOverrides = this.config.manual_overrides || {};
      
      logger.info('[EmotionManager] Loaded emotion configuration');
    } catch (error) {
      logger.error('[EmotionManager] Failed to load emotion config:', error.message);
      this.createDefaultConfig();
    }
  }

  createDefaultConfig() {
    // Use the config we created earlier
    const defaultConfig = {
      emotion_system: { enabled: true },
      emotions: {
        primary: {
          neutral: { enabled: true, weight_multiplier: 1.0 }
        }
      },
      manual_overrides: {},
      database_tracking: { log_all_changes: true }
    };
    
    fs.writeJsonSync(this.configPath, defaultConfig, { spaces: 2 });
    this.config = defaultConfig;
  }

  /**
   * Check if emotion system is enabled
   */
  isEnabled() {
    return this.config?.emotion_system?.enabled || false;
  }

  /**
   * Check if specific emotion is enabled
   */
  isEmotionEnabled(emotionName) {
    const emotion = this.getEmotionConfig(emotionName);
    return emotion?.enabled !== false;
  }

  /**
   * Get emotion configuration
   */
  getEmotionConfig(emotionName) {
    const primary = this.config?.emotions?.primary?.[emotionName];
    const secondary = this.config?.emotions?.secondary?.[emotionName];
    return primary || secondary || null;
  }

  /**
   * Set manual emotion override
   */
  setManualEmotion(emotionName, intensity = null, duration = null) {
    if (!this.isEmotionEnabled(emotionName)) {
      logger.warn(`[EmotionManager] Cannot set disabled emotion: ${emotionName}`);
      return false;
    }

    this.manualOverrides.current_emotion = emotionName;
    this.manualOverrides.forced_intensity = intensity;
    
    if (duration) {
      this.manualOverrides.temporary_settings = {
        duration: duration,
        expires_at: Date.now() + duration
      };
    }

    this.currentEmotion = emotionName;
    if (intensity !== null) {
      this.emotionIntensity = Math.max(0.1, Math.min(1.0, intensity));
    }

    this.saveConfig();
    this.logEmotionChange('manual_override', `Set to ${emotionName} (intensity: ${this.emotionIntensity})`);
    
    logger.info(`[EmotionManager] Manual emotion set: ${emotionName} (${this.emotionIntensity})`);
    return true;
  }

  /**
   * Clear manual overrides
   */
  clearManualOverrides() {
    this.manualOverrides = {};
    this.config.manual_overrides = {};
    this.saveConfig();
    
    logger.info('[EmotionManager] Manual overrides cleared');
  }

  /**
   * Enable/disable specific emotion
   */
  toggleEmotion(emotionName, enabled) {
    const emotionConfig = this.getEmotionConfig(emotionName);
    if (!emotionConfig) {
      logger.warn(`[EmotionManager] Emotion not found: ${emotionName}`);
      return false;
    }

    // Find the emotion in config and update
    if (this.config.emotions.primary[emotionName]) {
      this.config.emotions.primary[emotionName].enabled = enabled;
    } else if (this.config.emotions.secondary[emotionName]) {
      this.config.emotions.secondary[emotionName].enabled = enabled;
    }

    this.saveConfig();
    this.logEmotionChange('toggle', `${emotionName} ${enabled ? 'enabled' : 'disabled'}`);
    
    logger.info(`[EmotionManager] Emotion ${emotionName} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Set emotion weight multiplier
   */
  setEmotionWeight(emotionName, weight) {
    const emotionConfig = this.getEmotionConfig(emotionName);
    if (!emotionConfig) return false;

    // Update weight in config
    if (this.config.emotions.primary[emotionName]) {
      this.config.emotions.primary[emotionName].weight_multiplier = weight;
    } else if (this.config.emotions.secondary[emotionName]) {
      this.config.emotions.secondary[emotionName].weight_multiplier = weight;
    }

    this.saveConfig();
    this.logEmotionChange('weight_change', `${emotionName} weight set to ${weight}`);
    
    return true;
  }

  /**
   * Process emotion trigger
   */
  processEmotionTrigger(trigger, context = '') {
    if (!this.isEnabled()) return this.currentEmotion;

    // Check for manual override first
    if (this.manualOverrides.current_emotion) {
      // Check if override has expired
      const tempSettings = this.manualOverrides.temporary_settings;
      if (tempSettings && tempSettings.expires_at && Date.now() > tempSettings.expires_at) {
        this.clearManualOverrides();
      } else {
        return this.currentEmotion; // Keep manual override
      }
    }

    // Find emotions triggered by this trigger
    const triggeredEmotions = [];
    
    for (const [category, emotions] of Object.entries(this.config.emotions)) {
      for (const [emotionName, emotionConfig] of Object.entries(emotions)) {
        if (!emotionConfig.enabled) continue;
        
        if (emotionConfig.triggers && emotionConfig.triggers.includes(trigger)) {
          triggeredEmotions.push({
            name: emotionName,
            weight: emotionConfig.weight_multiplier || 1.0,
            config: emotionConfig
          });
        }
      }
    }

    if (triggeredEmotions.length > 0) {
      // Select emotion with highest weight
      const selectedEmotion = triggeredEmotions.reduce((prev, current) => 
        current.weight > prev.weight ? current : prev
      );

      this.currentEmotion = selectedEmotion.name;
      this.logEmotionChange('trigger', `${trigger} -> ${selectedEmotion.name} (${context})`);
    }

    return this.currentEmotion;
  }

  /**
   * Get current emotion state
   */
  getCurrentEmotionState() {
    const emotionConfig = this.getEmotionConfig(this.currentEmotion);
    
    return {
      primary: this.currentEmotion,
      intensity: this.emotionIntensity,
      confidence: 1.0,
      context: 'emotion_manager',
      responses: emotionConfig?.responses || ['neutral'],
      manual_override: !!this.manualOverrides.current_emotion,
      enabled: this.isEmotionEnabled(this.currentEmotion)
    };
  }

  /**
   * Get emotion statistics
   */
  getEmotionStats() {
    const recentHistory = this.emotionHistory.slice(-20);
    const emotionCounts = {};
    
    recentHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });

    const dominant = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
    );

    return {
      current: this.currentEmotion,
      dominant: dominant,
      stability: this.calculateStability(),
      history: {
        total: this.emotionHistory.length,
        recent: recentHistory.length
      },
      enabled_emotions: this.getEnabledEmotions(),
      manual_overrides_active: Object.keys(this.manualOverrides).length > 0
    };
  }

  /**
   * Get list of enabled emotions
   */
  getEnabledEmotions() {
    const enabled = [];
    
    for (const [category, emotions] of Object.entries(this.config.emotions)) {
      for (const [emotionName, emotionConfig] of Object.entries(emotions)) {
        if (emotionConfig.enabled !== false) {
          enabled.push({
            name: emotionName,
            category: category,
            weight: emotionConfig.weight_multiplier || 1.0,
            manual_control: emotionConfig.manual_control || false
          });
        }
      }
    }
    
    return enabled;
  }

  /**
   * Calculate emotional stability
   */
  calculateStability() {
    if (this.emotionHistory.length < 5) return 1.0;
    
    const recent = this.emotionHistory.slice(-10);
    const uniqueEmotions = new Set(recent.map(e => e.emotion));
    
    // More unique emotions = less stability
    return Math.max(0, 1 - (uniqueEmotions.size - 1) * 0.2);
  }

  /**
   * Log emotion change to history and database
   */
  logEmotionChange(trigger, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      emotion: this.currentEmotion,
      intensity: this.emotionIntensity,
      trigger: trigger,
      details: details
    };

    this.emotionHistory.push(entry);
    
    // Keep only last 100 entries
    if (this.emotionHistory.length > 100) {
      this.emotionHistory = this.emotionHistory.slice(-100);
    }

    // Log to database if tracking enabled
    if (this.config?.database_tracking?.log_all_changes) {
      logger.debug(`[EmotionManager] ${trigger}: ${this.currentEmotion} (${details})`);
    }
  }

  /**
   * Save configuration
   */
  saveConfig() {
    try {
      this.config.manual_overrides = this.manualOverrides;
      fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
    } catch (error) {
      logger.error('[EmotionManager] Failed to save config:', error.message);
    }
  }

  /**
   * Reset to default state
   */
  reset() {
    this.currentEmotion = 'neutral';
    this.emotionIntensity = 0.5;
    this.emotionHistory = [];
    this.clearManualOverrides();
    
    logger.info('[EmotionManager] Reset to default state');
  }
}

module.exports = EnhancedEmotionManager;
