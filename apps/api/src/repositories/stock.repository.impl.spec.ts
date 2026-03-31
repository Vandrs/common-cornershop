import { DataSource, Repository } from 'typeorm';

import {
  Category,
  Order,
  OrderItem,
  Product,
  Stock,
  InsufficientStockError,
  ProductNotFoundException,
} from '@domain/index';
import type { StockRepositoryImpl } from './stock.repository.impl';

describe('StockRepositoryImpl (Integration)', () => {
  let dataSource: DataSource;
  let categoryRepo: Repository<Category>;
  let productRepo: Repository<Product>;
  let stockOrmRepo: Repository<Stock>;

  let repository: StockRepositoryImpl;

  const getRequiredEnv = (key: 'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME') => {
    const value = process.env[key];

    if (!value) {
      throw new Error(`Missing required env var for integration test: ${key}`);
    }

    return value;
  };

  beforeAll(async () => {
    const { StockRepositoryImpl } =
      require('./stock.repository.impl') as typeof import('./stock.repository.impl');

    dataSource = new DataSource({
      type: 'postgres',
      host: getRequiredEnv('DB_HOST'),
      port: Number(getRequiredEnv('DB_PORT')),
      username: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      database: getRequiredEnv('DB_NAME'),
      entities: [Category, Product, Stock, Order, OrderItem],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await dataSource.initialize();
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    categoryRepo = dataSource.getRepository(Category);
    productRepo = dataSource.getRepository(Product);
    stockOrmRepo = dataSource.getRepository(Stock);

    repository = new StockRepositoryImpl(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE order_items, orders, stocks, products, categories RESTART IDENTITY CASCADE',
    );
  });

  const createCategory = async (): Promise<Category> => {
    return categoryRepo.save(
      categoryRepo.create({
        name: `Category-${Date.now()}-${Math.random()}`,
        description: 'Category test',
        isActive: true,
      }),
    );
  };

  const createProduct = async (categoryId: string): Promise<Product> => {
    return productRepo.save(
      productRepo.create({
        name: `Product-${Date.now()}-${Math.random()}`,
        description: 'Product test',
        price: 10,
        categoryId,
        isActive: true,
      }),
    );
  };

  const createStock = async (
    productId: string,
    quantity: number,
    minimumQuantity: number,
  ): Promise<Stock> => {
    return stockOrmRepo.save(
      stockOrmRepo.create({
        productId,
        quantity,
        minimumQuantity,
        lastUpdatedAt: new Date(),
      }),
    );
  };

  describe('findAll', () => {
    it('should return paginated records honoring filters and soft-delete', async () => {
      // Arrange
      const category = await createCategory();
      const productA = await createProduct(category.id);
      const productB = await createProduct(category.id);
      const productC = await createProduct(category.id);

      const activeBelowMin = await createStock(productA.id, 2, 5);
      const activeOk = await createStock(productB.id, 10, 3);
      const deletedBelowMin = await createStock(productC.id, 1, 4);
      deletedBelowMin.deletedAt = new Date();
      await stockOrmRepo.save(deletedBelowMin);

      // Act
      const all = await repository.findAll({ page: 1, limit: 10 });
      const belowMinimum = await repository.findAll({ page: 1, limit: 10, belowMinimum: true });
      const byProduct = await repository.findAll({ page: 1, limit: 10, productId: productB.id });

      // Assert
      expect(all.meta).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(all.data).toHaveLength(2);

      expect(belowMinimum.data).toHaveLength(1);
      expect(belowMinimum.data[0].id).toBe(activeBelowMin.id);

      expect(byProduct.data).toHaveLength(1);
      expect(byProduct.data[0].id).toBe(activeOk.id);
    });
  });

  describe('findByProductId', () => {
    it('should return null when stock is soft-deleted', async () => {
      // Arrange
      const category = await createCategory();
      const product = await createProduct(category.id);
      const stock = await createStock(product.id, 10, 2);
      stock.deletedAt = new Date();
      await stockOrmRepo.save(stock);

      // Act
      const result = await repository.findByProductId(product.id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should persist stock and auto-fill lastUpdatedAt when missing', async () => {
      // Arrange
      const category = await createCategory();
      const product = await createProduct(category.id);

      const stock = stockOrmRepo.create({
        productId: product.id,
        quantity: 3,
        minimumQuantity: 1,
      });

      // Act
      const saved = await repository.save(stock);

      // Assert
      expect(saved.id).toBeDefined();
      expect(saved.lastUpdatedAt).toBeInstanceOf(Date);
      expect(saved.quantity).toBe(3);
    });
  });

  describe('adjustQuantity', () => {
    it('should update quantity when result is non-negative', async () => {
      // Arrange
      const category = await createCategory();
      const product = await createProduct(category.id);
      await createStock(product.id, 10, 2);

      // Act
      const increased = await repository.adjustQuantity(product.id, 5);
      const decreased = await repository.adjustQuantity(product.id, -3);

      // Assert
      expect(increased.quantity).toBe(15);
      expect(decreased.quantity).toBe(12);
    });

    it('should throw and keep quantity unchanged when operation would become negative', async () => {
      // Arrange
      const category = await createCategory();
      const product = await createProduct(category.id);
      await createStock(product.id, 4, 1);

      // Act + Assert
      await expect(repository.adjustQuantity(product.id, -5)).rejects.toBeInstanceOf(
        InsufficientStockError,
      );

      const persisted = await repository.findByProductId(product.id);
      expect(persisted?.quantity).toBe(4);
    });

    it('should throw ProductNotFoundException for unknown product stock', async () => {
      // Act + Assert
      await expect(
        repository.adjustQuantity('8bc3e8dd-90eb-4617-8f79-a2414cb6252a', 1),
      ).rejects.toBeInstanceOf(ProductNotFoundException);
    });
  });

  describe('reserve and release', () => {
    it('should reserve and release stock correctly', async () => {
      // Arrange
      const category = await createCategory();
      const product = await createProduct(category.id);
      await createStock(product.id, 10, 2);

      // Act
      const reserved = await repository.reserve(product.id, 6);
      const released = await repository.release(product.id, 2);

      // Assert
      expect(reserved.quantity).toBe(4);
      expect(released.quantity).toBe(6);
    });

    it('should not allow reserve that would produce negative quantity', async () => {
      // Arrange
      const category = await createCategory();
      const product = await createProduct(category.id);
      await createStock(product.id, 2, 1);

      // Act + Assert
      await expect(repository.reserve(product.id, 3)).rejects.toBeInstanceOf(
        InsufficientStockError,
      );
    });
  });
});
