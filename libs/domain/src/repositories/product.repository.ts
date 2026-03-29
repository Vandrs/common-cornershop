import { PaginationParams, PaginatedResult } from '@shared/types/pagination.types';

import { Product } from '../entities/product.entity';

/**
 * Parameters accepted when listing products.
 */
export type ProductListParams = PaginationParams & {
  /** Filter products by the category they belong to. */
  categoryId?: string;
  /** Include only active/inactive products when provided. */
  isActive?: boolean;
  /** Simple text search that matches against the product name. */
  search?: string;
  /** Optional minimum price filter. */
  minPrice?: number;
  /** Optional maximum price filter. */
  maxPrice?: number;
};

/**
 * Contracts that define how application services interact with the Product
 * aggregate without knowing storage or ORM details.
 */
export interface IProductRepository {
  /**
   * Returns a paginated list of products that match the provided filters.
   */
  findAll(params: ProductListParams): Promise<PaginatedResult<Product>>;

  /** Retrieves a product by its unique identifier. */
  findById(id: string): Promise<Product | null>;

  /** Retrieves multiple products by their identifiers. */
  findByIds(ids: string[]): Promise<Product[]>;

  /** Persists a new or updated product entity. */
  save(product: Product): Promise<Product>;

  /** Removes a product from persistence. */
  delete(id: string): Promise<void>;
}
