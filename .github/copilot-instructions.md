# GitHub Copilot Instructions for Neversleep.ai

## Project Overview
Neversleep.ai is an advanced autonomous AI agent with continuous learning, identity evolution, and sophisticated state management. It's built with Node.js and integrates with Ollama for local LLM processing.

## Core Architecture

### Main Components
- **agent.js**: Main event loop, user input handling, responsive processing
- **brain.js**: LLM interactions, identity evolution, anti-hallucination, decision making
- **memory.js**: SQLite persistence, conversation analysis, pattern recognition
- **StateManager.js**: Comprehensive state tracking and management
- **logger.js**: Multi-level logging system with file and console output

### Key Design Patterns

#### 1. Modular Architecture
- Each file has a single responsibility
- Functions are exported/imported using CommonJS modules
- State is managed centrally through StateManager
- Logging is consistent across all modules

#### 2. Async/Await Pattern
```javascript
// Always use async/await for LLM calls and file operations
async function example() {
  const result = await askLLM(prompt);
  await saveMessage('type', content);
}
```

#### 3. Error Handling
```javascript
// Wrap risky operations in try-catch with fallbacks
try {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
} catch (err) {
  logger.error('Operation failed:', err.message);
  // Provide fallback behavior
}
```

## Code Style Guidelines

### 1. Naming Conventions
- **Functions**: camelCase (`askLLM`, `loadIdentity`, `evolveIdentity`)
- **Variables**: camelCase (`userInput`, `currentStatus`, `processingInput`)
- **Constants**: UPPER_SNAKE_CASE (`OLLAMA_URL`)
- **Files**: camelCase or kebab-case (`StateManager.js`, `copilot-instructions.md`)

### 2. Function Structure
```javascript
async function functionName(param1, param2 = defaultValue) {
  // Input validation
  if (!param1) {
    logger.error('Missing required parameter');
    return;
  }
  
  // Main logic
  try {
    const result = await operation();
    logger.info('Operation successful:', result);
    return result;
  } catch (err) {
    logger.error('Operation failed:', err.message);
    // Handle error appropriately
  }
}
```

### 3. Logging Patterns
```javascript
// Use appropriate log levels
logger.info('Normal operation completed');
logger.warn('Potential issue detected');
logger.error('Error occurred:', error.message);
logger.debug('Detailed debugging info:', data);
```

## Key Features Implementation

### 1. Identity Evolution System
When working with identity changes:
```javascript
// Pattern for identity evolution
async function evolveIdentity(memoryLog) {
  // 1. Check for direct name change patterns first
  const directPatterns = [
    /change your name to\s+(\w+)/i,
    /your name is\s+(\w+)/i,
    // ... more patterns
  ];
  
  // 2. Use StateManager to record changes
  stateManager.recordIdentityEvolution({
    oldName: currentIdentity.name,
    name: newName,
    traits: newTraits,
    reason: 'User request'
  });
  
  // 3. Always validate and limit traits to 10 maximum
  traits: traits.filter(t => !core.locked_traits.includes(t)).slice(0, 10)
}
```

### 2. State Management
Always use StateManager for persistent state:
```javascript
// Record user interactions
stateManager.recordInteraction('user_message', {
  satisfaction: 'pending',
  tone: 'conversational'
});

// Record learning events
stateManager.recordLearning('New Concept', 'Context description');

// Update dynamic state
stateManager.updateDynamicState({ mood: 'happy', goal: 'assist user' });
```

### 3. Anti-Hallucination System
Follow these patterns for LLM responses:
```javascript
// Use config-driven hallucination detection
const config = loadConfig();
if (config.hallucination_detection.enabled) {
  const cleanedResponse = validateResponse(response);
}

// Use low temperature for JSON responses
const result = await askLLM(prompt, 'gemma3:latest', 0.1);
```

### 4. Responsive User Interaction
Implement user input interruption:
```javascript
// Check for user input before long operations
if (processingInput || inputBuffer) {
  return; // or continue; in loops
}

// Set processing flags appropriately
processingInput = true;
// ... do processing
processingInput = false;
```

## File Structure Patterns

### Configuration Files (JSON)
- **core.json**: Unchangeable identity core
- **identity.json**: Dynamic identity (name, mission, traits)
- **config.json**: System configuration and settings
- **state.json**: Comprehensive system state
- **dynamic.json**: Real-time mood and goals

### Log Files
- **logs/thoughts.log**: Filtered stream of consciousness
- **logs/info.log**: General information
- **logs/error.log**: Error tracking
- **logs/debug.log**: Detailed debugging
- **logs/hallucination.log**: Hallucination detection logs

## Common Operations

### 1. Adding New Commands
```javascript
// In agent.js runThoughtLoop function
if (userInput.toLowerCase().startsWith('newcommand')) {
  const param = userInput.substring(10).trim();
  
  // Process command
  const result = await processNewCommand(param);
  
  // Log and respond
  logThought(`[New Command] ${result}`);
  currentStatus = 'command processed';
  continue;
}
```

### 2. Adding New State Tracking
```javascript
// In StateManager.js, add new tracking method
recordNewMetric(data) {
  this.updateState({
    newCategory: {
      ...this.getState().newCategory,
      ...data,
      timestamp: new Date().toISOString()
    }
  });
}
```

### 3. Extending Identity System
```javascript
// In brain.js, enhance evolveIdentity function
// Always consider:
// - Trait validation and limits
// - State recording
// - Error handling with fallbacks
// - JSON parsing safety
```

## LLM Integration Best Practices

### 1. Prompt Engineering
```javascript
// Structure prompts clearly
const prompt = `You are a JSON parser. You MUST return only valid JSON.

Context: ${context}

Instructions:
- Specific instruction 1
- Specific instruction 2

Output format: {"key": "value"}

JSON:`;
```

### 2. Response Validation
```javascript
// Always validate LLM responses
let jsonMatch = result.match(/\{.*\}/s);
if (!jsonMatch) {
  logger.warn('No JSON found in response');
  return fallbackValue;
}

const parsed = JSON.parse(jsonMatch[0]);
```

### 3. Temperature Settings
- **0.1**: For JSON parsing and structured responses
- **0.3**: For trait reflection and creative tasks
- **0.7**: For general conversation and thoughts

## Testing Patterns

### 1. Feature Testing
```javascript
// Create test files for new features
async function testNewFeature() {
  console.log('Testing new feature...');
  
  // Test case 1
  const result1 = await newFeature(input1);
  console.log('Test 1:', result1);
  
  // Test case 2
  const result2 = await newFeature(input2);
  console.log('Test 2:', result2);
  
  console.log('✅ Tests completed');
}
```

### 2. Error Testing
Always test error conditions and edge cases:
- Invalid JSON responses
- Missing files
- Network failures
- Invalid user input

## Performance Considerations

### 1. Memory Management
- Limit array sizes (slice(-20) for keeping last 20 items)
- Clean up temporary files
- Use appropriate data structures

### 2. Response Time
- Implement responsive interruption patterns
- Use shorter wait times when user is active
- Cache frequently accessed data

### 3. File I/O
- Use fs-extra for robust file operations
- Implement proper error handling for all file operations
- Ensure directories exist before writing files

## Security and Validation

### 1. Input Sanitization
```javascript
// Validate user input
if (!userInput || typeof userInput !== 'string') {
  logger.warn('Invalid user input received');
  return;
}

const sanitized = userInput.trim().slice(0, 1000); // Limit length
```

### 2. File Path Safety
```javascript
// Use path.join for safe path construction
const safePath = path.join('./logs', `${filename}.log`);
```

### 3. JSON Safety
```javascript
// Always validate JSON structure
if (!data || typeof data !== 'object') {
  throw new Error('Invalid data structure');
}
```

## Documentation Standards

### 1. Function Documentation
```javascript
/**
 * Brief description of what the function does
 * @param {string} param1 - Description of parameter
 * @param {Object} param2 - Description of object parameter
 * @returns {Promise<Object>} Description of return value
 */
async function exampleFunction(param1, param2) {
  // Implementation
}
```

### 2. README Updates
When adding new features:
- Update feature list
- Add usage examples
- Update file structure documentation
- Include configuration options

## Integration Guidelines

### 1. Adding New Dependencies
- Use npm for package management
- Update package.json appropriately
- Consider local vs. cloud dependencies
- Document new requirements in README

### 2. Database Operations
- Use SQLite for persistent storage
- Implement proper connection handling
- Use parameterized queries for safety
- Handle database errors gracefully

### 3. External APIs
- Implement retry logic
- Use appropriate timeouts
- Handle rate limiting
- Log API interactions

## Debugging and Troubleshooting

### 1. Common Issues
- **JSON parsing errors**: Check LLM response format
- **File not found**: Ensure proper initialization
- **Memory issues**: Check array limits and cleanup
- **State inconsistencies**: Verify StateManager updates

### 2. Debug Information
```javascript
// Use debug logging for troubleshooting
logger.debug('Function called with:', { param1, param2 });
logger.debug('Current state:', stateManager.getState());
logger.debug('LLM response:', response);
```

### 3. Error Recovery
- Always provide fallback behaviors
- Maintain system stability during errors
- Log sufficient information for debugging
- Graceful degradation when possible

## Future Development Guidelines

### 1. Extensibility
- Design functions to be easily extended
- Use configuration-driven behavior
- Implement plugin-like architectures where appropriate
- Maintain backward compatibility

### 2. Scalability
- Consider performance implications of new features
- Design for multiple concurrent users if needed
- Implement proper resource management
- Plan for data growth over time

### 3. Maintainability
- Keep functions focused and single-purpose
- Use consistent coding patterns
- Maintain comprehensive documentation
- Implement proper testing coverage

---

## Quick Reference

### Key Files to Modify for Common Tasks
- **New commands**: `agent.js` (runThoughtLoop function)
- **LLM behavior**: `brain.js` (think, evolveIdentity functions)
- **State tracking**: `StateManager.js` (add new record methods)
- **Logging**: `logger.js` (add new log types)
- **Configuration**: `config.json`, `core.json`

### Essential Patterns to Follow
1. Always use async/await for I/O operations
2. Implement proper error handling with fallbacks
3. Use StateManager for all persistent state changes
4. Follow consistent logging patterns
5. Validate all JSON parsing operations
6. Implement responsive user interaction patterns
7. Test both success and error conditions

### Common Gotchas to Avoid
- Don't parse JSON without try-catch
- Don't ignore user input interruption
- Don't create infinite loops without breaks
- Don't forget to limit array sizes
- Don't hardcode file paths
- Don't skip error logging
- Don't create duplicate state tracking

This document should be updated as the project evolves to maintain accurate guidance for GitHub Copilot assistance.
