import 'reflect-metadata';

import { GetProductUseCase } from './get-product.usecase';
import { ProductService } from '../../services/product.service';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { Product } from '../../entities/product.entity';

describe('GetProductUseCase', () => {
  let useCase: GetProductUseCase;
  let mockProductService: jest.Mocked<ProductService>;

  const buildProduct = (overrides: Partial<Product> = {}): Product => {
    const product = new Product();
    product.id = 'prod-1';
    product.name = 'Coca-Cola 2L';
    product.price = 8.5;
    product.categoryId = 'cat-1';
    product.isActive = true;
    Object.assign(product, overrides);
    return product;
  };

  beforeEach(() => {
    mockProductService = {
      validateCategoryExists: jest.fn(),
      getExistingProduct: jest.fn(),
    } as unknown as jest.Mocked<ProductService>;

    useCase = new GetProductUseCase(mockProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return the product when it exists', async () => {
      // Arrange
      const product = buildProduct();
      mockProductService.getExistingProduct.mockResolvedValue(product);

      // Act
      const result = await useCase.execute('prod-1');

      // Assert
      expect(result).toBe(product);
      expect(mockProductService.getExistingProduct).toHaveBeenCalledWith('prod-1');
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockProductService.getExistingProduct.mockRejectedValue(new ProductNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(ProductNotFoundException);
    });

    it('should delegate the lookup entirely to ProductService', async () => {
      // Arrange
      const product = buildProduct({ name: 'Guaraná 2L' });
      mockProductService.getExistingProduct.mockResolvedValue(product);

      // Act
      await useCase.execute('prod-1');

      // Assert
      expect(mockProductService.getExistingProduct).toHaveBeenCalledTimes(1);
      expect(mockProductService.getExistingProduct).toHaveBeenCalledWith('prod-1');
    });
  });
});
