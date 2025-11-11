import {
  MoreOptionGroup,
  MoreOptions,
} from "@/components/utility/more-options";
import { useFilePermissions } from "@/hooks/file/useFilePermissions";
import type { File } from "@/types";
import { useMemo } from "react";

export interface FileActionsProps {
  file: File;
  onDownload: (file: File) => void;
  onDelete: (file: File) => void;
  onViewHistory?: (file: File) => void;
  onArchive?: (file: File) => void;
}

export function FileActions({
  file,
  onDownload,
  onDelete,
  onViewHistory,
  onArchive,
}: FileActionsProps) {
  const permissions = useFilePermissions(file);

  const groups: MoreOptionGroup[] = useMemo(() => {
    if (permissions.canDelete) {
      // Full access
      return [
        {
          options: [
            {
              label: "Download",
              onClick: () => onDownload(file),
            },
            ...(onViewHistory
              ? [
                  {
                    label: "View History",
                    onClick: () => onViewHistory(file),
                  },
                ]
              : []),
            ...(onArchive
              ? [
                  {
                    label: "Archive",
                    onClick: () => onArchive(file),
                  },
                ]
              : []),
          ],
        },
        {
          options: [
            {
              label: "Delete",
              onClick: () => onDelete(file),
              destructive: true,
            },
          ],
        },
      ];
    }

    if (permissions.canDownload) {
      // Can download
      return [
        {
          options: [
            {
              label: "Download",
              onClick: () => onDownload(file),
            },
          ],
        },
      ];
    }

    // No actions available
    return [
      {
        options: [
          {
            label: "No actions available",
            onClick: () => {},
            disabled: true,
          },
        ],
      },
    ];
  }, [permissions, file, onDownload, onDelete, onViewHistory, onArchive]);

  return <MoreOptions groups={groups} />;
}
