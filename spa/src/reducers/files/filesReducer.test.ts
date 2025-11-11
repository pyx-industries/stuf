import type { File } from "@/types";
import { describe, expect, it } from "vitest";
import {
  filesReducer,
  initialFilesState,
  type FilesAction,
  type FilesState,
} from "./filesReducer";

// Helper function to create mock files
function createMockFile(overrides: Partial<File> = {}): File {
  return {
    object_name: "file.pdf",
    collection: "collection-1",
    original_filename: "file.pdf",
    content_type: "application/pdf",
    owner: "user1",
    upload_time: "2024-01-01T00:00:00Z",
    size: 1024,
    metadata: {},
    ...overrides,
  };
}

describe("filesReducer", () => {
  describe("FETCH_START", () => {
    it("sets loading to true and clears error", () => {
      const state: FilesState = {
        files: [],
        loading: false,
        error: "Previous error",
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = { type: "FETCH_START" };
      const newState = filesReducer(state, action);

      expect(newState.loading).toBe(true);
      expect(newState.error).toBe(null);
      expect(newState.files).toEqual([]);
    });

    it("preserves existing files during fetch", () => {
      const existingFiles: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];

      const state: FilesState = {
        files: existingFiles,
        loading: false,
        error: null,
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
      };

      const action: FilesAction = { type: "FETCH_START" };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual(existingFiles);
    });

    it("preserves pagination state during fetch", () => {
      const state: FilesState = {
        files: [],
        loading: false,
        error: null,
        totalPages: 5,
        currentPage: 3,
        totalCount: 50,
      };

      const action: FilesAction = { type: "FETCH_START" };
      const newState = filesReducer(state, action);

      expect(newState.totalPages).toBe(5);
      expect(newState.currentPage).toBe(3);
      expect(newState.totalCount).toBe(50);
    });
  });

  describe("FETCH_SUCCESS", () => {
    it("sets loading to false and updates files", () => {
      const files: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
        createMockFile({
          object_name: "file2.csv",
          original_filename: "file2.csv",
          content_type: "text/csv",
          size: 2048,
          upload_time: "2024-01-02T00:00:00Z",
          owner: "user2",
        }),
      ];

      const state: FilesState = {
        files: [],
        loading: true,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "FETCH_SUCCESS",
        payload: files,
      };
      const newState = filesReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(null);
      expect(newState.files).toEqual(files);
    });

    it("replaces existing files with new data", () => {
      const oldFiles: File[] = [
        createMockFile({
          object_name: "old.pdf",
          original_filename: "old.pdf",
        }),
      ];
      const newFiles: File[] = [
        createMockFile({
          object_name: "new1.pdf",
          original_filename: "new1.pdf",
          size: 2048,
          upload_time: "2024-01-02T00:00:00Z",
          owner: "user2",
        }),
        createMockFile({
          object_name: "new2.csv",
          original_filename: "new2.csv",
          content_type: "text/csv",
          size: 3072,
          upload_time: "2024-01-03T00:00:00Z",
          owner: "user3",
        }),
      ];

      const state: FilesState = {
        files: oldFiles,
        loading: true,
        error: null,
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
      };

      const action: FilesAction = {
        type: "FETCH_SUCCESS",
        payload: newFiles,
      };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual(newFiles);
      expect(newState.files).not.toEqual(oldFiles);
    });

    it("handles empty files array", () => {
      const state: FilesState = {
        files: [
          createMockFile({
            object_name: "file1.pdf",
            original_filename: "file1.pdf",
          }),
        ],
        loading: true,
        error: null,
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
      };

      const action: FilesAction = {
        type: "FETCH_SUCCESS",
        payload: [],
      };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual([]);
      expect(newState.loading).toBe(false);
    });

    it("clears previous error on successful fetch", () => {
      const files: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];

      const state: FilesState = {
        files: [],
        loading: true,
        error: "Previous fetch error",
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "FETCH_SUCCESS",
        payload: files,
      };
      const newState = filesReducer(state, action);

      expect(newState.error).toBe(null);
      expect(newState.files).toEqual(files);
    });
  });

  describe("FETCH_PARTIAL_SUCCESS", () => {
    it("sets loading to false, updates files, and sets error", () => {
      const files: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
        createMockFile({
          object_name: "file2.csv",
          original_filename: "file2.csv",
          content_type: "text/csv",
          size: 2048,
          upload_time: "2024-01-02T00:00:00Z",
          owner: "user2",
        }),
      ];

      const state: FilesState = {
        files: [],
        loading: true,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          files,
          error: "Failed to fetch files from 1 collection",
        },
      };
      const newState = filesReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe("Failed to fetch files from 1 collection");
      expect(newState.files).toEqual(files);
    });

    it("handles partial success with multiple files", () => {
      const oldFiles: File[] = [
        createMockFile({
          object_name: "old.pdf",
          original_filename: "old.pdf",
        }),
      ];
      const newFiles: File[] = [
        createMockFile({
          object_name: "new1.pdf",
          original_filename: "new1.pdf",
          size: 2048,
          upload_time: "2024-01-02T00:00:00Z",
          owner: "user2",
        }),
        createMockFile({
          object_name: "new2.csv",
          original_filename: "new2.csv",
          content_type: "text/csv",
          size: 3072,
          upload_time: "2024-01-03T00:00:00Z",
          owner: "user3",
        }),
      ];

      const state: FilesState = {
        files: oldFiles,
        loading: true,
        error: null,
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
      };

      const action: FilesAction = {
        type: "FETCH_PARTIAL_SUCCESS",
        payload: {
          files: newFiles,
          error: "Failed to fetch files from 2 collections",
        },
      };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual(newFiles);
      expect(newState.error).toBe("Failed to fetch files from 2 collections");
      expect(newState.loading).toBe(false);
    });
  });

  describe("FETCH_ERROR", () => {
    it("sets loading to false and updates error message", () => {
      const state: FilesState = {
        files: [],
        loading: true,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "FETCH_ERROR",
        payload: "Failed to fetch files",
      };
      const newState = filesReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.error).toBe("Failed to fetch files");
      expect(newState.files).toEqual([]);
    });

    it("preserves existing files on error", () => {
      const existingFiles: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];

      const state: FilesState = {
        files: existingFiles,
        loading: true,
        error: null,
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
      };

      const action: FilesAction = {
        type: "FETCH_ERROR",
        payload: "Network error",
      };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual(existingFiles);
      expect(newState.error).toBe("Network error");
    });

    it("replaces previous error with new error message", () => {
      const state: FilesState = {
        files: [],
        loading: true,
        error: "Old error",
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "FETCH_ERROR",
        payload: "New error",
      };
      const newState = filesReducer(state, action);

      expect(newState.error).toBe("New error");
    });
  });

  describe("SET_PAGINATION", () => {
    it("updates all pagination values", () => {
      const state: FilesState = {
        files: [],
        loading: false,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "SET_PAGINATION",
        payload: {
          totalPages: 10,
          currentPage: 5,
          totalCount: 100,
        },
      };
      const newState = filesReducer(state, action);

      expect(newState.totalPages).toBe(10);
      expect(newState.currentPage).toBe(5);
      expect(newState.totalCount).toBe(100);
    });

    it("updates pagination without affecting other state", () => {
      const existingFiles: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];

      const state: FilesState = {
        files: existingFiles,
        loading: true,
        error: "Some error",
        totalPages: 1,
        currentPage: 1,
        totalCount: 10,
      };

      const action: FilesAction = {
        type: "SET_PAGINATION",
        payload: {
          totalPages: 5,
          currentPage: 2,
          totalCount: 50,
        },
      };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual(existingFiles);
      expect(newState.loading).toBe(true);
      expect(newState.error).toBe("Some error");
      expect(newState.totalPages).toBe(5);
      expect(newState.currentPage).toBe(2);
      expect(newState.totalCount).toBe(50);
    });
  });

  describe("RESET", () => {
    it("resets state to initial values", () => {
      const state: FilesState = {
        files: [
          createMockFile({
            object_name: "file1.pdf",
            original_filename: "file1.pdf",
          }),
        ],
        loading: true,
        error: "Some error",
        totalPages: 10,
        currentPage: 5,
        totalCount: 100,
      };

      const action: FilesAction = { type: "RESET" };
      const newState = filesReducer(state, action);

      expect(newState).toEqual(initialFilesState);
    });

    it("clears all state properties", () => {
      const state: FilesState = {
        files: [
          createMockFile({
            object_name: "file1.pdf",
            original_filename: "file1.pdf",
          }),
        ],
        loading: true,
        error: "Error message",
        totalPages: 5,
        currentPage: 3,
        totalCount: 50,
      };

      const action: FilesAction = { type: "RESET" };
      const newState = filesReducer(state, action);

      expect(newState.files).toEqual([]);
      expect(newState.loading).toBe(false);
      expect(newState.error).toBe(null);
      expect(newState.totalPages).toBe(0);
      expect(newState.currentPage).toBe(1);
      expect(newState.totalCount).toBe(0);
    });
  });

  describe("default case", () => {
    it("returns the same state for unknown action types", () => {
      const state: FilesState = {
        files: [
          createMockFile({
            object_name: "file1.pdf",
            original_filename: "file1.pdf",
          }),
        ],
        loading: false,
        error: null,
        totalPages: 1,
        currentPage: 1,
        totalCount: 1,
      };

      // @ts-expect-error: Testing invalid action type
      const action: FilesAction = { type: "UNKNOWN_ACTION" };
      const newState = filesReducer(state, action);

      expect(newState).toBe(state);
    });
  });

  describe("initialFilesState", () => {
    it("has correct initial values", () => {
      expect(initialFilesState).toEqual({
        files: [],
        loading: false,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      });
    });
  });

  describe("state immutability", () => {
    it("does not mutate original state on FETCH_START", () => {
      const state: FilesState = {
        files: [],
        loading: false,
        error: "Error",
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const originalError = state.error;
      const action: FilesAction = { type: "FETCH_START" };

      filesReducer(state, action);

      expect(state.error).toBe(originalError);
      expect(state.loading).toBe(false);
    });

    it("does not mutate original state on FETCH_SUCCESS", () => {
      const state: FilesState = {
        files: [],
        loading: true,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const newFiles: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];
      const action: FilesAction = {
        type: "FETCH_SUCCESS",
        payload: newFiles,
      };

      filesReducer(state, action);

      expect(state.files).toEqual([]);
      expect(state.loading).toBe(true);
    });

    it("does not mutate original state on SET_PAGINATION", () => {
      const state: FilesState = {
        files: [],
        loading: false,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };

      const action: FilesAction = {
        type: "SET_PAGINATION",
        payload: {
          totalPages: 10,
          currentPage: 5,
          totalCount: 100,
        },
      };

      filesReducer(state, action);

      expect(state.totalPages).toBe(0);
      expect(state.currentPage).toBe(1);
      expect(state.totalCount).toBe(0);
    });
  });

  describe("action sequences", () => {
    it("handles complete fetch lifecycle", () => {
      let state = initialFilesState;

      // Start fetching
      state = filesReducer(state, { type: "FETCH_START" });
      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);

      // Success
      const files: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];
      state = filesReducer(state, {
        type: "FETCH_SUCCESS",
        payload: files,
      });
      expect(state.loading).toBe(false);
      expect(state.files).toEqual(files);
    });

    it("handles fetch with pagination update", () => {
      let state = initialFilesState;

      // Start fetching
      state = filesReducer(state, { type: "FETCH_START" });

      // Success
      const files: File[] = [
        createMockFile({
          object_name: "file1.pdf",
          original_filename: "file1.pdf",
        }),
      ];
      state = filesReducer(state, {
        type: "FETCH_SUCCESS",
        payload: files,
      });

      // Update pagination
      state = filesReducer(state, {
        type: "SET_PAGINATION",
        payload: {
          totalPages: 5,
          currentPage: 1,
          totalCount: 50,
        },
      });

      expect(state.files).toEqual(files);
      expect(state.totalPages).toBe(5);
      expect(state.currentPage).toBe(1);
      expect(state.totalCount).toBe(50);
    });
  });
});
