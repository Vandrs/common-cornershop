import { injectable, inject } from 'tsyringe';

import { Product } from '../../entities/product.entity';
import { ProductService } from '../../services/product.service';

/**
 * Use case for retrieving a single product by its unique identifier.
 *
 * Delegates product existence validation to {@link ProductService} to keep
 * the guard logic in one place (DRY).
 */
@injectable()
export class GetProductUseCase {
  constructor(
    @inject('ProductService')
    private readonly productService: ProductService,
  ) {}

  /**
   * Executes the get-product operation.
   *
   * @param id - UUID of the product to retrieve.
   * @returns The resolved {@link Product} entity.
   * @throws {ProductNotFoundException} When no product with that id exists.
   */
  async execute(id: string): Promise<Product> {
    return this.productService.getExistingProduct(id);
  }
}
