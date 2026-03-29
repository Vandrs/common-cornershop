import { injectable, inject } from 'tsyringe';

import { Stock } from '../../entities/stock.entity';
import { StockService } from '../../services/stock.service';

/**
 * Use case for retrieving the stock record associated with a product.
 *
 * Delegates the product-and-stock existence check to {@link StockService}
 * to keep guard logic centralised (DRY).
 */
@injectable()
export class GetStockUseCase {
  constructor(
    @inject('StockService')
    private readonly stockService: StockService,
  ) {}

  /**
   * Executes the get-stock operation.
   *
   * @param productId - UUID of the product whose stock is requested.
   * @returns The resolved {@link Stock} entity.
   * @throws {ProductNotFoundException} When the product or its stock does not exist.
   */
  async execute(productId: string): Promise<Stock> {
    return this.stockService.getStockByProductId(productId);
  }
}
