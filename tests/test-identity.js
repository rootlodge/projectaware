const { evolveIdentity } = require('./brain');
const fs = require('fs');

async function testIdentityEvolution() {
  console.log('Testing identity evolution...');
  
  // Test with a name change request
  const testLog = `
USER: I think you should change your name to Alex from now on
AGENT: I understand you'd like me to change my name to Alex. Let me consider this evolution.
USER: Yes, Alex sounds much better than your current name
AGENT: Thank you for the feedback. I will update my identity accordingly.
  `;
  
  console.log('\nBefore evolution:');
  const beforeIdentity = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
  console.log(JSON.stringify(beforeIdentity, null, 2));
  
  try {
    await evolveIdentity(testLog);
    
    console.log('\nAfter evolution:');
    const afterIdentity = JSON.parse(fs.readFileSync('./identity.json', 'utf-8'));
    console.log(JSON.stringify(afterIdentity, null, 2));
    
    if (afterIdentity.name !== beforeIdentity.name) {
      console.log('\n✅ Identity evolution successful!');
    } else {
      console.log('\n❌ Identity did not change');
    }
  } catch (error) {
    console.error('❌ Error during identity evolution:', error.message);
  }
}

testIdentityEvolution();
