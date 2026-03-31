import { injectable } from 'tsyringe';
import { DataSource, IsNull } from 'typeorm';

import { ICategoryRepository, CategoryListParams } from '@domain/repositories/category.repository';
import { Category } from '@domain/entities/category.entity';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@shared/constants/pagination.constants';
import { PaginatedResult } from '@shared/types/pagination.types';
import { AppDataSource } from '../database/data-source';

/**
 * TypeORM implementation of ICategoryRepository.
 */
@injectable()
export class CategoryRepositoryImpl implements ICategoryRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  async findAll(params: CategoryListParams): Promise<PaginatedResult<Category>> {
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(params.limit ?? DEFAULT_PAGE_SIZE)),
    );
    const skip = (page - 1) * limit;

    const repository = this.dataSource.getRepository(Category);
    const queryBuilder = repository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL')
      .orderBy('category.createdAt', 'DESC')
      .addOrderBy('category.id', 'ASC');

    if (params.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.search?.trim()) {
      queryBuilder.andWhere('category.name ILIKE :search', {
        search: `%${params.search.trim()}%`,
      });
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Category | null> {
    const repository = this.dataSource.getRepository(Category);

    return repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  async save(category: Category): Promise<Category> {
    const repository = this.dataSource.getRepository(Category);
    return repository.save(category);
  }

  async delete(id: string): Promise<void> {
    const repository = this.dataSource.getRepository(Category);
    await repository.softDelete(id);
  }
}
