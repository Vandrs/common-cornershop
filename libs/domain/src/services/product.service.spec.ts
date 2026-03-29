import 'reflect-metadata';

import { ProductService } from './product.service';
import { IProductRepository } from '../repositories/product.repository';
import { ICategoryRepository } from '../repositories/category.repository';
import { ProductNotFoundException } from '../errors/product-not-found.error';
import { CategoryNotFoundException } from '../errors/category-not-found.error';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';

describe('ProductService', () => {
  let service: ProductService;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;

  const buildProduct = (overrides: Partial<Product> = {}): Product =>
    ({
      id: 'prod-1',
      name: 'Coca-Cola 2L',
      price: 8.5,
      categoryId: 'cat-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Product;

  const buildCategory = (overrides: Partial<Category> = {}): Category =>
    ({
      id: 'cat-1',
      name: 'Bebidas',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Category;

  beforeEach(() => {
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    mockCategoryRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICategoryRepository>;

    service = new ProductService(mockProductRepository, mockCategoryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCategoryExists', () => {
    it('should resolve without error when the category exists', async () => {
      // Arrange
      const category = buildCategory();
      mockCategoryRepository.findById.mockResolvedValue(category);

      // Act & Assert
      await expect(service.validateCategoryExists('cat-1')).resolves.toBeUndefined();
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('cat-1');
    });

    it('should throw CategoryNotFoundException when the category does not exist', async () => {
      // Arrange
      mockCategoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateCategoryExists('non-existent-cat')).rejects.toThrow(
        CategoryNotFoundException,
      );
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('non-existent-cat');
    });
  });

  describe('getExistingProduct', () => {
    it('should return the product when it exists', async () => {
      // Arrange
      const product = buildProduct();
      mockProductRepository.findById.mockResolvedValue(product);

      // Act
      const result = await service.getExistingProduct('prod-1');

      // Assert
      expect(result).toEqual(product);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-1');
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getExistingProduct('non-existent-prod')).rejects.toThrow(
        ProductNotFoundException,
      );
      expect(mockProductRepository.findById).toHaveBeenCalledWith('non-existent-prod');
    });
  });
});
