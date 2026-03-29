import { injectable, inject } from 'tsyringe';

import { Product } from '../../entities/product.entity';
import { IProductRepository } from '../../repositories/product.repository';
import { ProductService } from '../../services/product.service';

/**
 * DTO carrying the input data required to create a new product.
 */
export interface CreateProductDTO {
  /** Human-readable name of the product. */
  name: string;
  /** Optional detailed description. */
  description?: string;
  /** Selling price (must be positive). */
  price: number;
  /** UUID of the category this product belongs to. */
  categoryId: string;
  /** Whether the product starts as active. Defaults to `true`. */
  isActive?: boolean;
}

/**
 * Use case for creating a new product.
 *
 * Validates that the referenced category exists, then persists and returns
 * the new product entity.
 */
@injectable()
export class CreateProductUseCase {
  constructor(
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @inject('ProductService')
    private readonly productService: ProductService,
  ) {}

  /**
   * Executes the create-product operation.
   *
   * @param dto - Data required to create the product.
   * @returns The newly created {@link Product} entity.
   * @throws {CategoryNotFoundException} When the referenced category does not exist.
   */
  async execute(dto: CreateProductDTO): Promise<Product> {
    await this.productService.validateCategoryExists(dto.categoryId);

    const product = new Product();
    product.name = dto.name;
    product.description = dto.description;
    product.price = dto.price;
    product.categoryId = dto.categoryId;
    product.isActive = dto.isActive ?? true;

    return this.productRepository.save(product);
  }
}
