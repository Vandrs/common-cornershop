import { randomBytes } from 'crypto';

import { injectable, inject } from 'tsyringe';

import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { InvalidOrderStatusTransitionError } from '../errors/invalid-order-status-transition.error';
import { OrderNotFoundException } from '../errors/order-not-found.error';
import { ProductNotFoundException } from '../errors/product-not-found.error';
import { IOrderRepository } from '../repositories/order.repository';

/**
 * Input data for a single line item when creating an order.
 */
export interface CreateOrderItemDTO {
  /** UUID of the product being ordered. */
  productId: string;
  /** Number of units requested (must be > 0). */
  quantity: number;
}

/**
 * Intermediate representation of a calculated order item, carrying the
 * price snapshot and computed subtotal before persistence.
 */
export interface OrderItemData {
  /** UUID of the product. */
  productId: string;
  /** Number of units ordered. */
  quantity: number;
  /** Price per unit at the moment the order is created. */
  unitPrice: number;
  /** Total cost for this line item: quantity × unitPrice. */
  subtotal: number;
}

/**
 * Allowed order status transitions map.
 * Key: current status. Value: set of valid next statuses.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, Set<OrderStatus>> = {
  [OrderStatus.PENDING]: new Set([OrderStatus.PROCESSING, OrderStatus.CANCELLED]),
  [OrderStatus.PROCESSING]: new Set([OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
  [OrderStatus.COMPLETED]: new Set(),
  [OrderStatus.CANCELLED]: new Set(),
};

/**
 * Service encapsulating reusable business rules for the Order aggregate.
 *
 * Responsibilities:
 * - Generate unique, human-readable order numbers.
 * - Retrieve an order by ID, throwing when absent.
 * - Validate that a status transition adheres to the domain lifecycle.
 * - Calculate order item price snapshots and totals.
 */
@injectable()
export class OrderService {
  constructor(
    @inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * Generates a unique, human-readable order number.
   *
   * Format: `ORD-{timestamp}-{4-random-hex-chars}`
   * Example: `ORD-1711234567890-a3f2`
   *
   * @returns A new unique order number string.
   */
  generateOrderNumber(): string {
    const timestamp = Date.now();
    const randomHex = randomBytes(2).toString('hex');
    return `ORD-${timestamp}-${randomHex}`;
  }

  /**
   * Retrieves an order by its identifier, throwing a domain error when absent.
   *
   * @param id - UUID of the order to retrieve.
   * @returns The resolved {@link Order} entity.
   * @throws {OrderNotFoundException} When no order with that id exists.
   */
  async findOrFail(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new OrderNotFoundException();
    }

    return order;
  }

  /**
   * Validates that transitioning an order from `currentStatus` to `newStatus`
   * is permitted by the domain lifecycle rules.
   *
   * Allowed transitions:
   * - PENDING → PROCESSING ✅
   * - PENDING → CANCELLED ✅
   * - PROCESSING → COMPLETED ✅
   * - PROCESSING → CANCELLED ✅
   * - COMPLETED → anything ❌
   * - CANCELLED → anything ❌
   *
   * @param currentStatus - The order's current {@link OrderStatus}.
   * @param newStatus - The desired target {@link OrderStatus}.
   * @throws {InvalidOrderStatusTransitionError} When the transition is not allowed.
   */
  validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowed.has(newStatus)) {
      throw new InvalidOrderStatusTransitionError(currentStatus, newStatus);
    }
  }

  /**
   * Calculates price snapshots and subtotals for a list of order item DTOs
   * by looking up each product's current price.
   *
   * @param items - Array of {@link CreateOrderItemDTO} describing what to order.
   * @param products - Array of {@link Product} entities already fetched from the repository.
   * @returns An array of {@link OrderItemData} with `unitPrice` and `subtotal` populated.
   * @throws {ProductNotFoundException} When a product referenced by an item is not in `products`.
   */
  calculateOrderItems(items: CreateOrderItemDTO[], products: Product[]): OrderItemData[] {
    const productMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new ProductNotFoundException();
      }

      const unitPrice = product.price;
      const subtotal = item.quantity * unitPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });
  }

  /**
   * Calculates the total monetary amount for an order from its calculated items.
   *
   * @param items - Array of {@link OrderItemData} with computed subtotals.
   * @returns The sum of all item subtotals. Returns `0` for an empty array.
   */
  calculateTotal(items: OrderItemData[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}
