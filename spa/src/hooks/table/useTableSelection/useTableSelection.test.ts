import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTableSelection } from "./useTableSelection";

describe("useTableSelection", () => {
  describe("uncontrolled mode", () => {
    it("starts with empty selection", () => {
      const { result } = renderHook(() => useTableSelection());

      expect(result.current.selectedItems.size).toBe(0);
    });

    it("toggles item selection", () => {
      const { result } = renderHook(() => useTableSelection());

      act(() => {
        result.current.toggleItem("item1");
      });

      expect(result.current.selectedItems.has("item1")).toBe(true);

      act(() => {
        result.current.toggleItem("item1");
      });

      expect(result.current.selectedItems.has("item1")).toBe(false);
    });

    it("toggles all items", () => {
      const { result } = renderHook(() => useTableSelection());
      const allIds = ["item1", "item2", "item3"];

      act(() => {
        result.current.toggleAll(allIds);
      });

      expect(result.current.areAllSelected(allIds)).toBe(true);

      act(() => {
        result.current.toggleAll(allIds);
      });

      expect(result.current.selectedItems.size).toBe(0);
    });

    it("clears selection", () => {
      const { result } = renderHook(() => useTableSelection());

      act(() => {
        result.current.toggleItem("item1");
        result.current.toggleItem("item2");
      });

      expect(result.current.selectedItems.size).toBe(2);

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedItems.size).toBe(0);
    });

    it("checks if all items are selected", () => {
      const { result } = renderHook(() => useTableSelection());
      const allIds = ["item1", "item2", "item3"];

      expect(result.current.areAllSelected(allIds)).toBe(false);

      act(() => {
        result.current.toggleAll(allIds);
      });

      expect(result.current.areAllSelected(allIds)).toBe(true);
    });

    it("checks if some items are selected", () => {
      const { result } = renderHook(() => useTableSelection());
      const allIds = ["item1", "item2", "item3"];

      expect(result.current.areSomeSelected(allIds)).toBe(false);

      act(() => {
        result.current.toggleItem("item1");
      });

      expect(result.current.areSomeSelected(allIds)).toBe(true);

      act(() => {
        result.current.toggleAll(allIds);
      });

      expect(result.current.areSomeSelected(allIds)).toBe(false);
    });

    it("returns false for areAllSelected with empty array", () => {
      const { result } = renderHook(() => useTableSelection());

      expect(result.current.areAllSelected([])).toBe(false);
    });

    it("returns false for areSomeSelected with empty array", () => {
      const { result } = renderHook(() => useTableSelection());

      expect(result.current.areSomeSelected([])).toBe(false);
    });
  });

  describe("controlled mode", () => {
    it("uses external selection state", () => {
      const selectedItems = new Set(["item1", "item2"]);
      const onSelectionChange = vi.fn();

      const { result } = renderHook(() =>
        useTableSelection({ selectedItems, onSelectionChange }),
      );

      expect(result.current.selectedItems).toBe(selectedItems);
      expect(result.current.selectedItems.has("item1")).toBe(true);
      expect(result.current.selectedItems.has("item2")).toBe(true);
    });

    it("calls onSelectionChange when toggling item", () => {
      const selectedItems = new Set<string>();
      const onSelectionChange = vi.fn();

      const { result } = renderHook(() =>
        useTableSelection({ selectedItems, onSelectionChange }),
      );

      act(() => {
        result.current.toggleItem("item1");
      });

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      const newSelection = onSelectionChange.mock.calls[0][0];
      expect(newSelection.has("item1")).toBe(true);
    });

    it("calls onSelectionChange when toggling all", () => {
      const selectedItems = new Set<string>();
      const onSelectionChange = vi.fn();

      const { result } = renderHook(() =>
        useTableSelection({ selectedItems, onSelectionChange }),
      );

      const allIds = ["item1", "item2", "item3"];

      act(() => {
        result.current.toggleAll(allIds);
      });

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      const newSelection = onSelectionChange.mock.calls[0][0];
      expect(newSelection.size).toBe(3);
    });

    it("calls onSelectionChange when clearing selection", () => {
      const selectedItems = new Set(["item1", "item2"]);
      const onSelectionChange = vi.fn();

      const { result } = renderHook(() =>
        useTableSelection({ selectedItems, onSelectionChange }),
      );

      act(() => {
        result.current.clearSelection();
      });

      expect(onSelectionChange).toHaveBeenCalledTimes(1);
      const newSelection = onSelectionChange.mock.calls[0][0];
      expect(newSelection.size).toBe(0);
    });
  });
});
