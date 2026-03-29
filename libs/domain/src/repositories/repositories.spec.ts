import { PaginatedResult } from '@shared/types/pagination.types';

import { Category } from '../entities/category.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { ICategoryRepository, CategoryListParams } from './category.repository';
import { IOrderRepository, OrderListParams } from './order.repository';
import { IOrderItemRepository } from './order-item.repository';
import { IProductRepository, ProductListParams } from './product.repository';
import { IStockRepository, StockListParams } from './stock.repository';

describe('Repository contracts', () => {
  const baseMeta = (): PaginatedResult<unknown>['meta'] => ({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  it('Category repository contract is satisfiable', async () => {
    class DummyCategoryRepository implements ICategoryRepository {
      async findAll(params: CategoryListParams) {
        return { data: [], meta: { ...baseMeta(), limit: params.limit ?? 10 } };
      }

      async findById(): Promise<Category | null> {
        return null;
      }

      async save(category: Category): Promise<Category> {
        return category;
      }

      async delete(): Promise<void> {
        return undefined;
      }
    }

    const repo: ICategoryRepository = new DummyCategoryRepository();
    expect(repo).toBeInstanceOf(DummyCategoryRepository);
  });

  it('Product repository contract is satisfiable', async () => {
    class DummyProductRepository implements IProductRepository {
      async findAll(params: ProductListParams) {
        return { data: [], meta: { ...baseMeta(), limit: params.limit ?? 10 } };
      }

      async findById(): Promise<Product | null> {
        return null;
      }

      async findByIds(): Promise<Product[]> {
        return [];
      }

      async save(product: Product): Promise<Product> {
        return product;
      }

      async delete(): Promise<void> {
        return undefined;
      }
    }

    const repo: IProductRepository = new DummyProductRepository();
    expect(repo).toBeInstanceOf(DummyProductRepository);
  });

  it('Stock repository contract is satisfiable', async () => {
    class DummyStockRepository implements IStockRepository {
      async findAll(params: StockListParams) {
        return { data: [], meta: { ...baseMeta(), limit: params.limit ?? 10 } };
      }

      async findByProductId(): Promise<Stock | null> {
        return null;
      }

      async save(stock: Stock): Promise<Stock> {
        return stock;
      }

      async adjustQuantity(): Promise<Stock> {
        return {} as Stock;
      }

      async reserve(): Promise<Stock> {
        return {} as Stock;
      }

      async release(): Promise<Stock> {
        return {} as Stock;
      }
    }

    const repo: IStockRepository = new DummyStockRepository();
    expect(repo).toBeInstanceOf(DummyStockRepository);
  });

  it('Order repository contract is satisfiable', async () => {
    class DummyOrderRepository implements IOrderRepository {
      async list(params: OrderListParams) {
        return { data: [], meta: { ...baseMeta(), limit: params.limit ?? 10 } };
      }

      async findById(): Promise<Order | null> {
        return null;
      }

      async createWithItems(order: Order, items: OrderItem[]): Promise<Order> {
        order.items = items;
        return order;
      }

      async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        return { ...({ id, status } as Order) };
      }
    }

    const repo: IOrderRepository = new DummyOrderRepository();
    expect(repo).toBeInstanceOf(DummyOrderRepository);
  });

  it('Order item repository contract is satisfiable', async () => {
    class DummyOrderItemRepository implements IOrderItemRepository {
      async findByOrderId(): Promise<OrderItem[]> {
        return [];
      }

      async save(orderItem: OrderItem): Promise<OrderItem> {
        return orderItem;
      }

      async saveMany(orderItems: OrderItem[]): Promise<OrderItem[]> {
        return orderItems;
      }

      async deleteByOrderId(): Promise<void> {
        return undefined;
      }
    }

    const repo: IOrderItemRepository = new DummyOrderItemRepository();
    expect(repo).toBeInstanceOf(DummyOrderItemRepository);
  });
});
