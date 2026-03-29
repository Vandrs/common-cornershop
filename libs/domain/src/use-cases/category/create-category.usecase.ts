import { injectable, inject } from 'tsyringe';

import { Category } from '../../entities/category.entity';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService, CreateCategoryDTO } from '../../services/category.service';

/**
 * Use case that creates a new Category and persists it.
 *
 * Entity construction and defaults are delegated to CategoryService (SRP, DRY).
 * Depends on ICategoryRepository and CategoryService via constructor injection (DIP).
 */
@injectable()
export class CreateCategoryUseCase {
  constructor(
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @inject('CategoryService')
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Executes the create-category use case.
   *
   * @param dto - Data transfer object with the new category's data.
   * @returns The newly persisted Category entity.
   */
  async execute(dto: CreateCategoryDTO): Promise<Category> {
    const category = this.categoryService.buildCategory(dto);
    return this.categoryRepository.save(category);
  }
}
