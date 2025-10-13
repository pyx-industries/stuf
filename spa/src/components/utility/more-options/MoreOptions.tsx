import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface MoreOption {
  label: string | ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export interface MoreOptionGroup {
  options: MoreOption[];
}

export interface MoreOptionsProps {
  groups: MoreOptionGroup[];
  className?: string;
  testId?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  alignOffset?: number;
}

export function MoreOptions({
  groups,
  className,
  testId = "more-options",
  align = "end",
  side = "bottom",
  sideOffset = 8,
  alignOffset,
}: MoreOptionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 hover:bg-accent rounded-sm cursor-pointer focus:outline-none focus-visible:outline-none",
          className,
        )}
        data-testid={`${testId}-trigger`}
      >
        <img
          src="/icons/more_vert.svg"
          alt="More options"
          width={6}
          height={20}
          className="dark:invert"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        data-testid={`${testId}-content`}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              {group.options.map((option, optionIndex) => (
                <DropdownMenuItem
                  key={optionIndex}
                  onClick={option.onClick}
                  disabled={option.disabled}
                  className={cn(
                    "cursor-pointer",
                    option.destructive &&
                      "text-destructive focus:text-destructive",
                  )}
                  data-testid={`${testId}-option-${groupIndex}-${optionIndex}`}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
