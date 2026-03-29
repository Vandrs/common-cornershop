import { injectable, inject } from 'tsyringe';

import { Product } from '../entities/product.entity';
import { CategoryNotFoundException } from '../errors/category-not-found.error';
import { ProductNotFoundException } from '../errors/product-not-found.error';
import { ICategoryRepository } from '../repositories/category.repository';
import { IProductRepository } from '../repositories/product.repository';

/**
 * Service encapsulating reusable business rules for the Product aggregate.
 *
 * Responsibilities:
 * - Validate that a referenced category exists before persisting a product.
 * - Ensure a product exists before operations that depend on it.
 */
@injectable()
export class ProductService {
  constructor(
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * Verifies that the category identified by `categoryId` exists and is
   * available in the system.
   *
   * @param categoryId - UUID of the category to validate.
   * @throws {CategoryNotFoundException} When no category with that id exists.
   */
  async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw new CategoryNotFoundException();
    }
  }

  /**
   * Retrieves an existing product, throwing a domain error when absent.
   *
   * @param id - UUID of the product.
   * @returns The resolved {@link Product} entity.
   * @throws {ProductNotFoundException} When no product with that id exists.
   */
  async getExistingProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new ProductNotFoundException();
    }

    return product;
  }
}
