import { injectable, inject } from 'tsyringe';

import { Category } from '../../entities/category.entity';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService, UpdateCategoryDTO } from '../../services/category.service';

/**
 * Input DTO for the update-category use case.
 */
export interface UpdateCategoryInput {
  /** UUID of the category to update. */
  id: string;
  /** Partial update payload — only provided fields will be changed. */
  data: UpdateCategoryDTO;
}

/**
 * Use case that applies a partial update to an existing Category.
 *
 * Delegates the "find-or-throw" guard and field-merging to CategoryService
 * to avoid duplication (DRY, SRP).
 * Depends on ICategoryRepository and CategoryService via DI (DIP).
 */
@injectable()
export class UpdateCategoryUseCase {
  constructor(
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @inject('CategoryService')
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Executes the update-category use case.
   *
   * @param input - Contains the target category ID and the partial update data.
   * @returns The updated, persisted Category entity.
   * @throws {CategoryNotFoundException} When no category is found for the given ID.
   */
  async execute(input: UpdateCategoryInput): Promise<Category> {
    const category = await this.categoryService.findOrFail(input.id);
    const updated = this.categoryService.applyUpdate(category, input.data);
    return this.categoryRepository.save(updated);
  }
}
