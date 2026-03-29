import { injectable } from 'tsyringe';

import { IOrderItemRepository } from '@domain/repositories/order-item.repository';
import { OrderItem } from '@domain/entities/order-item.entity';

/**
 * Stub implementation of IOrderItemRepository.
 *
 * This placeholder satisfies the DI container bindings while the full TypeORM
 * implementation is delivered in T4.3. All methods intentionally throw to
 * surface missing implementations at runtime rather than silently producing
 * incorrect results.
 *
 * @see IOrderItemRepository
 */
@injectable()
export class OrderItemRepositoryImpl implements IOrderItemRepository {
  findByOrderId(_orderId: string): Promise<OrderItem[]> {
    throw new Error('OrderItemRepositoryImpl.findByOrderId: not implemented');
  }

  save(_orderItem: OrderItem): Promise<OrderItem> {
    throw new Error('OrderItemRepositoryImpl.save: not implemented');
  }

  saveMany(_orderItems: OrderItem[]): Promise<OrderItem[]> {
    throw new Error('OrderItemRepositoryImpl.saveMany: not implemented');
  }

  deleteByOrderId(_orderId: string): Promise<void> {
    throw new Error('OrderItemRepositoryImpl.deleteByOrderId: not implemented');
  }
}
