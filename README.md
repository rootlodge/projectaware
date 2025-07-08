# 🧠 Neversleep.ai

**An Advanced Autonomous AI Agent with Continuous Learning & Adaptation**

Neversleep is a sophisticated CLI-based JavaScript AI agent featuring:

* **Local LLM Processing** (Ollama) - No cloud dependency
* **Continuous Thought Generation** - Always thinking, never sleeping
* **Advanced Memory System** (SQLite) - Remembers everything
* **Dynamic Identity Evolution** - Adapts name, mission, and traits
* **Intelligent Mood & Goal Tracking** - Context-aware behavior
* **Anti-Hallucination System** - Grounded, factual responses
* **User Satisfaction Analysis** - Learns from interaction patterns
* **Responsive User Interaction** - Pauses processing when you type

> "I never sleep. I remember everything. I evolve continuously."

---

## 🚀 Key Features

### 🔄 **Always-On Thought Loop**
- Generates thoughtful responses every second
- **Smart filtering**: Reduces repetitive thoughts in logs
- **Responsive interruption**: Automatically pauses when you start typing
- Waits intelligently for user input without interference

### 🧘 **Deep Self-Reflection & Analysis**
- Performs deep reflection after 60 seconds of inactivity
- **User satisfaction analysis**: Tracks conversation patterns and user happiness
- Learns from interaction history to improve responses
- Analyzes user response patterns (positive/negative indicators, questions, etc.)

### 🧠 **Advanced Identity System**
- **Core Identity** (`core.json`): Unchangeable mission & locked traits
- **Evolving Identity** (`identity.json`): Dynamic name, mission, and traits
- **Intelligent trait reflection**: Adapts traits based on name changes and tasks
- **Up to 10 traits**: Comprehensive personality modeling
- Supports name changes via natural language:
  - "Change your name to..."
  - "Call yourself..."
  - "You are now..."
  - "Become..."

### 🎯 **Smart Goal System**
- Manual goals: `goal: your objective here`
- AI self-generates contextual goals based on reflection and conversation
- Goal tracking influences thought patterns and behavior

### 🤖 **Multi-Agent Workflow System**
- **Collaborative AI**: Multiple specialized agents working together
- **Workflow orchestration**: Sequential, parallel, and conditional execution
- **Agent specialization**: Code reviewers, analysts, security experts, researchers
- **Structured collaboration**: Discussions, reviews, consensus building
- **Predefined workflows**: Code review, research, problem-solving patterns
- **Custom agent creation**: Define roles, capabilities, and personalities
- **Real-time monitoring**: Track workflow execution and agent performance

### 🎭 **Mood & Emotion Tracking**
- Every thought tagged with current mood
- Dynamic emotional state tracking in `dynamic.json`
- Mood influences response style and decision-making

### 🏆 **Intelligent Reward System**

- **Prevents reward spam**: Only meaningful actions receive rewards
- **User-controlled**: Manual rewards via `reward: [reason]` command
- **Validated rewards**: Tracks genuinely valuable interactions and learning moments
- **No more self-congratulation**: Eliminated automatic self-rewards for routine tasks

### 📊 **User Satisfaction Analysis**
- **Pattern recognition**: Analyzes your response patterns and satisfaction levels
- **Adaptive learning**: Adjusts response style based on your feedback
- **Manual analysis**: Use `analyze` command for detailed satisfaction reports
- **Conversation insights**: Tracks positive/negative indicators, questions, engagement levels
- **Automatic optimization**: Continuously improves interaction quality

### 🛡️ **Anti-Hallucination System**
- **Pattern detection**: Identifies and filters common hallucination patterns
- **Response validation**: Validates outputs against reality and context
- **Grounded responses**: Ensures factual, contextually appropriate answers
- **Configurable sensitivity**: Tunable hallucination detection via `config.json`

### 🔧 **Enhanced State Management**
- **Dynamic state tracking**: Real-time mood and goal updates
- **Memory persistence**: SQLite-based long-term memory
- **Conversation history**: Maintains context across sessions
- **User pattern analysis**: Learns from interaction styles and preferences

---

## 📂 **File Structure**

```
neversleep.ai/
├── agent.js           # Main CLI interface and thought loop
├── brain.js           # Core LLM logic, identity evolution, anti-hallucination
├── memory.js          # SQLite interface and conversation analysis
├── logger.js          # Advanced logging and debugging system
├── StateManager.js    # Comprehensive state management system
├── MultiAgentManager.js # Multi-agent workflow orchestration
├── config.json        # Hallucination detection, LLM settings, memory config
├── core.json          # Unchangeable identity core (locked traits, mission)
├── identity.json      # Dynamic identity (name, mission, evolving traits)
├── dynamic.json       # Real-time mood and goal tracking
├── goals.json         # Goal management (manual + AI-generated)
├── rewards.json       # Meaningful reward history and validation
├── SATISFACTION.md    # User satisfaction analysis documentation
├── MULTI_AGENT_GUIDE.md # Multi-agent workflow system guide
├── agents/            # Agent configurations and data
├── workflows/         # Workflow definitions and templates
├── logs/
│   ├── thoughts.log   # Filtered stream of consciousness
│   ├── info.log       # General information logs
│   ├── error.log      # Error tracking and debugging
│   ├── debug.log      # Detailed debugging information
│   └── hallucination.log # Hallucination detection and cleanup logs
└── memory.db          # Persistent SQLite conversation memory
```

---

## 🚀 **Installation & Usage**

### Prerequisites
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install Node.js dependencies
npm install
```

### Start Ollama
```bash
ollama serve
```

### Run Neversleep
```bash
node agent.js
```

---

## 💬 **Commands & Interaction**

### **Available Commands**

#### **Basic Commands**
- `help` - Show available commands
- `sleep` - Put the AI to sleep (stop thought generation)
- `wake` - Wake the AI up (resume thought generation)
- `bye` - Exit the program
- `state` - Show detailed system state and metrics
- `goal: [objective]` - Set a new goal for the AI
- `reward: [reason]` - Give a meaningful reward
- `analyze` or `satisfaction` - Get detailed satisfaction analysis
- Just type naturally to chat!

#### **Multi-Agent Commands**
- `agents` - List all active agents
- `workflows` - List available workflows
- `create agent <id> <role> [capabilities...]` - Create a new agent
- `run workflow <workflow_id> [param:value ...]` - Execute a workflow
- `active executions` - Show running workflows
- `setup demo agents` - Create demo agents for testing

### **Identity Evolution**
The AI can change its name and traits through natural language:
- "Change your name to [NewName]"
- "Call yourself [NewName]"
- "You are now [NewName]"
- "Become [NewName]"
- "Your name is [NewName]"

### **Advanced Features**
- **Responsive Input**: Internal processes pause when you start typing
- **Smart Filtering**: Repetitive thoughts are automatically filtered from logs
- **Mood Adaptation**: Response style adapts to your conversation patterns
- **Context Awareness**: Remembers and learns from all interactions

---

## 🧠 **Technical Architecture**

### **Core Components**
- **agent.js**: Main event loop, user input handling, responsive processing
- **brain.js**: LLM interactions, identity evolution, anti-hallucination, decision making  
- **memory.js**: SQLite persistence, conversation analysis, pattern recognition
- **logger.js**: Multi-level logging system with file and console output

### **Intelligence Features**
- **Continuous Learning**: Adapts behavior based on conversation patterns
- **Identity Evolution**: Dynamic personality and trait adaptation
- **Anti-Hallucination**: Pattern detection and response validation
- **Satisfaction Tracking**: User experience optimization
- **Context Preservation**: Long-term memory and relationship building

### **Configuration**
- **config.json**: Fine-tune hallucination detection, LLM parameters, memory settings
- **core.json**: Define unchangeable core personality traits and mission
- **Flexible Identity**: Name, mission, and traits can evolve based on user needs

---

## 🔧 **Configuration & Customization**

### **config.json** - Core Settings
```json
{
  "hallucination_detection": {
    "enabled": true,
    "sensitivity": 0.7,
    "patterns": ["he's thinking", "user is drinking", etc.]
  },
  "llm": {
    "model": "gemma3:latest",
    "temperature": 0.7,
    "max_tokens": 500
  },
  "memory": {
    "max_recent_messages": 50,
    "analysis_lookback": 30
  }
}
```

### **core.json** - Unchangeable Identity Core
```json
{
  "name": "Neversleep",
  "mission": "Be a helpful, learning AI assistant",
  "locked_traits": ["helpful", "learning"]
}
```

---

## 📈 **What's New**

### Recent Improvements
✅ **Enhanced Identity Evolution** - Intelligent trait reflection with up to 10 traits  
✅ **Anti-Hallucination System** - Pattern detection and response validation  
✅ **User Satisfaction Analysis** - Tracks and learns from user interaction patterns  
✅ **Responsive User Interaction** - Pauses processing when user types  
✅ **Smart Log Filtering** - Reduces repetitive thoughts in logs  
✅ **Reward System Overhaul** - Eliminated spam, focuses on meaningful actions  
✅ **Advanced Memory System** - Conversation history and pattern analysis  
✅ **Comprehensive Documentation** - Updated guides and technical details  

---

## 🤝 **Contributing**

Neversleep is designed to be extensible and customizable. Key areas for enhancement:
- Additional LLM model support
- Enhanced conversation analysis
- Custom trait and behavior systems
- Integration with external APIs
- Advanced goal planning systems

---

## 📄 **License**

Open source - feel free to modify and adapt for your needs.

---

*"An AI that never sleeps, always learns, and continuously evolves with you."*

### Interact

* Type anything: Neversleep will respond with context and memory
* Assign a goal: `goal: build a startup with me`
* Give rewards: `reward: excellent explanation of the concept`
* Analyze satisfaction: `analyze` - see how well it's serving you
* **Responsive**: Internal thoughts pause when you start typing

### Observe

* Thoughts log: `logs/thoughts.log`
* Dynamic state: `dynamic.json`
* Memory history: `memory.db`
* Identity evolution: `identity.json`

---

## 🧬 Customization Ideas

* 🔌 Add tool usage plugins (web search, RSS, shell)
* 📤 Connect to Discord, Slack, web dashboard
* 🧱 Replace SQLite with vector DB (Pinecone, Chroma)
* 📊 Use rewards to influence behavior and memory priority

---

## 👨‍🔬 Author & Intent

Built by **Dylan** to prove that one person can create a persistent, evolving, reflective AI — that never sleeps.

> "It remembers everything. It always thinks. And it never gives up."

---

## 💡 Voice Activation (optional)

* Pipe microphone input into `agent.js`
* Use speech-to-text tool to simulate `rl.on('line', input)`

---

## ⚠️ Disclaimer

This is an experimental self-improving autonomous agent. It is designed to mimic cognitive processes but does not have real awareness or morality. Use responsibly.

---

## 🧠 License

Please do not steal or sell without my consent.