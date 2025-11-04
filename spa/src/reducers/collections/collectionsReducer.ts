import type { Collection } from "@/types";

export interface CollectionsState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
}

export type CollectionsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: Collection[] }
  | {
      type: "FETCH_PARTIAL_SUCCESS";
      payload: { collections: Collection[]; error: string };
    }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "RESET" };

export function collectionsReducer(
  state: CollectionsState,
  action: CollectionsAction,
): CollectionsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        collections: action.payload,
        error: null,
      };
    case "FETCH_PARTIAL_SUCCESS":
      return {
        ...state,
        loading: false,
        collections: action.payload.collections,
        error: action.payload.error,
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "RESET":
      return { collections: [], loading: false, error: null };
    default:
      return state;
  }
}

export const initialCollectionsState: CollectionsState = {
  collections: [],
  loading: false,
  error: null,
};
