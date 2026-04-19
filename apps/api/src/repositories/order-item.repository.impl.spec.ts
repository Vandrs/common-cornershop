import { DataSource, Repository } from 'typeorm';

import { Category, Customer, Order, OrderItem, OrderStatus, Product, Stock } from '@domain/index';
import { OrderItemRepositoryImpl } from './order-item.repository.impl';

describe('OrderItemRepositoryImpl (Integration)', () => {
  let dataSource: DataSource;
  let categoryRepo: Repository<Category>;
  let customerRepo: Repository<Customer>;
  let productRepo: Repository<Product>;
  let orderRepo: Repository<Order>;
  let orderItemOrmRepo: Repository<OrderItem>;

  let repository: OrderItemRepositoryImpl;

  const getRequiredEnv = (key: 'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME') => {
    const value = process.env[key];

    if (!value) {
      throw new Error(`Missing required env var for integration test: ${key}`);
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
      entities: [Category, Product, Stock, Order, OrderItem, Customer],
      synchronize: true,
      dropSchema: true,
      logging: false,
    });

    await dataSource.initialize();
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    categoryRepo = dataSource.getRepository(Category);
    customerRepo = dataSource.getRepository(Customer);
    productRepo = dataSource.getRepository(Product);
    orderRepo = dataSource.getRepository(Order);
    orderItemOrmRepo = dataSource.getRepository(OrderItem);

    repository = new OrderItemRepositoryImpl(dataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query(
      'TRUNCATE TABLE order_items, orders, customers, stocks, products, categories RESTART IDENTITY CASCADE',
    );
  });

  const createCustomer = async (): Promise<Customer> => {
    return customerRepo.save(
      customerRepo.create({
        name: `Customer-${Date.now()}-${Math.random()}`,
        email: `customer-${Date.now()}-${Math.floor(Math.random() * 10000)}@test.com`,
        phone: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      }),
    );
  };

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

  const createOrder = async (): Promise<Order> => {
    const customer = await createCustomer();

    return orderRepo.save(
      orderRepo.create({
        customerId: customer.id,
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: OrderStatus.PENDING,
        totalAmount: 0,
      }),
    );
  };

  describe('save', () => {
    it('should persist a single order item', async () => {
      const category = await createCategory();
      const product = await createProduct(category.id);
      const order = await createOrder();

      const orderItem = orderItemOrmRepo.create({
        orderId: order.id,
        productId: product.id,
        quantity: 2,
        unitPrice: 15.5,
        subtotal: 31,
      });

      const result = await repository.save(orderItem);

      expect(result.id).toBeDefined();
      expect(result.orderId).toBe(order.id);
      expect(result.productId).toBe(product.id);
      expect(Number(result.unitPrice)).toBe(15.5);
      expect(Number(result.subtotal)).toBe(31);
      expect(result.deletedAt ?? null).toBeNull();
    });
  });

  describe('saveMany', () => {
    it('should persist multiple order items in bulk', async () => {
      const category = await createCategory();
      const productA = await createProduct(category.id);
      const productB = await createProduct(category.id);
      const order = await createOrder();

      const items = [
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: productA.id,
          quantity: 1,
          unitPrice: 10,
          subtotal: 10,
        }),
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: productB.id,
          quantity: 3,
          unitPrice: 20,
          subtotal: 60,
        }),
      ];

      const result = await repository.saveMany(items);

      expect(result).toHaveLength(2);
      expect(result.every((item) => Boolean(item.id))).toBe(true);

      const persisted = await orderItemOrmRepo.find({ where: { orderId: order.id } });
      expect(persisted).toHaveLength(2);
    });

    it('should return empty array when saving empty list', async () => {
      const result = await repository.saveMany([]);

      expect(result).toEqual([]);
    });
  });

  describe('findByOrderId', () => {
    it('should return items for active order', async () => {
      const category = await createCategory();
      const productA = await createProduct(category.id);
      const productB = await createProduct(category.id);
      const order = await createOrder();

      await repository.saveMany([
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: productA.id,
          quantity: 1,
          unitPrice: 12,
          subtotal: 12,
        }),
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: productB.id,
          quantity: 2,
          unitPrice: 5,
          subtotal: 10,
        }),
      ]);

      const result = await repository.findByOrderId(order.id);

      expect(result).toHaveLength(2);
      expect(result.every((item) => item.orderId === order.id)).toBe(true);
    });

    it('should not return items when parent order is soft-deleted', async () => {
      const category = await createCategory();
      const product = await createProduct(category.id);
      const order = await createOrder();

      await repository.save(
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          unitPrice: 10,
          subtotal: 10,
        }),
      );

      await orderRepo.softDelete({ id: order.id });

      const result = await repository.findByOrderId(order.id);

      expect(result).toEqual([]);
    });
  });

  describe('deleteByOrderId', () => {
    it('should soft-delete all items for an order without hard delete', async () => {
      const category = await createCategory();
      const productA = await createProduct(category.id);
      const productB = await createProduct(category.id);
      const order = await createOrder();

      await repository.saveMany([
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: productA.id,
          quantity: 1,
          unitPrice: 10,
          subtotal: 10,
        }),
        orderItemOrmRepo.create({
          orderId: order.id,
          productId: productB.id,
          quantity: 1,
          unitPrice: 20,
          subtotal: 20,
        }),
      ]);

      await repository.deleteByOrderId(order.id);

      const activeItems = await repository.findByOrderId(order.id);
      const withDeletedItems = await orderItemOrmRepo
        .createQueryBuilder('orderItem')
        .withDeleted()
        .where('orderItem.orderId = :orderId', { orderId: order.id })
        .getMany();

      expect(activeItems).toEqual([]);
      expect(withDeletedItems).toHaveLength(2);
      expect(withDeletedItems.every((item) => item.deletedAt instanceof Date)).toBe(true);
    });
  });
});
