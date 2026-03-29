/**
 * Parameters for paginated queries
 */
export interface PaginationParams {
  /** Page number (1-based). Defaults to 1 if omitted. */
  page?: number;
  /** Number of items per page. Defaults to DEFAULT_PAGE_SIZE if omitted. */
  limit?: number;
}

/**
 * Metadata returned alongside paginated results
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Generic paginated result wrapper
 * @template T - Type of items in the result set
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}
