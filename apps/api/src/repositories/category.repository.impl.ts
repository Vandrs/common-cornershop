import { injectable } from 'tsyringe';

import { ICategoryRepository, CategoryListParams } from '@domain/repositories/category.repository';
import { Category } from '@domain/entities/category.entity';
import { PaginatedResult } from '@shared/types/pagination.types';

/**
 * Stub implementation of ICategoryRepository.
 *
 * This placeholder satisfies the DI container bindings while the full TypeORM
 * implementation is delivered in T4.3. All methods intentionally throw to
 * surface missing implementations at runtime rather than silently producing
 * incorrect results.
 *
 * @see ICategoryRepository
 */
@injectable()
export class CategoryRepositoryImpl implements ICategoryRepository {
  findAll(_params: CategoryListParams): Promise<PaginatedResult<Category>> {
    throw new Error('CategoryRepositoryImpl.findAll: not implemented');
  }

  findById(_id: string): Promise<Category | null> {
    throw new Error('CategoryRepositoryImpl.findById: not implemented');
  }

  save(_category: Category): Promise<Category> {
    throw new Error('CategoryRepositoryImpl.save: not implemented');
  }

  delete(_id: string): Promise<void> {
    throw new Error('CategoryRepositoryImpl.delete: not implemented');
  }
}
