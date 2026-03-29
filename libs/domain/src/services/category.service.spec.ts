import 'reflect-metadata';

import { Category } from '../entities/category.entity';
import { CategoryNotFoundException } from '../errors/category-not-found.error';
import { ICategoryRepository } from '../repositories/category.repository';
import { CategoryService, CreateCategoryDTO, UpdateCategoryDTO } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;

  const makeMockCategory = (overrides: Partial<Category> = {}): Category => {
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

    service = new CategoryService(mockCategoryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── buildCategory ───────────────────────────────────────────────────────────

  describe('buildCategory', () => {
    it('should build a category with all provided fields', () => {
      // Arrange
      const dto: CreateCategoryDTO = {
        name: 'Snacks',
        description: 'Chips and crackers',
        isActive: false,
      };

      // Act
      const result = service.buildCategory(dto);

      // Assert
      expect(result.name).toBe('Snacks');
      expect(result.description).toBe('Chips and crackers');
      expect(result.isActive).toBe(false);
    });

    it('should default isActive to true when not provided', () => {
      // Arrange
      const dto: CreateCategoryDTO = { name: 'Dairy' };

      // Act
      const result = service.buildCategory(dto);

      // Assert
      expect(result.isActive).toBe(true);
    });

    it('should set description to undefined when not provided', () => {
      // Arrange
      const dto: CreateCategoryDTO = { name: 'Frozen Foods' };

      // Act
      const result = service.buildCategory(dto);

      // Assert
      expect(result.description).toBeUndefined();
    });

    it('should return a Category instance', () => {
      // Arrange
      const dto: CreateCategoryDTO = { name: 'Produce' };

      // Act
      const result = service.buildCategory(dto);

      // Assert
      expect(result).toBeInstanceOf(Category);
    });
  });

  // ─── findOrFail ──────────────────────────────────────────────────────────────

  describe('findOrFail', () => {
    it('should return the category when found', async () => {
      // Arrange
      const existing = makeMockCategory();
      mockCategoryRepository.findById.mockResolvedValue(existing);

      // Act
      const result = await service.findOrFail('cat-uuid-1');

      // Assert
      expect(result).toBe(existing);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('cat-uuid-1');
    });

    it('should throw CategoryNotFoundException when category is not found', async () => {
      // Arrange
      mockCategoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOrFail('non-existent-id')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('should call findById with the exact id provided', async () => {
      // Arrange
      const id = 'specific-uuid-999';
      mockCategoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOrFail(id)).rejects.toThrow(CategoryNotFoundException);
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(id);
    });
  });

  // ─── applyUpdate ─────────────────────────────────────────────────────────────

  describe('applyUpdate', () => {
    it('should update all fields when all are provided', () => {
      // Arrange
      const category = makeMockCategory();
      const dto: UpdateCategoryDTO = {
        name: 'New Name',
        description: 'New description',
        isActive: false,
      };

      // Act
      const result = service.applyUpdate(category, dto);

      // Assert
      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New description');
      expect(result.isActive).toBe(false);
    });

    it('should update only name when only name is provided', () => {
      // Arrange
      const category = makeMockCategory({
        name: 'Old Name',
        description: 'Old description',
        isActive: true,
      });
      const dto: UpdateCategoryDTO = { name: 'Updated Name' };

      // Act
      const result = service.applyUpdate(category, dto);

      // Assert
      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Old description');
      expect(result.isActive).toBe(true);
    });

    it('should update only isActive when only isActive is provided', () => {
      // Arrange
      const category = makeMockCategory({ name: 'Beverages', isActive: true });
      const dto: UpdateCategoryDTO = { isActive: false };

      // Act
      const result = service.applyUpdate(category, dto);

      // Assert
      expect(result.name).toBe('Beverages');
      expect(result.isActive).toBe(false);
    });

    it('should return the same category instance (mutation in place)', () => {
      // Arrange
      const category = makeMockCategory();
      const dto: UpdateCategoryDTO = { name: 'Mutated' };

      // Act
      const result = service.applyUpdate(category, dto);

      // Assert
      expect(result).toBe(category);
    });

    it('should not change any field when an empty DTO is provided', () => {
      // Arrange
      const category = makeMockCategory({
        name: 'Beverages',
        description: 'Drinks',
        isActive: true,
      });
      const dto: UpdateCategoryDTO = {};

      // Act
      const result = service.applyUpdate(category, dto);

      // Assert
      expect(result.name).toBe('Beverages');
      expect(result.description).toBe('Drinks');
      expect(result.isActive).toBe(true);
    });
  });
});
