import Fastify, { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { CategoryController } from '../../controllers/category.controller';
import { ProductController } from '../../controllers/product.controller';
import { registerDependencies } from '../../container/dependency-injection';
import { AppDataSource } from '../../database/data-source';
import { OrderController } from '../../http/controllers/order.controller';
import { registerErrorHandler } from '../../plugins/error-handler.plugin';
import { Product } from '@domain/entities/product.entity';
import {
  CancelOrderUseCase,
  CreateOrderUseCase,
  GetOrderUseCase,
  ListOrdersUseCase,
  UpdateOrderStatusUseCase,
} from '@domain/index';
import { CategoryRepositoryImpl } from '../../repositories/category.repository.impl';
import { OrderItemRepositoryImpl } from '../../repositories/order-item.repository.impl';
import { OrderRepositoryImpl } from '../../repositories/order.repository.impl';
import { ProductRepositoryImpl } from '../../repositories/product.repository.impl';
import { StockRepositoryImpl } from '../../repositories/stock.repository.impl';

import { E2EFixtures } from './fixtures/e2e-fixtures';

const DEFAULT_TEST_DB_ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'cornershop_test',
  DB_SSL: 'false',
  DB_SSL_REJECT_UNAUTHORIZED: 'true',
};

/**
 * Centralized bootstrapping for E2E tests.
 */
export class E2ETestSetup {
  private app: FastifyInstance | null = null;

  readonly fixtures = new E2EFixtures(AppDataSource);

  async init(): Promise<FastifyInstance> {
    this.applyTestDatabaseEnvironment();

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await AppDataSource.synchronize(true);
    }

    registerDependencies();

    container.register('ICategoryRepository', {
      useFactory: () => new CategoryRepositoryImpl(AppDataSource),
    });
    container.register('IProductRepository', {
      useFactory: () => new ProductRepositoryImpl(AppDataSource.getRepository(Product)),
    });
    container.register('IStockRepository', {
      useFactory: () => new StockRepositoryImpl(AppDataSource),
    });
    container.register('IOrderRepository', {
      useFactory: () => new OrderRepositoryImpl(AppDataSource),
    });
    container.register('IOrderItemRepository', {
      useFactory: () => new OrderItemRepositoryImpl(AppDataSource),
    });

    this.app = Fastify({ logger: false });
    registerErrorHandler(this.app);

    const categoryController = container.resolve(CategoryController);
    this.app.get('/api/categories', categoryController.list.bind(categoryController));
    this.app.get('/api/categories/:id', categoryController.getById.bind(categoryController));

    const productController = container.resolve(ProductController);
    this.app.get('/api/products', productController.list.bind(productController));
    this.app.get('/api/products/:id', productController.getById.bind(productController));

    const orderController = new OrderController(
      container.resolve(CreateOrderUseCase),
      container.resolve(GetOrderUseCase),
      container.resolve(ListOrdersUseCase),
      container.resolve(UpdateOrderStatusUseCase),
      container.resolve(CancelOrderUseCase),
    );

    this.app.post('/api/orders', orderController.create.bind(orderController));
    this.app.get('/api/orders', orderController.list.bind(orderController));
    this.app.get('/api/orders/:id', orderController.getById.bind(orderController));
    this.app.get('/api/orders/:id/status', orderController.getStatus.bind(orderController));
    this.app.patch('/api/orders/:id/status', orderController.updateStatus.bind(orderController));
    this.app.patch('/api/orders/:id/cancel', orderController.cancel.bind(orderController));

    await this.app.ready();

    return this.app;
  }

  async resetState(): Promise<void> {
    this.fixtures.resetFactories();
    await this.fixtures.clearDatabase();
  }

  async teardown(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }

  private applyTestDatabaseEnvironment(): void {
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST =
      process.env.TEST_DB_HOST ?? process.env.DB_HOST ?? DEFAULT_TEST_DB_ENV.DB_HOST;
    process.env.DB_PORT =
      process.env.TEST_DB_PORT ?? process.env.DB_PORT ?? DEFAULT_TEST_DB_ENV.DB_PORT;
    process.env.DB_USER =
      process.env.TEST_DB_USER ?? process.env.DB_USER ?? DEFAULT_TEST_DB_ENV.DB_USER;
    process.env.DB_PASSWORD =
      process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? DEFAULT_TEST_DB_ENV.DB_PASSWORD;
    process.env.DB_NAME =
      process.env.TEST_DB_NAME ??
      process.env.DB_NAME_TEST ??
      process.env.DB_NAME ??
      DEFAULT_TEST_DB_ENV.DB_NAME;
    process.env.DB_SSL = process.env.DB_SSL ?? DEFAULT_TEST_DB_ENV.DB_SSL;
    process.env.DB_SSL_REJECT_UNAUTHORIZED =
      process.env.DB_SSL_REJECT_UNAUTHORIZED ?? DEFAULT_TEST_DB_ENV.DB_SSL_REJECT_UNAUTHORIZED;
  }
}
