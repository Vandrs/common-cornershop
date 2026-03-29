import 'reflect-metadata';

import { Category } from '../../entities/category.entity';
import { CategoryNotFoundException } from '../../errors/category-not-found.error';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from '../../services/category.service';
import { GetCategoryUseCase } from './get-category.usecase';

describe('GetCategoryUseCase', () => {
  let useCase: GetCategoryUseCase;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockCategoryService: jest.Mocked<CategoryService>;

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

    useCase = new GetCategoryUseCase(mockCategoryRepository, mockCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return the category when it exists', async () => {
      // Arrange
      const existing = makeCategory('cat-uuid-1', 'Beverages');
      mockCategoryService.findOrFail.mockResolvedValue(existing);

      // Act
      const result = await useCase.execute('cat-uuid-1');

      // Assert
      expect(result).toBe(existing);
      expect(mockCategoryService.findOrFail).toHaveBeenCalledWith('cat-uuid-1');
    });

    it('should throw CategoryNotFoundException when category does not exist', async () => {
      // Arrange
      mockCategoryService.findOrFail.mockRejectedValue(new CategoryNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(CategoryNotFoundException);
    });

    it('should delegate the lookup to CategoryService', async () => {
      // Arrange
      const category = makeCategory('cat-uuid-2', 'Snacks');
      mockCategoryService.findOrFail.mockResolvedValue(category);

      // Act
      await useCase.execute('cat-uuid-2');

      // Assert
      expect(mockCategoryService.findOrFail).toHaveBeenCalledTimes(1);
      expect(mockCategoryService.findOrFail).toHaveBeenCalledWith('cat-uuid-2');
    });

    it('should return the exact category entity provided by the service', async () => {
      // Arrange
      const category = makeCategory('cat-uuid-3', 'Dairy');
      category.description = 'Milk products';
      mockCategoryService.findOrFail.mockResolvedValue(category);

      // Act
      const result = await useCase.execute('cat-uuid-3');

      // Assert
      expect(result.id).toBe('cat-uuid-3');
      expect(result.name).toBe('Dairy');
      expect(result.description).toBe('Milk products');
    });
  });
});
