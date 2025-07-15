/**
 * AgentCollaborationProtocol: Shared state and messaging for agent collaboration.
 * Part of Advanced Autonomous Intelligence.
 */

export interface AgentMessage {
  from: string;
  to: string;
  content: string;
  timestamp: string;
}

export class AgentCollaborationProtocol {
  private messages: AgentMessage[] = [];
  private sharedState: Record<string, any> = {};

  sendMessage(from: string, to: string, content: string) {
    this.messages.push({ from, to, content, timestamp: new Date().toISOString() });
    if (this.messages.length > 500) this.messages.shift();
  }

  getMessagesForAgent(agentId: string): AgentMessage[] {
    return this.messages.filter(m => m.to === agentId || m.from === agentId);
  }

  setSharedState(key: string, value: any) {
    this.sharedState[key] = value;
  }

  getSharedState(key: string) {
    return this.sharedState[key];
  }
}
