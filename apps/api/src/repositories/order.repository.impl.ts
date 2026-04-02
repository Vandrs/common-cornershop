import { injectable } from 'tsyringe';
import { DataSource, IsNull, Repository } from 'typeorm';

import { IOrderRepository, OrderListParams } from '@domain/repositories/order.repository';
import { Order } from '@domain/entities/order.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { OrderNotFoundException } from '@domain/errors/order-not-found.error';
import { PaginatedResult } from '@shared/types/pagination.types';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@shared/constants/pagination.constants';

import { AppDataSource } from '../database/data-source';

/**
 * TypeORM implementation of IOrderRepository.
 *
 * @see IOrderRepository
 */
@injectable()
export class OrderRepositoryImpl implements IOrderRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repository(): Repository<Order> {
    return this.dataSource.getRepository(Order);
  }

  async list(params: OrderListParams): Promise<PaginatedResult<Order>> {
    const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
    const limitRaw =
      params.limit && params.limit > 0 ? Math.floor(params.limit) : DEFAULT_PAGE_SIZE;
    const limit = Math.min(limitRaw, MAX_PAGE_SIZE);

    const queryBuilder = this.repository
      .createQueryBuilder('order')
      .loadRelationCountAndMap('order.itemsCount', 'order.items')
      .where('order.deletedAt IS NULL');

    if (params.status) {
      queryBuilder.andWhere('order.status = :status', { status: params.status });
    }

    if (params.orderNumber) {
      queryBuilder.andWhere('order.orderNumber = :orderNumber', {
        orderNumber: params.orderNumber,
      });
    }

    if (params.createdAfter) {
      queryBuilder.andWhere('order.createdAt >= :createdAfter', {
        createdAfter: params.createdAfter,
      });
    }

    if (params.createdBefore) {
      queryBuilder.andWhere('order.createdAt <= :createdBefore', {
        createdBefore: params.createdBefore,
      });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .clone()
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async findById(id: string): Promise<Order | null> {
    return this.repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['items', 'items.product'],
    });
  }

  async createWithItems(order: Order, items: OrderItem[]): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);

      const savedOrder = await orderRepository.save(
        orderRepository.create({
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
        }),
      );

      if (items.length > 0) {
        const orderItems = items.map((item) =>
          orderItemRepository.create({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            orderId: savedOrder.id,
          }),
        );

        await orderItemRepository.save(orderItems);
      }

      const createdOrder = await orderRepository.findOne({
        where: { id: savedOrder.id, deletedAt: IsNull() },
        relations: ['items', 'items.product'],
      });

      if (!createdOrder) {
        throw new OrderNotFoundException();
      }

      return createdOrder;
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updateResult = await this.repository
      .createQueryBuilder()
      .update(Order)
      .set({ status })
      .where('id = :id', { id })
      .andWhere('deleted_at IS NULL')
      .execute();

    if (!updateResult.affected) {
      throw new OrderNotFoundException();
    }

    const updatedOrder = await this.findById(id);

    if (!updatedOrder) {
      throw new OrderNotFoundException();
    }

    return updatedOrder;
  }
}
