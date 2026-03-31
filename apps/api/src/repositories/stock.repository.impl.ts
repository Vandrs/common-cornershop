import { injectable } from 'tsyringe';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { ProductNotFoundException } from '@domain/errors/product-not-found.error';
import { InsufficientStockError } from '@domain/errors/insufficient-stock.error';
import { Stock } from '@domain/entities/stock.entity';
import { IStockRepository, StockListParams } from '@domain/repositories/stock.repository';
import { DEFAULT_PAGE_SIZE } from '@shared/constants/pagination.constants';
import { PaginatedResult } from '@shared/types/pagination.types';

import { AppDataSource } from '../database/data-source';

/**
 * TypeORM implementation of {@link IStockRepository}.
 *
 * Guarantees:
 * - Standard reads ignore soft-deleted rows.
 * - Quantity-changing operations never persist negative values.
 * - Quantity updates are executed inside a transaction with row lock to avoid
 *   race conditions between concurrent stock updates.
 */
@injectable()
export class StockRepositoryImpl implements IStockRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  async findAll(params: StockListParams): Promise<PaginatedResult<Stock>> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : DEFAULT_PAGE_SIZE;

    const repository = this.getRepository();
    const queryBuilder = repository
      .createQueryBuilder('stock')
      .where('stock.deletedAt IS NULL')
      .orderBy('stock.createdAt', 'DESC');

    if (params.productId) {
      queryBuilder.andWhere('stock.productId = :productId', { productId: params.productId });
    }

    if (params.belowMinimum === true) {
      queryBuilder.andWhere('stock.quantity < stock.minimumQuantity');
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

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

  async findByProductId(productId: string): Promise<Stock | null> {
    return this.getRepository().findOne({
      where: {
        productId,
      },
    });
  }

  async save(stock: Stock): Promise<Stock> {
    if (stock.quantity < 0 || stock.minimumQuantity < 0) {
      throw new Error(
        'StockRepositoryImpl.save: quantity and minimumQuantity must be non-negative',
      );
    }

    if (!stock.lastUpdatedAt) {
      stock.lastUpdatedAt = new Date();
    }

    return this.getRepository().save(stock);
  }

  async adjustQuantity(productId: string, quantityDelta: number): Promise<Stock> {
    return this.changeQuantity(productId, quantityDelta);
  }

  async reserve(productId: string, quantity: number): Promise<Stock> {
    this.assertPositiveQuantity(quantity, 'reserve');
    return this.changeQuantity(productId, -quantity);
  }

  async release(productId: string, quantity: number): Promise<Stock> {
    this.assertPositiveQuantity(quantity, 'release');
    return this.changeQuantity(productId, quantity);
  }

  private getRepository(manager?: EntityManager): Repository<Stock> {
    return (manager ?? this.dataSource.manager).getRepository(Stock);
  }

  private async changeQuantity(productId: string, delta: number): Promise<Stock> {
    return this.dataSource.transaction(async (manager) => {
      const stock = await this.getStockForUpdate(manager, productId);

      const nextQuantity = stock.quantity + delta;
      if (nextQuantity < 0) {
        throw new InsufficientStockError(stock.product?.name ?? productId);
      }

      stock.quantity = nextQuantity;
      stock.lastUpdatedAt = new Date();

      return this.getRepository(manager).save(stock);
    });
  }

  private async getStockForUpdate(manager: EntityManager, productId: string): Promise<Stock> {
    const stock = await this.getRepository(manager)
      .createQueryBuilder('stock')
      .where('stock.productId = :productId', { productId })
      .andWhere('stock.deletedAt IS NULL')
      .setLock('pessimistic_write')
      .getOne();

    if (!stock) {
      throw new ProductNotFoundException();
    }

    return stock;
  }

  private assertPositiveQuantity(quantity: number, operation: 'reserve' | 'release'): void {
    if (quantity <= 0) {
      throw new Error(`StockRepositoryImpl.${operation}: quantity must be greater than zero`);
    }
  }
}
