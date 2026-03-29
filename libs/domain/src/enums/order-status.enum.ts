/**
 * Enum representing the possible states of an order through its lifecycle.
 *
 * - PENDING: Order has been created but not yet processed.
 * - PROCESSING: Order is currently being processed.
 * - COMPLETED: Order has been successfully fulfilled.
 * - CANCELLED: Order was cancelled before completion.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
