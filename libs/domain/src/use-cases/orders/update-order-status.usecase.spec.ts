import 'reflect-metadata';

import { UpdateOrderStatusUseCase, UpdateOrderStatusDTO } from './update-order-status.usecase';
import { IOrderRepository } from '../../repositories/order.repository';
import { OrderService } from '../../services/order.service';
import { OrderNotFoundException } from '../../errors/order-not-found.error';
import { InvalidOrderStatusTransitionError } from '../../errors/invalid-order-status-transition.error';
import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
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

    useCase = new UpdateOrderStatusUseCase(mockOrderRepository, mockOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update status from PENDING to PROCESSING', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      const existingOrder = buildOrder({ status: OrderStatus.PENDING });
      const updatedOrder = buildOrder({ status: OrderStatus.PROCESSING });

      mockOrderService.findOrFail.mockResolvedValue(existingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockOrderService.findOrFail).toHaveBeenCalledWith('order-1');
      expect(mockOrderService.validateStatusTransition).toHaveBeenCalledWith(
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
      );
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.PROCESSING,
      );
    });

    it('should update status from PROCESSING to COMPLETED', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.COMPLETED };
      const existingOrder = buildOrder({ status: OrderStatus.PROCESSING });
      const updatedOrder = buildOrder({ status: OrderStatus.COMPLETED });

      mockOrderService.findOrFail.mockResolvedValue(existingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockOrderService.validateStatusTransition).toHaveBeenCalledWith(
        OrderStatus.PROCESSING,
        OrderStatus.COMPLETED,
      );
    });

    it('should throw OrderNotFoundException when the order does not exist', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'non-existent', status: OrderStatus.PROCESSING };
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderService.validateStatusTransition).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidOrderStatusTransitionError on invalid transition (COMPLETED → PROCESSING)', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      const completedOrder = buildOrder({ status: OrderStatus.COMPLETED });

      mockOrderService.findOrFail.mockResolvedValue(completedOrder);
      mockOrderService.validateStatusTransition.mockImplementation(() => {
        throw new InvalidOrderStatusTransitionError(OrderStatus.COMPLETED, OrderStatus.PROCESSING);
      });

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(InvalidOrderStatusTransitionError);
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidOrderStatusTransitionError on invalid transition (CANCELLED → PROCESSING)', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });

      mockOrderService.findOrFail.mockResolvedValue(cancelledOrder);
      mockOrderService.validateStatusTransition.mockImplementation(() => {
        throw new InvalidOrderStatusTransitionError(OrderStatus.CANCELLED, OrderStatus.PROCESSING);
      });

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(InvalidOrderStatusTransitionError);
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should not call updateStatus when findOrFail throws', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
