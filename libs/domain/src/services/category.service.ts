import { injectable, inject } from 'tsyringe';

import { Category } from '../entities/category.entity';
import { CategoryNotFoundException } from '../errors/category-not-found.error';
import { ICategoryRepository } from '../repositories/category.repository';

/**
 * DTO for creating a new category.
 */
export interface CreateCategoryDTO {
  /** Human-readable name of the category. */
  name: string;
  /** Optional detailed description. */
  description?: string;
  /** Whether the category is active. Defaults to true. */
  isActive?: boolean;
}

/**
 * DTO for updating an existing category.
 * All fields are optional; only provided fields will be updated.
 */
export interface UpdateCategoryDTO {
  /** Updated name. */
  name?: string;
  /** Updated description. */
  description?: string;
  /** Updated active status. */
  isActive?: boolean;
}

/**
 * Service containing reusable business logic for the Category domain.
 *
 * Encapsulates operations such as entity construction, field merging, and
 * guard clauses that would otherwise be duplicated across multiple use cases.
 *
 * SRP: focused exclusively on Category business-logic operations.
 * DIP: depends on the ICategoryRepository interface, not a concrete class.
 */
@injectable()
export class CategoryService {
  constructor(
    @inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * Builds a new Category entity from the supplied DTO, applying domain defaults.
   *
   * @param dto - Data transfer object carrying the creation payload.
   * @returns An un-persisted Category entity ready to be saved.
   */
  buildCategory(dto: CreateCategoryDTO): Category {
    const category = new Category();
    category.name = dto.name;
    category.description = dto.description;
    category.isActive = dto.isActive ?? true;
    return category;
  }

  /**
   * Retrieves an existing category by ID and throws {@link CategoryNotFoundException}
   * when it cannot be found.
   *
   * Centralises the "find-or-throw" guard so use cases remain free of repeated
   * null-check boilerplate (DRY).
   *
   * @param id - UUID of the category to retrieve.
   * @returns The found Category entity.
   * @throws {CategoryNotFoundException} When no category matches the given ID.
   */
  async findOrFail(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new CategoryNotFoundException();
    }

    return category;
  }

  /**
   * Merges a partial update DTO into an existing Category entity.
   *
   * Only fields explicitly present in the DTO are written; undefined values are
   * ignored so callers can do partial PATCH-style updates.
   *
   * @param category - The target entity to be mutated in-place.
   * @param dto - Partial update payload.
   * @returns The same mutated category entity.
   */
  applyUpdate(category: Category, dto: UpdateCategoryDTO): Category {
    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    return category;
  }
}
