import { cn } from "@/lib/utils";
import { CollectionItem } from "./CollectionItem";
import { useState, useEffect, useRef } from "react";
import type { Collection } from "@/types";

// Maximum height for scrollable collections list (256px)
const COLLECTIONS_MAX_HEIGHT = "max-h-64";

interface CollectionNavProps {
  collections: Collection[];
  selectedCollectionId?: string | null;
  onCollectionSelect?: (collectionId: string) => void;
  onHomeClick?: () => void;
  isHomeSelected?: boolean;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
}

export function CollectionNav({
  collections,
  selectedCollectionId,
  onCollectionSelect,
  onHomeClick,
  isHomeSelected = false,
  isExpanded: controlledIsExpanded,
  onToggleExpanded,
  className,
}: CollectionNavProps) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const isExpanded =
    controlledIsExpanded !== undefined
      ? controlledIsExpanded
      : internalIsExpanded;

  const handleToggle = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  // Auto-scroll to selected collection when it changes or when expanded
  useEffect(() => {
    if (
      isExpanded &&
      selectedCollectionId &&
      selectedItemRef.current &&
      containerRef.current
    ) {
      const container = containerRef.current;
      const selectedItem = selectedItemRef.current;

      // Get the positions
      const containerRect = container.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      // Check if item is already fully visible
      const isVisible =
        itemRect.top >= containerRect.top &&
        itemRect.bottom <= containerRect.bottom;

      // Only scroll if not visible
      if (!isVisible) {
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [selectedCollectionId, isExpanded]);

  return (
    <div
      className={cn(
        "w-full flex flex-col justify-start items-end gap-2",
        className,
      )}
      data-testid="collection-nav"
    >
      {/* Files home header */}
      <div className="self-stretch flex flex-col gap-2">
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={onHomeClick}
            className="flex-1 py-2 rounded inline-flex justify-start items-center gap-3 transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            data-testid="collection-nav-home"
            aria-pressed={isHomeSelected}
          >
            <img
              src="/icons/contextual_token.svg"
              alt=""
              className="w-6 h-6 shrink-0 dark:invert"
              aria-hidden="true"
            />
            <span className="text-foreground text-base font-normal font-sans leading-snug">
              Files home
            </span>
          </button>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
            aria-label={
              isExpanded ? "Collapse collections" : "Expand collections"
            }
            data-testid="collection-nav-toggle"
          >
            <img
              src="/icons/keyboard_arrow_up.svg"
              alt=""
              className={cn(
                "w-6 h-6 shrink-0 transition-transform dark:invert",
                !isExpanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Collections list */}
        {isExpanded && (
          <div
            ref={containerRef}
            className={cn(
              "self-stretch pl-9 flex flex-col justify-start items-start gap-2 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent",
              COLLECTIONS_MAX_HEIGHT,
            )}
          >
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                ref={
                  selectedCollectionId === collection.id
                    ? selectedItemRef
                    : undefined
                }
                id={collection.id}
                name={collection.name}
                isSelected={selectedCollectionId === collection.id}
                onClick={() => onCollectionSelect?.(collection.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
