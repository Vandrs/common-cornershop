import 'reflect-metadata';

import { CancelOrderUseCase } from './cancel-order.usecase';
import { IOrderItemRepository } from '../../repositories/order-item.repository';
import { IOrderRepository } from '../../repositories/order.repository';
import { IStockRepository } from '../../repositories/stock.repository';
import { OrderService } from '../../services/order.service';
import { OrderNotFoundException } from '../../errors/order-not-found.error';
import { InvalidOrderStatusTransitionError } from '../../errors/invalid-order-status-transition.error';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderStatus } from '../../enums/order-status.enum';

describe('CancelOrderUseCase', () => {
  let useCase: CancelOrderUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockOrderItemRepository: jest.Mocked<IOrderItemRepository>;
  let mockStockRepository: jest.Mocked<IStockRepository>;
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

    useCase = new CancelOrderUseCase(
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
    it('should cancel a PENDING order successfully without refunding stock', async () => {
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
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
    });

    it('should refund stock items before cancelling a PROCESSING order', async () => {
      const processingOrder = buildOrder({ status: OrderStatus.PROCESSING });
      const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });
      const orderItems = [
        buildOrderItem({ productId: 'product-1', quantity: 2 }),
        buildOrderItem({ id: 'order-item-2', productId: 'product-2', quantity: 3 }),
      ];

      mockOrderService.findOrFail.mockResolvedValue(processingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderItemRepository.findByOrderId.mockResolvedValue(orderItems);
      mockStockRepository.adjustQuantity.mockResolvedValue({} as never);
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
      expect(mockOrderItemRepository.findByOrderId).toHaveBeenCalledWith('order-1');
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(1, 'product-1', 2);
      expect(mockStockRepository.adjustQuantity).toHaveBeenNthCalledWith(2, 'product-2', 3);
      expect(mockOrderRepository.updateStatus.mock.invocationCallOrder[0]).toBeGreaterThan(
        mockStockRepository.adjustQuantity.mock.invocationCallOrder[1],
      );
    });

    it('should throw OrderNotFoundException when the order does not exist', async () => {
      mockOrderService.findOrFail.mockRejectedValue(new OrderNotFoundException());

      await expect(useCase.execute('non-existent')).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderService.validateStatusTransition).not.toHaveBeenCalled();
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidOrderStatusTransitionError when the order is already COMPLETED', async () => {
      const completedOrder = buildOrder({ status: OrderStatus.COMPLETED });

      mockOrderService.findOrFail.mockResolvedValue(completedOrder);
      mockOrderService.validateStatusTransition.mockImplementation(() => {
        throw new InvalidOrderStatusTransitionError(OrderStatus.COMPLETED, OrderStatus.CANCELLED);
      });

      await expect(useCase.execute('order-1')).rejects.toThrow(InvalidOrderStatusTransitionError);
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvalidOrderStatusTransitionError when the order is already CANCELLED', async () => {
      const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });

      mockOrderService.findOrFail.mockResolvedValue(cancelledOrder);
      mockOrderService.validateStatusTransition.mockImplementation(() => {
        throw new InvalidOrderStatusTransitionError(OrderStatus.CANCELLED, OrderStatus.CANCELLED);
      });

      await expect(useCase.execute('order-1')).rejects.toThrow(InvalidOrderStatusTransitionError);
      expect(mockOrderItemRepository.findByOrderId).not.toHaveBeenCalled();
      expect(mockStockRepository.adjustQuantity).not.toHaveBeenCalled();
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should not update status when stock refund fails for a PROCESSING order', async () => {
      const processingOrder = buildOrder({ status: OrderStatus.PROCESSING });
      const orderItems = [buildOrderItem({ productId: 'product-1', quantity: 2 })];
      const expectedError = new Error('refund failed');

      mockOrderService.findOrFail.mockResolvedValue(processingOrder);
      mockOrderService.validateStatusTransition.mockReturnValue(undefined);
      mockOrderItemRepository.findByOrderId.mockResolvedValue(orderItems);
      mockStockRepository.adjustQuantity.mockRejectedValue(expectedError);

      await expect(useCase.execute('order-1')).rejects.toThrow(expectedError);
      expect(mockStockRepository.adjustQuantity).toHaveBeenCalledWith('product-1', 2);
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
