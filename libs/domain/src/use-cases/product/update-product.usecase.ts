import { injectable, inject } from 'tsyringe';

import { Product } from '../../entities/product.entity';
import { IProductRepository } from '../../repositories/product.repository';
import { ProductService } from '../../services/product.service';

/**
 * DTO carrying the fields that can be updated on an existing product.
 * All fields are optional — only provided fields will be applied.
 */
export interface UpdateProductDTO {
  /** Updated human-readable name. */
  name?: string;
  /** Updated description. */
  description?: string;
  /** Updated selling price. */
  price?: number;
  /** Updated category reference (must resolve to an existing category). */
  categoryId?: string;
  /** Updated active status. */
  isActive?: boolean;
}

/**
 * Use case for updating an existing product.
 *
 * Validates product existence and, when a new category is provided,
 * validates that the category also exists before persisting changes.
 */
@injectable()
export class UpdateProductUseCase {
  constructor(
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @inject('ProductService')
    private readonly productService: ProductService,
  ) {}

  /**
   * Executes the update-product operation.
   *
   * @param id - UUID of the product to update.
   * @param dto - Partial data to apply to the product.
   * @returns The updated {@link Product} entity.
   * @throws {ProductNotFoundException} When no product with that id exists.
   * @throws {CategoryNotFoundException} When the provided `categoryId` does not exist.
   */
  async execute(id: string, dto: UpdateProductDTO): Promise<Product> {
    const product = await this.productService.getExistingProduct(id);

    if (dto.categoryId !== undefined) {
      await this.productService.validateCategoryExists(dto.categoryId);
      product.categoryId = dto.categoryId;
    }

    if (dto.name !== undefined) {
      product.name = dto.name;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.isActive !== undefined) {
      product.isActive = dto.isActive;
    }

    return this.productRepository.save(product);
  }
}
