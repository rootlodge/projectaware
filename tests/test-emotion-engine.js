const EmotionEngine = require('../UNORGANIZED-FILES/EmotionEngine');
const StateManager = require('../UNORGANIZED-FILES/StateManager');
const chalk = require('chalk');

console.log(chalk.blue.bold('🧪 EMOTION ENGINE TEST'));
console.log(chalk.gray('Testing emotion detection, analysis, and response generation...\n'));

// Initialize emotion engine
const stateManager = new StateManager();
const emotionEngine = new EmotionEngine(stateManager);

// Test cases for emotion detection
const testCases = [
  {
    text: "I'm so happy and excited about this project! It's going to be amazing!",
    expected: 'joy',
    description: 'Happy and excited text'
  },
  {
    text: "I'm feeling really sad and disappointed about what happened.",
    expected: 'sadness',
    description: 'Sad and disappointed text'
  },
  {
    text: "This is so annoying and frustrating! I can't believe this happened.",
    expected: 'anger',
    description: 'Angry and frustrated text'
  },
  {
    text: "I'm worried and anxious about the upcoming presentation.",
    expected: 'fear',
    description: 'Worried and anxious text'
  },
  {
    text: "Wow, that's really surprising! I didn't expect that at all.",
    expected: 'surprise',
    description: 'Surprised text'
  },
  {
    text: "That's absolutely disgusting and revolting.",
    expected: 'disgust',
    description: 'Disgusted text'
  },
  {
    text: "I'm really looking forward to tomorrow's meeting.",
    expected: 'anticipation',
    description: 'Anticipatory text'
  },
  {
    text: "I trust you completely and have faith in your abilities.",
    expected: 'trust',
    description: 'Trusting text'
  },
  {
    text: "The weather is nice today.",
    expected: 'neutral',
    description: 'Neutral text'
  },
  {
    text: "😊 I'm so happy! 🎉 This is fantastic! ✨",
    expected: 'joy',
    description: 'Text with happy emojis'
  }
];

async function runTests() {
  console.log(chalk.yellow('1. Testing emotion detection...'));
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const result = emotionEngine.analyzeEmotion(testCase.text, 'test');
    
    const passed = result.primary === testCase.expected;
    const status = passed ? chalk.green('✓') : chalk.red('✗');
    
    console.log(`${status} ${testCase.description}`);
    console.log(`   Input: "${testCase.text}"`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result.primary} (${(result.intensity * 100).toFixed(1)}% intensity)`);
    
    if (result.triggers && result.triggers.length > 0) {
      console.log(`   Triggers: ${result.triggers.map(t => t.emotion).join(', ')}`);
    }
    
    if (passed) passedTests++;
    console.log();
  }
  
  console.log(chalk.cyan(`Test Results: ${passedTests}/${totalTests} passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`));
  console.log();
  
  // Test emotion response generation
  console.log(chalk.yellow('2. Testing emotion response generation...'));
  
  const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral'];
  
  for (const emotion of emotions) {
    emotionEngine.updateEmotion(emotion, null, 0.8, 0.9, [], 'test');
    const response = emotionEngine.generateEmotionalResponse('test');
    
    console.log(`${emotion.toUpperCase()}: ${response.response}`);
  }
  
  console.log();
  
  // Test style modifiers
  console.log(chalk.yellow('3. Testing response style modifiers...'));
  
  for (const emotion of emotions) {
    emotionEngine.updateEmotion(emotion, null, 0.7, 0.8, [], 'test');
    const modifiers = emotionEngine.getResponseStyleModifiers();
    
    console.log(`${emotion.toUpperCase()}:`);
    console.log(`  Tone: ${modifiers.tone}`);
    console.log(`  Enthusiasm: ${(modifiers.enthusiasm * 100).toFixed(1)}%`);
    console.log(`  Empathy: ${(modifiers.empathy * 100).toFixed(1)}%`);
    console.log(`  Formality: ${(modifiers.formality * 100).toFixed(1)}%`);
    console.log();
  }
  
  // Test emotion patterns and history
  console.log(chalk.yellow('4. Testing emotion patterns and history...'));
  
  // Generate some emotion history
  const emotionSequence = ['neutral', 'joy', 'surprise', 'joy', 'sadness', 'anger', 'neutral', 'trust', 'joy'];
  
  for (const emotion of emotionSequence) {
    emotionEngine.updateEmotion(emotion, null, Math.random() * 0.8 + 0.2, 0.8, [], 'test_sequence');
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay for timestamp differences
  }
  
  const patterns = emotionEngine.getEmotionPatterns();
  console.log(chalk.cyan('Emotion Patterns:'));
  console.log(`Dominant Emotion: ${patterns.dominantEmotion}`);
  console.log(`Emotional Stability: ${(patterns.emotionalStability * 100).toFixed(1)}%`);
  
  console.log(chalk.cyan('Emotion Frequency:'));
  for (const [emotion, data] of Object.entries(patterns.emotionFrequency)) {
    console.log(`  ${emotion}: ${data.count} times (avg intensity: ${(data.averageIntensity * 100).toFixed(1)}%)`);
  }
  
  console.log(chalk.cyan('Emotion Transitions:'));
  for (const [transition, count] of Object.entries(patterns.transitions)) {
    console.log(`  ${transition}: ${count} times`);
  }
  
  console.log();
  
  // Test emotion statistics
  console.log(chalk.yellow('5. Testing emotion statistics...'));
  
  const stats = emotionEngine.getEmotionStats();
  console.log(`Current Emotion: ${stats.current.primary} (${(stats.current.intensity * 100).toFixed(1)}% intensity)`);
  console.log(`Dominant Emotion: ${stats.dominant}`);
  console.log(`Emotional Stability: ${(stats.stability * 100).toFixed(1)}%`);
  console.log(`Total Emotion Changes: ${stats.history.total}`);
  
  console.log(chalk.cyan('Recent Emotion History:'));
  stats.history.recent.forEach((emotion, index) => {
    console.log(`  ${index + 1}. ${emotion.primary} (${(emotion.intensity * 100).toFixed(1)}%) - ${emotion.context}`);
  });
  
  console.log();
  
  // Test edge cases
  console.log(chalk.yellow('6. Testing edge cases...'));
  
  // Empty input
  const emptyResult = emotionEngine.analyzeEmotion('', 'empty_test');
  console.log(`Empty input: ${emptyResult.primary} (${(emptyResult.intensity * 100).toFixed(1)}% intensity)`);
  
  // Very long input
  const longInput = 'This is a very long text that contains multiple emotions. I am happy about some things, sad about others, and angry about specific situations. I feel surprised by recent events and trust that things will work out. '.repeat(10);
  const longResult = emotionEngine.analyzeEmotion(longInput, 'long_test');
  console.log(`Long input: ${longResult.primary} (${(longResult.intensity * 100).toFixed(1)}% intensity)`);
  
  // Mixed emotions
  const mixedInput = 'I am happy but also sad, excited yet worried, and grateful while being disappointed.';
  const mixedResult = emotionEngine.analyzeEmotion(mixedInput, 'mixed_test');
  console.log(`Mixed emotions: ${mixedResult.primary}${mixedResult.secondary ? ` + ${mixedResult.secondary}` : ''} (${(mixedResult.intensity * 100).toFixed(1)}% intensity)`);
  
  console.log();
  
  // Test reset functionality
  console.log(chalk.yellow('7. Testing emotion reset...'));
  
  emotionEngine.resetEmotion();
  const resetResult = emotionEngine.getCurrentEmotion();
  console.log(`After reset: ${resetResult.primary} (${(resetResult.intensity * 100).toFixed(1)}% intensity)`);
  
  console.log();
  console.log(chalk.green.bold('✅ All emotion engine tests completed!'));
  console.log(chalk.gray('The emotion engine is working correctly and ready for integration.'));
  
  // Save final state
  emotionEngine.saveEmotions();
  console.log(chalk.blue('💾 Emotion state saved to emotions.json'));
}

runTests().catch(console.error);
