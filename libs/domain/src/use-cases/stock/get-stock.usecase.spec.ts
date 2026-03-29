import 'reflect-metadata';

import { GetStockUseCase } from './get-stock.usecase';
import { StockService } from '../../services/stock.service';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { Stock } from '../../entities/stock.entity';

describe('GetStockUseCase', () => {
  let useCase: GetStockUseCase;
  let mockStockService: jest.Mocked<StockService>;

  const buildStock = (overrides: Partial<Stock> = {}): Stock => {
    const stock = new Stock();
    stock.id = 'stock-1';
    stock.productId = 'prod-1';
    stock.quantity = 50;
    stock.minimumQuantity = 5;
    stock.lastUpdatedAt = new Date();
    Object.assign(stock, overrides);
    return stock;
  };

  beforeEach(() => {
    mockStockService = {
      getStockByProductId: jest.fn(),
      validateSufficientStock: jest.fn(),
    } as unknown as jest.Mocked<StockService>;

    useCase = new GetStockUseCase(mockStockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return the stock record when the product exists', async () => {
      // Arrange
      const stock = buildStock();
      mockStockService.getStockByProductId.mockResolvedValue(stock);

      // Act
      const result = await useCase.execute('prod-1');

      // Assert
      expect(result).toBe(stock);
      expect(mockStockService.getStockByProductId).toHaveBeenCalledWith('prod-1');
    });

    it('should throw ProductNotFoundException when the product does not exist', async () => {
      // Arrange
      mockStockService.getStockByProductId.mockRejectedValue(new ProductNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent-prod')).rejects.toThrow(ProductNotFoundException);
    });

    it('should delegate the lookup entirely to StockService', async () => {
      // Arrange
      const stock = buildStock({ quantity: 100 });
      mockStockService.getStockByProductId.mockResolvedValue(stock);

      // Act
      await useCase.execute('prod-1');

      // Assert
      expect(mockStockService.getStockByProductId).toHaveBeenCalledTimes(1);
      expect(mockStockService.getStockByProductId).toHaveBeenCalledWith('prod-1');
    });
  });
});
