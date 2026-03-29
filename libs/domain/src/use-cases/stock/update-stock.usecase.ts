import { injectable, inject } from 'tsyringe';

import { Stock } from '../../entities/stock.entity';
import { IStockRepository } from '../../repositories/stock.repository';
import { StockService } from '../../services/stock.service';

/**
 * DTO for adjusting stock quantity.
 *
 * A positive `quantityDelta` replenishes stock; a negative value debits it.
 * When `requestedQuantity` is provided and the delta is negative, the service
 * validates sufficiency before applying the adjustment.
 */
export interface UpdateStockDTO {
  /** UUID of the product whose stock should be updated. */
  productId: string;
  /**
   * Amount to add (positive) or subtract (negative) from the current quantity.
   */
  quantityDelta: number;
}

/**
 * Use case for updating (replenishing or debiting) stock for a product.
 *
 * When the delta is negative, delegates stock sufficiency validation to
 * {@link StockService} before issuing the adjustment so that an
 * {@link InsufficientStockError} is raised early, before any persistence
 * operation occurs.
 */
@injectable()
export class UpdateStockUseCase {
  constructor(
    @inject('IStockRepository')
    private readonly stockRepository: IStockRepository,
    @inject('StockService')
    private readonly stockService: StockService,
  ) {}

  /**
   * Executes the update-stock operation.
   *
   * @param dto - Data describing the product and the quantity delta.
   * @returns The updated {@link Stock} entity.
   * @throws {ProductNotFoundException} When the product or its stock does not exist.
   * @throws {InsufficientStockError} When a debit exceeds the available quantity.
   */
  async execute(dto: UpdateStockDTO): Promise<Stock> {
    if (dto.quantityDelta < 0) {
      // Validate that the debit amount does not exceed available stock.
      await this.stockService.validateSufficientStock(dto.productId, Math.abs(dto.quantityDelta));
    } else {
      // For positive deltas, still validate the product/stock record exists.
      await this.stockService.getStockByProductId(dto.productId);
    }

    return this.stockRepository.adjustQuantity(dto.productId, dto.quantityDelta);
  }
}
