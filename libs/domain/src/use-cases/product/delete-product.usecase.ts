import { injectable, inject } from 'tsyringe';

import { IProductRepository } from '../../repositories/product.repository';
import { ProductService } from '../../services/product.service';

/**
 * Use case for soft-deleting a product by its unique identifier.
 *
 * Validates product existence before issuing the delete, ensuring the
 * caller receives a meaningful error when the product cannot be found.
 */
@injectable()
export class DeleteProductUseCase {
  constructor(
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @inject('ProductService')
    private readonly productService: ProductService,
  ) {}

  /**
   * Executes the delete-product operation.
   *
   * @param id - UUID of the product to delete.
   * @throws {ProductNotFoundException} When no product with that id exists.
   */
  async execute(id: string): Promise<void> {
    await this.productService.getExistingProduct(id);
    await this.productRepository.delete(id);
  }
}
