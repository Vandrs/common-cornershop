import { injectable } from 'tsyringe';

import { IProductRepository, ProductListParams } from '@domain/repositories/product.repository';
import { Product } from '@domain/entities/product.entity';
import { PaginatedResult } from '@shared/types/pagination.types';

/**
 * Stub implementation of IProductRepository.
 *
 * This placeholder satisfies the DI container bindings while the full TypeORM
 * implementation is delivered in T4.3. All methods intentionally throw to
 * surface missing implementations at runtime rather than silently producing
 * incorrect results.
 *
 * @see IProductRepository
 */
@injectable()
export class ProductRepositoryImpl implements IProductRepository {
  findAll(_params: ProductListParams): Promise<PaginatedResult<Product>> {
    throw new Error('ProductRepositoryImpl.findAll: not implemented');
  }

  findById(_id: string): Promise<Product | null> {
    throw new Error('ProductRepositoryImpl.findById: not implemented');
  }

  findByIds(_ids: string[]): Promise<Product[]> {
    throw new Error('ProductRepositoryImpl.findByIds: not implemented');
  }

  save(_product: Product): Promise<Product> {
    throw new Error('ProductRepositoryImpl.save: not implemented');
  }

  delete(_id: string): Promise<void> {
    throw new Error('ProductRepositoryImpl.delete: not implemented');
  }
}
