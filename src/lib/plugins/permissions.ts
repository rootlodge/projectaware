export type PermissionValidationResult = {
  allowed: boolean;
  error?: string;
};

export class PermissionManager {
  /**
   * Standard permission scopes
   */
  static readonly SCOPES = {
    DB_READ: "db:read",
    DB_WRITE: "db:write",
    STORAGE_READ: "storage:read",
    STORAGE_WRITE: "storage:write",
    AI_GENERATE: "ai:generate",
    CONTEXT_READ: "context:read",
    CONTEXT_WRITE: "context:write",
    NETWORK_OUTBOUND: "network:outbound",
  } as const;

  /**
   * Validate if a set of granted permissions includes the required permission
   */
  static hasPermission(granted: string[], required: string): boolean {
    if (granted.includes("*")) return true; // Super admin permission
    if (granted.includes(required)) return true;

    // Handle wildcards like "db:*"
    const requiredParts = required.split(":");
    if (requiredParts.length > 1) {
      const wildcard = `${requiredParts[0]}:*`;
      if (granted.includes(wildcard)) return true;
    }

    return false;
  }

  /**
   * Validate multiple permissions
   */
  static validatePermissions(granted: string[], required: string[]): PermissionValidationResult {
    const missing = required.filter(req => !this.hasPermission(granted, req));
    
    if (missing.length > 0) {
      return {
        allowed: false,
        error: `Missing required permissions: ${missing.join(", ")}`
      };
    }

    return { allowed: true };
  }
}
