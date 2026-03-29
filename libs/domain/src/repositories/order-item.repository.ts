import { OrderItem } from '../entities/order-item.entity';

/**
 * Repository contract for managing order line items within a single order.
 *
 * Use cases leverage this interface to build and query the items that belong
 * to an order without introducing framework dependencies.
 */
export interface IOrderItemRepository {
  /**
   * Returns all items that belong to the provided order.
   */
  findByOrderId(orderId: string): Promise<OrderItem[]>;

  /**
   * Persists a single order item entity.
   */
  save(orderItem: OrderItem): Promise<OrderItem>;

  /**
   * Persists multiple order items in bulk, useful when creating an order.
   */
  saveMany(orderItems: OrderItem[]): Promise<OrderItem[]>;

  /**
   * Removes all items that belong to the provided order (used when rolling back).
   */
  deleteByOrderId(orderId: string): Promise<void>;
}
