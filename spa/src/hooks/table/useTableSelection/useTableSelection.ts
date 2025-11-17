import { useCallback, useState } from "react";

export interface UseTableSelectionOptions {
  /**
   * Externally controlled selection state
   */
  selectedItems?: Set<string>;
  /**
   * Callback when selection changes (for controlled mode)
   */
  onSelectionChange?: (selected: Set<string>) => void;
}

export interface UseTableSelectionReturn {
  /**
   * Current selection state
   */
  selectedItems: Set<string>;
  /**
   * Toggle selection of a single item
   */
  toggleItem: (id: string) => void;
  /**
   * Toggle selection of all items
   */
  toggleAll: (allIds: string[]) => void;
  /**
   * Clear all selections
   */
  clearSelection: () => void;
  /**
   * Check if all items are selected
   */
  areAllSelected: (allIds: string[]) => boolean;
  /**
   * Check if some (but not all) items are selected
   */
  areSomeSelected: (allIds: string[]) => boolean;
}

/**
 * Hook for managing table row selection state
 * Supports both controlled and uncontrolled modes
 */
export function useTableSelection({
  selectedItems: externalSelectedItems,
  onSelectionChange,
}: UseTableSelectionOptions = {}): UseTableSelectionReturn {
  const [internalSelectedItems, setInternalSelectedItems] = useState<
    Set<string>
  >(new Set());

  const selectedItems = externalSelectedItems ?? internalSelectedItems;

  // Wrapper to handle both controlled and uncontrolled selection state
  const updateSelectedItems = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      if (onSelectionChange) {
        // Controlled: compute new state and pass it to parent
        const newSelection = updater(selectedItems);
        onSelectionChange(newSelection);
      } else {
        // Uncontrolled: use internal state with functional update
        setInternalSelectedItems(updater);
      }
    },
    [onSelectionChange, selectedItems],
  );

  const toggleItem = useCallback(
    (id: string) => {
      updateSelectedItems((prev: Set<string>) => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        return newSelection;
      });
    },
    [updateSelectedItems],
  );

  const toggleAll = useCallback(
    (allIds: string[]) => {
      updateSelectedItems((prev: Set<string>) => {
        const allSelected = allIds.every((id) => prev.has(id));
        if (allSelected) {
          // Deselect all
          return new Set();
        } else {
          // Select all
          return new Set(allIds);
        }
      });
    },
    [updateSelectedItems],
  );

  const clearSelection = useCallback(() => {
    updateSelectedItems(() => new Set());
  }, [updateSelectedItems]);

  const areAllSelected = useCallback(
    (allIds: string[]) => {
      if (allIds.length === 0) return false;
      return allIds.every((id) => selectedItems.has(id));
    },
    [selectedItems],
  );

  const areSomeSelected = useCallback(
    (allIds: string[]) => {
      if (allIds.length === 0) return false;
      const hasAny = allIds.some((id) => selectedItems.has(id));
      const hasAll = allIds.every((id) => selectedItems.has(id));
      return hasAny && !hasAll;
    },
    [selectedItems],
  );

  return {
    selectedItems,
    toggleItem,
    toggleAll,
    clearSelection,
    areAllSelected,
    areSomeSelected,
  };
}
