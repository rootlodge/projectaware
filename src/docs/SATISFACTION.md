# Satisfaction Analysis System

## Overview
The agent now analyzes your queries, responses, and satisfaction patterns to improve its performance and understand your preferences.

## Features

### 1. **Automatic Satisfaction Analysis**
- Runs during deep reflection (after 60 seconds of inactivity)
- Analyzes conversation patterns between you and the AI
- Tracks your response indicators and satisfaction levels

### 2. **Manual Analysis Command**
- Type `analyze` or `satisfaction` to get an immediate analysis
- Shows detailed satisfaction metrics and user patterns
- Displays statistics about your interaction style

### 3. **User Pattern Tracking**
The system tracks:
- **Positive indicators**: "good", "great", "thanks", "perfect", etc.
- **Negative indicators**: "no", "wrong", "bad", "fix", "problem", etc.
- **Questions asked**: How many questions you ask
- **Short responses**: Brief replies that might indicate impatience
- **Commands used**: goal:, reward:, analyze commands
- **Total interactions**: Overall engagement level

### 4. **Satisfaction-Aware Responses**
- The AI now considers conversation patterns when responding
- Adjusts style based on your feedback patterns
- Focuses on areas that have previously satisfied you

## Commands

| Command | Description |
|---------|-------------|
| `analyze` | Run immediate satisfaction analysis |
| `satisfaction` | Same as analyze |
| `goal: [text]` | Set a specific goal |
| `reward: [reason]` | Give meaningful reward for good performance |

## How It Works

1. **Conversation Tracking**: Every interaction is logged with timestamps
2. **Pattern Recognition**: The system identifies satisfaction indicators in your responses
3. **Trend Analysis**: Looks for patterns in what works and what doesn't
4. **Adaptive Responses**: Uses insights to improve future interactions

## Example Analysis Output

```
📊 SATISFACTION ANALYSIS:
Dylan seems engaged with technical discussions and appreciates detailed explanations. 
Questions are answered effectively with follow-up engagement. 
Response length appears appropriate - not too verbose.

📈 USER PATTERNS:
Positive indicators: 5
Negative indicators: 1  
Questions asked: 12
Short responses: 3
Commands used: 2
Total interactions: 23
```

This helps the AI understand:
- You prefer detailed technical responses
- You're generally satisfied (5 positive vs 1 negative)
- You're actively engaged (asking questions)
- Response length is good (few short/frustrated responses)
