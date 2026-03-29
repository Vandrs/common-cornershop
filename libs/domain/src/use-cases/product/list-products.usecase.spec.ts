import 'reflect-metadata';

import { ListProductsUseCase } from './list-products.usecase';
import { IProductRepository, ProductListParams } from '../../repositories/product.repository';
import { PaginatedResult } from '@shared/types/pagination.types';
import { Product } from '../../entities/product.entity';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  const buildPaginatedResult = (
    items: Partial<Product>[],
    total = items.length,
  ): PaginatedResult<Product> => ({
    data: items as Product[],
    meta: {
      page: 1,
      limit: 10,
      total,
      totalPages: Math.ceil(total / 10),
    },
  });

  beforeEach(() => {
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    useCase = new ListProductsUseCase(mockProductRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return a paginated list of products when no filters are provided', async () => {
      // Arrange
      const products = [
        { id: 'prod-1', name: 'Coca-Cola 2L' },
        { id: 'prod-2', name: 'Guaraná 2L' },
      ];
      const expected = buildPaginatedResult(products);

      mockProductRepository.findAll.mockResolvedValue(expected);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result).toEqual(expected);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should forward all filter parameters to the repository', async () => {
      // Arrange
      const params: ProductListParams = {
        page: 2,
        limit: 5,
        categoryId: 'cat-1',
        isActive: true,
        search: 'cola',
        minPrice: 5,
        maxPrice: 20,
      };
      const expected = buildPaginatedResult([]);
      mockProductRepository.findAll.mockResolvedValue(expected);

      // Act
      await useCase.execute(params);

      // Assert
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(params);
    });

    it('should return an empty data array when no products match the filters', async () => {
      // Arrange
      const expected = buildPaginatedResult([]);
      mockProductRepository.findAll.mockResolvedValue(expected);

      // Act
      const result = await useCase.execute({ categoryId: 'non-existent-cat' });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
