import type { IApiClient } from "@/types/services/api";
import type {
  ICollectionsService,
  GetCollectionsResult,
} from "@/types/services/collections";
import type { User, ServiceError } from "@/types";
import { NotFoundError, ForbiddenError, ApplicationError } from "@/errors/api";
import { ERROR_ACTIONS, ERROR_MESSAGES } from "@/errors/messages";

/**
 * Service for managing collections
 * TODO: Refactor to use dedicated /api/collections endpoint when available
 */
export class CollectionsService implements ICollectionsService {
  constructor(private apiClient: IApiClient) {}

  /**
   * Get collections with their file counts
   * Returns partial results even if some collections fail
   * @param user - User object from auth context
   */
  async getCollections(user: User): Promise<GetCollectionsResult> {
    const collectionNames = Object.keys(user.collections || {});
    const errors: ServiceError[] = [];

    // TODO: Replace with dedicated /api/collections endpoint that returns file counts
    // Currently fetching file counts individually from /api/files/{collection}
    const collections = await Promise.all(
      collectionNames.map(async (name) => {
        try {
          const fileCount = await this._getCollectionFileCount(name);
          return {
            id: name,
            name,
            fileCount,
          };
        } catch (error) {
          // Collect errors from failed collections
          if (error instanceof ApplicationError) {
            errors.push({
              message: error.message,
              action: error.action,
            });
          } else {
            const errorMessage =
              error instanceof Error
                ? error.message
                : ERROR_MESSAGES.UNKNOWN_ERROR;
            errors.push({
              message: ERROR_MESSAGES.FETCH_FAILED(
                `file count for "${name}"`,
                errorMessage,
              ),
              action: ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
            });
          }
          return {
            id: name,
            name,
            fileCount: 0,
          };
        }
      }),
    );

    return { collections, errors };
  }

  /**
   * Get the number of files in a collection
   * TODO: This should come from a dedicated collections endpoint
   * @throws {ApplicationError} On permission or fetch failure
   */
  private async _getCollectionFileCount(collectionId: string): Promise<number> {
    try {
      const response = await this.apiClient.request(
        `/api/files/${collectionId}`,
      );
      return response.files?.length || 0;
    } catch (error) {
      // Handle specific error types with actionable messages
      if (error instanceof NotFoundError) {
        throw new ApplicationError(
          ERROR_MESSAGES.NOT_FOUND(`Collection "${collectionId}"`),
          ERROR_ACTIONS.VERIFY_EXISTS,
          error,
        );
      }

      if (error instanceof ForbiddenError) {
        throw new ApplicationError(
          ERROR_MESSAGES.FORBIDDEN(`collection "${collectionId}"`),
          ERROR_ACTIONS.REQUEST_ACCESS,
          error,
        );
      }

      // Generic error fallback
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new ApplicationError(
        ERROR_MESSAGES.FETCH_FAILED(
          `file count for "${collectionId}"`,
          errorMessage,
        ),
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
        error instanceof Error ? error : undefined,
      );
    }
  }
}
