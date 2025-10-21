/**
 * Represents a collection of files
 */
export interface Collection {
  id: string;
  name: string;
  fileCount?: number;
}

/**
 * Represents a file in the system
 */
export interface File {
  object_name: string;
  collection: string;
  owner: string;
  original_filename: string;
  upload_time: string;
  content_type: string;
  size?: number;
  metadata?: Record<string, any>;
}

/**
 * Available user roles in the system
 */
export enum UserRole {
  Admin = "admin",
  TrustArchitect = "trust-architect",
  ProjectParticipant = "project-participant",
}

/**
 * Represents a user in the system
 */
export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  roles: UserRole[];
  collections: Record<string, string[]>;
}

/**
 * Unified service error format consumed by UI
 */
export interface ServiceError {
  message: string;
  action: string;
}

/**
 * Helper function to check if user has admin role
 * TODO: Move to AuthProvider when implemented
 */
export function isAdmin(user: User): boolean {
  return user.roles.includes(UserRole.Admin);
}
