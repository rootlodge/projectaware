# 🤖 Multi-Agent Workflow System

The neversleep.ai multi-agent workflow system enables multiple AI agents to collaborate on complex tasks through structured workflows.

## 🎯 Key Features

### **Agent Management**
- **Dynamic Agent Creation**: Create specialized agents with specific roles and capabilities
- **Identity System**: Each agent has its own identity, mission, and traits
- **Role-Based Capabilities**: Agents are optimized for specific tasks (reviewer, analyst, security expert, etc.)
- **State Tracking**: Individual agent status and task monitoring

### **Workflow Orchestration**
- **Multiple Coordination Strategies**: Sequential, parallel, and conditional execution
- **Flexible Step Types**: Agent tasks, collaboration, decision points, and data processing
- **Parameter Passing**: Share data between workflow steps
- **Error Handling**: Robust error handling and recovery mechanisms

### **Collaboration Types**
- **Discussion**: Agents engage in structured discussions
- **Review**: Multiple agents provide independent reviews
- **Consensus**: Agents work together to reach agreement
- **Task Delegation**: Distribute work across specialized agents

## 🚀 Quick Start

### 1. Setup Demo Agents
```bash
# In neversleep.ai console
setup demo agents
```

This creates:
- **Code Reviewer**: Analyzes code quality
- **Security Analyst**: Identifies security issues
- **Performance Expert**: Optimizes performance
- **Research Specialist**: Conducts research tasks

### 2. View Available Commands
```bash
# List all agents
agents

# List available workflows
workflows

# View active executions
active executions
```

### 3. Run a Workflow
```bash
# Code review workflow
run workflow code_review_workflow code:"function example() { return 'hello'; }"

# Research workflow
run workflow research_workflow topic:"AI ethics"

# Problem solving workflow
run workflow problem_solving_workflow problem:"Reduce app loading time"
```

## 📋 Predefined Workflows

### **Code Review Workflow**
- **Sequential coordination**
- **Steps**: Initial review → Security analysis → Performance review → Consensus
- **Agents**: Reviewer, Security Analyst, Performance Expert
- **Use case**: Comprehensive code quality assessment

### **Research Workflow**
- **Parallel coordination**
- **Steps**: Research discussion → Fact verification → Final synthesis
- **Agents**: Researcher, Analyst, Fact Checker
- **Use case**: Multi-perspective research projects

### **Problem Solving Workflow**
- **Conditional coordination**
- **Steps**: Analysis → Creative solutions → Critique → Refinement
- **Agents**: Analyst, Creative Thinker, Critic
- **Use case**: Complex problem solving from multiple angles

## 🛠 Creating Custom Agents

```bash
# Create a specialized agent
create agent <id> <role> [capabilities...]

# Examples:
create agent data_scientist analyst data_analysis machine_learning
create agent ui_designer designer user_experience interface_design
create agent project_manager coordinator planning scheduling
```

## 📊 Workflow Results

Each workflow execution provides:
- **Step-by-step results**: Detailed output from each agent
- **Execution metrics**: Timing and performance data
- **Collaboration summaries**: Discussion outcomes and consensus
- **Error reporting**: Any issues encountered during execution

## 🔧 Advanced Features

### **Custom Workflows**
Create JSON workflow definitions with:
- Custom step sequences
- Agent role assignments
- Parameter passing configurations
- Conditional logic

### **Agent Specialization**
- **Capabilities**: Define what each agent can do
- **Identity**: Customize personality and approach
- **Role-based prompting**: Agents respond according to their expertise

### **Monitoring & Analytics**
- Real-time execution tracking
- Agent performance metrics
- Workflow optimization insights
- Error pattern analysis

## 📝 Example Workflow Definition

```json
{
  "id": "custom_workflow",
  "name": "Custom Analysis Workflow",
  "coordination": "sequential",
  "steps": [
    {
      "name": "initial_analysis",
      "type": "agent_task",
      "agentId": "analyst",
      "task": { "type": "analysis" },
      "input": { "source": "workflow_params", "key": "data" }
    },
    {
      "name": "team_discussion",
      "type": "agent_collaboration",
      "agents": ["analyst", "reviewer"],
      "collaborationType": "discussion",
      "task": { "topic": "Analysis findings", "maxRounds": 3 }
    }
  ]
}
```

## 🧪 Testing

Run the test suite to verify multi-agent functionality:

```bash
node tests/test-multi-agent.js
```

This tests:
- Agent creation and management
- Workflow execution
- Collaboration mechanisms
- Error handling

## 🎯 Use Cases

### **Code Development**
- Code review with multiple experts
- Architecture design discussions
- Security and performance audits

### **Research & Analysis**
- Multi-perspective research projects
- Data analysis with different approaches
- Fact-checking and verification

### **Problem Solving**
- Complex problem decomposition
- Creative solution generation
- Feasibility assessment

### **Content Creation**
- Collaborative writing projects
- Multi-angle content review
- Quality assurance workflows

## 🔮 Future Enhancements

- **Visual workflow designer**
- **Real-time collaboration monitoring**
- **Agent learning from collaboration**
- **Integration with external tools**
- **Workflow template marketplace**

---

The multi-agent workflow system transforms neversleep.ai from a single AI agent into a collaborative AI team, enabling more sophisticated and comprehensive task completion through specialized agent expertise and structured collaboration.
