import 'reflect-metadata';
import { container } from 'tsyringe';

import { CategoryRepositoryImpl } from '../repositories/category.repository.impl';
import { ProductRepositoryImpl } from '../repositories/product.repository.impl';
import { StockRepositoryImpl } from '../repositories/stock.repository.impl';
import { OrderRepositoryImpl } from '../repositories/order.repository.impl';
import { OrderItemRepositoryImpl } from '../repositories/order-item.repository.impl';
import { CustomerRepositoryImpl } from '../repositories/customer.repository.impl';

import {
  CategoryService,
  ProductService,
  StockService,
  OrderService,
  CustomerService,
  CreateCategoryUseCase,
  ListCategoriesUseCase,
  GetCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
  CreateProductUseCase,
  ListProductsUseCase,
  GetProductUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  GetStockUseCase,
  UpdateStockUseCase,
  CreateOrderUseCase,
  GetOrderUseCase,
  ListOrdersUseCase,
  UpdateOrderStatusUseCase,
  CancelOrderUseCase,
  CreateCustomerUseCase,
  GetCustomerUseCase,
} from '@domain/index';

/**
 * Registers all DI bindings for the application.
 *
 * Registration order:
 *   1. Repository implementations (infrastructure)  → satisfy domain interfaces.
 *   2. Domain services                               → depend on repositories.
 *   3. Use cases                                     → depend on services & repos.
 *
 * Using `useClass` with `singleton` scope ensures one instance per token for
 * the lifetime of the process, which is appropriate for stateless service
 * and repository objects.
 *
 * DIP: domain layer owns the repository interfaces; this file wires the
 * concrete infrastructure implementations. The domain never references this
 * file.
 */
export function registerDependencies(): void {
  container.registerSingleton<CategoryRepositoryImpl>(
    'ICategoryRepository',
    CategoryRepositoryImpl,
  );
  container.registerSingleton<ProductRepositoryImpl>('IProductRepository', ProductRepositoryImpl);
  container.registerSingleton<StockRepositoryImpl>('IStockRepository', StockRepositoryImpl);
  container.registerSingleton<OrderRepositoryImpl>('IOrderRepository', OrderRepositoryImpl);
  container.registerSingleton<OrderItemRepositoryImpl>(
    'IOrderItemRepository',
    OrderItemRepositoryImpl,
  );
  container.registerSingleton<CustomerRepositoryImpl>(
    'ICustomerRepository',
    CustomerRepositoryImpl,
  );

  container.registerSingleton<CategoryService>('CategoryService', CategoryService);
  container.registerSingleton<ProductService>('ProductService', ProductService);
  container.registerSingleton<StockService>('StockService', StockService);
  container.registerSingleton<OrderService>('OrderService', OrderService);
  container.registerSingleton<CustomerService>('CustomerService', CustomerService);

  container.registerSingleton<CreateCategoryUseCase>(
    'CreateCategoryUseCase',
    CreateCategoryUseCase,
  );
  container.registerSingleton<ListCategoriesUseCase>(
    'ListCategoriesUseCase',
    ListCategoriesUseCase,
  );
  container.registerSingleton<GetCategoryUseCase>('GetCategoryUseCase', GetCategoryUseCase);
  container.registerSingleton<UpdateCategoryUseCase>(
    'UpdateCategoryUseCase',
    UpdateCategoryUseCase,
  );
  container.registerSingleton<DeleteCategoryUseCase>(
    'DeleteCategoryUseCase',
    DeleteCategoryUseCase,
  );

  container.registerSingleton<CreateProductUseCase>('CreateProductUseCase', CreateProductUseCase);
  container.registerSingleton<ListProductsUseCase>('ListProductsUseCase', ListProductsUseCase);
  container.registerSingleton<GetProductUseCase>('GetProductUseCase', GetProductUseCase);
  container.registerSingleton<UpdateProductUseCase>('UpdateProductUseCase', UpdateProductUseCase);
  container.registerSingleton<DeleteProductUseCase>('DeleteProductUseCase', DeleteProductUseCase);

  container.registerSingleton<GetStockUseCase>('GetStockUseCase', GetStockUseCase);
  container.registerSingleton<UpdateStockUseCase>('UpdateStockUseCase', UpdateStockUseCase);

  container.registerSingleton<CreateOrderUseCase>('CreateOrderUseCase', CreateOrderUseCase);
  container.registerSingleton<GetOrderUseCase>('GetOrderUseCase', GetOrderUseCase);
  container.registerSingleton<ListOrdersUseCase>('ListOrdersUseCase', ListOrdersUseCase);
  container.registerSingleton<UpdateOrderStatusUseCase>(
    'UpdateOrderStatusUseCase',
    UpdateOrderStatusUseCase,
  );
  container.registerSingleton<CancelOrderUseCase>('CancelOrderUseCase', CancelOrderUseCase);

  container.registerSingleton<CreateCustomerUseCase>(
    'CreateCustomerUseCase',
    CreateCustomerUseCase,
  );
  container.registerSingleton<GetCustomerUseCase>('GetCustomerUseCase', GetCustomerUseCase);
}
