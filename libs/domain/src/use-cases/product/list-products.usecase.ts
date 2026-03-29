import { injectable, inject } from 'tsyringe';

import { PaginatedResult } from '@shared/types/pagination.types';

import { Product } from '../../entities/product.entity';
import { IProductRepository, ProductListParams } from '../../repositories/product.repository';

/**
 * Use case for listing products with optional filters and pagination.
 *
 * Delegates directly to the product repository — no additional business
 * rules are applied at this layer; filtering semantics live in the repository.
 */
@injectable()
export class ListProductsUseCase {
  constructor(
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  /**
   * Executes the list-products operation.
   *
   * @param params - Optional filter and pagination parameters.
   * @returns A paginated result containing matching {@link Product} entities.
   */
  async execute(params: ProductListParams): Promise<PaginatedResult<Product>> {
    return this.productRepository.findAll(params);
  }
}
