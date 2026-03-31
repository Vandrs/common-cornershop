import { injectable } from 'tsyringe';
import { DataSource, Repository } from 'typeorm';

import { IOrderItemRepository } from '@domain/repositories/order-item.repository';
import { OrderItem } from '@domain/entities/order-item.entity';
import { AppDataSource } from '../database/data-source';

/**
 * TypeORM implementation of IOrderItemRepository.
 *
 * @see IOrderItemRepository
 */
@injectable()
export class OrderItemRepositoryImpl implements IOrderItemRepository {
  constructor(private readonly dataSource: DataSource = AppDataSource) {}

  private get repository(): Repository<OrderItem> {
    return this.dataSource.getRepository(OrderItem);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.repository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('orderItem.orderId = :orderId', { orderId })
      .andWhere('orderItem.deletedAt IS NULL')
      .andWhere('order.deletedAt IS NULL')
      .orderBy('orderItem.createdAt', 'ASC')
      .getMany();
  }

  async save(orderItem: OrderItem): Promise<OrderItem> {
    return this.repository.save(orderItem);
  }

  async saveMany(orderItems: OrderItem[]): Promise<OrderItem[]> {
    if (orderItems.length === 0) {
      return [];
    }

    return this.repository.save(orderItems);
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('order_id = :orderId', { orderId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }
}
