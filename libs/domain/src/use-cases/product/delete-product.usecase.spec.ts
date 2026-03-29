import 'reflect-metadata';

import { DeleteProductUseCase } from './delete-product.usecase';
import { IProductRepository } from '../../repositories/product.repository';
import { ProductService } from '../../services/product.service';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { Product } from '../../entities/product.entity';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductService: jest.Mocked<ProductService>;

  const buildProduct = (): Product => {
    const product = new Product();
    product.id = 'prod-1';
    product.name = 'Coca-Cola 2L';
    product.price = 8.5;
    product.categoryId = 'cat-1';
    product.isActive = true;
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

    useCase = new DeleteProductUseCase(mockProductRepository, mockProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete the product when it exists', async () => {
      // Arrange
      const product = buildProduct();
      mockProductService.getExistingProduct.mockResolvedValue(product);
      mockProductRepository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('prod-1');

      // Assert
      expect(mockProductService.getExistingProduct).toHaveBeenCalledWith('prod-1');
      expect(mockProductRepository.delete).toHaveBeenCalledWith('prod-1');
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockProductService.getExistingProduct.mockRejectedValue(new ProductNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(ProductNotFoundException);
      expect(mockProductRepository.delete).not.toHaveBeenCalled();
    });

    it('should verify product existence before issuing the delete', async () => {
      // Arrange
      const product = buildProduct();
      mockProductService.getExistingProduct.mockResolvedValue(product);
      mockProductRepository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute('prod-1');

      // Assert — getExistingProduct must be called before delete
      const getOrder = mockProductService.getExistingProduct.mock.invocationCallOrder[0];
      const deleteOrder = mockProductRepository.delete.mock.invocationCallOrder[0];
      expect(getOrder).toBeLessThan(deleteOrder);
    });
  });
});
