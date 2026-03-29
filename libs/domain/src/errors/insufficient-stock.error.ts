import { DomainError } from './domain.error';

/**
 * Thrown when an order operation cannot be fulfilled due to insufficient
 * stock for a specific product.
 */
export class InsufficientStockError extends DomainError {
  /**
   * Creates a new InsufficientStockError.
   * @param productName - The name of the product with insufficient stock.
   */
  constructor(productName: string) {
    super(`Estoque insuficiente para o produto ${productName}`);
  }
}
