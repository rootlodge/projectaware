# 🗂️ File Organization & Reference Update Checklist

## Status: 🚧 IN PROGRESS

This document tracks all file movements and reference updates needed to properly organize the codebase.

---

## 📋 File Movement Plan

### ✅ COMPLETED MOVEMENTS

#### Config Files
- [x] `config/emotions.json` - Already in correct location
- [x] `config/models.json` - Already in correct location

#### Core System Files
- [x] `src/core/ModelManager.js` - Already in correct location
- [x] `src/core/core.json` - Already in correct location

#### Advanced Systems
- [x] `src/systems/DelayedRefinementSystem.js` - Already in correct location
- [x] `src/systems/EnhancedEmotionManager.js` - Already in correct location

---

## 🚨 PENDING MOVEMENTS

### Core Application Files (UNORGANIZED-FILES → src/core/)
- [ ] `UNORGANIZED-FILES/brain.js` → `src/core/brain.js`
- [ ] `UNORGANIZED-FILES/memory.js` → `src/core/memory.js`
- [ ] `UNORGANIZED-FILES/logger.js` → `src/utils/logger.js`
- [ ] `UNORGANIZED-FILES/StateManager.js` → `src/core/StateManager.js`

### Agent System Files (UNORGANIZED-FILES → src/agents/)
- [ ] `UNORGANIZED-FILES/CentralBrainAgent.js` → `src/agents/CentralBrainAgent.js`
- [ ] `UNORGANIZED-FILES/MultiAgentManager.js` → `src/agents/MultiAgentManager.js`
- [ ] `UNORGANIZED-FILES/InternalAgentSystem.js` → `src/agents/InternalAgentSystem.js`

### System Components (UNORGANIZED-FILES → src/systems/)
- [ ] `UNORGANIZED-FILES/EmotionEngine.js` → `src/systems/EmotionEngine.js`
- [ ] `UNORGANIZED-FILES/ResponseCache.js` → `src/systems/ResponseCache.js`
- [ ] `UNORGANIZED-FILES/HelpSystem.js` → `src/systems/HelpSystem.js`
- [ ] `UNORGANIZED-FILES/IntelligentCleaner.js` → `src/systems/IntelligentCleaner.js`
- [ ] `UNORGANIZED-FILES/TaskManager.js` → `src/systems/TaskManager.js`

### Configuration Files (UNORGANIZED-FILES → config/)
- [ ] `UNORGANIZED-FILES/emotions.json` → `config/emotions.json` (merge/replace)
- [ ] `UNORGANIZED-FILES/task_templates.json` → `config/task_templates.json`

### Documentation (UNORGANIZED-FILES → docs/)
- [ ] `UNORGANIZED-FILES/CEREBRUM_IMPLEMENTATION_COMPLETE.md` → `docs/CEREBRUM_IMPLEMENTATION_COMPLETE.md`

### Root Level Files (UNORGANIZED-FILES → root/)
- [ ] `UNORGANIZED-FILES/agent.js` → `agent.js` (already moved manually)

---

## 🔗 REFERENCE UPDATES NEEDED

### Files with Import/Require Statements to Update

#### `agent.js` (ROOT)
Current imports that need updating:
```javascript
const { askLLM, loadIdentity, ... } = require('./brain');
const { saveMessage, ... } = require('./memory');
const MultiAgentManager = require('./MultiAgentManager');
const InternalAgentSystem = require('./InternalAgentSystem');
const HelpSystem = require('./HelpSystem');
const CentralBrainAgent = require('./CentralBrainAgent');
```

**Updated imports needed:**
```javascript
const { askLLM, loadIdentity, ... } = require('./src/core/brain');
const { saveMessage, ... } = require('./src/core/memory');
const MultiAgentManager = require('./src/agents/MultiAgentManager');
const InternalAgentSystem = require('./src/agents/InternalAgentSystem');
const HelpSystem = require('./src/systems/HelpSystem');
const CentralBrainAgent = require('./src/agents/CentralBrainAgent');
```

#### `src/core/brain.js` (MOVE FROM UNORGANIZED-FILES)
Current imports that need updating:
```javascript
const StateManager = require('./StateManager');
const EmotionEngine = require('./EmotionEngine');
const ResponseCache = require('./ResponseCache');
```

**Updated imports needed:**
```javascript
const StateManager = require('./StateManager'); // Already in same folder
const EmotionEngine = require('../systems/EmotionEngine');
const ResponseCache = require('../systems/ResponseCache');
```

#### `src/agents/CentralBrainAgent.js` (MOVE FROM UNORGANIZED-FILES)
Current imports that need updating:
```javascript
const logger = require('./logger');
const { askLLM } = require('./brain');
const IntelligentCleaner = require('./IntelligentCleaner');
const TaskManager = require('./TaskManager');
```

**Updated imports needed:**
```javascript
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');
const IntelligentCleaner = require('../systems/IntelligentCleaner');
const TaskManager = require('../systems/TaskManager');
```

#### `src/systems/DelayedRefinementSystem.js` (ALREADY MOVED)
Current imports that need updating:
```javascript
const logger = require('../logger');
const { askLLM } = require('../brain');
```

**Updated imports needed:**
```javascript
const logger = require('../utils/logger');
const { askLLM } = require('../core/brain');
```

#### `src/systems/EnhancedEmotionManager.js` (ALREADY MOVED)
Current imports that need updating:
```javascript
const logger = require('../logger');
```

**Updated imports needed:**
```javascript
const logger = require('../utils/logger');
```

#### `src/core/ModelManager.js` (ALREADY MOVED)
Current imports that need updating:
```javascript
const logger = require('../logger');
```

**Updated imports needed:**
```javascript
const logger = require('../utils/logger');
```

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

## 🚀 EXECUTION STEPS

### Phase 1: File Movement
1. [ ] Move `logger.js` to `src/utils/`
2. [ ] Move `brain.js` to `src/core/`
3. [ ] Move `memory.js` to `src/core/`
4. [ ] Move `StateManager.js` to `src/core/`
5. [ ] Move `CentralBrainAgent.js` to `src/agents/`
6. [ ] Move `MultiAgentManager.js` to `src/agents/`
7. [ ] Move `InternalAgentSystem.js` to `src/agents/`
8. [ ] Move `EmotionEngine.js` to `src/systems/`
9. [ ] Move `ResponseCache.js` to `src/systems/`
10. [ ] Move `HelpSystem.js` to `src/systems/`
11. [ ] Move `IntelligentCleaner.js` to `src/systems/`
12. [ ] Move `TaskManager.js` to `src/systems/`
13. [ ] Move `task_templates.json` to `config/`
14. [ ] Move `CEREBRUM_IMPLEMENTATION_COMPLETE.md` to `docs/`

### Phase 2: Reference Updates
1. [ ] Update all imports in `agent.js`
2. [ ] Update all imports in `src/core/brain.js`
3. [ ] Update all imports in `src/agents/CentralBrainAgent.js`
4. [ ] Update all imports in `src/agents/MultiAgentManager.js`
5. [ ] Update all imports in `src/agents/InternalAgentSystem.js`
6. [ ] Update all imports in `src/systems/EmotionEngine.js`
7. [ ] Update all imports in `src/systems/ResponseCache.js`
8. [ ] Update all imports in `src/systems/HelpSystem.js`
9. [ ] Update all imports in `src/systems/IntelligentCleaner.js`
10. [ ] Update all imports in `src/systems/TaskManager.js`
11. [ ] Update all imports in `src/systems/DelayedRefinementSystem.js`
12. [ ] Update all imports in `src/systems/EnhancedEmotionManager.js`
13. [ ] Update all imports in `src/core/ModelManager.js`

### Phase 3: Testing & Validation
1. [ ] Test main agent.js startup
2. [ ] Test all require/import statements
3. [ ] Test core functionality
4. [ ] Test agent systems
5. [ ] Test emotion systems
6. [ ] Test delayed refinement
7. [ ] Test model management
8. [ ] Validate all file paths
9. [ ] Clean up UNORGANIZED-FILES directory

### Phase 4: Configuration Updates
1. [ ] Update package.json scripts if needed
2. [ ] Update README.md with new structure
3. [ ] Update any hardcoded paths in config files
4. [ ] Update test files to use new paths

---

## 🔍 FILES TO CHECK FOR ADDITIONAL REFERENCES

### Test Files (tests/)
- [ ] `tests/test-central-brain.js`
- [ ] `tests/test-improved-cerebrum.js`
- [ ] `tests/test-emotion-engine.js`
- [ ] `tests/test-cache-help.js`
- [ ] `tests/test-internal-agents.js`
- [ ] `tests/test-multi-agent.js`

### Configuration Files
- [ ] `config/emotions.json` - Check for any file path references
- [ ] `config/models.json` - Check for any file path references
- [ ] `package.json` - Check for any script paths

### Documentation Files
- [ ] `README.md` - Update file structure documentation
- [ ] Any other .md files with file path references

---

## 🛠️ COMMANDS TO EXECUTE

### PowerShell Commands for File Movement:
```powershell
# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path ".\src\utils"

# Move files
Move-Item ".\UNORGANIZED-FILES\logger.js" ".\src\utils\logger.js"
Move-Item ".\UNORGANIZED-FILES\brain.js" ".\src\core\brain.js"
Move-Item ".\UNORGANIZED-FILES\memory.js" ".\src\core\memory.js"
Move-Item ".\UNORGANIZED-FILES\StateManager.js" ".\src\core\StateManager.js"
Move-Item ".\UNORGANIZED-FILES\CentralBrainAgent.js" ".\src\agents\CentralBrainAgent.js"
Move-Item ".\UNORGANIZED-FILES\MultiAgentManager.js" ".\src\agents\MultiAgentManager.js"
Move-Item ".\UNORGANIZED-FILES\InternalAgentSystem.js" ".\src\agents\InternalAgentSystem.js"
Move-Item ".\UNORGANIZED-FILES\EmotionEngine.js" ".\src\systems\EmotionEngine.js"
Move-Item ".\UNORGANIZED-FILES\ResponseCache.js" ".\src\systems\ResponseCache.js"
Move-Item ".\UNORGANIZED-FILES\HelpSystem.js" ".\src\systems\HelpSystem.js"
Move-Item ".\UNORGANIZED-FILES\IntelligentCleaner.js" ".\src\systems\IntelligentCleaner.js"
Move-Item ".\UNORGANIZED-FILES\TaskManager.js" ".\src\systems\TaskManager.js"
Move-Item ".\UNORGANIZED-FILES\task_templates.json" ".\config\task_templates.json"
Move-Item ".\UNORGANIZED-FILES\CEREBRUM_IMPLEMENTATION_COMPLETE.md" ".\docs\CEREBRUM_IMPLEMENTATION_COMPLETE.md"

# Handle duplicate emotions.json (check content first)
# Move-Item ".\UNORGANIZED-FILES\emotions.json" ".\config\emotions.json" -Force
```

---

## 📝 NOTES

- **Backup First**: Before making any changes, create a backup of the current working state
- **Test Incrementally**: Move and update a few files at a time, test functionality
- **Check Dependencies**: Some files may have circular dependencies that need careful handling
- **Config Files**: The `emotions.json` in UNORGANIZED-FILES may need to be merged with existing config
- **Git Status**: Monitor git status to ensure all files are properly tracked after moves

---

## 🎯 SUCCESS CRITERIA

- [ ] All files moved to appropriate directories
- [ ] All import/require statements updated and working
- [ ] Main agent.js runs without errors
- [ ] All systems (emotion, model, refinement) functional
- [ ] Test suite passes
- [ ] UNORGANIZED-FILES directory cleaned up
- [ ] Documentation updated with new structure

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status:** Ready for execution
