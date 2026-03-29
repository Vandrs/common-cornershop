import 'reflect-metadata';

import { UpdateProductUseCase, UpdateProductDTO } from './update-product.usecase';
import { IProductRepository } from '../../repositories/product.repository';
import { ProductService } from '../../services/product.service';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { CategoryNotFoundException } from '../../errors/category-not-found.error';
import { Product } from '../../entities/product.entity';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductService: jest.Mocked<ProductService>;

  const buildProduct = (overrides: Partial<Product> = {}): Product => {
    const product = new Product();
    product.id = 'prod-1';
    product.name = 'Coca-Cola 2L';
    product.description = 'Refrigerante de cola';
    product.price = 8.5;
    product.categoryId = 'cat-1';
    product.isActive = true;
    Object.assign(product, overrides);
    return product;
  };

  beforeEach(() => {
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    mockProductService = {
      validateCategoryExists: jest.fn(),
      getExistingProduct: jest.fn(),
    } as unknown as jest.Mocked<ProductService>;

    useCase = new UpdateProductUseCase(mockProductRepository, mockProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update and return the product when given valid fields', async () => {
      // Arrange
      const existing = buildProduct();
      const dto: UpdateProductDTO = { name: 'Coca-Cola 3L', price: 10.0 };
      const saved = buildProduct({ name: 'Coca-Cola 3L', price: 10.0 });

      mockProductService.getExistingProduct.mockResolvedValue(existing);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute('prod-1', dto);

      // Assert
      expect(result).toEqual(saved);
      expect(mockProductService.getExistingProduct).toHaveBeenCalledWith('prod-1');
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Coca-Cola 3L', price: 10.0 }),
      );
    });

    it('should update the categoryId and validate the new category', async () => {
      // Arrange
      const existing = buildProduct();
      const dto: UpdateProductDTO = { categoryId: 'cat-2' };
      const saved = buildProduct({ categoryId: 'cat-2' });

      mockProductService.getExistingProduct.mockResolvedValue(existing);
      mockProductService.validateCategoryExists.mockResolvedValue(undefined);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute('prod-1', dto);

      // Assert
      expect(mockProductService.validateCategoryExists).toHaveBeenCalledWith('cat-2');
      expect(result.categoryId).toBe('cat-2');
    });

    it('should not validate category when categoryId is not provided in the DTO', async () => {
      // Arrange
      const existing = buildProduct();
      const dto: UpdateProductDTO = { name: 'New Name' };
      const saved = buildProduct({ name: 'New Name' });

      mockProductService.getExistingProduct.mockResolvedValue(existing);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      await useCase.execute('prod-1', dto);

      // Assert
      expect(mockProductService.validateCategoryExists).not.toHaveBeenCalled();
    });

    it('should apply only the fields present in the DTO (partial update)', async () => {
      // Arrange
      const existing = buildProduct({ price: 8.5, isActive: true });
      const dto: UpdateProductDTO = { isActive: false };
      const saved = buildProduct({ price: 8.5, isActive: false });

      mockProductService.getExistingProduct.mockResolvedValue(existing);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute('prod-1', dto);

      // Assert
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false, price: 8.5 }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockProductService.getExistingProduct.mockRejectedValue(new ProductNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent', {})).rejects.toThrow(ProductNotFoundException);
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CategoryNotFoundException when the new category does not exist', async () => {
      // Arrange
      const existing = buildProduct();
      mockProductService.getExistingProduct.mockResolvedValue(existing);
      mockProductService.validateCategoryExists.mockRejectedValue(new CategoryNotFoundException());

      // Act & Assert
      await expect(useCase.execute('prod-1', { categoryId: 'non-existent-cat' })).rejects.toThrow(
        CategoryNotFoundException,
      );
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should update the description when only description is provided', async () => {
      // Arrange
      const existing = buildProduct({ description: 'Old description' });
      const dto: UpdateProductDTO = { description: 'New description' };
      const saved = buildProduct({ description: 'New description' });

      mockProductService.getExistingProduct.mockResolvedValue(existing);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute('prod-1', dto);

      // Assert
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'New description' }),
      );
      expect(result.description).toBe('New description');
    });
  });
});
