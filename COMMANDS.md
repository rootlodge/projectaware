# Neversleep.ai Command Reference

This document contains all available commands and their usage.

## System Commands

### help

**Description:** Show help information

**Usage:** `help [command]`

**Examples:**
- `help`
- `help emotions`
- `help cache`

**Details:** Get help for all commands or specific command information.

---

### state

**Description:** Show current system state

**Usage:** `state`

**Examples:**
- `state`
- `status`

**Details:** Display comprehensive system state including session info, cognitive state, and performance metrics.

---

### analyze

**Description:** Analyze conversation and user patterns

**Usage:** `analyze`

**Examples:**
- `analyze`
- `satisfaction`

**Details:** Perform satisfaction analysis and show user interaction patterns.

---

### sleep

**Description:** Put the AI into sleep mode

**Usage:** `sleep`

**Examples:**
- `sleep`

**Details:** Put the AI into sleep mode to reduce processing.

---

### wake

**Description:** Wake the AI from sleep mode

**Usage:** `wake`

**Examples:**
- `wake`

**Details:** Wake the AI from sleep mode to resume normal operation.

---

### shutdown

**Description:** Shutdown the AI system

**Usage:** `shutdown`

**Examples:**
- `shutdown`

**Details:** Safely shutdown the AI system.

---

## Emotion Commands

### emotions

**Description:** Show current emotion state and statistics

**Usage:** `emotions`

**Examples:**
- `emotions`
- `emotion`

**Details:** Display current emotion, intensity, confidence, history, and emotional statistics.

---

### emotion reset

**Description:** Reset emotion system to neutral

**Usage:** `emotion reset`

**Examples:**
- `emotion reset`

**Details:** Manually reset the emotion system to neutral state.

---

### emotion response

**Description:** Generate emotional response based on current state

**Usage:** `emotion response`

**Examples:**
- `emotion response`

**Details:** Generate an emotional response and show style modifiers based on current emotional state.

---

## Cache Commands

### cache

**Description:** Show response cache statistics

**Usage:** `cache`

**Examples:**
- `cache`
- `cache stats`

**Details:** Display cache statistics including hit rate, size, and top cached responses.

---

### cache clear

**Description:** Clear all cached responses

**Usage:** `cache clear`

**Examples:**
- `cache clear`

**Details:** Remove all cached responses from memory and disk.

---

### cache entries

**Description:** Show recent cache entries

**Usage:** `cache entries`

**Examples:**
- `cache entries`

**Details:** Display recent cached responses with details.

---

## Multi-agent Commands

### agents

**Description:** List active multi-agent system agents

**Usage:** `agents`

**Examples:**
- `agents`

**Details:** Show all active agents with their roles and current tasks.

---

### create agent

**Description:** Create a new agent

**Usage:** `create agent <id> <role> [capabilities...]`

**Examples:**
- `create agent researcher analyst`
- `create agent coder programming debugging`
- `create agent writer creative storytelling`

**Details:** Create a new agent with specified ID, role, and optional capabilities.

---

### workflows

**Description:** List available workflows

**Usage:** `workflows`

**Examples:**
- `workflows`

**Details:** Show all available multi-agent workflows with descriptions.

---

### run workflow

**Description:** Execute a workflow

**Usage:** `run workflow <workflow_id> [param:value ...]`

**Examples:**
- `run workflow code_review`
- `run workflow research topic:AI`
- `run workflow problem_solving problem:"solve equation"`

**Details:** Execute a multi-agent workflow with optional parameters.

---

## Internal Commands

### internal agents

**Description:** Show internal agent system status

**Usage:** `internal agents`

**Examples:**
- `internal agents`

**Details:** Display internal agent system status and active internal agents.

---

### init internal system

**Description:** Initialize internal agent system

**Usage:** `init internal system`

**Examples:**
- `init internal system`

**Details:** Initialize specialized internal agents for different functions.

---

### process internal

**Description:** Process input through internal agent system

**Usage:** `process internal <input>`

**Examples:**
- `process internal analyze this data`
- `process internal change my name to Alex`
- `process internal what should I do next?`

**Details:** Process user input through internal agent system for specialized handling.

---

## Identity Commands

### goal:

**Description:** Set a manual goal

**Usage:** `goal: <goal description>`

**Examples:**
- `goal: learn about machine learning`
- `goal: help with coding project`
- `goal: be more creative`

**Details:** Set a specific goal for the AI to focus on.

---

### reward:

**Description:** Give a reward with reason

**Usage:** `reward: <reason>`

**Examples:**
- `reward: good explanation`
- `reward: helpful response`
- `reward: creative solution`

**Details:** Give positive reinforcement to the AI with a specific reason.

---

### change name

**Description:** Change the AI's name

**Usage:** `change your name to <name>`

**Examples:**
- `change your name to Alex`
- `your name is now Sarah`
- `call yourself Max`

**Details:** Change the AI's identity name and associated traits.

---
