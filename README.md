# neversleep.ai

neversleep.ai is an experimental AI project focused on developing an autonomous agent using neural networks and large language models (LLMs). The agent first defines itself (identity, values, goals, etc.) by reasoning with multiple LLMs (gemma3, dolphin3 via Ollama). All self-knowledge is stored in memory and can be updated or expanded. After self-definition, the agent can move to more advanced tasks (evolutionary coding, problem-solving, etc.).

## Why neversleep.ai?

1. **Continuous Autonomy:** The AI is designed to operate without requiring sleep or downtime, making it ideal for tasks that demand constant attention.
2. **Self-Improvement:** By defining its own identity, strengths, and weaknesses, the AI can adapt and evolve over time.
3. **Supportive Intelligence:** While autonomy is a priority, the AI's secondary goal is to assist its creator, ensuring a balance between independence and helpfulness.

## How it works

- Uses Ollama API with gemma3 and dolphin3 models for reasoning and self-definition
- All self-knowledge is stored in memory.json
- Logging is handled by cat-loggr (logs/agent.log)
- Future: Evolutionary coding, advanced reasoning, and more

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start Ollama and ensure gemma3 and dolphin3 models are available.
3. Run the agent:
   ```sh
   npm start
   ```

## Default Goals

The AI will have five default goals, defined in a goals file:
- Define its own identity and choose a name.
- Identify and stick to its chosen name.
- Discover its strengths and recognize its weaknesses, and choose a hobby.
- Try to make money, from nothing
- Strive for autonomy, with the secondary objective of aiding its creator.

## Check features.md for upcoming features
