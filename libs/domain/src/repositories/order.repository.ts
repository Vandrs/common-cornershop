import { PaginationParams, PaginatedResult } from '@shared/types/pagination.types';

import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';

/**
 * Filters and pagination applied when listing orders.
 */
export type OrderListParams = PaginationParams & {
  /** Filter by the current order status. */
  status?: OrderStatus;
  /** Filter by the business order number. */
  orderNumber?: string;
  /** Inclusive start date for creation timestamp. */
  createdAfter?: Date;
  /** Inclusive end date for creation timestamp. */
  createdBefore?: Date;
};

/**
 * Repository contract for orchestrating order persistence behavior.
 *
 * Use cases mutate the order lifecycle by calling these methods without
 * depending on infrastructure-specific implementations.
 */
export interface IOrderRepository {
  /** Paginated listing of orders matching the provided filters. */
  list(params: OrderListParams): Promise<PaginatedResult<Order>>;

  /** Retrieves an order by its identifier, optionally including relations. */
  findById(id: string): Promise<Order | null>;

  /** Creates a new order together with its line items atomically. */
  createWithItems(order: Order, items: OrderItem[]): Promise<Order>;

  /** Updates the status for the requested order. */
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
}
