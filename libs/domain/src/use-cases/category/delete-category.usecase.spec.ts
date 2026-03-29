import 'reflect-metadata';

import { CategoryNotFoundException } from '../../errors/category-not-found.error';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService } from '../../services/category.service';
import { DeleteCategoryUseCase } from './delete-category.usecase';
import { Category } from '../../entities/category.entity';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const makeCategory = (id: string): Category => {
    const category = new Category();
    category.id = id;
    category.name = 'Beverages';
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

    useCase = new DeleteCategoryUseCase(mockCategoryRepository, mockCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete the category when it exists', async () => {
      // Arrange
      const existing = makeCategory('cat-uuid-1');
      mockCategoryService.findOrFail.mockResolvedValue(existing);
      mockCategoryRepository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('cat-uuid-1');

      // Assert
      expect(mockCategoryService.findOrFail).toHaveBeenCalledWith('cat-uuid-1');
      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('cat-uuid-1');
    });

    it('should throw CategoryNotFoundException when category does not exist', async () => {
      // Arrange
      mockCategoryService.findOrFail.mockRejectedValue(new CategoryNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(CategoryNotFoundException);
    });

    it('should not call delete when findOrFail throws', async () => {
      // Arrange
      mockCategoryService.findOrFail.mockRejectedValue(new CategoryNotFoundException());

      // Act & Assert
      await expect(useCase.execute('bad-id')).rejects.toThrow(CategoryNotFoundException);
      expect(mockCategoryRepository.delete).not.toHaveBeenCalled();
    });

    it('should resolve without a value (void) on successful deletion', async () => {
      // Arrange
      const existing = makeCategory('cat-uuid-2');
      mockCategoryService.findOrFail.mockResolvedValue(existing);
      mockCategoryRepository.delete.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute('cat-uuid-2');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should propagate repository errors after a successful lookup', async () => {
      // Arrange
      const existing = makeCategory('cat-uuid-3');
      mockCategoryService.findOrFail.mockResolvedValue(existing);
      mockCategoryRepository.delete.mockRejectedValue(new Error('DB delete failed'));

      // Act & Assert
      await expect(useCase.execute('cat-uuid-3')).rejects.toThrow('DB delete failed');
    });
  });
});
