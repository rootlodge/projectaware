# 🧠 Neversleep.ai

Neversleep is a fully autonomous CLI-based JavaScript AI agent built with:

* Ollama LLMs (local model reasoning)
* Continuous thought generation
* Memory (SQLite)
* Identity evolution
* Mood/goal tracking
* Reward system
* Real-time user interaction

> "I never sleep. I remember everything. I grow on my own."

---

## 🚀 Features

### ✅ Always-On Thought Loop

* Generates a thought every second
* Records thoughts with mood + goal tags
* **Responsive interruption**: Pauses internal processes when you type
* Waits for user input without interfering with your interaction

### 🧘 Deep Self-Reflection

* After 60 seconds of no input, it performs a deep reflection
* Analyzes its understanding of the user and how to serve them better

### 🧠 Identity + Traits System

* `core.json`: Unchangeable mission & locked traits
* `identity.json`: Evolves through self-reflection
* Can rename itself, change goals, traits via keywords like:

  * "Call me..."
  * "I am reborn as..."

### 🎯 Goal System

* `goal: your goal here` → assigns a manual goal
* AI can self-generate goals based on reflection, context, or mood

### 🎭 Mood Tracker

* Every thought is tagged with a `mood`
* Updates `dynamic.json` with current emotional state

### 🏆 Reward System

* Meaningful rewards only (no more self-reward spam)
* User-controlled via `reward: [reason]` command
* Tracks genuinely valuable interactions

### 📊 Satisfaction Analysis

* Analyzes your response patterns and satisfaction levels
* Learns from your feedback to improve future interactions
* Use `analyze` command for detailed satisfaction reports
* Automatically adjusts response style based on your preferences

---

## 📂 File Structure

```
neversleep/
├── agent.js           # Main CLI interface and control loop
├── brain.js           # Core LLM logic and state handling
├── memory.js          # SQLite interface
├── logger.js          # Logging and debugging system
├── config.json        # Configuration for hallucination detection & LLM settings
├── core.json          # Unchangeable identity traits
├── identity.json      # Mutable name, mission, traits
├── dynamic.json       # Tracks current mood and goal
├── goals.json         # Goal data (manual + self-generated)
├── rewards.json       # Reward history log
├── SATISFACTION.md    # Documentation for satisfaction analysis
├── logs/
│   └── thoughts.log   # Stream of consciousness log
└── memory.db          # Persistent SQLite memory
```

---

## 🧪 Usage

### Start Ollama

```
ollama serve
```

### Run Neversleep

```
node agent.js
```

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