/**
 * Represents a collection of files
 */
export interface Collection {
  id: string;
  name: string;
}

/**
 * Available user roles in the system
 */
export enum UserRole {
  Admin = "admin",
  User = "user",
  Limited = "limited",
}

/**
 * Represents a user in the system
 */
export interface User {
  name: string;
  email: string;
  roles: UserRole[];
  avatarUrl?: string;
}

/**
 * Helper function to check if user has admin role
 * TODO: Move to AuthProvider when implemented
 */
export function isAdmin(user: User): boolean {
  return user.roles.includes(UserRole.Admin);
}
