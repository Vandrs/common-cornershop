import { injectable } from 'tsyringe';

import { IOrderRepository, OrderListParams } from '@domain/repositories/order.repository';
import { Order } from '@domain/entities/order.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { PaginatedResult } from '@shared/types/pagination.types';

/**
 * Stub implementation of IOrderRepository.
 *
 * This placeholder satisfies the DI container bindings while the full TypeORM
 * implementation is delivered in T4.3. All methods intentionally throw to
 * surface missing implementations at runtime rather than silently producing
 * incorrect results.
 *
 * @see IOrderRepository
 */
@injectable()
export class OrderRepositoryImpl implements IOrderRepository {
  list(_params: OrderListParams): Promise<PaginatedResult<Order>> {
    throw new Error('OrderRepositoryImpl.list: not implemented');
  }

  findById(_id: string): Promise<Order | null> {
    throw new Error('OrderRepositoryImpl.findById: not implemented');
  }

  createWithItems(_order: Order, _items: OrderItem[]): Promise<Order> {
    throw new Error('OrderRepositoryImpl.createWithItems: not implemented');
  }

  updateStatus(_id: string, _status: OrderStatus): Promise<Order> {
    throw new Error('OrderRepositoryImpl.updateStatus: not implemented');
  }
}
