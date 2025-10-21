import type { File, User, ServiceError } from "../index";

/**
 * Fields that files can be sorted by
 */
export type FileSortField = "status" | "uploader" | "date";

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * File list filters
 */
export interface FileFilters {
  uploaders?: string[];
  statuses?: string[];
  dateRange?: { start: string; end: string };
}

/**
 * List files response
 */
export interface ListFilesResponse {
  files: File[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Recent files response (supports partial failures)
 */
export interface RecentFilesResponse {
  files: File[];
  errors: ServiceError[];
}

/**
 * Interface for files service
 */
export interface IFilesService {
  uploadFile(
    file: globalThis.File,
    collection: string,
    metadata?: Record<string, any>,
  ): Promise<void>;
  listFiles(
    collection: string,
    page?: number,
    pageSize?: number,
    filters?: FileFilters,
  ): Promise<ListFilesResponse>;
  downloadFile(collection: string, objectName: string): Promise<Response>;
  deleteFile(collection: string, objectName: string): Promise<void>;
  archiveFile(collection: string, objectName: string): Promise<void>;
  getRecentFiles(user: User, limit?: number): Promise<RecentFilesResponse>;
}
