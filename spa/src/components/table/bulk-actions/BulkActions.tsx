import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export interface BulkActionsProps {
  selectedCount: number;
  onDownload?: () => void;
  onChangeStatus?: (status: string) => void;
  testId?: string;
}

export function BulkActions({
  selectedCount = 0,
  onDownload,
  onChangeStatus,
  testId = "bulk-actions",
}: BulkActionsProps) {
  return (
    <div className="flex justify-start items-center">
      <button
        onClick={onDownload}
        disabled={selectedCount === 0}
        className="px-3 py-2 bg-sidebar rounded-tl-md rounded-bl-md outline outline-1 outline-offset-[-1px] outline-border flex justify-start items-center gap-2.5 hover:bg-sidebar-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
        data-testid={`${testId}-download`}
      >
        <span className="justify-start text-sidebar-foreground text-sm font-normal leading-normal">
          Download
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={selectedCount === 0}>
          <button
            disabled={selectedCount === 0}
            className="px-3 py-2 bg-sidebar rounded-tr-md rounded-br-md border-r border-t border-b border-border flex justify-start items-center gap-2.5 hover:bg-sidebar-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer text-sidebar-foreground"
            data-testid={`${testId}-change-status-trigger`}
          >
            <span className="justify-start text-sidebar-foreground text-sm font-normal leading-normal">
              Change status
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent data-testid={`${testId}-change-status-content`}>
          <DropdownMenuItem
            onClick={() => onChangeStatus?.("in_progress")}
            className="cursor-pointer"
          >
            In progress
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onChangeStatus?.("review")}
            className="cursor-pointer"
          >
            Review
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onChangeStatus?.("done")}
            className="cursor-pointer"
          >
            Done
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
