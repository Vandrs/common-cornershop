import { injectable } from 'tsyringe';

import { IStockRepository, StockListParams } from '@domain/repositories/stock.repository';
import { Stock } from '@domain/entities/stock.entity';
import { PaginatedResult } from '@shared/types/pagination.types';

/**
 * Stub implementation of IStockRepository.
 *
 * This placeholder satisfies the DI container bindings while the full TypeORM
 * implementation is delivered in T4.3. All methods intentionally throw to
 * surface missing implementations at runtime rather than silently producing
 * incorrect results.
 *
 * @see IStockRepository
 */
@injectable()
export class StockRepositoryImpl implements IStockRepository {
  findAll(_params: StockListParams): Promise<PaginatedResult<Stock>> {
    throw new Error('StockRepositoryImpl.findAll: not implemented');
  }

  findByProductId(_productId: string): Promise<Stock | null> {
    throw new Error('StockRepositoryImpl.findByProductId: not implemented');
  }

  save(_stock: Stock): Promise<Stock> {
    throw new Error('StockRepositoryImpl.save: not implemented');
  }

  adjustQuantity(_productId: string, _quantityDelta: number): Promise<Stock> {
    throw new Error('StockRepositoryImpl.adjustQuantity: not implemented');
  }

  reserve(_productId: string, _quantity: number): Promise<Stock> {
    throw new Error('StockRepositoryImpl.reserve: not implemented');
  }

  release(_productId: string, _quantity: number): Promise<Stock> {
    throw new Error('StockRepositoryImpl.release: not implemented');
  }
}
