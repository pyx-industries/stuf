import type { File } from "@/types";
import { useMemo } from "react";
import { useUser } from "../../user/useUser";

interface FilePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canArchive: boolean;
  canViewHistory: boolean;
  isOwnFile: boolean;
}

/**
 * Hook to determine user permissions for a file based on collection permissions
 *
 * Permission model:
 * - delete permission: Full access (download, view history, archive, delete)
 * - write permission: Can download own files
 * - read permission: Can download any file
 */
export function useFilePermissions(file: File): FilePermissions {
  const user = useUser();

  return useMemo(() => {
    if (!user) {
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canDownload: false,
        canArchive: false,
        canViewHistory: false,
        isOwnFile: false,
      };
    }

    const isOwnFile = file.owner === user.username;

    // Get collection permissions
    const collectionPermissions = user.collections?.[file.collection] || [];
    const hasDeletePermission = collectionPermissions.includes("delete");
    const hasWritePermission = collectionPermissions.includes("write");
    const hasReadPermission = collectionPermissions.includes("read");

    // Users with delete permission have full access
    if (hasDeletePermission) {
      return {
        canRead: true,
        canWrite: true,
        canDelete: true,
        canDownload: true,
        canArchive: true,
        canViewHistory: true,
        isOwnFile,
      };
    }

    // Users with write permission can download their own files
    if (hasWritePermission) {
      return {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canDownload: isOwnFile,
        canArchive: false,
        canViewHistory: false,
        isOwnFile,
      };
    }

    // Users with read permission can download any file
    if (hasReadPermission) {
      return {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canDownload: true,
        canArchive: false,
        canViewHistory: false,
        isOwnFile,
      };
    }

    // No permissions
    return {
      canRead: false,
      canWrite: false,
      canDelete: false,
      canDownload: false,
      canArchive: false,
      canViewHistory: false,
      isOwnFile,
    };
  }, [user, file]);
}
