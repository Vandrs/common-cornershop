import 'reflect-metadata';

import { UpdateStockUseCase, UpdateStockDTO } from './update-stock.usecase';
import { IStockRepository } from '../../repositories/stock.repository';
import { StockService } from '../../services/stock.service';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { InsufficientStockError } from '../../errors/insufficient-stock.error';
import { Stock } from '../../entities/stock.entity';

describe('UpdateStockUseCase', () => {
  let useCase: UpdateStockUseCase;
  let mockStockRepository: jest.Mocked<IStockRepository>;
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
    mockStockRepository = {
      findAll: jest.fn(),
      findByProductId: jest.fn(),
      save: jest.fn(),
      adjustQuantity: jest.fn(),
      reserve: jest.fn(),
      release: jest.fn(),
    } as jest.Mocked<IStockRepository>;

    mockStockService = {
      getStockByProductId: jest.fn(),
      validateSufficientStock: jest.fn(),
    } as unknown as jest.Mocked<StockService>;

    useCase = new UpdateStockUseCase(mockStockRepository, mockStockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should replenish stock and return the updated record when delta is positive', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'prod-1', quantityDelta: 20 };
      const updatedStock = buildStock({ quantity: 70 });

      mockStockService.getStockByProductId.mockResolvedValue(buildStock({ quantity: 50 }));
      mockStockRepository.adjustQuantity.mockResolvedValue(updatedStock);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual(updatedStock);
      expect(mockStockService.getStockByProductId).toHaveBeenCalledWith('prod-1');
      expect(mockStockRepository.adjustQuantity).toHaveBeenCalledWith('prod-1', 20);
    });

    it('should debit stock and return the updated record when delta is negative and stock is sufficient', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'prod-1', quantityDelta: -10 };
      const updatedStock = buildStock({ quantity: 40 });

      mockStockService.validateSufficientStock.mockResolvedValue(undefined);
      mockStockRepository.adjustQuantity.mockResolvedValue(updatedStock);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual(updatedStock);
      expect(mockStockService.validateSufficientStock).toHaveBeenCalledWith('prod-1', 10);
      expect(mockStockRepository.adjustQuantity).toHaveBeenCalledWith('prod-1', -10);
    });

    it('should not call validateSufficientStock when the delta is positive', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'prod-1', quantityDelta: 5 };
      mockStockService.getStockByProductId.mockResolvedValue(buildStock());
      mockStockRepository.adjustQuantity.mockResolvedValue(buildStock({ quantity: 55 }));

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockStockService.validateSufficientStock).not.toHaveBeenCalled();
    });

    it('should not call getStockByProductId when the delta is negative', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'prod-1', quantityDelta: -5 };
      mockStockService.validateSufficientStock.mockResolvedValue(undefined);
      mockStockRepository.adjustQuantity.mockResolvedValue(buildStock({ quantity: 45 }));

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockStockService.getStockByProductId).not.toHaveBeenCalled();
    });

    it('should throw InsufficientStockError when debiting more than available quantity', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'prod-1', quantityDelta: -100 };
      mockStockService.validateSufficientStock.mockRejectedValue(
        new InsufficientStockError('Coca-Cola 2L'),
      );

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(InsufficientStockError);
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundException when the product does not exist (positive delta)', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'non-existent', quantityDelta: 10 };
      mockStockService.getStockByProductId.mockRejectedValue(new ProductNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ProductNotFoundException);
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundException when the product does not exist (negative delta)', async () => {
      // Arrange
      const dto: UpdateStockDTO = { productId: 'non-existent', quantityDelta: -5 };
      mockStockService.validateSufficientStock.mockRejectedValue(new ProductNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(ProductNotFoundException);
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
    });
  });
});
