import 'reflect-metadata';

import { UpdateOrderStatusUseCase, UpdateOrderStatusDTO } from './update-order-status.usecase';
import { IOrderItemRepository } from '../../repositories/order-item.repository';
import { IOrderRepository } from '../../repositories/order.repository';
import { IStockRepository } from '../../repositories/stock.repository';
import { OrderService } from '../../services/order.service';
import { OrderNotFoundException } from '../../errors/order-not-found.error';
import { InvalidOrderStatusTransitionError } from '../../errors/invalid-order-status-transition.error';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderStatus } from '../../enums/order-status.enum';

describe('UpdateOrderStatusUseCase', () => {
  let useCase: UpdateOrderStatusUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOrderItemRepository: jest.Mocked<IOrderItemRepository>;
  let mockStockRepository: jest.Mocked<IStockRepository>;
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

  const buildOrderItem = (overrides: Partial<OrderItem> = {}): OrderItem =>
    ({
      id: 'order-item-1',
      orderId: 'order-1',
      productId: 'product-1',
      quantity: 2,
      unitPrice: 25,
      subtotal: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as OrderItem;

  beforeEach(() => {
    mockOrderRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      createWithItems: jest.fn(),
      updateStatus: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    mockOrderItemRepository = {
      findByOrderId: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      deleteByOrderId: jest.fn(),
    } as jest.Mocked<IOrderItemRepository>;

    mockStockRepository = {
      findAll: jest.fn(),
      findByProductId: jest.fn(),
      save: jest.fn(),
      adjustQuantity: jest.fn(),
      reserve: jest.fn(),
      release: jest.fn(),
    } as jest.Mocked<IStockRepository>;

    mockOrderService = {
      generateOrderNumber: jest.fn(),
      findOrFail: jest.fn(),
      validateStatusTransition: jest.fn(),
      calculateOrderItems: jest.fn(),
      calculateTotal: jest.fn(),
    } as unknown as jest.Mocked<OrderService>;

    useCase = new UpdateOrderStatusUseCase(
      mockOrderRepository,
      mockOrderItemRepository,
      mockStockRepository,
      mockOrderService,
    );
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
      const orderItems = [
        buildOrderItem({ productId: 'product-1', quantity: 2 }),
        buildOrderItem({ id: 'order-item-2', productId: 'product-2', quantity: 3 }),
      ];

      mockOrderService.findOrFail.mockResolvedValue(existingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderItemRepository.findByOrderId.mockResolvedValue(orderItems);
      mockStockRepository.adjustQuantity.mockResolvedValue({} as never);
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
      expect(mockOrderItemRepository.findByOrderId).toHaveBeenCalledWith('order-1');
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(1, 'product-1', -2);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(2, 'product-2', -3);
      expect(mockOrderRepository.updateStatus.mock.invocationCallOrder[0]).toBeGreaterThan(
        mockStockRepository.adjustQuantity.mock.invocationCallOrder[1],
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
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
    });

    it('should not debit stock when updating status from PENDING to CANCELLED', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.CANCELLED };
      const existingOrder = buildOrder({ status: OrderStatus.PENDING });
      const updatedOrder = buildOrder({ status: OrderStatus.CANCELLED });

      mockOrderService.findOrFail.mockResolvedValue(existingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual(updatedOrder);
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
    });

    it('should throw OrderNotFoundException when the order does not exist', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'non-existent', status: OrderStatus.PROCESSING };
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderService.validateStatusTransition).not.toHaveBeenCalled();
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
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
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
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
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should not call updateStatus when findOrFail throws', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow();
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should rollback debits when updateStatus fails after stock debit', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      const existingOrder = buildOrder({ status: OrderStatus.PENDING });
      const orderItems = [
        buildOrderItem({ productId: 'product-1', quantity: 2 }),
        buildOrderItem({ id: 'order-item-2', productId: 'product-2', quantity: 3 }),
      ];
      const expectedError = new Error('status update failed');

      mockOrderService.findOrFail.mockResolvedValue(existingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderItemRepository.findByOrderId.mockResolvedValue(orderItems);
      mockStockRepository.adjustQuantity
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never)
        .mockResolvedValueOnce({} as never);
      mockOrderRepository.updateStatus.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(expectedError);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(1, 'product-1', -2);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(2, 'product-2', -3);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(3, 'product-2', 3);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(4, 'product-1', 2);
    });

    it('should rollback already-debited items when a later debit fails', async () => {
      // Arrange
      const dto: UpdateOrderStatusDTO = { id: 'order-1', status: OrderStatus.PROCESSING };
      const existingOrder = buildOrder({ status: OrderStatus.PENDING });
      const orderItems = [
        buildOrderItem({ productId: 'product-1', quantity: 2 }),
        buildOrderItem({ id: 'order-item-2', productId: 'product-2', quantity: 3 }),
      ];
      const debitError = new Error('debit failed');

      mockOrderService.findOrFail.mockResolvedValue(existingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderItemRepository.findByOrderId.mockResolvedValue(orderItems);
      mockStockRepository.adjustQuantity
        .mockResolvedValueOnce({} as never)
        .mockRejectedValueOnce(debitError)
        .mockResolvedValueOnce({} as never);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(debitError);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(1, 'product-1', -2);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(2, 'product-2', -3);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(3, 'product-1', 2);
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
