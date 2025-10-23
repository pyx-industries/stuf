import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface CollectionItemProps {
  id: string;
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CollectionItem = forwardRef<
  HTMLButtonElement,
  CollectionItemProps
>(function CollectionItem(
  { id, name, isSelected = false, onClick, className },
  ref,
) {
  const testId = id.toLowerCase().replace(/\s+/g, "-");

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 rounded inline-flex justify-start items-center gap-3 text-left transition-colors min-w-0 cursor-pointer",
        isSelected
          ? "bg-primary hover:bg-primary/90"
          : "hover:bg-black/10 dark:hover:bg-white/10",
        className,
      )}
      data-testid={`collection-item-${testId}`}
      aria-pressed={isSelected}
    >
      <img
        src={isSelected ? "/icons/folder_open.svg" : "/icons/folder.svg"}
        alt=""
        className={cn("w-6 h-6 shrink-0", !isSelected && "dark:invert")}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-base font-normal font-sans leading-snug truncate min-w-0 flex-1",
          isSelected ? "text-black dark:text-black" : "text-foreground",
        )}
      >
        {name}
      </span>
    </button>
  );
});

CollectionItem.displayName = "CollectionItem";
