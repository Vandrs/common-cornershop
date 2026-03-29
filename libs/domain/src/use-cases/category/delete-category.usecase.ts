import { injectable, inject } from 'tsyringe';

import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from '../../services/category.service';

/**
 * Use case that deletes an existing Category.
 *
 * The "find-or-throw" guard in CategoryService ensures the category exists
 * before deletion is attempted (DRY, fail-fast principle).
 * Depends on ICategoryRepository and CategoryService via DI (DIP).
 */
@injectable()
export class DeleteCategoryUseCase {
  constructor(
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @inject('CategoryService')
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Executes the delete-category use case.
   *
   * @param id - UUID of the category to delete.
   * @returns A resolved promise once the category has been removed.
   * @throws {CategoryNotFoundException} When no category is found for the given ID.
   */
  async execute(id: string): Promise<void> {
    await this.categoryService.findOrFail(id);
    await this.categoryRepository.delete(id);
  }
}
