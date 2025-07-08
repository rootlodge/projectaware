// clean-thoughts.js - Remove repetitive thoughts from logs
const fs = require('fs');

const thoughtsFile = './logs/thoughts.log';

if (!fs.existsSync(thoughtsFile)) {
  console.log('No thoughts.log file found');
  process.exit(0);
}

const content = fs.readFileSync(thoughtsFile, 'utf-8');
const entries = content.split('-----------------------------').filter(e => e.trim());

const cleaned = [];
let lastThought = '';
let consecutiveRepeats = 0;
let lastWasMeaningful = false;

entries.forEach(entry => {
  const trimmed = entry.trim();
  if (!trimmed) return;
  
  // Extract just the thought content (without timestamp)
  const thoughtMatch = trimmed.match(/\[.*?\]\n(.*)/s);
  const thoughtContent = thoughtMatch ? thoughtMatch[1].trim() : trimmed;
  
  // Check if this is meaningful content
  const isMeaningful = 
    trimmed.includes('[Deep Reflection]') ||
    trimmed.includes('[Satisfaction Analysis]') ||
    trimmed.includes('USER ➜') ||
    trimmed.includes('[Goal Assigned]') ||
    trimmed.includes('[User Reward]') ||
    !thoughtContent.startsWith('No new information to process') &&
    !thoughtContent.startsWith('The AI consistently responds') &&
    !thoughtContent.startsWith('The AI is operating within expected parameters');
  
  // If it's meaningful, always keep it
  if (isMeaningful) {
    cleaned.push(trimmed);
    lastThought = thoughtContent;
    consecutiveRepeats = 0;
    lastWasMeaningful = true;
    return;
  }
  
  // For repetitive thoughts, only keep if:
  // 1. It's the first occurrence
  // 2. It's right after meaningful content
  // 3. We haven't had more than 2 consecutive repeats
  
  if (thoughtContent !== lastThought) {
    // New thought, keep it
    cleaned.push(trimmed);
    lastThought = thoughtContent;
    consecutiveRepeats = 0;
    lastWasMeaningful = false;
  } else if (lastWasMeaningful || consecutiveRepeats < 2) {
    // Keep limited repeats
    cleaned.push(trimmed);
    consecutiveRepeats++;
    lastWasMeaningful = false;
  }
  // Otherwise skip this repetitive entry
});

const cleanedContent = cleaned.join('\n-----------------------------\n') + '\n-----------------------------\n';

// Backup original file
fs.writeFileSync(thoughtsFile + '.backup', content);
fs.writeFileSync(thoughtsFile, cleanedContent);

console.log(`Original entries: ${entries.length}`);
console.log(`Cleaned entries: ${cleaned.length}`);
console.log(`Removed: ${entries.length - cleaned.length} repetitive thoughts`);
console.log('Original file backed up as thoughts.log.backup');
console.log('✅ Thoughts log cleaned!');
