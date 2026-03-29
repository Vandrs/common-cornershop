import { PaginationParams, PaginatedResult } from '@shared/types/pagination.types';

import { Category } from '../entities/category.entity';

/**
 * Parameters used when listing categories.
 */
export type CategoryListParams = PaginationParams & {
  /** When set, filters categories by their active state. */
  isActive?: boolean;
  /** Optional text search applied to the category name. */
  search?: string;
};

/**
 * Repository contract for Category operations.
 *
 * Use cases depend on this interface to list, retrieve, persist, and remove
 * categories without knowing how the data is stored.
 */
export interface ICategoryRepository {
  /**
   * Returns a paginated list of categories respecting the provided filters.
   */
  findAll(params: CategoryListParams): Promise<PaginatedResult<Category>>;

  /**
   * Retrieves a category by its unique identifier.
   */
  findById(id: string): Promise<Category | null>;

  /**
   * Persists the provided category (creation or update semantics may vary
   * depending on the implementation).
   */
  save(category: Category): Promise<Category>;

  /**
   * Removes a category from persistence.
   */
  delete(id: string): Promise<void>;
}
