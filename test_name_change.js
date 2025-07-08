const { evolveIdentity, loadIdentity } = require('./brain');

async function testNameChange() {
  console.log('Current identity:', loadIdentity());
  
  // Test direct name change command
  console.log('\nTesting: "Change your name to TestBot"');
  await evolveIdentity('Change your name to TestBot');
  console.log('After change:', loadIdentity());
  
  // Change back
  console.log('\nTesting: "Your name is Verity"');
  await evolveIdentity('Your name is Verity');
  console.log('After change:', loadIdentity());
}

testNameChange().catch(console.error);
