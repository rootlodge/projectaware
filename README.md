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
* Waits for user input without pausing internal processes

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

* Every deep reflection or goal-oriented action can trigger a reward
* Rewards are tracked in `rewards.json` as timestamped events

---

## 📂 File Structure

```
neversleep/
├── agent.js           # Main CLI interface and control loop
├── brain.js           # Core LLM logic and state handling
├── memory.js          # SQLite interface
├── core.json          # Unchangeable identity traits
├── identity.json      # Mutable name, mission, traits
├── dynamic.json       # Tracks current mood and goal
├── goals.json         # Goal data (manual + self-generated)
├── rewards.json       # Reward history log
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