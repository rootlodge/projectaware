import { aiService } from "../lib/ai/service";
import "dotenv/config";

async function main() {
  console.log("Verifying AI Service...");
  
  try {
    const models = await aiService.getModels();
    console.log(`Successfully fetched ${models.length} models.`);
    models.forEach(m => console.log(`- ${m.provider}: ${m.name}`));

    // Test generic adapter loading
    const openai = await aiService.getAdapter("openai");
    console.log("OpenAI adapter loaded:", !!openai);

  } catch (e) {
    console.error("Verification Failed:", e);
    process.exit(1);
  }
}

main();
