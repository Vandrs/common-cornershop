export { BaseEntity } from './entities/base.entity';
export { Category } from './entities/category.entity';
export { Product } from './entities/product.entity';
export { Stock } from './entities/stock.entity';
export { Order } from './entities/order.entity';
export { OrderItem } from './entities/order-item.entity';
export { Customer } from './entities/customer.entity';

export { OrderStatus } from './enums/order-status.enum';

export { DomainError } from './errors/domain.error';
export { ProductNotFoundException } from './errors/product-not-found.error';
export { CategoryNotFoundException } from './errors/category-not-found.error';
export { InsufficientStockError } from './errors/insufficient-stock.error';
export { OrderNotFoundException } from './errors/order-not-found.error';
export { InvalidOrderStatusTransitionError } from './errors/invalid-order-status-transition.error';
export { CustomerNotFoundException } from './errors/customer-not-found.error';

export type { ICategoryRepository, CategoryListParams } from './repositories/category.repository';
export type { IProductRepository, ProductListParams } from './repositories/product.repository';
export type { IStockRepository, StockListParams } from './repositories/stock.repository';
export type { IOrderRepository, OrderListParams } from './repositories/order.repository';
export type { IOrderItemRepository } from './repositories/order-item.repository';
export type { ICustomerRepository } from './repositories/customer.repository';

export { CategoryService } from './services/category.service';
export type { CreateCategoryDTO, UpdateCategoryDTO } from './services/category.service';
export { ProductService } from './services/product.service';
export { StockService } from './services/stock.service';
export { OrderService } from './services/order.service';
export type { CreateOrderItemDTO, OrderItemData } from './services/order.service';

export { CreateCategoryUseCase } from './use-cases/category/create-category.usecase';
export { ListCategoriesUseCase } from './use-cases/category/list-categories.usecase';
export type { ListCategoriesDTO } from './use-cases/category/list-categories.usecase';
export { GetCategoryUseCase } from './use-cases/category/get-category.usecase';
export { UpdateCategoryUseCase } from './use-cases/category/update-category.usecase';
export type { UpdateCategoryInput } from './use-cases/category/update-category.usecase';
export { DeleteCategoryUseCase } from './use-cases/category/delete-category.usecase';

export { CreateProductUseCase } from './use-cases/product/create-product.usecase';
export type { CreateProductDTO } from './use-cases/product/create-product.usecase';
export { ListProductsUseCase } from './use-cases/product/list-products.usecase';
export { GetProductUseCase } from './use-cases/product/get-product.usecase';
export { UpdateProductUseCase } from './use-cases/product/update-product.usecase';
export type { UpdateProductDTO } from './use-cases/product/update-product.usecase';
export { DeleteProductUseCase } from './use-cases/product/delete-product.usecase';

export { GetStockUseCase } from './use-cases/stock/get-stock.usecase';
export { UpdateStockUseCase } from './use-cases/stock/update-stock.usecase';
export type { UpdateStockDTO } from './use-cases/stock/update-stock.usecase';

export { CreateOrderUseCase } from './use-cases/orders/create-order.usecase';
export type { CreateOrderDTO } from './use-cases/orders/create-order.usecase';
export { GetOrderUseCase } from './use-cases/orders/get-order.usecase';
export { ListOrdersUseCase } from './use-cases/orders/list-orders.usecase';
export { UpdateOrderStatusUseCase } from './use-cases/orders/update-order-status.usecase';
export type { UpdateOrderStatusDTO } from './use-cases/orders/update-order-status.usecase';
export { CancelOrderUseCase } from './use-cases/orders/cancel-order.usecase';
