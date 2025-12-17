import { PluginInterface, PluginManifest, PluginContext } from "@/lib/plugins/types";

export class GoalsPlugin implements PluginInterface {
  manifest: PluginManifest = {
    id: "goal-tracking",
    name: "Goal Tracking",
    version: "0.5.0",
    description: "Extracts, tracks, and manages user goals from conversations.",
    author: "Project Aware Core",
    category: "utility",
    permissions: ["context:read"],
  };

  hooks = {
    onInit: async (context: PluginContext) => {
      context.logger.info("Goal tracking initialized");
    },
    
    onAgentAction: async (context: PluginContext, action: any) => {
        // Expecting action to contain message content or user input
        const content = action?.content || action?.input || "";
        
        if (typeof content !== 'string') return null;

        const goalPatterns = [
            /i want to ([\w\s]+)/i,
            /my goal is ([\w\s]+)/i,
            /i need to ([\w\s]+)/i
        ];

        for (const pattern of goalPatterns) {
            const match = content.match(pattern);
            if (match) {
                const goal = match[1].trim();
                context.logger.info(`Detected potential user goal: "${goal}"`);
                
                // In a real system, we would persist this to a 'goals' table
                // For now, we return it as a detected entity
                return {
                    type: "goal_detected",
                    goal: goal,
                    confidence: 0.8
                };
            }
        }

        return null;
    }
  };
}
