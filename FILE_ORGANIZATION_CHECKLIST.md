# 🗂️ File Organization & Reference Update Checklist

## Status: � RECHECKING AFTER MOVES

This document tracks all file movements and reference updates needed to properly organize the codebase.

---

## 📋 File Movement Plan

### ✅ COMPLETED MOVEMENTS

#### Config Files
- [x] `config/emotions.json` - Already in correct location
- [x] `config/models.json` - Already in correct location

#### Core System Files
- [x] `src/core/brain.js` - ✅ MOVED
- [x] `src/core/memory.js` - ✅ MOVED
- [x] `src/core/StateManager.js` - ✅ MOVED
- [x] `src/core/ModelManager.js` - Already in correct location
- [x] `src/core/core.json` - Already in correct location
- [x] `src/core/logger.js` - ✅ MOVED (but should be in utils/)

#### Agent System Files
- [x] `src/agents/CentralBrainAgent.js` - ✅ MOVED
- [x] `src/agents/MultiAgentManager.js` - ✅ MOVED
- [x] `src/agents/InternalAgentSystem.js` - ✅ MOVED

#### System Components
- [x] `src/systems/EmotionEngine.js` - ✅ MOVED
- [x] `src/systems/ResponseCache.js` - ✅ MOVED
- [x] `src/systems/IntelligentCleaner.js` - ✅ MOVED
- [x] `src/systems/TaskManager.js` - ✅ MOVED
- [x] `src/systems/DelayedRefinementSystem.js` - Already in correct location
- [x] `src/systems/EnhancedEmotionManager.js` - Already in correct location

---

## 🚨 REMAINING ISSUES

### Files Still in Wrong Location
- [ ] `src/core/logger.js` → `src/utils/logger.js` (needs to be moved)

### Files Still in UNORGANIZED-FILES
- [ ] `UNORGANIZED-FILES/HelpSystem.js` → `src/systems/HelpSystem.js` (needs to be moved)
- [ ] `UNORGANIZED-FILES/agent.js` → DELETE (duplicate, keep root version)

### Missing Utils Directory
- [ ] Create `src/utils/` directory
- [ ] Move `src/core/logger.js` to `src/utils/logger.js`

---

## 🔗 CRITICAL IMPORT ISSUES FOUND

### ❌ BROKEN IMPORTS - NEEDS IMMEDIATE FIXING

#### `agent.js` (ROOT) - BROKEN IMPORTS
Current broken imports:
```javascript
const { askLLM, loadIdentity, ... } = require('./brain');
const { saveMessage, ... } = require('./memory');
const MultiAgentManager = require('./MultiAgentManager');
const InternalAgentSystem = require('./InternalAgentSystem');
const HelpSystem = require('./HelpSystem');
const CentralBrainAgent = require('./src/agents/CentralBrainAgent'); // This one is correct
```

**🚨 URGENT FIX NEEDED:**
```javascript
const { askLLM, loadIdentity, ... } = require('./src/core/brain');
const { saveMessage, ... } = require('./src/core/memory');
const MultiAgentManager = require('./src/agents/MultiAgentManager');
const InternalAgentSystem = require('./src/agents/InternalAgentSystem');
const HelpSystem = require('./src/systems/HelpSystem');
const CentralBrainAgent = require('./src/agents/CentralBrainAgent');
```

#### `src/core/brain.js` - BROKEN IMPORTS
Current broken imports:
```javascript
const EmotionEngine = require('./EmotionEngine');
const ResponseCache = require('./ResponseCache');
```

**🚨 URGENT FIX NEEDED:**
```javascript
const EmotionEngine = require('../systems/EmotionEngine');
const ResponseCache = require('../systems/ResponseCache');
```

#### `src/agents/CentralBrainAgent.js` - BROKEN IMPORTS
Current broken imports:
```javascript
const logger = require('../core/logger');
const { askLLM } = require('./brain');
```

**🚨 URGENT FIX NEEDED:**
```javascript
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');
```

#### `src/systems/DelayedRefinementSystem.js` - BROKEN IMPORTS
Current broken imports:
```javascript
const logger = require('../logger');
const { askLLM } = require('../brain');
```

**🚨 URGENT FIX NEEDED:**
```javascript
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');
```

#### `src/systems/EnhancedEmotionManager.js` - BROKEN IMPORTS
Current broken imports:
```javascript
const logger = require('../logger');
```

**🚨 URGENT FIX NEEDED:**
```javascript
const logger = require('../utils/logger');
```

#### `src/core/ModelManager.js` - BROKEN IMPORTS
Current broken imports:
```javascript
const logger = require('../logger');
```

**🚨 URGENT FIX NEEDED:**
```javascript
const logger = require('../utils/logger');
```

#### `UNORGANIZED-FILES/HelpSystem.js` - NEEDS IMPORT UPDATE WHEN MOVED
Current imports:
```javascript
const logger = require('../src/core/logger');
```

**When moved to `src/systems/HelpSystem.js`, fix to:**
```javascript
const logger = require('../utils/logger');
```

---

## 📋 ALL FILES REQUIRING IMPORT UPDATES

### Files with Missing/Incorrect Imports (Need to Check Each)
1. [ ] `src/agents/MultiAgentManager.js` - Check all imports
2. [ ] `src/agents/InternalAgentSystem.js` - Check all imports  
3. [ ] `src/systems/EmotionEngine.js` - Check all imports
4. [ ] `src/systems/ResponseCache.js` - Check all imports
5. [ ] `src/systems/IntelligentCleaner.js` - Check all imports
6. [ ] `src/systems/TaskManager.js` - Check all imports
7. [ ] `src/core/memory.js` - Check all imports
8. [ ] `src/core/StateManager.js` - Check all imports

---

## 📁 TARGET DIRECTORY STRUCTURE

```
neversleep.ai/
├── 📁 src/
│   ├── 📁 core/           # Core system files
│   │   ├── brain.js       # LLM interface & processing
│   │   ├── memory.js      # Memory management
│   │   ├── StateManager.js # State management
│   │   ├── ModelManager.js # Model selection & management
│   │   └── core.json      # Core configuration
│   ├── 📁 agents/         # Agent system files
│   │   ├── CentralBrainAgent.js # CEREBRUM central brain
│   │   ├── MultiAgentManager.js # Multi-agent coordination
│   │   └── InternalAgentSystem.js # Internal agent system
│   ├── 📁 systems/        # System components
│   │   ├── EmotionEngine.js # Emotion processing
│   │   ├── ResponseCache.js # Response caching
│   │   ├── HelpSystem.js  # Help system
│   │   ├── IntelligentCleaner.js # Cleanup system
│   │   ├── TaskManager.js # Task management
│   │   ├── DelayedRefinementSystem.js # Response refinement
│   │   └── EnhancedEmotionManager.js # Enhanced emotion control
│   ├── 📁 utils/          # Utility files
│   │   └── logger.js      # Logging system
│   ├── 📁 workflows/      # Workflow definitions
│   ├── 📁 docs/           # Documentation
│   └── 📁 logs/           # Log files
├── 📁 config/             # Configuration files
│   ├── emotions.json      # Emotion configuration
│   ├── models.json        # Model configuration
│   └── task_templates.json # Task templates
├── 📁 tests/              # Test files
├── 📁 cache/              # Cache directory
├── agent.js               # Main entry point
├── package.json           # Dependencies
└── README.md              # Project documentation
```

---

## 🚀 IMMEDIATE EXECUTION STEPS

### 🔥 PHASE 1: CRITICAL FIXES (DO FIRST)

1. **Create missing utils directory:**
   ```powershell
   New-Item -ItemType Directory -Force -Path ".\src\utils"
   ```

2. **Move logger.js to correct location:**
   ```powershell
   Move-Item ".\src\core\logger.js" ".\src\utils\logger.js"
   ```

3. **Move remaining files:**
   ```powershell
   Move-Item ".\UNORGANIZED-FILES\HelpSystem.js" ".\src\systems\HelpSystem.js"
   ```

4. **Delete duplicate files:**
   ```powershell
   Remove-Item ".\UNORGANIZED-FILES\agent.js"
   ```

### 🔥 PHASE 2: FIX CRITICAL BROKEN IMPORTS

#### Fix `agent.js` (ROOT)
```javascript
// Change these lines:
const { askLLM, loadIdentity, ... } = require('./src/core/brain');
const { saveMessage, ... } = require('./src/core/memory');
const MultiAgentManager = require('./src/agents/MultiAgentManager');
const InternalAgentSystem = require('./src/agents/InternalAgentSystem');
const HelpSystem = require('./src/systems/HelpSystem');
```

#### Fix `src/core/brain.js`
```javascript
// Change these lines:
const EmotionEngine = require('../systems/EmotionEngine');
const ResponseCache = require('../systems/ResponseCache');
```

#### Fix `src/agents/CentralBrainAgent.js`
```javascript
// Change these lines:
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');
```

#### Fix `src/systems/DelayedRefinementSystem.js`
```javascript
// Change these lines:
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');
```

#### Fix `src/systems/EnhancedEmotionManager.js`
```javascript
// Change this line:
const logger = require('../utils/logger');
```

#### Fix `src/core/ModelManager.js`
```javascript
// Change this line:
const logger = require('../utils/logger');
```

#### Fix `src/systems/HelpSystem.js` (after moving)
```javascript
// Change this line:
const logger = require('../utils/logger');
```

### 🔥 PHASE 3: CHECK AND FIX REMAINING FILES

**Each file needs to be checked for imports:**
- [ ] `src/agents/MultiAgentManager.js`
- [ ] `src/agents/InternalAgentSystem.js`
- [ ] `src/systems/EmotionEngine.js`
- [ ] `src/systems/ResponseCache.js`
- [ ] `src/systems/IntelligentCleaner.js`
- [ ] `src/systems/TaskManager.js`
- [ ] `src/core/memory.js`
- [ ] `src/core/StateManager.js`

### � PHASE 4: TEST FILES UPDATE

**All test files need import updates:**
- [ ] `tests/test-central-brain.js`
- [ ] `tests/test-improved-cerebrum.js`
- [ ] `tests/test-emotion-engine.js`
- [ ] `tests/test-cache-help.js`
- [ ] `tests/test-internal-agents.js`
- [ ] `tests/test-multi-agent.js`
- [ ] All other test files

---

## ⚠️ CRITICAL WARNINGS

1. **`agent.js` WILL NOT START** until imports are fixed
2. **All systems will fail** until logger path is corrected
3. **Tests will fail** until paths are updated
4. **Duplicate files exist** and need to be removed

---

## 🛠️ POWER SHELL COMMANDS FOR IMMEDIATE FIXES

```powershell
# Step 1: Create utils directory
New-Item -ItemType Directory -Force -Path ".\src\utils"

# Step 2: Move logger to correct location
Move-Item ".\src\core\logger.js" ".\src\utils\logger.js"

# Step 3: Move remaining files
Move-Item ".\UNORGANIZED-FILES\HelpSystem.js" ".\src\systems\HelpSystem.js"

# Step 4: Delete duplicate
Remove-Item ".\UNORGANIZED-FILES\agent.js"

# Step 5: Remove empty UNORGANIZED-FILES directory
Remove-Item ".\UNORGANIZED-FILES" -Recurse -Force
```

---

## 🎯 UPDATED SUCCESS CRITERIA

### Must Fix Immediately:
- [ ] Create `src/utils/` directory
- [ ] Move `logger.js` to `src/utils/logger.js`
- [ ] Move `HelpSystem.js` to `src/systems/`
- [ ] Delete duplicate `agent.js` in UNORGANIZED-FILES
- [ ] Fix all broken imports in all files
- [ ] Update all test files
- [ ] Clean up UNORGANIZED-FILES directory

### System Functionality:
- [ ] Main agent.js runs without errors
- [ ] All systems (emotion, model, refinement) functional
- [ ] Test suite passes
- [ ] All import/require statements working

### Code Quality:
- [ ] No duplicate files exist
- [ ] All files in correct directories
- [ ] Documentation updated with new structure
- [ ] Git status clean

---

## 📊 CURRENT STATUS SUMMARY

### ✅ COMPLETED:
- Most files moved to correct locations
- Core directory structure created
- Agent and system files organized

### ❌ CRITICAL ISSUES:
- **Logger in wrong location** (src/core instead of src/utils)
- **Multiple broken imports** across all files
- **HelpSystem still in UNORGANIZED-FILES**
- **Duplicate agent.js exists**
- **All test files have wrong paths**

### 🔥 IMMEDIATE PRIORITY:
1. Fix logger location
2. Fix broken imports
3. Clean up remaining files
4. Test functionality

---

**Last Updated:** 2025-01-09 - Post-Move Analysis
**Status:** CRITICAL FIXES REQUIRED - System will not run until imports are fixed
