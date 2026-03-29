import { injectable, inject } from 'tsyringe';

import { Stock } from '../entities/stock.entity';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { ProductNotFoundException } from '../errors/product-not-found.error';
import { IProductRepository } from '../repositories/product.repository';
import { IStockRepository } from '../repositories/stock.repository';

/**
 * Service encapsulating reusable business rules for the Stock aggregate.
 *
 * Responsibilities:
 * - Validate that a product has sufficient stock before an order reservation.
 * - Retrieve the stock record for a given product, throwing a domain error when absent.
 */
@injectable()
export class StockService {
  constructor(
    @inject('IStockRepository')
    private readonly stockRepository: IStockRepository,
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * Retrieves the stock record for the given product. Throws when neither the
   * product nor its stock record can be found.
   *
   * @param productId - UUID of the product whose stock is requested.
   * @returns The resolved {@link Stock} entity.
   * @throws {ProductNotFoundException} When the product or its stock does not exist.
   */
  async getStockByProductId(productId: string): Promise<Stock> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundException();
    }

    const stock = await this.stockRepository.findByProductId(productId);

    if (!stock) {
      throw new ProductNotFoundException();
    }

    return stock;
  }

  /**
   * Validates that the current stock quantity is sufficient for the requested
   * amount. Throws an {@link InsufficientStockError} when the available quantity
   * is less than requested.
   *
   * @param productId - UUID of the product to check.
   * @param requestedQuantity - Number of units required.
   * @throws {ProductNotFoundException} When the product or its stock does not exist.
   * @throws {InsufficientStockError} When available quantity is below `requestedQuantity`.
   */
  async validateSufficientStock(productId: string, requestedQuantity: number): Promise<void> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new ProductNotFoundException();
    }

    const stock = await this.stockRepository.findByProductId(productId);

    if (!stock) {
      throw new ProductNotFoundException();
    }

    if (stock.quantity < requestedQuantity) {
      throw new InsufficientStockError(product.name);
    }
  }
}
