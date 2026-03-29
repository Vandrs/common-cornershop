import 'reflect-metadata';

import { GetOrderUseCase } from './get-order.usecase';
import { OrderService } from '../../services/order.service';
import { OrderNotFoundException } from '../../errors/order-not-found.error';
import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';

describe('GetOrderUseCase', () => {
  let useCase: GetOrderUseCase;
  let mockOrderService: jest.Mocked<OrderService>;

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

  beforeEach(() => {
    mockOrderService = {
      generateOrderNumber: jest.fn(),
      findOrFail: jest.fn(),
      validateStatusTransition: jest.fn(),
      calculateOrderItems: jest.fn(),
      calculateTotal: jest.fn(),
    } as unknown as jest.Mocked<OrderService>;

    useCase = new GetOrderUseCase(mockOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return the order when it exists', async () => {
      // Arrange
      const order = buildOrder();
      mockOrderService.findOrFail.mockResolvedValue(order);

      // Act
      const result = await useCase.execute('order-1');

      // Assert
      expect(result).toEqual(order);
      expect(mockOrderService.findOrFail).toHaveBeenCalledWith('order-1');
    });

    it('should throw OrderNotFoundException when the order does not exist', async () => {
      // Arrange
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      // Act & Assert
      await expect(useCase.execute('non-existent')).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderService.findOrFail).toHaveBeenCalledWith('non-existent');
    });
  });
});
