import { DomainError } from './domain.error';
import { OrderStatus } from '../enums/order-status.enum';

/**
 * Thrown when an order status transition is attempted that is not allowed
 * by the domain lifecycle rules.
 *
 * Allowed transitions:
 * - PENDING → PROCESSING
 * - PENDING → CANCELLED
 * - PROCESSING → COMPLETED
 * - PROCESSING → CANCELLED
 *
 * Terminal states (COMPLETED, CANCELLED) cannot be transitioned out of.
 */
export class InvalidOrderStatusTransitionError extends DomainError {
  /**
   * Creates a new InvalidOrderStatusTransitionError.
   *
   * @param from - The current {@link OrderStatus} of the order.
   * @param to - The target {@link OrderStatus} that was rejected.
   */
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Transição de status inválida: ${from} → ${to}`);
  }
}
