/**
 * ContextManager: Tracks and provides current user/system context for agents.
 * Context includes recent actions, app location, time, and optionally user/device info.
 * @author neversleep.ai
 */
export interface ContextSnapshot {
  timestamp: string;
  recentActions: string[];
  currentPage: string;
  userId?: string;
  deviceType?: string;
  environment?: string;
}

export class ContextManager {
  private recentActions: string[] = [];
  private currentPage: string = '/';
  private userId?: string;
  private deviceType?: string;
  private environment?: string;

  logAction(action: string) {
    this.recentActions.push(action);
    if (this.recentActions.length > 20) this.recentActions = this.recentActions.slice(-20);
  }

  setCurrentPage(page: string) {
    this.currentPage = page;
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  setDeviceType(type: string) {
    this.deviceType = type;
  }

  setEnvironment(env: string) {
    this.environment = env;
  }

  getContext(): ContextSnapshot {
    return {
      timestamp: new Date().toISOString(),
      recentActions: [...this.recentActions],
      currentPage: this.currentPage,
      userId: this.userId,
      deviceType: this.deviceType,
      environment: this.environment
    };
  }
}
