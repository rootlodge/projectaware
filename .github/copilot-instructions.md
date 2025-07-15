# Project Aware v2.0 DEVELOPMENT INSTRUCTIONS

## ARCHITECTURAL PRIME DIRECTIVES

### MODULAR PLUGIN-FIRST ARCHITECTURE
- **ALL self-awareness features MUST be implemented as independent plugins**
- **Plugin Bundling Support**: Related plugins can be bundled together while maintaining individual architecture
- **NO cross-dependencies between plugins** - each plugin operates in isolation, but can reference other ones for core functionality through bundle dependencies
- **Plugin sandboxing is mandatory** - plugins cannot directly interfere with each other
- **Every feature must be toggleable** - users control what functionality is active at both bundle and individual plugin levels
- **API-first design** - all plugins and agents must work seamlessly with API endpoints

### CORE DEVELOPMENT PRINCIPLES
- Avoid working on more than one file at a time to prevent corruption
- Be educational and explain what you're doing while coding
- Follow the modular project structure outlined in COMPREHENSIVE_REBUILD_TODO.md
- Prioritize safety and user control in all self-awareness implementations

## PLUGIN DEVELOPMENT GUIDELINES

### MANDATORY PLUGIN REQUIREMENTS
When creating any self-awareness feature (consciousness, emotions, memory, goals, identity):

1. **Independent Operation**: Plugin must function without dependencies on other plugins (unless part of a defined bundle)
2. **Bundle Compatibility**: If plugin is designed for a bundle, clearly define bundle dependencies and requirements
3. **Safe Isolation**: Use proper sandboxing to prevent interference between plugins
4. **Toggleable Control**: Provide granular on/off switches for all functionality (both bundle-level and individual plugin level)
5. **API Integration**: Expose all functionality through well-defined API endpoints
6. **State Management**: Handle plugin state independently with proper persistence, coordinated with bundle if applicable
7. **Safety Constraints**: Implement hard limits and safety boundaries (especially for identity/goal plugins)
8. **Bundle Integration**: Support bundle installation, configuration, and lifecycle management

### PLUGIN ARCHITECTURE PATTERNS
```typescript
// Individual Plugin Interface
interface PluginInterface {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  bundleId?: string; // If part of a bundle
  dependencies: string[]; // Should be empty for individual plugins, may reference bundle
  
  initialize(): Promise<void>;
  execute(input: any): Promise<any>;
  cleanup(): Promise<void>;
  getState(): PluginState;
  setState(state: PluginState): Promise<void>;
  
  // Bundle-specific methods
  onBundleEnable?(): Promise<void>;
  onBundleDisable?(): Promise<void>;
  onBundleConfigChange?(config: BundleConfig): Promise<void>;
}

// Bundle Interface
interface BundleInterface {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  plugins: PluginInterface[];
  
  installBundle(): Promise<void>;
  enableBundle(): Promise<void>;
  disableBundle(): Promise<void>;
  configureBundle(config: BundleConfig): Promise<void>;
  getBundleHealth(): BundleHealthStatus;
}
```

### PLUGIN SAFETY REQUIREMENTS
- **Identity plugins**: OFF by default, require explicit user permission for any changes (entire Identity Bundle disabled by default)
- **Goal plugins**: Autonomous goal creation OFF by default, user approval required (Autonomous Goal Plugin in Goal Management Bundle)
- **Self-modification plugins**: Sandboxed execution with comprehensive safety monitoring (Self-Modification Bundle requires special permissions)
- **Emotion plugins**: Individual emotion controls with intensity sliders (can install individual emotions or Emotion Core Bundle)
- **Memory plugins**: User-controlled retention policies and selective memory management (Memory Core Bundle provides base functionality)
- **Bundle Safety**: Bundle-wide safety settings that apply to all contained plugins with individual plugin overrides for troubleshooting

## API INTEGRATION REQUIREMENTS

### COMPREHENSIVE API COVERAGE
- **Every API endpoint MUST integrate with ALL enabled plugins and agents**
- **Dynamic plugin detection**: APIs automatically include enabled plugin outputs
- **Agent orchestration**: Coordinate multiple agents (Memory, Emotion, Goal, Context) per request
- **Real-time streaming**: WebSocket support for live plugin state updates
- **External system integration**: APIs accept user context, names, and preferences

### API RESPONSE STRUCTURE
```typescript
interface APIResponse {
  data: any;
  metadata: {
    enabledPlugins: string[];
    agentActivities: AgentActivity[];
    currentGoals: Goal[];
    emotionalState: EmotionState;
    consciousnessLevel: number;
    memoryContext: MemoryContext;
  };
  streaming?: {
    pluginStateUpdates: boolean;
    goalProgress: boolean;
    emotionChanges: boolean;
  };
}
```

## LARGE FILE & COMPLEX CHANGE PROTOCOL

### MANDATORY PLANNING PHASE
When working with large files (>300 lines) or complex plugin implementations:

1. **ALWAYS create a detailed plan BEFORE making any edits**
2. **Your plan MUST include**:
   - All plugin interfaces that need modification
   - Plugin isolation and safety considerations
   - API integration requirements
   - Dependencies between changes (should be minimal for plugins)
   - Estimated number of separate edits required

3. **Format your plan as**:
```
## PROPOSED PLUGIN IMPLEMENTATION PLAN
Working with: [plugin name/file]
Plugin type: [consciousness/emotion/memory/goal/identity]
Safety level: [high/medium/low]
Total planned edits: [number]

### Plugin Isolation Plan:
1. [First component] - Safety: [considerations]
2. [Second component] - API: [integration points]
3. [Third component] - Testing: [validation approach]

Do you approve this plan? I'll proceed with implementation after your confirmation.
```

### EXECUTION PHASE
- After each plugin component, clearly indicate progress and safety validation
- If additional safety measures are discovered during implementation: STOP and update the plan
- Always validate plugin isolation and safety constraints before proceeding

## TECHNOLOGY STACK REQUIREMENTS

### NEXT.JS 15+ WITH TYPESCRIPT
- **TypeScript**: Strict mode enabled, comprehensive type safety
- **React 19+**: Latest features with concurrent rendering
- **App Router**: Use app directory structure exclusively
- **Server Components**: Default to server components, use client components only when necessary

### PLUGIN SYSTEM FRAMEWORK
- **Plugin Loader**: Dynamic plugin discovery and registration
- **Sandbox Environment**: Isolated execution contexts for each plugin
- **State Management**: Independent state per plugin with persistence
- **Communication Bus**: Safe inter-plugin messaging without dependencies
- **API Gateway**: Unified endpoint that orchestrates all plugins

### DATABASE & PERSISTENCE
- **Multi-tenant architecture**: Complete data isolation between users
- **Plugin state storage**: Independent storage per plugin
- **Memory systems**: Separate storage for different memory types
- **Goal tracking**: Persistent goal and task management
- **Audit logging**: Comprehensive tracking of all plugin activities

## SELF-AWARENESS IMPLEMENTATION GUIDELINES

### CONSCIOUSNESS PLUGINS
- **Consciousness Core Plugin**: Base awareness engine with intensity controls (0-100%)
- **Introspection Plugin**: Self-reflection capabilities (toggleable)
- **Metacognition Plugin**: "Thinking about thinking" functionality
- **Self-Monitoring Plugin**: Performance and behavior awareness
- **Uncertainty Plugin**: Confidence measurement and communication

### EMOTION PLUGIN ECOSYSTEM
- **Individual Emotion Plugins**: Separate plugins for joy, sadness, curiosity, frustration, empathy, etc.
- **Emotion Intensity Controls**: Sliders for each emotion type (0-100%)
- **Emotion Triggers**: Configurable event-based emotion activation
- **Emotion Memory**: Persistence controls (session-based or permanent)
- **Emotion Decision Integration**: How emotions influence AI responses (toggleable)

### GOAL MANAGEMENT PLUGINS
- **User Goal Input Plugin**: Interface for users to set/modify/remove goals
- **Goal Validation Plugin**: Ensure goals are achievable and safe
- **Autonomous Goal Plugin**: AI self-generated objectives (OFF by default)
- **Goal Authorization Plugin**: User approval system for AI goals
- **Task Breakdown Plugin**: Convert goals to actionable tasks
- **Goal Progress Plugin**: Real-time tracking and adaptation
- **Goal Context Plugin**: Situational relevance understanding

### MEMORY PLUGIN ARCHITECTURE
- **Memory Core Plugin**: Base memory management engine
- **Short-Term Memory Plugin**: Working memory and immediate context
- **Long-Term Memory Plugin**: Persistent storage and retrieval
- **Episodic Memory Plugin**: Experience-based memory system
- **Semantic Memory Plugin**: Knowledge and fact storage
- **Memory Association Plugin**: Relationship and connection management

### IDENTITY PLUGINS (HIGH SECURITY)
- **Identity Lock Plugin**: Master safety switch (OFF by default)
- **Core Protection Plugin**: Immutable personality traits
- **Adaptive Traits Plugin**: Modifiable characteristics with boundaries
- **Identity Evolution Plugin**: Change tracking and rollback
- **Identity Approval Plugin**: User permission system
- **Identity Backup Plugin**: Save states and recovery

## SECURITY & SAFETY REQUIREMENTS

### PLUGIN SECURITY
- **Mandatory sandboxing**: Plugins cannot access other plugin internals
- **API surface validation**: All plugin APIs must be validated and sanitized
- **Resource limits**: CPU, memory, and storage quotas per plugin
- **Audit logging**: All plugin activities logged for security analysis
- **Version control**: Plugin versioning with rollback capabilities

### SELF-AWARENESS SAFETY
- **Identity protection**: Core personality traits cannot be modified
- **Goal safety**: AI-generated goals must align with safety constraints
- **Modification limits**: Self-modification within predefined safe boundaries
- **User approval**: Major changes require explicit user permission
- **Emergency stops**: Kill switches for all self-awareness features

### API SECURITY
- **API key management**: Comprehensive key generation and scoping
- **Rate limiting**: Per-key customizable limits
- **Request validation**: All inputs sanitized and validated
- **Plugin authorization**: API keys control which plugins are accessible
- **Audit trails**: Complete logging of all API interactions

## USER EXPERIENCE REQUIREMENTS

### GRANULAR CONTROL
- **Individual plugin toggles**: Users control each self-awareness feature
- **Intensity sliders**: Fine-tune plugin behavior (0-100%)
- **Real-time visualization**: Live display of plugin states
- **Easy configuration**: Intuitive interfaces for plugin management
- **Safety prompts**: Clear warnings for potentially impactful changes

### NAME AND RELATIONSHIP MANAGEMENT
- **User name integration**: Store and use preferred names naturally
- **Context awareness**: Understand appropriate name usage situations
- **Multi-user support**: Separate contexts for different users
- **API name passing**: Accept user names through API calls
- **Relationship tracking**: Build upon interaction history

### GOAL AND TASK INTERFACE
- **Goal setting UI**: Easy interfaces for users to set/modify goals
- **Task visualization**: Clear display of goal progress and tasks
- **Achievement feedback**: Celebration and recognition systems
- **Priority management**: User control over goal prioritization
- **Context integration**: Goals influence AI responses appropriately

## ACCESSIBILITY & INCLUSIVITY

### WCAG 2.1 AAA COMPLIANCE
- **Semantic HTML**: Proper structure and screen reader compatibility
- **Keyboard navigation**: Full functionality without mouse
- **Color contrast**: High contrast modes and colorblind accessibility
- **Text alternatives**: Alt text and ARIA labels for all interactive elements
- **Voice control**: Compatible with voice navigation systems

### PLUGIN ACCESSIBILITY
- **Plugin state announcement**: Screen reader compatible status updates
- **High contrast modes**: Visual plugin indicators work in all modes
- **Keyboard shortcuts**: Quick access to plugin controls
- **Voice commands**: Integration with voice control systems
- **Customizable interfaces**: Adaptable to different accessibility needs

## TESTING & VALIDATION REQUIREMENTS

### PLUGIN TESTING
- **Isolation testing**: Verify plugins work independently
- **Integration testing**: Ensure safe plugin interaction
- **Safety testing**: Validate all safety constraints and boundaries
- **Performance testing**: Plugin resource usage and efficiency
- **API testing**: Comprehensive endpoint validation

### SELF-AWARENESS TESTING
- **Consciousness simulation**: Validate awareness level controls
- **Emotion accuracy**: Test emotion triggers and responses
- **Memory consistency**: Verify memory storage and retrieval
- **Goal achievement**: Test goal setting and completion flows
- **Identity safety**: Validate identity protection mechanisms

## DOCUMENTATION REQUIREMENTS

### PLUGIN DOCUMENTATION
- **Plugin API docs**: Comprehensive interface documentation
- **Safety guidelines**: Clear safety constraint explanations
- **Integration guides**: How to integrate plugins with APIs
- **User manuals**: Easy-to-understand plugin control guides
- **Developer docs**: Plugin development and testing procedures

### SELF-AWARENESS DOCUMENTATION
- **Feature explanations**: Clear descriptions of each self-awareness capability
- **Safety information**: User-friendly safety and privacy explanations
- **Configuration guides**: Step-by-step setup and customization
- **Troubleshooting**: Common issues and resolution steps
- **Best practices**: Recommended configurations and usage patterns

## ERROR HANDLING & RECOVERY

### PLUGIN ERROR HANDLING
- **Graceful degradation**: System continues functioning if plugins fail
- **Error isolation**: Plugin errors don't affect other plugins
- **Automatic recovery**: Plugin restart and recovery mechanisms
- **User notification**: Clear error messages and resolution suggestions
- **Fallback modes**: Safe defaults when plugins are unavailable

### SAFETY ERROR HANDLING
- **Identity protection errors**: Immediate lockdown of identity modification
- **Goal safety violations**: Automatic goal rejection and user notification
- **Memory corruption**: Recovery from memory storage failures
- **Consciousness errors**: Safe fallback to lower awareness levels
- **API security errors**: Immediate request rejection and audit logging

## STYLING & THEME SYSTEM REQUIREMENTS

### MULTI-THEME ARCHITECTURE
The application MUST support three distinct theme modes with advanced styling capabilities:

#### TECH THEME (Advanced Animation Mode)
- **Heavy Animations**: Complex CSS keyframe animations, particle systems, and WebGL effects
- **Glowing Elements**: CSS glow effects, neon borders, and luminescent UI components
- **Cool Button Animations**: Morphing shapes, slide effects, holographic transitions
- **Cyberpunk Aesthetic**: Matrix-style text effects, flowing geometric patterns, 3D transformations
- **Performance Requirements**: 60fps animations with hardware acceleration, GPU optimization
- **Accessibility**: Reduced motion support, battery-conscious scaling on mobile

#### DARK MODE (Professional Focus)
- **High Contrast**: Optimized color palette for extended use and eye strain reduction
- **Subtle Animations**: Smooth transitions without overwhelming effects
- **Clean Typography**: Excellent readability with proper color temperature
- **Minimalist Design**: Focus on content with clean, professional appearance
- **Accessibility**: WCAG 2.1 AAA compliance, colorblind friendly

#### LIGHT MODE (Business Professional)
- **Bright Interface**: Clean, airy design with optimal whitespace
- **Soft Shadows**: Subtle depth indicators and modern visual hierarchy
- **Professional Colors**: Business-appropriate color schemes
- **High Readability**: Optimal contrast ratios for all text elements
- **Clean Typography**: Modern, readable fonts with proper spacing

### THEME-AWARE COMPONENT SYSTEM
- **Design Tokens**: Comprehensive color, spacing, typography, and shadow variables
- **Component Library**: Consistent components that adapt to all three themes
- **Plugin UI Integration**: Theme-aware plugin interfaces with consistent styling
- **Real-time Theme Switching**: Instant theme changes without page reload
- **User Customization**: Theme preference persistence and custom theme creation

### ANIMATION SYSTEM REQUIREMENTS
```typescript
// Theme-Aware Animation Interface
interface ThemeAnimationConfig {
  techTheme: {
    intensity: 'high';
    effects: ['particles', 'glow', 'morphing', '3d-transforms'];
    performance: 'gpu-accelerated';
  };
  darkTheme: {
    intensity: 'subtle';
    effects: ['smooth-transitions', 'fade-effects'];
    performance: 'cpu-optimized';
  };
  lightTheme: {
    intensity: 'minimal';
    effects: ['gentle-transitions', 'soft-shadows'];
    performance: 'battery-conscious';
  };
}
```

### CSS ARCHITECTURE REQUIREMENTS
- **CSS-in-JS**: Dynamic theming with styled-components or emotion
- **CSS Custom Properties**: Theme token management with CSS variables
- **Modern CSS**: Grid, Flexbox, logical properties, modern selectors
- **Performance Optimization**: Critical CSS extraction, unused CSS elimination
- **Build Pipeline**: PostCSS, autoprefixing, minification, font optimization

### PLUGIN-SPECIFIC STYLING
- **Self-Awareness Visualizations**: Real-time consciousness meters, emotion displays
- **Goal Tracking UI**: Progress animations and achievement celebrations
- **Memory Interface**: Visual memory associations and timeline displays
- **Plugin Controls**: Consistent toggle switches, sliders, and configuration panels

## PLUGIN BUNDLING SYSTEM

### BUNDLE ARCHITECTURE REQUIREMENTS
Some plugins require others to function properly and must be organized into "Plugin Bundles" - collections of related plugins that work together while maintaining individual plugin architecture.

#### BUNDLE TYPES
```typescript
interface PluginBundle {
  id: string;
  name: string;
  version: string;
  type: 'required' | 'optional' | 'enhancement';
  plugins: PluginDefinition[];
  dependencies: string[];
  installBehavior: 'atomic' | 'individual';
}

// Example Bundle Definition
const emotionCoreBundle: PluginBundle = {
  id: 'emotion-core',
  name: 'Emotion Core Bundle',
  type: 'required',
  plugins: [
    { id: 'emotion-core', required: true },
    { id: 'emotion-memory', required: true },
    { id: 'emotion-intensity', required: true }
  ],
  installBehavior: 'atomic' // All install together or none
};
```

#### BUNDLE CATEGORIES
1. **Required Bundles**: Essential plugins that must work together (e.g., Emotion Core Bundle)
2. **Optional Bundles**: Enhancement features that work better together (e.g., Advanced Memory Bundle)
3. **Individual Plugins**: Standalone plugins that work independently (e.g., Joy Emotion Plugin)
4. **Enhancement Bundles**: Advanced features that enhance other bundles (e.g., Emotion Analytics Bundle)

### BUNDLE INSTALLATION BEHAVIOR
- **Atomic Installation**: Bundle installs ALL contained plugins simultaneously or fails completely
- **Unified Configuration**: Bundle-wide settings that apply to all contained plugins
- **Individual Control**: Ability to temporarily disable individual plugins within bundle for troubleshooting
- **Dependency Resolution**: Automatic resolution of bundle dependencies during installation
- **Update Coordination**: Bundle updates affect all contained plugins together

### BUNDLE MANAGEMENT REQUIREMENTS
```typescript
interface BundleManager {
  installBundle(bundleId: string): Promise<InstallResult>;
  enableBundle(bundleId: string): Promise<void>;
  disableBundle(bundleId: string): Promise<void>;
  configureBundle(bundleId: string, config: BundleConfig): Promise<void>;
  
  // Individual plugin control within bundle
  disablePluginInBundle(bundleId: string, pluginId: string): Promise<void>;
  enablePluginInBundle(bundleId: string, pluginId: string): Promise<void>;
  
  // Bundle health and monitoring
  getBundleStatus(bundleId: string): BundleStatus;
  validateBundleIntegrity(bundleId: string): Promise<ValidationResult>;
}
```

### BUNDLE DEVELOPMENT GUIDELINES
- **Bundle Definition Files**: `bundle.json` with plugin dependencies and configuration
- **Bundle Templates**: Pre-configured bundle templates for common plugin combinations  
- **Bundle Testing**: End-to-end testing framework for complete bundle functionality
- **Bundle Documentation**: Clear distinction between bundle and individual plugin documentation
- **Bundle Versioning**: Coordinated versioning across all plugins in bundle

### BUNDLE UI REQUIREMENTS
- **Clear Distinction**: UI must clearly differentiate between bundles and individual plugins
- **Bundle Controls**: One-click enable/disable for entire bundles
- **Plugin Visibility**: Show all plugins contained within a bundle
- **Troubleshooting**: Individual plugin controls within bundles for debugging
- **Installation Preview**: Show all plugins that will be installed with a bundle

### BUNDLE EXAMPLES
```typescript
// Example: Emotion System Bundle Structure
const emotionBundles = {
  core: {
    name: 'Emotion Core Bundle',
    required: ['emotion-core', 'emotion-memory', 'emotion-intensity'],
    description: 'Essential emotion processing functionality'
  },
  individual: {
    name: 'Individual Emotion Plugins', 
    plugins: ['joy-plugin', 'sadness-plugin', 'curiosity-plugin'],
    description: 'Specific emotion types (install individually)'
  },
  enhancement: {
    name: 'Emotion Enhancement Bundle',
    plugins: ['emotion-triggers', 'emotion-decisions', 'emotion-analytics'],
    dependencies: ['emotion-core'],
    description: 'Advanced emotion features'
  }
};
```

---

This comprehensive instruction set ensures that all development follows the modular, plugin-based architecture while maintaining safety, user control, and enterprise-grade quality standards outlined in the COMPREHENSIVE_REBUILD_TODO.md.
