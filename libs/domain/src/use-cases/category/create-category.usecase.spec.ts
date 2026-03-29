import 'reflect-metadata';

import { Category } from '../../entities/category.entity';
import { ICategoryRepository } from '../../repositories/category.repository';
import { CategoryService, CreateCategoryDTO } from '../../services/category.service';
import { CreateCategoryUseCase } from './create-category.usecase';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const makeSavedCategory = (overrides: Partial<Category> = {}): Category => {
    const category = new Category();
    category.id = 'new-cat-uuid';
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

    useCase = new CreateCategoryUseCase(mockCategoryRepository, mockCategoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create and return a category with all provided fields', async () => {
      // Arrange
      const dto: CreateCategoryDTO = {
        name: 'Beverages',
        description: 'Drinks and juices',
        isActive: true,
      };

      const builtCategory = makeSavedCategory();
      const savedCategory = makeSavedCategory();

      mockCategoryService.buildCategory.mockReturnValue(builtCategory);
      mockCategoryRepository.save.mockResolvedValue(savedCategory);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toBe(savedCategory);
      expect(mockCategoryService.buildCategory).toHaveBeenCalledWith(dto);
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(builtCategory);
    });

    it('should create a category with only the required name field', async () => {
      // Arrange
      const dto: CreateCategoryDTO = { name: 'Snacks' };

      const builtCategory = makeSavedCategory({ name: 'Snacks', description: undefined });
      const savedCategory = makeSavedCategory({ name: 'Snacks', description: undefined });

      mockCategoryService.buildCategory.mockReturnValue(builtCategory);
      mockCategoryRepository.save.mockResolvedValue(savedCategory);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.name).toBe('Snacks');
      expect(mockCategoryService.buildCategory).toHaveBeenCalledWith(dto);
    });

    it('should delegate entity construction to CategoryService', async () => {
      // Arrange
      const dto: CreateCategoryDTO = { name: 'Dairy', isActive: false };
      const builtCategory = makeSavedCategory({ name: 'Dairy', isActive: false });
      const savedCategory = makeSavedCategory({ name: 'Dairy', isActive: false });

      mockCategoryService.buildCategory.mockReturnValue(builtCategory);
      mockCategoryRepository.save.mockResolvedValue(savedCategory);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockCategoryService.buildCategory).toHaveBeenCalledTimes(1);
      expect(mockCategoryRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors thrown by the repository', async () => {
      // Arrange
      const dto: CreateCategoryDTO = { name: 'Beverages' };
      const builtCategory = makeSavedCategory();

      mockCategoryService.buildCategory.mockReturnValue(builtCategory);
      mockCategoryRepository.save.mockRejectedValue(new Error('DB connection error'));

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('DB connection error');
    });
  });
});
