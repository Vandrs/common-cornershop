import { injectable, inject } from 'tsyringe';

import { Category } from '../../entities/category.entity';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from '../../services/category.service';

/**
 * Use case that retrieves a single Category by its ID.
 *
 * The "find-or-throw" guard is centralised in CategoryService (DRY).
 * Depends on ICategoryRepository and CategoryService via DI (DIP).
 */
@injectable()
export class GetCategoryUseCase {
  constructor(
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @inject('CategoryService')
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Executes the get-category use case.
   *
   * @param id - UUID of the category to retrieve.
   * @returns The matching Category entity.
   * @throws {CategoryNotFoundException} When no category is found for the given ID.
   */
  async execute(id: string): Promise<Category> {
    return this.categoryService.findOrFail(id);
  }
}
