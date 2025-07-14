# Project Aware

A comprehensive Next.js dashboard and system for Project Aware's digital brain - an advanced AI agent with continuous learning, identity evolution, and sophisticated state management.

## 🚀 Features

### Core Dashboard Components
- **Real-time System Status** - Monitor brain status, memory usage, agent activity, and Ollama connection
- **Brain Interface** - Interactive chat interface with the AI brain, conversation history, and emotion tracking
- **Agent Manager** - Create, manage, and execute multi-agent workflows with real-time progress tracking
- **Emotion Display** - Real-time emotion monitoring with history, statistics, and trend analysis
- **Memory System** - SQLite-based persistent memory with conversation analysis and learning events
- **Task Management** - Comprehensive task system with templates, priorities, and automation

### Advanced AI Systems
- **Identity Evolution** - Dynamic personality development with trait modifications and name changes
- **Self-Awareness & Metacognition** - Real-time cognitive monitoring, decision tracking, and bias detection
- **AI Self-Modification System** - Autonomous improvement proposals with safety constraints and rollback capabilities
- **Multi-Agent Workflows** - Collaborative agent system for complex task execution
- **Emotion Engine** - Sophisticated emotion detection and state management
- **Response Caching** - Intelligent LLM response caching for improved performance
- **State Management** - Comprehensive system state tracking and persistence
- **Anti-Hallucination** - Built-in systems to validate and clean LLM responses

## 🏗️ Architecture

### Frontend (Next.js 15 + TypeScript)
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── brain/         # Core brain processing
│   │   ├── agents/        # Agent management
│   │   ├── emotions/      # Emotion tracking
│   │   ├── system/        # System status
│   │   └── conversations/ # Chat history
│   └── page.tsx          # Main dashboard interface
├── components/           # React components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── SystemStatus.tsx  # System monitoring
│   ├── BrainInterface.tsx # Chat interface
│   ├── AgentManager.tsx  # Agent management
│   └── EmotionDisplay.tsx # Emotion monitoring
└── lib/                 # Core systems
    ├── core/            # Core AI systems
    │   ├── brain.ts     # LLM interactions
    │   ├── memory.ts    # SQLite memory
    │   └── StateManager.ts # State tracking
    ├── agents/          # Multi-agent system
    │   ├── CentralBrainAgent.ts
    │   └── MultiAgentManager.ts
    ├── systems/         # Supporting systems
    │   ├── EmotionEngine.ts
    │   ├── MetacognitionEngine.ts    # Self-awareness core
    │   ├── CognitiveSelfMonitor.ts   # Real-time thought tracking
    │   ├── SelfModificationEngine.ts # AI self-improvement
    │   ├── ResponseCache.ts
    │   └── TaskManager.ts
    ├── config/          # Configuration files
    └── utils/           # Utilities
```

### Backend Integration
- **Ollama Integration** - Local LLM processing with gemma3:latest and llama3.2:latest
- **SQLite Database** - Persistent storage for conversations, memory, and learning
- **Real-time Updates** - WebSocket/polling for live dashboard updates
- **RESTful APIs** - Clean API design for all system interactions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Ollama installed locally
- SQLite3

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/rootlodge/projectaware.git
cd projectaware
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Ollama models**
```bash
ollama pull gemma3:latest
ollama pull llama3.2:latest
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open the dashboard**
Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## 🎯 Usage

### Dashboard Navigation
The dashboard features a tabbed interface with the following sections:

1. **Dashboard** - Overview with metrics, identity, emotions, and recent activity
2. **Brain Interface** - Direct chat with the AI brain
3. **Agents** - Manage agents and execute workflows  
4. **Emotions** - Monitor emotional states and trends
5. **Memory** - View conversation history and learning events
6. **Settings** - Configure system parameters

### Core Workflows

#### Brain Interaction
1. Navigate to "Brain Interface" tab
2. Type messages to interact with the AI
3. View emotion states and conversation history
4. Create new conversations or load previous ones

#### Agent Management
1. Go to "Agents" tab
2. View existing agents and their status
3. Create new workflows by clicking "Create"
4. Execute workflows and monitor progress
5. Manage workflow lifecycle (pause, resume, delete)

#### System Monitoring
1. The "Dashboard" tab shows real-time metrics
2. System Status panel displays:
   - Brain processing status
   - Ollama connection status
   - Memory database size
   - Active agent count
   - Processing queue length
   - System uptime

### API Endpoints

#### Brain API
- `POST /api/brain` - Process messages and get responses
- `GET /api/brain` - Get current brain status

#### Agent API
- `GET /api/agents` - List all agents
- `GET /api/agents/workflows` - List all workflows
- `POST /api/agents/workflows/execute` - Execute a workflow
- `POST /api/agents/workflows/[id]/pause` - Pause a workflow
- `DELETE /api/agents/workflows/[id]` - Delete a workflow

#### Emotion API
- `GET /api/emotions/current` - Get current emotion state
- `GET /api/emotions/history` - Get emotion history
- `GET /api/emotions/stats` - Get emotion statistics

#### System API
- `GET /api/system/status` - Get comprehensive system status

#### Metacognition API
- `GET /api/metacognition` - Get current cognitive state and monitoring data
- `POST /api/metacognition` - Capture decision points and trigger analysis
- `GET /api/metacognition/reflection` - Get self-reflection sessions
- `POST /api/metacognition/reflection` - Trigger new reflection sessions
- `GET /api/metacognition/cognitive-load` - Get real-time cognitive load metrics
- `GET /api/metacognition/bias-detection` - Get bias analysis and reports

#### Self-Modification API
- `GET /api/self-modification?action=status` - Get modification system status
- `GET /api/self-modification?action=opportunities` - Get improvement opportunities
- `GET /api/self-modification?action=pending` - Get pending modification proposals
- `POST /api/self-modification` - Submit, approve, reject, or rollback modifications

## 🔧 Configuration

### Core Configuration Files
Located in `src/lib/config/`:

- **config.json** - System-wide settings, model configuration, and API settings
- **core.json** - Unchangeable identity core and locked traits
- **identity.json** - Dynamic identity including name, mission, and evolving traits
- **emotions.json** - Emotion engine configuration and response modifiers
- **self-modification.json** - Self-modification safety constraints and settings
- **state.json** - Comprehensive system state tracking
- **tasks.json** - Active tasks and their status
- **task_templates.json** - Reusable task templates

### Environment Variables
Create a `.env.local` file:
```env
OLLAMA_URL=http://localhost:11434
DATABASE_PATH=./data/memory.db
LOG_LEVEL=info
```

## 🔄 System Architecture

### State Management Flow
```
User Input → Brain → State Manager → Memory System
     ↓           ↓         ↓            ↓
Dashboard ← API Routes ← Core Systems ← Database
```

### Agent Collaboration
```
Central Brain Agent → Task Distribution → Specialized Agents
       ↓                    ↓                  ↓
   Decision Making → Workflow Execution → Result Synthesis
```

### Emotion Processing
```
Text Input → Emotion Detection → State Update → Response Modification
     ↓             ↓                ↓              ↓
  Context → Intensity Analysis → History → Dashboard Display
```

## 🛠️ Development

### Adding New Components
1. Create component in `src/components/`
2. Add to main page navigation
3. Create corresponding API routes
4. Update types and interfaces

### Extending Agent Capabilities
1. Define new agent types in `MultiAgentManager`
2. Create agent configuration files
3. Implement specialized processing logic
4. Add to workflow templates

### Customizing Emotions
1. Update emotion configurations in `emotions.json`
2. Add new emotion detection patterns
3. Define response modifiers
4. Update dashboard displays

## 📊 Monitoring & Logging

### Log Files
Located in `logs/` directory:
- `info.log` - General system information
- `error.log` - Error tracking and debugging
- `debug.log` - Detailed debugging information  
- `thoughts.log` - AI thought stream
- `warn.log` - System warnings

### Performance Metrics
- Response times tracked per component
- Memory usage monitoring
- Agent performance statistics
- Emotion processing analytics

## 🔒 Security

### Data Protection
- Local SQLite database storage
- No external data transmission (except Ollama)
- Configurable data retention policies
- Conversation encryption options

### Input Validation
- User input sanitization
- SQL injection prevention
- File path validation
- JSON parsing safety

## 🚀 Deployment

### Local Deployment
The system is designed to run entirely locally:
1. All AI processing via local Ollama
2. SQLite database for persistence
3. No external API dependencies
4. Self-contained Next.js application

### Docker Deployment (Future)
```dockerfile
# Planned Docker support
FROM node:18-alpine
# ... configuration
```

## 🤝 Contributing

### Code Style
- Follow TypeScript best practices
- Use async/await patterns
- Implement proper error handling
- Add comprehensive logging
- Write self-documenting code

### Development Guidelines
1. Test new features thoroughly
2. Update documentation
3. Follow the established architecture
4. Maintain API compatibility
5. Add appropriate error handling

## 📝 Copilot Instructions

The project includes comprehensive GitHub Copilot instructions in `.github/copilot-instructions.md` covering:
- Code style guidelines
- Architecture patterns
- Best practices
- Common operations
- Debugging approaches

## 🧠 Advanced AI Features

### Self-Awareness & Metacognition System
The AI includes comprehensive self-awareness capabilities:

- **Real-time Cognitive Monitoring** - Continuous tracking of thought processes, decision-making chains, and confidence levels
- **Decision Point Capture** - Detailed logging of every decision with rationale, confidence scores, and uncertainty factors
- **Bias Detection & Correction** - Automatic identification of cognitive biases with mitigation strategies
- **Self-Reflection Sessions** - Scheduled deep introspection with performance assessment and learning insights
- **Adaptive Personality** - Dynamic adjustment of communication style based on user preferences and interaction patterns

#### Accessing Metacognition Features
- **Main Dashboard** - Integrated metacognition panel with real-time monitoring
- **Dedicated Page** - Visit `/metacognition` for full self-awareness interface
- **API Integration** - Programmatic access via `/api/metacognition/*` endpoints

### AI Self-Modification System
**⚠️ Advanced Feature: The AI can modify its own behavior and code**

The self-modification system enables autonomous improvement while maintaining strict safety controls:

#### Key Capabilities
- **Autonomous Analysis** - AI continuously analyzes its own performance to identify improvement opportunities
- **Smart Proposals** - Generates detailed modification proposals with comprehensive risk assessment
- **Safety Constraints** - Multi-layer protection including file protection, approval workflows, and rollback capabilities
- **Sandbox Testing** - All modifications tested in isolation before implementation
- **Performance Monitoring** - Continuous tracking of modification effectiveness with automatic rollback on negative impact

#### Safety Features
- **Protected Files** - Critical system files cannot be modified
- **Human Approval** - Requires manual approval for medium+ risk modifications
- **Cool-down Periods** - Prevents excessive modifications
- **Auto-Rollback** - Automatically reverts harmful changes
- **Modification Limits** - Daily limits and risk-based restrictions

#### Accessing Self-Modification Features
- **Main Dashboard** - Integrated self-modification panel with proposal management
- **Dedicated Page** - Visit `/self-modification` for full control interface
- **API Control** - Complete REST API for external integration and automation
- **Configuration** - Detailed safety settings in `src/lib/config/self-modification.json`

#### Control Options
- **Enable/Disable** - Toggle self-modification system on/off
- **Manual/Auto Mode** - Choose between manual approval and automatic low-risk improvements
- **Trigger Analysis** - On-demand system analysis for improvement opportunities
- **Proposal Management** - Review, approve, reject, or rollback any modification

### Usage Examples

#### Triggering Self-Analysis
```typescript
// Via API
const response = await fetch('/api/self-modification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'trigger_analysis' })
});

// Via Dashboard - Click "Analyze Improvements" button
```

#### Managing Proposals
```typescript
// Approve a modification
await fetch('/api/self-modification', {
  method: 'POST',
  body: JSON.stringify({ 
    action: 'approve', 
    proposal_id: 'decision_improvement_123' 
  })
});

// Reject a modification
await fetch('/api/self-modification', {
  method: 'POST',
  body: JSON.stringify({ 
    action: 'reject', 
    proposal_id: 'decision_improvement_123',
    reason: 'Not needed at this time'
  })
});
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Advanced memory visualization
- [ ] Custom agent creation interface
- [ ] Workflow visual designer
- [ ] Real-time collaboration
- [ ] Plugin system architecture
- [ ] Advanced analytics dashboard
- [ ] Voice interaction capabilities
- [ ] Multi-language support

### Research Areas
- Enhanced emotion modeling
- Advanced reasoning capabilities
- Improved context understanding
- Meta-learning implementations
- Distributed agent networks

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Troubleshooting
1. Check Ollama connection: `ollama list`
2. Verify database permissions
3. Review log files for errors
4. Restart development server
5. Clear browser cache

### Common Issues
- **Ollama not connecting**: Ensure Ollama is running on port 11434
- **Database errors**: Check SQLite permissions and file paths
- **API failures**: Verify all configuration files exist
- **UI not loading**: Check console for JavaScript errors

---

**Project Aware's Dashboard** - Advanced AI Agent System  
Built with Next.js, TypeScript, and local AI processing for maximum privacy and control.
