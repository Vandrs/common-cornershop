import 'reflect-metadata';

import { CancelOrderUseCase } from './cancel-order.usecase';
import { IOrderRepository } from '../../repositories/order.repository';
import { OrderService } from '../../services/order.service';
import { OrderNotFoundException } from '../../errors/order-not-found.error';
import { InvalidOrderStatusTransitionError } from '../../errors/invalid-order-status-transition.error';
import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOrderService: jest.Mocked<OrderService>;

  const buildOrder = (overrides: Partial<Order> = {}): Order =>
    ({
      id: 'order-1',
      customerId: 'customer-1',
      orderNumber: 'ORD-1711234567890-a3f2',
      status: OrderStatus.PENDING,
      totalAmount: 50.0,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Order;

  beforeEach(() => {
    mockOrderRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      createWithItems: jest.fn(),
      updateStatus: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    mockOrderService = {
      generateOrderNumber: jest.fn(),
      findOrFail: jest.fn(),
      validateStatusTransition: jest.fn(),
      calculateOrderItems: jest.fn(),
      calculateTotal: jest.fn(),
    } as unknown as jest.Mocked<OrderService>;

    useCase = new CancelOrderUseCase(mockOrderRepository, mockOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should cancel a PENDING order successfully', async () => {
      const pendingOrder = buildOrder({ status: OrderStatus.PENDING });
      const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });

      mockOrderService.findOrFail.mockResolvedValue(pendingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(cancelledOrder);

      const result = await useCase.execute('order-1');

      expect(result).toEqual(cancelledOrder);
      expect(mockOrderService.findOrFail).toHaveBeenCalledWith('order-1');
      expect(mockOrderService.validateStatusTransition).toHaveBeenCalledWith(
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
      );
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.CANCELLED,
      );
    });

    it('should cancel a PROCESSING order successfully', async () => {
      const processingOrder = buildOrder({ status: OrderStatus.PROCESSING });
      const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });

      mockOrderService.findOrFail.mockResolvedValue(processingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(cancelledOrder);

      const result = await useCase.execute('order-1');

      expect(result).toEqual(cancelledOrder);
      expect(mockOrderService.validateStatusTransition).toHaveBeenCalledWith(
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
      );
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.CANCELLED,
      );
    });

    it('should throw OrderNotFoundException when the order does not exist', async () => {
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      await expect(useCase.execute('non-existent')).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderService.validateStatusTransition).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidOrderStatusTransitionError when the order is already COMPLETED', async () => {
      const completedOrder = buildOrder({ status: OrderStatus.COMPLETED });

      mockOrderService.findOrFail.mockResolvedValue(completedOrder);
      mockOrderService.validateStatusTransition.mockImplementation(() => {
        throw new InvalidOrderStatusTransitionError(OrderStatus.COMPLETED, OrderStatus.CANCELLED);
      });

      await expect(useCase.execute('order-1')).rejects.toThrow(InvalidOrderStatusTransitionError);
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidOrderStatusTransitionError when the order is already CANCELLED', async () => {
      const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });

      mockOrderService.findOrFail.mockResolvedValue(cancelledOrder);
      mockOrderService.validateStatusTransition.mockImplementation(() => {
        throw new InvalidOrderStatusTransitionError(OrderStatus.CANCELLED, OrderStatus.CANCELLED);
      });

      await expect(useCase.execute('order-1')).rejects.toThrow(InvalidOrderStatusTransitionError);
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should always pass CANCELLED as the target status to validateStatusTransition', async () => {
      const pendingOrder = buildOrder({ status: OrderStatus.PENDING });
      mockOrderService.findOrFail.mockResolvedValue(pendingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(
        buildOrder({ status: OrderStatus.CANCELLED }),
      );

      await useCase.execute('order-1');

      expect(mockOrderService.validateStatusTransition).toHaveBeenCalledWith(
        expect.any(String),
        OrderStatus.CANCELLED,
      );
    });
  });
});
