import 'reflect-metadata';

import { PaginatedResult } from '@shared/types/pagination.types';

import { Category } from '../../entities/category.entity';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from '../../services/category.service';
import { ListCategoriesUseCase, ListCategoriesDTO } from './list-categories.usecase';

describe('ListCategoriesUseCase', () => {
  let useCase: ListCategoriesUseCase;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const makePaginatedResult = (items: Category[]): PaginatedResult<Category> => ({
    data: items,
    meta: {
      page: 1,
      limit: 10,
      total: items.length,
      totalPages: Math.ceil(items.length / 10),
    },
  });

  const makeCategory = (id: string, name: string): Category => {
    const category = new Category();
    category.id = id;
    category.name = name;
    category.isActive = true;
    return category;
  };

  beforeEach(() => {
    mockCategoryRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockCategoryService = {
      buildCategory: jest.fn(),
      findOrFail: jest.fn(),
      applyUpdate: jest.fn(),
    } as unknown as jest.Mocked<CategoryService>;

    useCase = new ListCategoriesUseCase(mockCategoryRepository, mockCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return a paginated list of categories', async () => {
      // Arrange
      const categories = [makeCategory('cat-1', 'Beverages'), makeCategory('cat-2', 'Snacks')];
      const paginatedResult = makePaginatedResult(categories);

      mockCategoryRepository.findAll.mockResolvedValue(paginatedResult);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10 });

      // Assert
      expect(result).toBe(paginatedResult);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('should forward filter parameters to the repository', async () => {
      // Arrange
      const activeCategory = makeCategory('cat-1', 'Active Category');
      const paginatedResult = makePaginatedResult([activeCategory]);

      mockCategoryRepository.findAll.mockResolvedValue(paginatedResult);

      const dto: ListCategoriesDTO = { page: 1, limit: 5, isActive: true, search: 'Active' };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(mockCategoryRepository.findAll).toHaveBeenCalledWith(dto);
      expect(result.data).toHaveLength(1);
    });

    it('should return an empty paginated result when no categories match', async () => {
      // Arrange
      const emptyResult = makePaginatedResult([]);
      mockCategoryRepository.findAll.mockResolvedValue(emptyResult);

      // Act
      const result = await useCase.execute({ page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should call findAll with an empty object when no DTO is provided', async () => {
      // Arrange
      const emptyResult = makePaginatedResult([]);
      mockCategoryRepository.findAll.mockResolvedValue(emptyResult);

      // Act
      await useCase.execute();

      // Assert
      expect(mockCategoryRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should propagate errors thrown by the repository', async () => {
      // Arrange
      mockCategoryRepository.findAll.mockRejectedValue(new Error('DB timeout'));

      // Act & Assert
      await expect(useCase.execute({ page: 1, limit: 10 })).rejects.toThrow('DB timeout');
    });
  });
});
