import { injectable } from 'tsyringe';
import { In, IsNull, Repository } from 'typeorm';

import { IProductRepository, ProductListParams } from '@domain/repositories/product.repository';
import { Product } from '@domain/entities/product.entity';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@shared/constants/pagination.constants';
import { PaginatedResult } from '@shared/types/pagination.types';

import { AppDataSource } from '../database/data-source';

@injectable()
export class ProductRepositoryImpl implements IProductRepository {
  constructor(private readonly ormRepository?: Repository<Product>) {}

  private get repository(): Repository<Product> {
    return this.ormRepository ?? AppDataSource.getRepository(Product);
  }

  async findAll(params: ProductListParams): Promise<PaginatedResult<Product>> {
    const page = Math.max(1, Math.trunc(params.page ?? 1));
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(params.limit ?? DEFAULT_PAGE_SIZE)),
    );

    const query = this.repository
      .createQueryBuilder('product')
      .where('product.deletedAt IS NULL')
      .orderBy('product.createdAt', 'DESC')
      .addOrderBy('product.id', 'ASC');

    if (params.categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId: params.categoryId });
    }

    if (typeof params.isActive === 'boolean') {
      query.andWhere('product.isActive = :isActive', { isActive: params.isActive });
    }

    if (params.search?.trim()) {
      query.andWhere('LOWER(product.name) LIKE LOWER(:search)', {
        search: `%${params.search.trim()}%`,
      });
    }

    if (typeof params.minPrice === 'number') {
      query.andWhere('product.price >= :minPrice', { minPrice: params.minPrice });
    }

    if (typeof params.maxPrice === 'number') {
      query.andWhere('product.price <= :maxPrice', { maxPrice: params.maxPrice });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
      return [];
    }

    const products = await this.repository.find({
      where: {
        id: In(ids),
        deletedAt: IsNull(),
      },
    });

    const productsById = new Map(products.map((product) => [product.id, product]));

    return ids
      .map((id) => productsById.get(id))
      .filter((product): product is Product => Boolean(product));
  }

  async save(product: Product): Promise<Product> {
    return this.repository.save(product);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
