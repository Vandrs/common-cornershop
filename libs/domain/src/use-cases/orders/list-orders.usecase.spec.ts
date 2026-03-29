import 'reflect-metadata';

import { ListOrdersUseCase } from './list-orders.usecase';
import { IOrderRepository, OrderListParams } from '../../repositories/order.repository';
import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';
import { PaginatedResult } from '@shared/types/pagination.types';

describe('ListOrdersUseCase', () => {
  let useCase: ListOrdersUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  const buildOrder = (overrides: Partial<Order> = {}): Order =>
    ({
      id: 'order-1',
      orderNumber: 'ORD-1711234567890-a3f2',
      status: OrderStatus.PENDING,
      totalAmount: 50.0,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Order;

  const buildPaginatedResult = (orders: Order[]): PaginatedResult<Order> => ({
    data: orders,
    meta: {
      page: 1,
      limit: 10,
      total: orders.length,
      totalPages: 1,
    },
  });

  beforeEach(() => {
    mockOrderRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      createWithItems: jest.fn(),
      updateStatus: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    useCase = new ListOrdersUseCase(mockOrderRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return paginated orders when called with default params', async () => {
      // Arrange
      const orders = [buildOrder(), buildOrder({ id: 'order-2', orderNumber: 'ORD-222-bbbb' })];
      const paginatedResult = buildPaginatedResult(orders);
      const params: OrderListParams = { page: 1, limit: 10 };

      mockOrderRepository.list.mockResolvedValue(paginatedResult);

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(mockOrderRepository.list).toHaveBeenCalledWith(params);
    });

    it('should forward status filter to the repository', async () => {
      // Arrange
      const params: OrderListParams = { page: 1, limit: 10, status: OrderStatus.PROCESSING };
      const paginatedResult = buildPaginatedResult([]);

      mockOrderRepository.list.mockResolvedValue(paginatedResult);

      // Act
      await useCase.execute(params);

      // Assert
      expect(mockOrderRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.PROCESSING }),
      );
    });

    it('should forward date range filters to the repository', async () => {
      // Arrange
      const createdAfter = new Date('2024-01-01');
      const createdBefore = new Date('2024-12-31');
      const params: OrderListParams = { page: 1, limit: 10, createdAfter, createdBefore };
      const paginatedResult = buildPaginatedResult([]);

      mockOrderRepository.list.mockResolvedValue(paginatedResult);

      // Act
      await useCase.execute(params);

      // Assert
      expect(mockOrderRepository.list).toHaveBeenCalledWith(
        expect.objectContaining({ createdAfter, createdBefore }),
      );
    });

    it('should return an empty result when no orders match the filters', async () => {
      // Arrange
      const params: OrderListParams = { page: 1, limit: 10, orderNumber: 'ORD-nonexistent' };
      const emptyResult = buildPaginatedResult([]);

      mockOrderRepository.list.mockResolvedValue(emptyResult);

      // Act
      const result = await useCase.execute(params);

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });
});
