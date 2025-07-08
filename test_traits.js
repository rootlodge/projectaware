// Test trait reflection system
const { evolveIdentity } = require('./brain');

async function testTraitReflection() {
  console.log('Testing trait reflection with name change...');
  
  // Test name change with trait reflection
  await evolveIdentity('USER: Change your name to Aria, be more creative and artistic');
  
  const identity = require('./identity.json');
  console.log('New identity:', identity);
  
  // Test task-based trait evolution
  console.log('\nTesting task-based trait evolution...');
  await evolveIdentity('USER: I need help with complex data analysis and mathematical computations. Can you be more analytical?');
  
  const updatedIdentity = require('./identity.json');
  console.log('Updated identity:', updatedIdentity);
}

testTraitReflection().catch(console.error);
