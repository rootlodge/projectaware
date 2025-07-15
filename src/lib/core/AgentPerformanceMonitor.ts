/**
 * AgentPerformanceMonitor: Tracks agent performance metrics and feedback for improvement.
 * Part of Advanced Autonomous Intelligence.
 */

export interface AgentPerformance {
  agentId: string;
  tasksCompleted: number;
  avgCompletionTime: number;
  lastActive: string;
  feedback: string[];
}

export class AgentPerformanceMonitor {
  private records: AgentPerformance[] = [];

  recordTask(agentId: string, completionTime: number) {
    let rec = this.records.find(r => r.agentId === agentId);
    if (!rec) {
      rec = { agentId, tasksCompleted: 0, avgCompletionTime: 0, lastActive: '', feedback: [] };
      this.records.push(rec);
    }
    rec.tasksCompleted++;
    rec.avgCompletionTime = ((rec.avgCompletionTime * (rec.tasksCompleted - 1)) + completionTime) / rec.tasksCompleted;
    rec.lastActive = new Date().toISOString();
  }

  addFeedback(agentId: string, feedback: string) {
    let rec = this.records.find(r => r.agentId === agentId);
    if (!rec) {
      rec = { agentId, tasksCompleted: 0, avgCompletionTime: 0, lastActive: '', feedback: [] };
      this.records.push(rec);
    }
    rec.feedback.push(feedback);
  }

  getPerformance(agentId: string): AgentPerformance | undefined {
    return this.records.find(r => r.agentId === agentId);
  }

  getAllPerformance(): AgentPerformance[] {
    return this.records;
  }
}
