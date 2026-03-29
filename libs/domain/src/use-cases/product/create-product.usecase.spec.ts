import 'reflect-metadata';

import { CreateProductUseCase, CreateProductDTO } from './create-product.usecase';
import { IProductRepository } from '../../repositories/product.repository';
import { ProductService } from '../../services/product.service';
import { CategoryNotFoundException } from '../../errors/category-not-found.error';
import { Product } from '../../entities/product.entity';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockProductService: jest.Mocked<ProductService>;

  const buildSavedProduct = (dto: CreateProductDTO): Product =>
    ({
      id: 'prod-new',
      name: dto.name,
      description: dto.description,
      price: dto.price,
      categoryId: dto.categoryId,
      isActive: dto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as Product;

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

    useCase = new CreateProductUseCase(mockProductRepository, mockProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create and return a product when the category exists', async () => {
      // Arrange
      const dto: CreateProductDTO = {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante de cola',
        price: 8.5,
        categoryId: 'cat-1',
      };
      const saved = buildSavedProduct(dto);

      mockProductService.validateCategoryExists.mockResolvedValue(undefined);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual(saved);
      expect(mockProductService.validateCategoryExists).toHaveBeenCalledWith('cat-1');
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          price: dto.price,
          categoryId: dto.categoryId,
          isActive: true,
        }),
      );
    });

    it('should default isActive to true when not provided in the DTO', async () => {
      // Arrange
      const dto: CreateProductDTO = {
        name: 'Guaraná 2L',
        price: 7.5,
        categoryId: 'cat-1',
      };
      const saved = buildSavedProduct(dto);

      mockProductService.validateCategoryExists.mockResolvedValue(undefined);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });

    it('should respect isActive = false when explicitly provided', async () => {
      // Arrange
      const dto: CreateProductDTO = {
        name: 'Produto Inativo',
        price: 5.0,
        categoryId: 'cat-1',
        isActive: false,
      };
      const saved = buildSavedProduct(dto);

      mockProductService.validateCategoryExists.mockResolvedValue(undefined);
      mockProductRepository.save.mockResolvedValue(saved);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockProductRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw CategoryNotFoundException when the category does not exist', async () => {
      // Arrange
      const dto: CreateProductDTO = {
        name: 'Produto',
        price: 10.0,
        categoryId: 'non-existent-cat',
      };

      mockProductService.validateCategoryExists.mockRejectedValue(new CategoryNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(CategoryNotFoundException);
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });
});
