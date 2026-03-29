import 'reflect-metadata';

import { StockService } from './stock.service';
import { IStockRepository } from '../repositories/stock.repository';
import { IProductRepository } from '../repositories/product.repository';
import { ProductNotFoundException } from '../errors/product-not-found.error';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';

describe('StockService', () => {
  let service: StockService;
  let mockStockRepository: jest.Mocked<IStockRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;

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

  const buildStock = (overrides: Partial<Stock> = {}): Stock =>
    ({
      id: 'stock-1',
      productId: 'prod-1',
      quantity: 50,
      minimumQuantity: 5,
      lastUpdatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Stock;

  beforeEach(() => {
    mockStockRepository = {
      findAll: jest.fn(),
      findByProductId: jest.fn(),
      save: jest.fn(),
      adjustQuantity: jest.fn(),
      reserve: jest.fn(),
      release: jest.fn(),
    } as jest.Mocked<IStockRepository>;

    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    service = new StockService(mockStockRepository, mockProductRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStockByProductId', () => {
    it('should return the stock when the product and stock both exist', async () => {
      // Arrange
      const product = buildProduct();
      const stock = buildStock();
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(stock);

      // Act
      const result = await service.getStockByProductId('prod-1');

      // Assert
      expect(result).toEqual(stock);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-1');
      expect(mockStockRepository.findByProductId).toHaveBeenCalledWith('prod-1');
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStockByProductId('non-existent-prod')).rejects.toThrow(
        ProductNotFoundException,
      );
      expect(mockStockRepository.findByProductId).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundException when the stock record does not exist', async () => {
      // Arrange
      const product = buildProduct();
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStockByProductId('prod-1')).rejects.toThrow(ProductNotFoundException);
    });
  });

  describe('validateSufficientStock', () => {
    it('should resolve without error when the available quantity is sufficient', async () => {
      // Arrange
      const product = buildProduct();
      const stock = buildStock({ quantity: 100 });
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(stock);

      // Act & Assert
      await expect(service.validateSufficientStock('prod-1', 10)).resolves.toBeUndefined();
    });

    it('should resolve without error when requested quantity exactly equals available quantity', async () => {
      // Arrange
      const product = buildProduct();
      const stock = buildStock({ quantity: 10 });
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(stock);

      // Act & Assert
      await expect(service.validateSufficientStock('prod-1', 10)).resolves.toBeUndefined();
    });

    it('should throw InsufficientStockError when available quantity is less than requested', async () => {
      // Arrange
      const product = buildProduct({ name: 'Coca-Cola 2L' });
      const stock = buildStock({ quantity: 3 });
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(stock);

      // Act & Assert
      await expect(service.validateSufficientStock('prod-1', 10)).rejects.toThrow(
        InsufficientStockError,
      );
    });

    it('should include the product name in the InsufficientStockError message', async () => {
      // Arrange
      const product = buildProduct({ name: 'Guaraná Antarctica' });
      const stock = buildStock({ quantity: 0 });
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(stock);

      // Act & Assert
      await expect(service.validateSufficientStock('prod-1', 5)).rejects.toThrow(
        expect.objectContaining({ message: expect.stringContaining('Guaraná Antarctica') }),
      );
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateSufficientStock('non-existent', 1)).rejects.toThrow(
        ProductNotFoundException,
      );
      expect(mockStockRepository.findByProductId).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundException when the stock record does not exist', async () => {
      // Arrange
      const product = buildProduct();
      mockProductRepository.findById.mockResolvedValue(product);
      mockStockRepository.findByProductId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateSufficientStock('prod-1', 1)).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
});
