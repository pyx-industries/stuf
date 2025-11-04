import { describe, it, expect } from "vitest";
import {
  collectionsReducer,
  initialCollectionsState,
  type CollectionsState,
  type CollectionsAction,
} from "./collectionsReducer";
import type { Collection } from "@/types";

describe("collectionsReducer", () => {
  describe("FETCH_START", () => {
    it("sets loading to true and clears error", () => {
      const state: CollectionsState = {
        collections: [],
        loading: false,
        error: "Previous error",
      };

      const action: CollectionsAction = { type: "FETCH_START" };
      const newState = collectionsReducer(state, action);

      expect(newState.loading).toBe(true);
      expect(newState.error).toBe(null);
      expect(newState.collections).toEqual([]);
    });

    it("preserves existing collections during fetch", () => {
      const existingCollections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];

      const state: CollectionsState = {
        collections: existingCollections,
        loading: false,
        error: null,
      };

      const action: CollectionsAction = { type: "FETCH_START" };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual(existingCollections);
    });
  });

  describe("FETCH_SUCCESS", () => {
    it("sets loading to false and updates collections", () => {
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
        { id: "2", name: "Collection 2", fileCount: 10 },
      ];

      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_SUCCESS",
        payload: collections,
      };
      const newState = collectionsReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(null);
      expect(newState.collections).toEqual(collections);
    });

    it("replaces existing collections with new data", () => {
      const oldCollections: Collection[] = [
        { id: "1", name: "Old Collection", fileCount: 1 },
      ];
      const newCollections: Collection[] = [
        { id: "2", name: "New Collection", fileCount: 2 },
        { id: "3", name: "Another Collection", fileCount: 3 },
      ];

      const state: CollectionsState = {
        collections: oldCollections,
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_SUCCESS",
        payload: newCollections,
      };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual(newCollections);
      expect(newState.collections).not.toEqual(oldCollections);
    });

    it("handles empty collections array", () => {
      const state: CollectionsState = {
        collections: [{ id: "1", name: "Collection 1", fileCount: 5 }],
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_SUCCESS",
        payload: [],
      };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual([]);
      expect(newState.loading).toBe(false);
    });

    it("clears previous error on successful fetch", () => {
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];

      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: "Previous fetch error",
      };

      const action: CollectionsAction = {
        type: "FETCH_SUCCESS",
        payload: collections,
      };
      const newState = collectionsReducer(state, action);

      expect(newState.error).toBe(null);
      expect(newState.collections).toEqual(collections);
    });
  });

  describe("FETCH_PARTIAL_SUCCESS", () => {
    it("sets loading to false, updates collections, and sets error", () => {
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
        { id: "2", name: "Collection 2", fileCount: 10 },
      ];

      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          collections,
          error: "Failed to fetch 1 collection",
        },
      };
      const newState = collectionsReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe("Failed to fetch 1 collection");
      expect(newState.collections).toEqual(collections);
    });

    it("handles partial success with multiple collections", () => {
      const oldCollections: Collection[] = [
        { id: "1", name: "Old Collection", fileCount: 1 },
      ];
      const newCollections: Collection[] = [
        { id: "2", name: "New Collection", fileCount: 2 },
        { id: "3", name: "Another Collection", fileCount: 3 },
      ];

      const state: CollectionsState = {
        collections: oldCollections,
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          collections: newCollections,
          error: "Failed to fetch 2 collections",
        },
      };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual(newCollections);
      expect(newState.error).toBe("Failed to fetch 2 collections");
      expect(newState.loading).toBe(false);
    });

    it("handles partial success with empty collections array", () => {
      const state: CollectionsState = {
        collections: [{ id: "1", name: "Collection 1", fileCount: 5 }],
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          collections: [],
          error: "Failed to fetch 3 collections",
        },
      };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual([]);
      expect(newState.error).toBe("Failed to fetch 3 collections");
      expect(newState.loading).toBe(false);
    });
  });

  describe("FETCH_ERROR", () => {
    it("sets loading to false and updates error message", () => {
      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_ERROR",
        payload: "Failed to fetch collections",
      };
      const newState = collectionsReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe("Failed to fetch collections");
      expect(newState.collections).toEqual([]);
    });

    it("preserves existing collections on error", () => {
      const existingCollections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];

      const state: CollectionsState = {
        collections: existingCollections,
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_ERROR",
        payload: "Network error",
      };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual(existingCollections);
      expect(newState.error).toBe("Network error");
    });

    it("replaces previous error with new error message", () => {
      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: "Old error",
      };

      const action: CollectionsAction = {
        type: "FETCH_ERROR",
        payload: "New error",
      };
      const newState = collectionsReducer(state, action);

      expect(newState.error).toBe("New error");
    });
  });

  describe("RESET", () => {
    it("resets state to initial values", () => {
      const state: CollectionsState = {
        collections: [
          { id: "1", name: "Collection 1", fileCount: 5 },
          { id: "2", name: "Collection 2", fileCount: 10 },
        ],
        loading: true,
        error: "Some error",
      };

      const action: CollectionsAction = { type: "RESET" };
      const newState = collectionsReducer(state, action);

      expect(newState).toEqual(initialCollectionsState);
    });

    it("clears collections, loading state, and error", () => {
      const state: CollectionsState = {
        collections: [{ id: "1", name: "Collection 1", fileCount: 5 }],
        loading: true,
        error: "Error message",
      };

      const action: CollectionsAction = { type: "RESET" };
      const newState = collectionsReducer(state, action);

      expect(newState.collections).toEqual([]);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(null);
    });
  });

  describe("default case", () => {
    it("returns the same state for unknown action types", () => {
      const state: CollectionsState = {
        collections: [{ id: "1", name: "Collection 1", fileCount: 5 }],
        loading: false,
        error: null,
      };

      // @ts-expect-error: Testing invalid action type
      const action: CollectionsAction = { type: "UNKNOWN_ACTION" };
      const newState = collectionsReducer(state, action);

      expect(newState).toBe(state);
    });
  });

  describe("initialCollectionsState", () => {
    it("has correct initial values", () => {
      expect(initialCollectionsState).toEqual({
        collections: [],
        loading: false,
        error: null,
      });
    });
  });

  describe("state immutability", () => {
    it("does not mutate original state on FETCH_START", () => {
      const state: CollectionsState = {
        collections: [],
        loading: false,
        error: "Error",
      };

      const originalError = state.error;
      const action: CollectionsAction = { type: "FETCH_START" };

      collectionsReducer(state, action);

      expect(state.error).toBe(originalError);
      expect(state.loading).toBe(false);
    });

    it("does not mutate original state on FETCH_SUCCESS", () => {
      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: null,
      };

      const newCollections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];
      const action: CollectionsAction = {
        type: "FETCH_SUCCESS",
        payload: newCollections,
      };

      collectionsReducer(state, action);

      expect(state.collections).toEqual([]);
      expect(state.loading).toBe(true);
    });

    it("does not mutate original state on FETCH_PARTIAL_SUCCESS", () => {
      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: null,
      };

      const newCollections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];
      const action: CollectionsAction = {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          collections: newCollections,
          error: "Failed to fetch 1 collection",
        },
      };

      collectionsReducer(state, action);

      expect(state.collections).toEqual([]);
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it("does not mutate original state on FETCH_ERROR", () => {
      const state: CollectionsState = {
        collections: [],
        loading: true,
        error: null,
      };

      const action: CollectionsAction = {
        type: "FETCH_ERROR",
        payload: "Error message",
      };

      collectionsReducer(state, action);

      expect(state.error).toBe(null);
      expect(state.loading).toBe(true);
    });

    it("does not mutate original state on RESET", () => {
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];
      const state: CollectionsState = {
        collections,
        loading: true,
        error: "Error",
      };

      const action: CollectionsAction = { type: "RESET" };

      collectionsReducer(state, action);

      expect(state.collections).toBe(collections);
      expect(state.loading).toBe(true);
      expect(state.error).toBe("Error");
    });
  });

  describe("action sequences", () => {
    it("handles complete fetch lifecycle", () => {
      let state = initialCollectionsState;

      // Start fetching
      state = collectionsReducer(state, { type: "FETCH_START" });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);

      // Success
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];
      state = collectionsReducer(state, {
        type: "FETCH_SUCCESS",
        payload: collections,
      });
      expect(state.loading).toBe(false);
      expect(state.collections).toEqual(collections);
    });

    it("handles fetch start followed by partial success", () => {
      let state = initialCollectionsState;

      // Start fetching
      state = collectionsReducer(state, { type: "FETCH_START" });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);

      // Partial success
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];
      state = collectionsReducer(state, {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          collections,
          error: "Failed to fetch 2 collections",
        },
      });
      expect(state.loading).toBe(false);
      expect(state.collections).toEqual(collections);
      expect(state.error).toBe("Failed to fetch 2 collections");
    });

    it("handles fetch start followed by error", () => {
      let state = initialCollectionsState;

      // Start fetching
      state = collectionsReducer(state, { type: "FETCH_START" });
      expect(state.loading).toBe(true);

      // Error
      state = collectionsReducer(state, {
        type: "FETCH_ERROR",
        payload: "Network error",
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Network error");
    });

    it("handles reset after successful fetch", () => {
      let state = initialCollectionsState;

      // Fetch data
      const collections: Collection[] = [
        { id: "1", name: "Collection 1", fileCount: 5 },
      ];
      state = collectionsReducer(state, {
        type: "FETCH_SUCCESS",
        payload: collections,
      });

      // Reset
      state = collectionsReducer(state, { type: "RESET" });
      expect(state).toEqual(initialCollectionsState);
    });

    it("handles multiple fetch cycles", () => {
      let state = initialCollectionsState;

      // First fetch
      state = collectionsReducer(state, { type: "FETCH_START" });
      state = collectionsReducer(state, {
        type: "FETCH_SUCCESS",
        payload: [{ id: "1", name: "First", fileCount: 1 }],
      });
      expect(state.collections.length).toBe(1);

      // Second fetch
      state = collectionsReducer(state, { type: "FETCH_START" });
      state = collectionsReducer(state, {
        type: "FETCH_SUCCESS",
        payload: [
          { id: "2", name: "Second", fileCount: 2 },
          { id: "3", name: "Third", fileCount: 3 },
        ],
      });
      expect(state.collections.length).toBe(2);
      expect(state.collections[0].id).toBe("2");
    });
  });
});
