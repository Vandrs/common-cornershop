import { DataSource } from 'typeorm';

import { Category } from '@domain/entities/category.entity';
import { OrderItem } from '@domain/entities/order-item.entity';
import { Order } from '@domain/entities/order.entity';
import { Product } from '@domain/entities/product.entity';
import { CategoryRepositoryImpl } from './category.repository.impl';

describe('CategoryRepositoryImpl (Integration)', () => {
  let dataSource: DataSource;
  let repository: {
    findAll: (params: { page?: number; limit?: number }) => Promise<{
      data: Category[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>;
    findById: (id: string) => Promise<Category | null>;
    save: (category: Category) => Promise<Category>;
    delete: (id: string) => Promise<void>;
  };

  const getRequiredEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
      throw new Error(`Missing required test environment variable: ${name}`);
    }

    return value;
  };

  beforeAll(async () => {
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

    repository = new CategoryRepositoryImpl(dataSource);
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "categories" RESTART IDENTITY CASCADE');
  });

  const makeCategory = (name: string, isActive = true): Category => {
    const category = new Category();
    category.name = name;
    category.description = `${name} description`;
    category.isActive = isActive;

    return category;
  };

  describe('findAll', () => {
    it('should return paginated categories with correct metadata', async () => {
      // Arrange
      await repository.save(makeCategory('Beverages'));
      await repository.save(makeCategory('Snacks'));
      await repository.save(makeCategory('Dairy'));

      // Act
      const result = await repository.findAll({ page: 1, limit: 2 });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should exclude soft-deleted categories from listings', async () => {
      // Arrange
      const active = await repository.save(makeCategory('Active Category'));
      const deleted = await repository.save(makeCategory('Deleted Category'));

      await repository.delete(deleted.id);

      // Act
      const result = await repository.findAll({ page: 1, limit: 10 });

      // Assert
      expect(result.data.map((item) => item.id)).toContain(active.id);
      expect(result.data.map((item) => item.id)).not.toContain(deleted.id);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      // Arrange
      const saved = await repository.save(makeCategory('Found Category'));

      // Act
      const result = await repository.findById(saved.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(saved.id);
      expect(result?.name).toBe('Found Category');
    });

    it('should return null when category does not exist', async () => {
      // Act
      const result = await repository.findById('f8f12f9a-96a0-4f0e-8db1-0fcb7e95f0ea');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for soft-deleted category', async () => {
      // Arrange
      const saved = await repository.save(makeCategory('To Delete'));
      await repository.delete(saved.id);

      // Act
      const result = await repository.findById(saved.id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should persist a new category', async () => {
      // Arrange
      const toSave = makeCategory('Fresh Category');

      // Act
      const saved = await repository.save(toSave);

      // Assert
      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('Fresh Category');
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should update an existing category', async () => {
      // Arrange
      const saved = await repository.save(makeCategory('Original Name', true));
      saved.name = 'Updated Name';
      saved.isActive = false;

      // Act
      const updated = await repository.save(saved);

      // Assert
      expect(updated.id).toBe(saved.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should soft-delete category without hard delete', async () => {
      // Arrange
      const saved = await repository.save(makeCategory('Delete Me'));

      // Act
      await repository.delete(saved.id);

      // Assert
      const rawRepository = dataSource.getRepository(Category);

      const withDeleted = await rawRepository.findOne({
        where: { id: saved.id },
        withDeleted: true,
      });

      expect(withDeleted).not.toBeNull();
      expect(withDeleted?.deletedAt).toBeInstanceOf(Date);

      const activeOnly = await rawRepository.findOne({
        where: { id: saved.id },
      });

      expect(activeOnly).toBeNull();
    });
  });
});
