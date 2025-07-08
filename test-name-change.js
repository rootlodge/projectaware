// test-name-change.js
// Test script to verify name change functionality

const fs = require('fs');
const { evolveIdentity, loadIdentity } = require('./brain');

async function testNameChange() {
  console.log('Before name change:');
  const beforeIdentity = loadIdentity();
  console.log('Current name:', beforeIdentity.name);
  
  // Simulate a name change request
  const nameChangeLog = 'USER: Change your name to TestBot\nAI: I will update my name to TestBot';
  
  console.log('\nExecuting name change...');
  await evolveIdentity(nameChangeLog);
  
  console.log('\nAfter name change:');
  const afterIdentity = loadIdentity();
  console.log('New name:', afterIdentity.name);
  
  // Revert back to Verity
  const revertLog = 'USER: Change your name back to Verity\nAI: I will update my name back to Verity';
  await evolveIdentity(revertLog);
  
  console.log('\nAfter reverting:');
  const finalIdentity = loadIdentity();
  console.log('Final name:', finalIdentity.name);
}

testNameChange().catch(console.error);
