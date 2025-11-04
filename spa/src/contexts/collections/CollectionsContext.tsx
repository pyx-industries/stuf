import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import collectionsService from "@/services/collections";
import { ApplicationError } from "@/errors/api";
import { useUser } from "@/hooks/user";
import {
  collectionsReducer,
  initialCollectionsState,
  type CollectionsState,
} from "@/reducers/collections";

interface CollectionsContextType extends CollectionsState {
  fetchCollections: () => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(
  undefined,
);

export function CollectionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const [state, dispatch] = useReducer(
    collectionsReducer,
    initialCollectionsState,
  );

  const fetchCollections = useCallback(async () => {
    if (!user) {
      dispatch({ type: "RESET" });
      return;
    }

    try {
      dispatch({ type: "FETCH_START" });

      const result = await collectionsService.getCollections(user);

      // Show error toasts for any partial failures
      result.errors.forEach((error) => {
        toast.error(error.message, { description: error.action });
      });

      // Dispatch appropriate action based on whether there were errors
      if (result.errors.length > 0) {
        // If we have some successful collections, it's a partial success
        if (result.collections.length > 0) {
          dispatch({
            type: "FETCH_PARTIAL_SUCCESS",
            payload: {
              collections: result.collections,
              error: `Failed to fetch ${result.errors.length} collection${result.errors.length > 1 ? "s" : ""}`,
            },
          });
        } else {
          // All collections failed to fetch
          dispatch({
            type: "FETCH_ERROR",
            payload: "Failed to fetch collections",
          });
        }
      } else {
        dispatch({ type: "FETCH_SUCCESS", payload: result.collections });
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        dispatch({ type: "FETCH_ERROR", payload: error.message });
        toast.error(error.message, { description: error.action });
        return;
      }
      // Let error boundary handle unexpected errors
      throw error;
    }
  }, [user?.collections]);

  const value = useMemo(
    () => ({
      ...state,
      fetchCollections,
    }),
    [state, fetchCollections],
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (context === undefined) {
    throw new Error("useCollections must be used within a CollectionsProvider");
  }
  return context;
}
