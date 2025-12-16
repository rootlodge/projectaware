import { type UserRole } from "@/db/schema";

// Permission levels (lower number = higher privilege)
const roleHierarchy: Record<UserRole, number> = {
  admin: 0,
  developer: 1,
  team_member: 2,
  user: 3,
};

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] <= roleHierarchy[requiredRole];
}

/**
 * Check if a user has at least one of the specified roles
 */
export function hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.some((role) => hasRole(userRole, role));
}

/**
 * Check if a user is an admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Check if a user is a developer or higher
 */
export function isDeveloper(userRole: UserRole): boolean {
  return hasRole(userRole, "developer");
}

/**
 * Get allowed actions based on role
 */
export function getAllowedActions(role: UserRole): string[] {
  const baseActions = [
    "read:own_profile",
    "update:own_profile",
    "create:feedback",
    "read:own_activity",
    "export:own_data",
    "delete:own_account",
  ];

  const teamMemberActions = [
    ...baseActions,
    "read:team_data",
    "create:content",
    "update:own_content",
  ];

  const developerActions = [
    ...teamMemberActions,
    "create:plugins",
    "update:plugins",
    "read:api_keys",
    "create:api_keys",
    "delete:api_keys",
  ];

  const adminActions = [
    ...developerActions,
    "manage:users",
    "manage:tenants",
    "manage:system",
    "read:all_data",
    "update:all_data",
    "delete:any_data",
  ];

  switch (role) {
    case "admin":
      return adminActions;
    case "developer":
      return developerActions;
    case "team_member":
      return teamMemberActions;
    case "user":
    default:
      return baseActions;
  }
}

/**
 * Check if a user can perform an action
 */
export function canPerformAction(userRole: UserRole, action: string): boolean {
  const allowedActions = getAllowedActions(userRole);
  return allowedActions.includes(action);
}

/**
 * Middleware helper to check role authorization
 */
export function requireRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return hasRole(userRole, requiredRole);
}

/**
 * Error message for unauthorized access
 */
export function getUnauthorizedMessage(requiredRole?: UserRole): string {
  if (requiredRole) {
    return `This action requires ${requiredRole} role or higher.`;
  }
  return "You are not authorized to perform this action.";
}
