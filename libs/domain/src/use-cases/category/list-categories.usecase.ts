import { injectable, inject } from 'tsyringe';

import { PaginatedResult } from '@shared/types/pagination.types';

import { Category } from '../../entities/category.entity';
import { CategoryListParams, ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from '../../services/category.service';

/**
 * DTO for the list-categories use case.
 */
export interface ListCategoriesDTO extends CategoryListParams {}

/**
 * Use case that returns a paginated list of categories.
 *
 * Delegates filtering and pagination to the repository (SRP).
 * Depends on ICategoryRepository via DI, never on a concrete class (DIP).
 */
@injectable()
export class ListCategoriesUseCase {
  constructor(
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    @inject('CategoryService')
    private readonly categoryService: CategoryService,
  ) {}

  /**
   * Executes the list-categories use case.
   *
   * @param dto - Optional pagination and filter parameters.
   * @returns A paginated result containing matching categories.
   */
  async execute(dto: ListCategoriesDTO = {}): Promise<PaginatedResult<Category>> {
    return this.categoryRepository.findAll(dto);
  }
}
