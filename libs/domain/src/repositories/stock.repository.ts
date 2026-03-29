import { PaginationParams, PaginatedResult } from '@shared/types/pagination.types';

import { Stock } from '../entities/stock.entity';

/**
 * Parameters that can be used when listing stock records.
 */
export type StockListParams = PaginationParams & {
  /** Optional filter that returns only stock for the specified product. */
  productId?: string;
  /** When `true`, returns only entries below their minimum threshold. */
  belowMinimum?: boolean;
};

/**
 * Contract describing how business logic interacts with stock persistence.
 */
export interface IStockRepository {
  /** Returns paginated stock records with optional filtering. */
  findAll(params: StockListParams): Promise<PaginatedResult<Stock>>;

  /** Finds the stock record associated with a specific product. */
  findByProductId(productId: string): Promise<Stock | null>;

  /** Persists the stock record (create or update). */
  save(stock: Stock): Promise<Stock>;

  /** Adjusts the available quantity by the provided delta. */
  adjustQuantity(productId: string, quantityDelta: number): Promise<Stock>;

  /** Reserves stock units for pending orders. */
  reserve(productId: string, quantity: number): Promise<Stock>;

  /** Releases previously reserved stock units. */
  release(productId: string, quantity: number): Promise<Stock>;
}
