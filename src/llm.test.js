const { models } = require('./config');
const { askAllModels } = require('./llm');

(async () => {
  for (const model of models) {
    try {
      const prompt = `Say 'Hello from ${model}!'`;
      const answer = await askAllModels(prompt);
      console.log(`Model: ${model} | Response: ${answer}`);
    } catch (e) {
      console.error(`Model: ${model} | Error: ${e}`);
    }
  }
})();
