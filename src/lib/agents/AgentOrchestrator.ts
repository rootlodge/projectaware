/**
 * AgentOrchestrator: Selects and coordinates agents for complex, multi-step tasks.
 * Part of Advanced Autonomous Intelligence.
 */

export interface OrchestrationTask {
  id: string;
  description: string;
  requiredAgents: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

export class AgentOrchestrator {
  private tasks: OrchestrationTask[] = [];

  addTask(task: OrchestrationTask) {
    this.tasks.push(task);
  }

  assignAgents(taskId: string, agentIds: string[]) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.requiredAgents = agentIds;
      task.status = 'in_progress';
    }
  }

  completeTask(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
    }
  }

  getPendingTasks() {
    return this.tasks.filter(t => t.status === 'pending');
  }

  getInProgressTasks() {
    return this.tasks.filter(t => t.status === 'in_progress');
  }

  getCompletedTasks() {
    return this.tasks.filter(t => t.status === 'completed');
  }
}
