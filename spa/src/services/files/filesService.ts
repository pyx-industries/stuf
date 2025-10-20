import type { IApiClient } from "@/types/services/api";
import type {
  IFilesService,
  FileFilters,
  ListFilesResponse,
  RecentFilesResponse,
  FileSortField,
} from "@/types/services/files";
import type { File, User, ServiceError } from "@/types";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  ApplicationError,
} from "@/errors/api";
import { ERROR_ACTIONS, ERROR_MESSAGES } from "@/errors/messages";

/**
 * Service for managing files
 */
export class FilesService implements IFilesService {
  constructor(private apiClient: IApiClient) {}

  /**
   * Maps client sort fields to API field names
   */
  private _mapSortField(clientField: FileSortField): string {
    const mapping: Record<FileSortField, string> = {
      status: "metadata",
      uploader: "owner",
      date: "upload_time",
    };
    return mapping[clientField];
  }

  /**
   * Normalize upload time from API response
   * TODO: Backend API currently only returns date (YYYYMMDD format), not datetime.
   * Once backend is updated to return full ISO datetime, this conversion can be removed.
   *
   * @param uploadTime - Upload time from API (YYYYMMDD format)
   * @returns ISO datetime string for consistent handling
   */
  private _normalizeUploadTime(uploadTime: string): string {
    // Handle YYYYMMDD format from backend
    if (uploadTime.length === 8 && /^\d{8}$/.test(uploadTime)) {
      const year = uploadTime.substring(0, 4);
      const month = uploadTime.substring(4, 6);
      const day = uploadTime.substring(6, 8);
      // Return ISO format date at midnight
      return `${year}-${month}-${day}T00:00:00Z`;
    }

    // Already in datetime format
    return uploadTime;
  }

  /**
   * Normalize file data from API response
   */
  private _normalizeFile(file: File): File {
    return {
      ...file,
      upload_time: this._normalizeUploadTime(file.upload_time),
    };
  }

  /**
   * Upload a file to a collection
   * @throws {ApplicationError} On validation, permission, or upload failure
   */
  async uploadFile(
    file: globalThis.File,
    collection: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));

      await this.apiClient.request(`/api/files/${collection}`, {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ApplicationError(
          ERROR_MESSAGES.VALIDATION_FAILED("file upload"),
          ERROR_ACTIONS.CHECK_INPUT,
          error,
        );
      }
      if (error instanceof ForbiddenError) {
        throw new ApplicationError(
          ERROR_MESSAGES.FORBIDDEN(`collection "${collection}"`),
          ERROR_ACTIONS.REQUEST_ACCESS,
          error,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new ApplicationError(
        ERROR_MESSAGES.OPERATION_FAILED("File upload", errorMessage),
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * List all files in a collection
   * TODO: Backend API doesn't support pagination or filtering yet. Currently using client-side pagination and filtering
   * @throws {ApplicationError} On permission or fetch failure
   */
  async listFiles(
    collection: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: FileFilters,
  ): Promise<ListFilesResponse> {
    try {
      const response = await this.apiClient.request(`/api/files/${collection}`);
      let allFiles = (response.files || []).map((file: File) =>
        this._normalizeFile(file),
      );

      if (filters) {
        allFiles = allFiles.filter((file: File) => {
          // Filter by uploaders
          if (filters.uploaders && filters.uploaders.length > 0) {
            const uploaderField = this._mapSortField("uploader");
            const fileUploader = file[uploaderField as keyof File] as string;
            if (!filters.uploaders.includes(fileUploader)) {
              return false;
            }
          }

          // Filter by statuses
          if (filters.statuses && filters.statuses.length > 0) {
            const statusField = this._mapSortField("status");
            const fileMetadata = file[statusField as keyof File] as
              | Record<string, any>
              | undefined;
            const fileStatus = fileMetadata?.status || "";
            if (!filters.statuses.includes(fileStatus)) {
              return false;
            }
          }

          // Filter by date range
          if (
            filters.dateRange &&
            filters.dateRange.start &&
            filters.dateRange.end
          ) {
            const dateField = this._mapSortField("date");
            const fileDateStr = file[dateField as keyof File] as string;
            const fileDate = new Date(fileDateStr);
            const startDate = new Date(filters.dateRange.start);
            const endDate = new Date(filters.dateRange.end);
            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);

            if (fileDate < startDate || fileDate > endDate) {
              return false;
            }
          }

          return true;
        });
      }

      const totalCount = allFiles.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const files = allFiles.slice(startIndex, endIndex);

      return {
        files,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ApplicationError(
          ERROR_MESSAGES.NOT_FOUND(`Collection "${collection}"`),
          ERROR_ACTIONS.VERIFY_EXISTS,
          error,
        );
      }
      if (error instanceof ForbiddenError) {
        throw new ApplicationError(
          ERROR_MESSAGES.FORBIDDEN(`collection "${collection}"`),
          ERROR_ACTIONS.REQUEST_ACCESS,
          error,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new ApplicationError(
        ERROR_MESSAGES.FETCH_FAILED(`files from "${collection}"`, errorMessage),
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Download a file from a collection
   * @throws {ApplicationError} On permission or download failure
   */
  async downloadFile(
    collection: string,
    objectName: string,
  ): Promise<Response> {
    try {
      return await this.apiClient.request(
        `/api/files/${collection}/${objectName}`,
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ApplicationError(
          ERROR_MESSAGES.NOT_FOUND(`File "${objectName}"`),
          ERROR_ACTIONS.VERIFY_EXISTS,
          error,
        );
      }
      if (error instanceof ForbiddenError) {
        throw new ApplicationError(
          ERROR_MESSAGES.FORBIDDEN(`file "${objectName}"`),
          ERROR_ACTIONS.REQUEST_ACCESS,
          error,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new ApplicationError(
        ERROR_MESSAGES.FETCH_FAILED(`file "${objectName}"`, errorMessage),
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Delete a file from a collection
   * @throws {ApplicationError} On permission or deletion failure
   */
  async deleteFile(collection: string, objectName: string): Promise<void> {
    try {
      await this.apiClient.request(`/api/files/${collection}/${objectName}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ApplicationError(
          ERROR_MESSAGES.NOT_FOUND(`File "${objectName}"`),
          ERROR_ACTIONS.VERIFY_EXISTS,
          error,
        );
      }
      if (error instanceof ForbiddenError) {
        throw new ApplicationError(
          ERROR_MESSAGES.FORBIDDEN(`file "${objectName}"`),
          ERROR_ACTIONS.REQUEST_ACCESS,
          error,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new ApplicationError(
        ERROR_MESSAGES.OPERATION_FAILED("File deletion", errorMessage),
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Archive a file in a collection
   * TODO: Backend API endpoint needed - PATCH /api/files/{collection}/{object_name}
   * @throws {ApplicationError} On permission or archival failure
   */
  async archiveFile(collection: string, objectName: string): Promise<void> {
    try {
      await this.apiClient.request(`/api/files/${collection}/${objectName}`, {
        method: "PATCH",
        body: JSON.stringify({ archived: true }),
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ApplicationError(
          ERROR_MESSAGES.NOT_FOUND(`File "${objectName}"`),
          ERROR_ACTIONS.VERIFY_EXISTS,
          error,
        );
      }
      if (error instanceof ForbiddenError) {
        throw new ApplicationError(
          ERROR_MESSAGES.FORBIDDEN(`file "${objectName}"`),
          ERROR_ACTIONS.REQUEST_ACCESS,
          error,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      throw new ApplicationError(
        ERROR_MESSAGES.OPERATION_FAILED("File archival", errorMessage),
        ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Get recent files across all collections the user has access to
   * Returns partial results even if some collections fail
   * @param user - User object from auth context
   * @param limit - Maximum number of files to return
   */
  async getRecentFiles(
    user: User,
    limit: number = 10,
  ): Promise<RecentFilesResponse> {
    const collections = Object.keys(user.collections || {});
    const errors: ServiceError[] = [];

    // Fetch files from all collections (fetch all without pagination)
    const allFilesPromises = collections.map(async (collection) => {
      try {
        const result = await this.listFiles(collection, 1, 9999);
        return result.files;
      } catch (error) {
        // Collect errors from failed collections for partial failure reporting
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
              `files from "${collection}"`,
              errorMessage,
            ),
            action: ERROR_ACTIONS.TRY_AGAIN_OR_CONTACT_SUPPORT,
          });
        }
        return [];
      }
    });

    const allFilesArrays = await Promise.all(allFilesPromises);
    const allFiles = allFilesArrays.flat();

    // Sort by upload_time descending and limit
    const sortedFiles = allFiles.sort((a, b) => {
      const dateA = new Date(a.upload_time).getTime();
      const dateB = new Date(b.upload_time).getTime();
      return dateB - dateA;
    });

    return {
      files: sortedFiles.slice(0, limit),
      errors,
    };
  }
}
