import type { Collection, User, ServiceError } from "../index";

/**
 * Result of fetching collections with potential partial failures
 */
export interface GetCollectionsResult {
  collections: Collection[];
  errors: ServiceError[];
}

/**
 * Interface for collections service
 */
export interface ICollectionsService {
  getCollections(user: User): Promise<GetCollectionsResult>;
}
