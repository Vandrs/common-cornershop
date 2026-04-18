import { DataSource, Repository } from 'typeorm';

import { Category, Order, OrderItem, OrderStatus, Product, Stock } from '@domain/index';

import type { OrderRepositoryImpl } from './order.repository.impl';

describe('OrderRepositoryImpl (Integration)', () => {
  let dataSource: DataSource;
  let categoryRepo: Repository<Category>;
  let productRepo: Repository<Product>;
  let orderOrmRepo: Repository<Order>;
  let orderItemOrmRepo: Repository<OrderItem>;

  let repository: OrderRepositoryImpl;

  const getRequiredEnv = (key: 'DB_HOST' | 'DB_PORT' | 'DB_USER' | 'DB_PASSWORD' | 'DB_NAME') => {
    const value = process.env[key];

    if (!value) {
      throw new Error(`Missing required env var for integration test: ${key}`);
    }

    return value;
  };

  beforeAll(async () => {
    const { OrderRepositoryImpl } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('./order.repository.impl') as typeof import('./order.repository.impl');

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
    orderOrmRepo = dataSource.getRepository(Order);
    orderItemOrmRepo = dataSource.getRepository(OrderItem);

    repository = new OrderRepositoryImpl(dataSource);
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

  const createProduct = async (categoryId: string, price = 10): Promise<Product> => {
    return productRepo.save(
      productRepo.create({
        name: `Product-${Date.now()}-${Math.random()}`,
        description: 'Product test',
        price,
        categoryId,
        isActive: true,
      }),
    );
  };

  const createOrderEntity = (orderNumber: string, status: OrderStatus, totalAmount = 0): Order => {
    const order = new Order();
    order.orderNumber = orderNumber;
    order.status = status;
    order.totalAmount = totalAmount;
    return order;
  };

  const createOrderItemEntity = (
    productId: string,
    quantity: number,
    unitPrice: number,
    subtotal: number,
  ): OrderItem => {
    const item = new OrderItem();
    item.productId = productId;
    item.quantity = quantity;
    item.unitPrice = unitPrice;
    item.subtotal = subtotal;
    return item;
  };

  describe('findById', () => {
    it('should return order with items for active order', async () => {
      const category = await createCategory();
      const product = await createProduct(category.id);

      const createdOrder = await repository.createWithItems(
        createOrderEntity(`ORD-${Date.now()}-find`, OrderStatus.PENDING, 20),
        [createOrderItemEntity(product.id, 2, 10, 20)],
      );

      const result = await repository.findById(createdOrder.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdOrder.id);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].product.id).toBe(product.id);
    });

    it('should not return soft-deleted order', async () => {
      const savedOrder = await orderOrmRepo.save(
        orderOrmRepo.create({
          orderNumber: `ORD-${Date.now()}-soft-deleted`,
          status: OrderStatus.PENDING,
          totalAmount: 0,
        }),
      );

      await orderOrmRepo.softDelete({ id: savedOrder.id });

      const result = await repository.findById(savedOrder.id);

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should apply filters and return paginated result metadata', async () => {
      const orderA = await orderOrmRepo.save(
        orderOrmRepo.create({
          orderNumber: `ORD-${Date.now()}-A`,
          status: OrderStatus.PENDING,
          totalAmount: 100,
        }),
      );
      const orderB = await orderOrmRepo.save(
        orderOrmRepo.create({
          orderNumber: `ORD-${Date.now()}-B`,
          status: OrderStatus.PENDING,
          totalAmount: 120,
        }),
      );
      await orderOrmRepo.save(
        orderOrmRepo.create({
          orderNumber: `ORD-${Date.now()}-C`,
          status: OrderStatus.COMPLETED,
          totalAmount: 200,
        }),
      );

      const createdAfter = new Date('2026-01-01T00:00:00.000Z');
      const createdBefore = new Date('2026-01-31T23:59:59.999Z');

      await dataSource.query('UPDATE orders SET created_at = $1 WHERE id = $2', [
        '2026-01-10T10:00:00.000Z',
        orderA.id,
      ]);
      await dataSource.query('UPDATE orders SET created_at = $1 WHERE id = $2', [
        '2026-01-12T10:00:00.000Z',
        orderB.id,
      ]);

      const pageOne = await repository.list({
        status: OrderStatus.PENDING,
        createdAfter,
        createdBefore,
        page: 1,
        limit: 1,
      });

      expect(pageOne.data).toHaveLength(1);
      expect(pageOne.meta).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
      expect(pageOne.data[0].status).toBe(OrderStatus.PENDING);

      const byOrderNumber = await repository.list({
        orderNumber: orderA.orderNumber,
        page: 1,
        limit: 10,
      });

      expect(byOrderNumber.data).toHaveLength(1);
      expect(byOrderNumber.data[0].id).toBe(orderA.id);
      expect(byOrderNumber.meta.total).toBe(1);
    });

    it('should not include soft-deleted orders in list', async () => {
      const order = await orderOrmRepo.save(
        orderOrmRepo.create({
          orderNumber: `ORD-${Date.now()}-deleted-list`,
          status: OrderStatus.PENDING,
          totalAmount: 10,
        }),
      );

      await orderOrmRepo.softDelete({ id: order.id });

      const result = await repository.list({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('createWithItems', () => {
    it('should persist order and items atomically in a transaction', async () => {
      const category = await createCategory();
      const productA = await createProduct(category.id, 12);
      const productB = await createProduct(category.id, 8);

      const result = await repository.createWithItems(
        createOrderEntity(`ORD-${Date.now()}-tx-ok`, OrderStatus.PENDING, 28),
        [
          createOrderItemEntity(productA.id, 1, 12, 12),
          createOrderItemEntity(productB.id, 2, 8, 16),
        ],
      );

      expect(result.id).toBeDefined();
      expect(result.items).toHaveLength(2);

      const persistedOrder = await orderOrmRepo.findOne({ where: { id: result.id } });
      const persistedItems = await orderItemOrmRepo.find({ where: { orderId: result.id } });

      expect(persistedOrder).not.toBeNull();
      expect(persistedItems).toHaveLength(2);
    });

    it('should rollback entire transaction when item persistence fails', async () => {
      const category = await createCategory();
      const validProduct = await createProduct(category.id, 15);
      const invalidProductId = '00000000-0000-0000-0000-000000000000';

      await expect(
        repository.createWithItems(
          createOrderEntity(`ORD-${Date.now()}-tx-fail`, OrderStatus.PENDING, 30),
          [
            createOrderItemEntity(validProduct.id, 1, 15, 15),
            createOrderItemEntity(invalidProductId, 1, 15, 15),
          ],
        ),
      ).rejects.toThrow();

      const persistedOrders = await orderOrmRepo.find();
      const persistedItems = await orderItemOrmRepo.find();

      expect(persistedOrders).toHaveLength(0);
      expect(persistedItems).toHaveLength(0);
    });
  });

  describe('updateStatus', () => {
    it('should update order status for active order', async () => {
      const order = await orderOrmRepo.save(
        orderOrmRepo.create({
          orderNumber: `ORD-${Date.now()}-status`,
          status: OrderStatus.PENDING,
          totalAmount: 0,
        }),
      );

      const result = await repository.updateStatus(order.id, OrderStatus.PROCESSING);

      expect(result.id).toBe(order.id);
      expect(result.status).toBe(OrderStatus.PROCESSING);

      const persisted = await orderOrmRepo.findOne({ where: { id: order.id } });
      expect(persisted?.status).toBe(OrderStatus.PROCESSING);
    });
  });
});
