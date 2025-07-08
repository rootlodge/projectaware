// cleanup-rewards.js
const fs = require('fs');

const rewardsFile = './rewards.json';
const rewards = JSON.parse(fs.readFileSync(rewardsFile, 'utf-8'));

// Keep only meaningful rewards (excluding routine self-rewards)
const meaningfulRewards = rewards.history.filter(reward => {
  const blockedReasons = [
    'Generated grounded thought',
    'Completed deep reflection after user inactivity',
    'Responded to user input and reflected'
  ];
  
  return !blockedReasons.some(blocked => reward.reason.includes(blocked));
});

console.log(`Original rewards: ${rewards.history.length}`);
console.log(`Meaningful rewards kept: ${meaningfulRewards.length}`);
console.log(`Removed: ${rewards.history.length - meaningfulRewards.length} routine self-rewards`);

// Update the rewards file
const cleanedRewards = {
  history: meaningfulRewards
};

fs.writeFileSync(rewardsFile, JSON.stringify(cleanedRewards, null, 2));
console.log('✅ Rewards file cleaned!');
