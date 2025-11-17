import type { File } from "@/types";

export interface FilesState {
  files: File[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export type FilesAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: File[] }
  | { type: "FETCH_PARTIAL_SUCCESS"; payload: { files: File[]; error: string } }
  | { type: "FETCH_ERROR"; payload: string }
  | {
      type: "SET_PAGINATION";
      payload: { totalPages: number; currentPage: number; totalCount: number };
    }
  | { type: "RESET" };

export function filesReducer(
  state: FilesState,
  action: FilesAction,
): FilesState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, files: action.payload, error: null };
    case "FETCH_PARTIAL_SUCCESS":
      return {
        ...state,
        loading: false,
        files: action.payload.files,
        error: action.payload.error,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "SET_PAGINATION":
      return {
        ...state,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage,
        totalCount: action.payload.totalCount,
      };
    case "RESET":
      return {
        files: [],
        loading: false,
        error: null,
        totalPages: 0,
        currentPage: 1,
        totalCount: 0,
      };
    default:
      return state;
  }
}

export const initialFilesState: FilesState = {
  files: [],
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalCount: 0,
};
