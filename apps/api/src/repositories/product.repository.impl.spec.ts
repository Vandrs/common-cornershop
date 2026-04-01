import 'reflect-metadata';

import { randomUUID } from 'crypto';

import { Category } from '@domain/entities/category.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { Order } from '@domain/entities/order.entity';
import { Product } from '@domain/entities/product.entity';
import { Stock } from '@domain/entities/stock.entity';
import { DataSource, Repository } from 'typeorm';

import { ProductRepositoryImpl } from './product.repository.impl';

const getRequiredTestEnv = (primaryName: string, fallbackName?: string): string => {
  const primaryValue = process.env[primaryName];
  if (primaryValue && primaryValue.trim().length > 0) {
    return primaryValue;
  }

  if (fallbackName) {
    const fallbackValue = process.env[fallbackName];
    if (fallbackValue && fallbackValue.trim().length > 0) {
      return fallbackValue;
    }
  }

  throw new Error(
    `${primaryName}${fallbackName ? ` (or ${fallbackName})` : ''} is required for ProductRepositoryImpl integration tests`,
  );
};

describe('ProductRepositoryImpl (integration)', () => {
  let dataSource: DataSource;
  let categoryOrmRepository: Repository<Category>;
  let productOrmRepository: Repository<Product>;
  let repository: ProductRepositoryImpl;

  const dbHost = getRequiredTestEnv('DB_HOST', 'TEST_DB_HOST');
  const dbPort = Number(getRequiredTestEnv('DB_PORT', 'TEST_DB_PORT'));
  const dbUser = getRequiredTestEnv('DB_USER', 'TEST_DB_USER');
  const dbPassword = getRequiredTestEnv('DB_PASSWORD', 'TEST_DB_PASSWORD');
  const dbName = getRequiredTestEnv('DB_NAME', 'TEST_DB_NAME');

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPassword,
      database: dbName,
      entities: [Category, Product, Stock, Order, OrderItem],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await dataSource.initialize();

    categoryOrmRepository = dataSource.getRepository(Category);
    productOrmRepository = dataSource.getRepository(Product);
    repository = new ProductRepositoryImpl(productOrmRepository);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE "order_items", "orders", "stocks", "products", "categories" RESTART IDENTITY CASCADE',
    );
  });

  const createCategory = async (name: string): Promise<Category> => {
    return categoryOrmRepository.save({
      id: randomUUID(),
      name,
      isActive: true,
    });
  };

  const createProduct = async (overrides: Partial<Product> = {}): Promise<Product> => {
    const category =
      overrides.categoryId !== undefined
        ? null
        : await createCategory(`Category-${Math.random().toString(36).slice(2, 8)}`);

    return productOrmRepository.save({
      id: randomUUID(),
      name: 'Default Product',
      description: 'Default Description',
      price: 10,
      categoryId: category?.id ?? overrides.categoryId ?? randomUUID(),
      isActive: true,
      ...overrides,
    });
  };

  describe('findAll', () => {
    it('should return paginated products and metadata', async () => {
      const category = await createCategory('Bebidas');

      await createProduct({ name: 'P1', categoryId: category.id });
      await createProduct({ name: 'P2', categoryId: category.id });
      await createProduct({ name: 'P3', categoryId: category.id });

      const result = await repository.findAll({ page: 1, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should apply categoryId filter', async () => {
      const beverages = await createCategory('Bebidas');
      const snacks = await createCategory('Snacks');

      await createProduct({ name: 'Cola', categoryId: beverages.id });
      await createProduct({ name: 'Chips', categoryId: snacks.id });

      const result = await repository.findAll({ categoryId: beverages.id });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Cola');
      expect(result.data[0].categoryId).toBe(beverages.id);
    });

    it('should apply isActive filter', async () => {
      const category = await createCategory('Bebidas');

      await createProduct({ name: 'Ativo', isActive: true, categoryId: category.id });
      await createProduct({ name: 'Inativo', isActive: false, categoryId: category.id });

      const result = await repository.findAll({ isActive: false });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Inativo');
      expect(result.data[0].isActive).toBe(false);
    });

    it('should apply case-insensitive name search filter', async () => {
      const category = await createCategory('Bebidas');

      await createProduct({ name: 'Coca Cola Zero', categoryId: category.id });
      await createProduct({ name: 'Guarana', categoryId: category.id });

      const result = await repository.findAll({ search: 'coLa' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Coca Cola Zero');
    });

    it('should apply minPrice and maxPrice filters', async () => {
      const category = await createCategory('Bebidas');

      await createProduct({ name: 'Cheap', price: 5, categoryId: category.id });
      await createProduct({ name: 'Mid', price: 15, categoryId: category.id });
      await createProduct({ name: 'Expensive', price: 30, categoryId: category.id });

      const result = await repository.findAll({ minPrice: 10, maxPrice: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Mid');
      expect(Number(result.data[0].price)).toBe(15);
    });

    it('should not return soft-deleted records in list', async () => {
      const category = await createCategory('Bebidas');
      const deletedProduct = await createProduct({ name: 'Deleted', categoryId: category.id });
      await createProduct({ name: 'Active', categoryId: category.id });

      await repository.delete(deletedProduct.id);

      const result = await repository.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Active');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const category = await createCategory('Doces');
      const product = await createProduct({ name: 'Chocolate', categoryId: category.id });

      const result = await repository.findById(product.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(product.id);
      expect(result?.name).toBe('Chocolate');
    });

    it('should return null when product is soft-deleted', async () => {
      const category = await createCategory('Doces');
      const product = await createProduct({ name: 'Deleted Product', categoryId: category.id });

      await repository.delete(product.id);

      const result = await repository.findById(product.id);

      expect(result).toBeNull();
    });

    it('should return null when product does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should return only matching non-deleted products', async () => {
      const category = await createCategory('Padaria');
      const product1 = await createProduct({ name: 'Pao', categoryId: category.id });
      const product2 = await createProduct({ name: 'Bolo', categoryId: category.id });
      const deletedProduct = await createProduct({ name: 'Rosca', categoryId: category.id });

      await repository.delete(deletedProduct.id);

      const result = await repository.findByIds([
        product2.id,
        deletedProduct.id,
        product1.id,
        randomUUID(),
      ]);

      expect(result.map((product) => product.id)).toEqual([product2.id, product1.id]);
    });

    it('should return empty array when ids list is empty', async () => {
      const result = await repository.findByIds([]);

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create a new product', async () => {
      const category = await createCategory('Congelados');

      const productToCreate = productOrmRepository.create({
        id: randomUUID(),
        name: 'Lasanha',
        description: 'Congelada',
        price: 22.5,
        categoryId: category.id,
        isActive: true,
      });

      const saved = await repository.save(productToCreate);

      expect(saved.id).toBe(productToCreate.id);
      expect(saved.name).toBe('Lasanha');
      expect(Number(saved.price)).toBe(22.5);
    });

    it('should update an existing product', async () => {
      const category = await createCategory('Congelados');
      const existing = await createProduct({
        name: 'Pizza',
        description: 'Muçarela',
        price: 19,
        categoryId: category.id,
      });

      existing.name = 'Pizza Premium';
      existing.price = 25.5;
      existing.isActive = false;

      const updated = await repository.save(existing);

      expect(updated.id).toBe(existing.id);
      expect(updated.name).toBe('Pizza Premium');
      expect(Number(updated.price)).toBe(25.5);
      expect(updated.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should soft-delete an existing product', async () => {
      const category = await createCategory('Higiene');
      const product = await createProduct({ name: 'Sabonete', categoryId: category.id });

      await repository.delete(product.id);

      const deleted = await productOrmRepository.findOne({
        where: { id: product.id },
        withDeleted: true,
      });

      expect(deleted).not.toBeNull();
      expect(deleted?.deletedAt).toBeInstanceOf(Date);

      const activeRecord = await repository.findById(product.id);
      expect(activeRecord).toBeNull();
    });
  });
});
