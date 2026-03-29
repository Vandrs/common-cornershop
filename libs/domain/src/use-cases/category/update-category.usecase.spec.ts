import 'reflect-metadata';

import { Category } from '../../entities/category.entity';
import { CategoryNotFoundException } from '../../errors/category-not-found.error';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService, UpdateCategoryDTO } from '../../services/category.service';
import { UpdateCategoryUseCase, UpdateCategoryInput } from './update-category.usecase';

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const makeCategory = (overrides: Partial<Category> = {}): Category => {
    const category = new Category();
    category.id = 'cat-uuid-1';
    category.name = 'Beverages';
    category.description = 'Drinks and juices';
    category.isActive = true;
    Object.assign(category, overrides);
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

    useCase = new UpdateCategoryUseCase(mockCategoryRepository, mockCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update and return the category with all provided fields', async () => {
      // Arrange
      const existing = makeCategory();
      const updated = makeCategory({ name: 'Soft Drinks', isActive: false });
      const saved = makeCategory({ name: 'Soft Drinks', isActive: false });

      const dto: UpdateCategoryDTO = { name: 'Soft Drinks', isActive: false };
      const input: UpdateCategoryInput = { id: 'cat-uuid-1', data: dto };

      mockCategoryService.findOrFail.mockResolvedValue(existing);
      mockCategoryService.applyUpdate.mockReturnValue(updated);
      mockCategoryRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBe(saved);
      expect(mockCategoryService.findOrFail).toHaveBeenCalledWith('cat-uuid-1');
      expect(mockCategoryService.applyUpdate).toHaveBeenCalledWith(existing, dto);
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(updated);
    });

    it('should update only the name when only name is provided', async () => {
      // Arrange
      const existing = makeCategory();
      const updated = makeCategory({ name: 'New Name' });
      const saved = makeCategory({ name: 'New Name' });

      const dto: UpdateCategoryDTO = { name: 'New Name' };
      const input: UpdateCategoryInput = { id: 'cat-uuid-1', data: dto };

      mockCategoryService.findOrFail.mockResolvedValue(existing);
      mockCategoryService.applyUpdate.mockReturnValue(updated);
      mockCategoryRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(mockCategoryService.applyUpdate).toHaveBeenCalledWith(existing, dto);
      expect(result.name).toBe('New Name');
    });

    it('should throw CategoryNotFoundException when category does not exist', async () => {
      // Arrange
      mockCategoryService.findOrFail.mockRejectedValue(new CategoryNotFoundException());

      const input: UpdateCategoryInput = { id: 'non-existent', data: { name: 'X' } };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(CategoryNotFoundException);
      expect(mockCategoryRepository.save).not.toHaveBeenCalled();
    });

    it('should not save when findOrFail throws', async () => {
      // Arrange
      mockCategoryService.findOrFail.mockRejectedValue(new CategoryNotFoundException());

      // Act & Assert
      await expect(useCase.execute({ id: 'bad-id', data: { isActive: false } })).rejects.toThrow(
        CategoryNotFoundException,
      );

      expect(mockCategoryService.applyUpdate).not.toHaveBeenCalled();
      expect(mockCategoryRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate repository errors after a successful lookup', async () => {
      // Arrange
      const existing = makeCategory();
      const updated = makeCategory({ name: 'Updated' });

      mockCategoryService.findOrFail.mockResolvedValue(existing);
      mockCategoryService.applyUpdate.mockReturnValue(updated);
      mockCategoryRepository.save.mockRejectedValue(new Error('DB write failed'));

      // Act & Assert
      await expect(
        useCase.execute({ id: 'cat-uuid-1', data: { name: 'Updated' } }),
      ).rejects.toThrow('DB write failed');
    });
  });
});
